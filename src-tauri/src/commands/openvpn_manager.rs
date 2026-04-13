use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};
use tokio::io::AsyncWriteExt;
use tokio::sync::mpsc;

// --- Data Types ---

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OvpnConfig {
    pub profile_path: String,
    pub username: String,
    pub password: String,
    pub otp: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct OvpnStatus {
    pub state: String,         // "connected", "disconnected", "connecting", "error"
    pub server: String,
    pub local_ip: String,
    pub remote_ip: String,
    pub uptime: String,
    pub bytes_sent: String,
    pub bytes_received: String,
    pub protocol: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct OvpnLogLine {
    pub content: String,
    pub level: String, // "info", "success", "error", "warn"
}

// --- State ---

struct OvpnWatchState {
    _cancel_tx: mpsc::Sender<()>,
}

// --- Helper functions ---

fn format_bytes(bytes: u64) -> String {
    if bytes >= 1_073_741_824 {
        format!("{:.1} GB", bytes as f64 / 1_073_741_824.0)
    } else if bytes >= 1_048_576 {
        format!("{:.1} MB", bytes as f64 / 1_048_576.0)
    } else if bytes >= 1024 {
        format!("{:.1} KB", bytes as f64 / 1024.0)
    } else {
        format!("{} B", bytes)
    }
}

/// Get IP address for a specific network device
async fn get_device_ip(device: &str) -> String {
    let output = tokio::process::Command::new("ip")
        .args(["addr", "show", "dev", device])
        .output()
        .await;

    if let Ok(out) = output {
        let stdout = String::from_utf8_lossy(&out.stdout);
        for line in stdout.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("inet ") {
                let parts: Vec<&str> = trimmed.split_whitespace().collect();
                if parts.len() >= 2 {
                    return parts[1].split('/').next().unwrap_or("").to_string();
                }
            }
        }
    }
    String::new()
}

/// Get bytes from /proc/net/dev for a specific device
fn get_device_bytes(device: &str) -> (String, String) {
    let content = std::fs::read_to_string("/proc/net/dev").unwrap_or_default();
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with(&format!("{}:", device)) || trimmed.starts_with(device) {
            let parts: Vec<&str> = trimmed.split_whitespace().collect();
            if parts.len() >= 10 {
                let rx = parts[1].parse::<u64>().unwrap_or(0);
                let tx = parts[9].parse::<u64>().unwrap_or(0);
                return (format_bytes(tx), format_bytes(rx));
            }
        }
    }
    ("0 B".to_string(), "0 B".to_string())
}

/// Compute uptime from a timestamp string like "2026-04-13 13:44:57"
fn compute_uptime(created: &str) -> String {
    if created.is_empty() {
        return String::new();
    }
    if let Ok(start) = chrono::NaiveDateTime::parse_from_str(created, "%Y-%m-%d %H:%M:%S") {
        let now = chrono::Local::now().naive_local();
        let duration = now.signed_duration_since(start);
        let secs = duration.num_seconds();
        if secs < 0 {
            return String::new();
        }
        let h = secs / 3600;
        let m = (secs % 3600) / 60;
        let s = secs % 60;
        format!("{}h {:02}m {:02}s", h, m, s)
    } else {
        String::new()
    }
}

/// Get byte stats from `openvpn3 session-stats`
async fn get_openvpn3_stats(session_path: &str) -> Option<(String, String)> {
    let output = tokio::process::Command::new("openvpn3")
        .args(["session-stats", "--session-path", session_path])
        .output()
        .await
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut bytes_in: u64 = 0;
    let mut bytes_out: u64 = 0;

    for line in stdout.lines() {
        let trimmed = line.trim();
        if let Some(val) = trimmed.strip_prefix("BYTES_IN") {
            bytes_in = val.trim().parse().unwrap_or(0);
        } else if let Some(val) = trimmed.strip_prefix("BYTES_OUT") {
            bytes_out = val.trim().parse().unwrap_or(0);
        }
    }

    if bytes_in > 0 || bytes_out > 0 {
        Some((format_bytes(bytes_out), format_bytes(bytes_in)))
    } else {
        None
    }
}

// --- openvpn3 session helpers ---

/// Parse `openvpn3 sessions-list` and return the first session path found
async fn get_session_path() -> Option<String> {
    let output = tokio::process::Command::new("openvpn3")
        .args(["sessions-list"])
        .output()
        .await
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    for line in stdout.lines() {
        let trimmed = line.trim();
        if let Some(val) = trimmed.strip_prefix("Path:") {
            let path = val.trim().to_string();
            if !path.is_empty() {
                return Some(path);
            }
        }
    }
    None
}

