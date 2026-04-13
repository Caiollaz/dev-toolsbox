use serde::Serialize;
use std::net::SocketAddr;
use std::time::Duration;
use tokio::net::TcpStream;
use tokio::time::timeout;

#[derive(Debug, Serialize, Clone)]
pub struct PortResult {
    pub port: u16,
    pub open: bool,
    pub service: String,
}

fn guess_service(port: u16) -> &'static str {
    match port {
        20 => "FTP Data",
        21 => "FTP",
        22 => "SSH",
        23 => "Telnet",
        25 => "SMTP",
        53 => "DNS",
        80 => "HTTP",
        110 => "POP3",
        143 => "IMAP",
        443 => "HTTPS",
        445 => "SMB",
        465 => "SMTPS",
        587 => "SMTP (Submission)",
        993 => "IMAPS",
        995 => "POP3S",
        1433 => "MSSQL",
        1521 => "Oracle DB",
        3000 => "Dev Server",
        3306 => "MySQL",
        3389 => "RDP",
        4200 => "Angular Dev",
        5000 => "Flask / Dev",
        5432 => "PostgreSQL",
        5672 => "RabbitMQ",
        5900 => "VNC",
        6379 => "Redis",
        8000 => "Dev Server",
        8080 => "HTTP Proxy",
        8443 => "HTTPS Alt",
        8888 => "Jupyter",
        9090 => "Prometheus",
        9200 => "Elasticsearch",
        9418 => "Git",
        27017 => "MongoDB",
        _ => "Unknown",
    }
}

#[tauri::command]
pub async fn scan_ports(host: String, from: u16, to: u16) -> Result<Vec<PortResult>, String> {
    if from > to {
        return Err("Invalid range: 'from' must be <= 'to'".into());
    }
    if to - from > 10000 {
        return Err("Range too large: maximum 10000 ports per scan".into());
    }

    let mut handles = Vec::new();

    for port in from..=to {
        let host = host.clone();
        let handle = tokio::spawn(async move {
            let addr: SocketAddr = match format!("{}:{}", host, port).parse() {
                Ok(a) => a,
                Err(_) => return PortResult {
                    port,
                    open: false,
                    service: String::new(),
                },
            };

            let is_open = timeout(Duration::from_millis(200), TcpStream::connect(addr))
                .await
                .map(|r| r.is_ok())
                .unwrap_or(false);

            PortResult {
                port,
                open: is_open,
                service: if is_open {
                    guess_service(port).to_string()
                } else {
                    String::new()
                },
            }
        });
        handles.push(handle);
    }

    let mut results = Vec::new();
    for handle in handles {
        if let Ok(result) = handle.await {
            if result.open {
                results.push(result);
            }
        }
    }

    results.sort_by_key(|r| r.port);
    Ok(results)
}
