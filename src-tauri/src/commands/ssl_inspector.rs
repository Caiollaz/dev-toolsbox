use chrono::{DateTime, Utc};
use rustls::pki_types::ServerName;
use serde::Serialize;
use std::io::Read;
use std::net::TcpStream;
use std::sync::Arc;
use x509_parser::prelude::*;
use x509_parser::public_key::PublicKey;

#[derive(Debug, Serialize, Clone)]
pub struct CertChainEntry {
    pub level: String,
    pub subject: String,
    pub issuer: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct SslCertInfo {
    pub subject: String,
    pub issuer: String,
    pub valid_from: String,
    pub valid_until: String,
    pub serial_number: String,
    pub signature_algorithm: String,
    pub key_size: String,
    pub is_valid: bool,
    pub days_remaining: i64,
    pub san: Vec<String>,
    pub chain: Vec<CertChainEntry>,
}

#[tauri::command]
pub async fn inspect_ssl(domain: String) -> Result<SslCertInfo, String> {
    tokio::task::spawn_blocking(move || inspect_ssl_sync(&domain))
        .await
        .map_err(|e| format!("Task failed: {}", e))?
}

fn inspect_ssl_sync(domain: &str) -> Result<SslCertInfo, String> {
    let server_name = ServerName::try_from(domain.to_string())
        .map_err(|e| format!("Invalid domain: {}", e))?;

    let mut root_store = rustls::RootCertStore::empty();
    root_store.extend(webpki_roots::TLS_SERVER_ROOTS.iter().cloned());

    let config = rustls::ClientConfig::builder()
        .with_root_certificates(root_store)
        .with_no_client_auth();

    let mut conn = rustls::ClientConnection::new(Arc::new(config), server_name)
        .map_err(|e| format!("TLS config error: {}", e))?;

    let mut tcp = TcpStream::connect(format!("{}:443", domain))
        .map_err(|e| format!("TCP connection failed: {}", e))?;

    tcp.set_read_timeout(Some(std::time::Duration::from_secs(10)))
        .ok();
    tcp.set_write_timeout(Some(std::time::Duration::from_secs(10)))
        .ok();

    let mut tls = rustls::Stream::new(&mut conn, &mut tcp);

    // Drive the handshake by attempting a read
    let mut buf = [0u8; 1];
    let _ = tls.read(&mut buf);

    let peer_certs = conn
        .peer_certificates()
        .ok_or("No certificates received from server")?;

    if peer_certs.is_empty() {
        return Err("Empty certificate chain".into());
    }

    let mut chain = Vec::new();
    let mut cert_info = None;

    for (i, cert_der) in peer_certs.iter().enumerate() {
        let (_, cert) = X509Certificate::from_der(cert_der.as_ref())
            .map_err(|e| format!("Failed to parse certificate: {}", e))?;

        let level = match i {
            0 => "LEAF",
            _ if i == peer_certs.len() - 1 => "ROOT",
            _ => "INTERMEDIATE",
        };

        let subject = cert.subject().to_string();
        let issuer = cert.issuer().to_string();

        chain.push(CertChainEntry {
            level: level.to_string(),
            subject: subject.clone(),
            issuer: issuer.clone(),
        });

        if i == 0 {
            let valid_from = format_asn1_time(&cert.validity().not_before);
            let valid_until = format_asn1_time(&cert.validity().not_after);

            let now: DateTime<Utc> = Utc::now();
            let not_after_chrono = DateTime::parse_from_rfc3339(&valid_until)
                .unwrap_or(now.into())
                .with_timezone(&Utc);

            let days_remaining = (not_after_chrono - now).num_days();
            let is_valid = days_remaining > 0;

            // Extract SANs
            let san = cert
                .subject_alternative_name()
                .ok()
                .flatten()
                .map(|ext| {
                    ext.value
                        .general_names
                        .iter()
                        .filter_map(|name| match name {
                            GeneralName::DNSName(dns) => Some(dns.to_string()),
                            GeneralName::IPAddress(ip) => Some(format!("{:?}", ip)),
                            _ => None,
                        })
                        .collect::<Vec<_>>()
                })
                .unwrap_or_default();

            let sig_algo = cert.signature_algorithm.algorithm.to_string();
            let key_size = match cert.public_key().parsed() {
                Ok(key) => match key {
                    PublicKey::RSA(rsa) => format!("{} bit (RSA)", rsa.key_size()),
                    PublicKey::EC(ec) => format!("{} bit (EC)", ec.key_size()),
                    _ => "Unknown".into(),
                },
                Err(_) => "Unknown".into(),
            };

            // Format serial number from raw bytes
            let serial_number = format_serial_bytes(cert.raw_serial());

            cert_info = Some(SslCertInfo {
                subject,
                issuer,
                valid_from,
                valid_until,
                serial_number,
                signature_algorithm: sig_algo,
                key_size,
                is_valid,
                days_remaining,
                san,
                chain: Vec::new(),
            });
        }
    }

    let mut info = cert_info.ok_or("Failed to extract certificate info")?;
    info.chain = chain;
    Ok(info)
}

fn format_asn1_time(time: &ASN1Time) -> String {
    let dt = time.to_datetime();
    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
        dt.year(),
        dt.month() as u8,
        dt.day(),
        dt.hour(),
        dt.minute(),
        dt.second()
    )
}

fn format_serial_bytes(bytes: &[u8]) -> String {
    bytes
        .iter()
        .map(|b| format!("{:02X}", b))
        .collect::<Vec<_>>()
        .join(":")
}