/// Get full status from `openvpn3 sessions-list` + device info
async fn get_openvpn3_status() -> Option<OvpnStatus> {
    let output = tokio::process::Command::new("openvpn3")
        .args(["sessions-list"])
        .output()
        .await
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    // Parse the sessions-list output:
    //         Path: /net/openvpn/v3/sessions/...
    //      Created: 2026-04-13 13:44:57                       PID: 63766
    //        Owner: ti-17                                  Device: tun0
    //  Config name: /home/ti-17/vpn-profile.ovpn
    // Connected to: udp:15.229.213.158:1592
    //       Status: Connection, Client connected

    let mut session_path = String::new();
    let mut server = String::new();
    let mut protocol = String::new();
    let mut device = String::new();
    let mut status_text = String::new();
    let mut created = String::new();

    for line in stdout.lines() {
        let trimmed = line.trim();

        if let Some(val) = trimmed.strip_prefix("Path:") {
            session_path = val.trim().to_string();
        } else if let Some(val) = trimmed.strip_prefix("Created:") {
            // "2026-04-13 13:44:57                       PID: 63766"
            let parts: Vec<&str> = val.split("PID:").collect();
            created = parts[0].trim().to_string();
        } else if trimmed.starts_with("Owner:") {
            // "ti-17                                  Device: tun0"
            if let Some(dev_part) = trimmed.split("Device:").nth(1) {
                device = dev_part.trim().to_string();
            }
        } else if let Some(val) = trimmed.strip_prefix("Connected to:") {
            // "udp:15.229.213.158:1592"
            let conn = val.trim().to_string();
            let parts: Vec<&str> = conn.splitn(2, ':').collect();
            if parts.len() == 2 {
                protocol = parts[0].to_uppercase();
                server = parts[1].to_string();
            } else {
                server = conn;
            }
        } else if let Some(val) = trimmed.strip_prefix("Status:") {
            status_text = val.trim().to_string();
        }
    }

    // No session found
    if session_path.is_empty() {
        return None;
    }

    // Check if status indicates connected
    let is_connected = status_text.contains("Client connected");
    if !is_connected {
        return None;
    }

    // Get device-specific info
    let local_ip = if !device.is_empty() {
        get_device_ip(&device).await
    } else {
        get_device_ip("tun0").await
    };

    let (bytes_sent, bytes_received) = if !device.is_empty() {
        get_device_bytes(&device)
    } else {
        get_device_bytes("tun0")
    };

    // Compute uptime from created timestamp
    let uptime = compute_uptime(&created);

    // Get stats from openvpn3 session-stats (more accurate byte counts)
    let (final_bytes_sent, final_bytes_received) =
        if let Some((s, r)) = get_openvpn3_stats(&session_path).await {
            if !s.is_empty() {
                (s, r)
            } else {
                (bytes_sent, bytes_received)
            }
        } else {
            (bytes_sent, bytes_received)
        };

    Some(OvpnStatus {
        state: "connected".to_string(),
        server,
        local_ip,
        remote_ip: String::new(),
        uptime,
        bytes_sent: final_bytes_sent,
        bytes_received: final_bytes_received,
        protocol,
    })
}

/// The journalctl syslog identifiers used by openvpn3
const OPENVPN3_LOG_IDENTIFIERS: &[&str] = &[
    "net.openvpn.v3.log",
    "net.openvpn.v3.client",
    "openvpn3",
    "openvpn3-service-client",
];

fn detect_log_level(line: &str) -> &'static str {
    let upper = line.to_uppercase();
    if upper.contains("ERROR") || upper.contains("FATAL") || upper.contains("FAIL") {
        "error"
    } else if upper.contains("WARN") {
        "warn"
    } else if upper.contains("VERIFY OK")
        || upper.contains("COMPLETED")
        || upper.contains("CONNECTED")
        || upper.contains("PEER CONNECTION")
    {
        "success"
    } else {
        "info"
    }
}

// --- Tauri Commands ---

#[tauri::command]
pub async fn ovpn_connect(config: OvpnConfig) -> Result<String, String> {
    // Validate profile exists
    if !std::path::Path::new(&config.profile_path).exists() {
        return Err(format!("Profile not found: {}", config.profile_path));
    }

    // Spawn openvpn3 session-start with piped stdin for credentials
    let mut child = tokio::process::Command::new("openvpn3")
        .args(["session-start", "--config", &config.profile_path])
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start openvpn3: {}", e))?;

    // Write credentials to stdin: username, then password+otp
    if let Some(mut stdin) = child.stdin.take() {
        let credentials = format!("{}\n{}{}\n", config.username, config.password, config.otp);
        stdin
            .write_all(credentials.as_bytes())
            .await
            .map_err(|e| format!("Failed to write credentials: {}", e))?;
        stdin
            .shutdown()
            .await
            .map_err(|e| format!("Failed to close stdin: {}", e))?;
    } else {
        return Err("Failed to open stdin for openvpn3".to_string());
    }

    // Wait for the process with a timeout (60 seconds — openvpn3 can be slow)
    let result = tokio::time::timeout(std::time::Duration::from_secs(60), child.wait_with_output())
        .await
        .map_err(|_| "Connection timed out after 60 seconds".to_string())?
        .map_err(|e| format!("Failed to wait for openvpn3: {}", e))?;

    if !result.status.success() {
        let stderr = String::from_utf8_lossy(&result.stderr);
        let stdout = String::from_utf8_lossy(&result.stdout);
        let msg = if !stderr.is_empty() {
            stderr.to_string()
        } else {
            stdout.to_string()
        };
        return Err(format!("openvpn3 session-start failed: {}", msg.trim()));
    }

    Ok("Connection initiated".to_string())
}

