use hickory_resolver::config::ResolverConfig;
use hickory_resolver::name_server::TokioConnectionProvider;
use hickory_resolver::proto::rr::RecordType;
use hickory_resolver::Resolver;
use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
pub struct DnsRecord {
    pub record_type: String,
    pub value: String,
    pub ttl: u32,
}

#[tauri::command]
pub async fn dns_resolve(domain: String, record_type: String) -> Result<Vec<DnsRecord>, String> {
    let resolver = Resolver::builder_with_config(
        ResolverConfig::default(),
        TokioConnectionProvider::default(),
    )
    .build();

    let mut records = Vec::new();

    match record_type.to_uppercase().as_str() {
        "A" => {
            let response = resolver
                .ipv4_lookup(&domain)
                .await
                .map_err(|e| format!("DNS lookup failed: {}", e))?;
            let ttl = response.as_lookup().records()
                .first()
                .map(|r| r.ttl())
                .unwrap_or(0);
            for addr in response.iter() {
                records.push(DnsRecord {
                    record_type: "A".into(),
                    value: addr.to_string(),
                    ttl,
                });
            }
        }
        "AAAA" => {
            let response = resolver
                .ipv6_lookup(&domain)
                .await
                .map_err(|e| format!("DNS lookup failed: {}", e))?;
            let ttl = response.as_lookup().records()
                .first()
                .map(|r| r.ttl())
                .unwrap_or(0);
            for addr in response.iter() {
                records.push(DnsRecord {
                    record_type: "AAAA".into(),
                    value: addr.to_string(),
                    ttl,
                });
            }
        }
        "CNAME" => {
            let response = resolver
                .lookup(&domain, RecordType::CNAME)
                .await
                .map_err(|e| format!("CNAME lookup failed: {}", e))?;
            let ttl = response.records()
                .first()
                .map(|r| r.ttl())
                .unwrap_or(0);
            for record in response.records() {
                records.push(DnsRecord {
                    record_type: "CNAME".into(),
                    value: record.data().to_string().trim_end_matches('.').to_string(),
                    ttl,
                });
            }
        }
        "MX" => {
            let response = resolver
                .mx_lookup(&domain)
                .await
                .map_err(|e| format!("MX lookup failed: {}", e))?;
            let ttl = response.as_lookup().records()
                .first()
                .map(|r| r.ttl())
                .unwrap_or(0);
            for mx in response.iter() {
                records.push(DnsRecord {
                    record_type: "MX".into(),
                    value: format!(
                        "{} (priority: {})",
                        mx.exchange().to_string().trim_end_matches('.'),
                        mx.preference()
                    ),
                    ttl,
                });
            }
        }
        "TXT" => {
            let response = resolver
                .txt_lookup(&domain)
                .await
                .map_err(|e| format!("TXT lookup failed: {}", e))?;
            let ttl = response.as_lookup().records()
                .first()
                .map(|r| r.ttl())
                .unwrap_or(0);
            for txt in response.iter() {
                records.push(DnsRecord {
                    record_type: "TXT".into(),
                    value: txt.to_string(),
                    ttl,
                });
            }
        }
        "NS" => {
            let response = resolver
                .ns_lookup(&domain)
                .await
                .map_err(|e| format!("NS lookup failed: {}", e))?;
            let ttl = response.as_lookup().records()
                .first()
                .map(|r| r.ttl())
                .unwrap_or(0);
            for ns in response.iter() {
                records.push(DnsRecord {
                    record_type: "NS".into(),
                    value: ns.to_string().trim_end_matches('.').to_string(),
                    ttl,
                });
            }
        }
        _ => {
            return Err(format!("Unsupported record type: {}", record_type));
        }
    }

    Ok(records)
}