#[tauri::command]
pub async fn ovpn_disconnect() -> Result<String, String> {
    let session_path = get_session_path()
        .await
        .ok_or_else(|| "No active OpenVPN session found".to_string())?;

    let output = tokio::process::Command::new("openvpn3")
        .args([
            "session-manage",
            "--session-path",
            &session_path,
            "--disconnect",
        ])
        .output()
        .await
        .map_err(|e| format!("Failed to run openvpn3 disconnect: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("openvpn3 disconnect failed: {}", stderr.trim()));
    }

    Ok("Disconnected".to_string())
}

#[tauri::command]
pub async fn ovpn_status(_profile_path: String) -> Result<OvpnStatus, String> {
    // Check for an active openvpn3 session
    if let Some(status) = get_openvpn3_status().await {
        return Ok(status);
    }

    // No active session → disconnected
    Ok(OvpnStatus {
        state: "disconnected".to_string(),
        server: String::new(),
        local_ip: String::new(),
        remote_ip: String::new(),
        uptime: String::new(),
        bytes_sent: String::new(),
        bytes_received: String::new(),
        protocol: String::new(),
    })
}

#[tauri::command]
pub async fn ovpn_get_logs(lines: u32) -> Result<Vec<OvpnLogLine>, String> {
    // Build journalctl args with multiple syslog identifiers for openvpn3
    let mut args: Vec<String> = Vec::new();
    for ident in OPENVPN3_LOG_IDENTIFIERS {
        args.push("-t".to_string());
        args.push(ident.to_string());
    }
    args.extend_from_slice(&[
        "--no-pager".to_string(),
        "-n".to_string(),
        lines.to_string(),
        "-o".to_string(),
        "cat".to_string(),
    ]);

    let output = tokio::process::Command::new("journalctl")
        .args(&args)
        .output()
        .await
        .map_err(|e| format!("Failed to read logs: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let result: Vec<OvpnLogLine> = stdout
        .lines()
        .filter(|l| !l.is_empty())
        .map(|line| OvpnLogLine {
            content: line.to_string(),
            level: detect_log_level(line).to_string(),
        })
        .collect();

    Ok(result)
}

#[tauri::command]
pub async fn ovpn_watch_start(app: AppHandle) -> Result<(), String> {
    // Stop existing watcher
    let _ = ovpn_watch_stop_inner(&app);

    let (cancel_tx, mut cancel_rx) = mpsc::channel::<()>(1);
    let app_handle = app.clone();

    // Build journalctl args for openvpn3
    let mut log_args: Vec<String> = Vec::new();
    for ident in OPENVPN3_LOG_IDENTIFIERS {
        log_args.push("-t".to_string());
        log_args.push(ident.to_string());
    }
    log_args.extend_from_slice(&[
        "--no-pager".to_string(),
        "-n".to_string(),
        "200".to_string(),
        "-o".to_string(),
        "cat".to_string(),
    ]);

    tokio::spawn(async move {
        let mut last_count: usize = 0;

        loop {
            tokio::select! {
                _ = cancel_rx.recv() => break,
                _ = tokio::time::sleep(std::time::Duration::from_secs(1)) => {
                    let output = tokio::process::Command::new("journalctl")
                        .args(&log_args)
                        .output()
                        .await;

                    if let Ok(out) = output {
                        let stdout = String::from_utf8_lossy(&out.stdout);
                        let all_lines: Vec<&str> = stdout.lines().filter(|l| !l.is_empty()).collect();
                        let current_count = all_lines.len();

                        if current_count > last_count {
                            let new_lines: Vec<OvpnLogLine> = all_lines[last_count..]
                                .iter()
                                .map(|line| OvpnLogLine {
                                    content: line.to_string(),
                                    level: detect_log_level(line).to_string(),
                                })
                                .collect();

                            if !new_lines.is_empty() {
                                let _ = app_handle.emit("ovpn-log-lines", &new_lines);
                            }
                        }
                        last_count = current_count;
                    }
                }
            }
        }
    });

    let state = OvpnWatchState {
        _cancel_tx: cancel_tx,
    };
    app.manage(Mutex::new(Some(state)));

    Ok(())
}

fn ovpn_watch_stop_inner(app: &AppHandle) -> Result<(), String> {
    if let Some(state) = app.try_state::<Mutex<Option<OvpnWatchState>>>() {
        let mut guard = state.lock().map_err(|e| format!("Lock error: {}", e))?;
        *guard = None;
    }
    Ok(())
}

#[tauri::command]
pub async fn ovpn_watch_stop(app: AppHandle) -> Result<(), String> {
    ovpn_watch_stop_inner(&app)
}
