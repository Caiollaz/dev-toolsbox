use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use std::io::{BufRead, BufReader, SeekFrom};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};
use tokio::sync::mpsc;

#[derive(Debug, Serialize, Clone)]
pub struct LogLine {
    pub line_number: usize,
    pub content: String,
    pub level: String,
    pub timestamp: String,
}

fn detect_level(line: &str) -> &'static str {
    let upper = line.to_uppercase();
    if upper.contains("ERROR") || upper.contains("ERR ") || upper.contains("[ERROR]") {
        "error"
    } else if upper.contains("WARN") || upper.contains("[WARN]") || upper.contains("WARNING") {
        "warn"
    } else if upper.contains("DEBUG") || upper.contains("[DEBUG]") {
        "debug"
    } else if upper.contains("INFO") || upper.contains("[INFO]") {
        "info"
    } else if upper.contains("TRACE") || upper.contains("[TRACE]") {
        "trace"
    } else {
        "info"
    }
}

fn extract_timestamp(line: &str) -> String {
    // Try common timestamp patterns
    if line.len() >= 12 {
        let prefix = &line[..std::cmp::min(30, line.len())];
        // ISO-like: 2024-01-01T12:00:00 or 2024-01-01 12:00:00
        if prefix.contains('-') && (prefix.contains('T') || prefix.contains(' ')) {
            if let Some(ts) = prefix.split_whitespace().next() {
                if ts.contains('-') {
                    return ts.to_string();
                }
            }
        }
        // Time only: 12:00:00.123
        if let Some(idx) = prefix.find(':') {
            if idx >= 2 && idx <= 10 {
                let start = prefix[..idx]
                    .rfind(|c: char| !c.is_ascii_digit() && c != '.')
                    .map(|i| i + 1)
                    .unwrap_or(0);
                let time_part = &prefix[start..];
                if let Some(end) = time_part.find(|c: char| !c.is_ascii_digit() && c != ':' && c != '.') {
                    return time_part[..end].to_string();
                }
            }
        }
    }
    String::new()
}

#[tauri::command]
pub async fn log_read_file(path: String, lines: usize) -> Result<Vec<LogLine>, String> {
    let content = tokio::fs::read_to_string(&path)
        .await
        .map_err(|e| format!("Failed to read file: {}", e))?;

    let all_lines: Vec<&str> = content.lines().collect();
    let start = if all_lines.len() > lines {
        all_lines.len() - lines
    } else {
        0
    };

    let result: Vec<LogLine> = all_lines[start..]
        .iter()
        .enumerate()
        .map(|(i, line)| LogLine {
            line_number: start + i + 1,
            content: line.to_string(),
            level: detect_level(line).to_string(),
            timestamp: extract_timestamp(line),
        })
        .collect();

    Ok(result)
}

struct WatcherState {
    _watcher: RecommendedWatcher,
    _cancel_tx: mpsc::Sender<()>,
}

#[tauri::command]
pub async fn log_watch_start(app: AppHandle, path: String) -> Result<(), String> {
    // Stop existing watcher if any
    let _ = log_watch_stop_inner(&app);

    let file_path = std::path::PathBuf::from(&path);
    if !file_path.exists() {
        return Err(format!("File not found: {}", path));
    }

    let (cancel_tx, mut cancel_rx) = mpsc::channel::<()>(1);

    // Track file position
    let initial_size = std::fs::metadata(&path)
        .map(|m| m.len())
        .unwrap_or(0);
    let position = std::sync::Arc::new(Mutex::new(initial_size));

    let app_handle = app.clone();
    let watch_path = path.clone();

    let (tx, mut rx) = mpsc::channel::<()>(100);

    let mut watcher = RecommendedWatcher::new(
        move |res: Result<Event, notify::Error>| {
            if let Ok(event) = res {
                if matches!(event.kind, EventKind::Modify(_)) {
                    let _ = tx.blocking_send(());
                }
            }
        },
        notify::Config::default(),
    )
    .map_err(|e| format!("Failed to create file watcher: {}", e))?;

    watcher
        .watch(file_path.as_path(), RecursiveMode::NonRecursive)
        .map_err(|e| format!("Failed to watch file: {}", e))?;

    // Spawn the reader task
    let pos = position.clone();
    tokio::spawn(async move {
        loop {
            tokio::select! {
                _ = cancel_rx.recv() => break,
                Some(()) = rx.recv() => {
                    let mut current_pos = pos.lock().unwrap().clone();
                    if let Ok(file) = std::fs::File::open(&watch_path) {
                        let metadata = file.metadata().unwrap();
                        let file_size = metadata.len();

                        if file_size < current_pos {
                            // File was truncated, read from beginning
                            current_pos = 0;
                        }

                        if file_size > current_pos {
                            use std::io::Seek;
                            let mut reader = BufReader::new(file);
                            if reader.seek(SeekFrom::Start(current_pos)).is_ok() {
                                let mut new_lines = Vec::new();
                                let mut line = String::new();
                                while reader.read_line(&mut line).unwrap_or(0) > 0 {
                                    let trimmed = line.trim_end().to_string();
                                    if !trimmed.is_empty() {
                                        new_lines.push(LogLine {
                                            line_number: 0,
                                            content: trimmed.clone(),
                                            level: detect_level(&trimmed).to_string(),
                                            timestamp: extract_timestamp(&trimmed),
                                        });
                                    }
                                    line.clear();
                                }
                                if !new_lines.is_empty() {
                                    let _ = app_handle.emit("log-new-lines", &new_lines);
                                }
                            }
                            *pos.lock().unwrap() = file_size;
                        }
                    }
                }
            }
        }
    });

    // Store watcher state so it doesn't get dropped
    let state = WatcherState {
        _watcher: watcher,
        _cancel_tx: cancel_tx,
    };
    app.manage(Mutex::new(Some(state)));

    Ok(())
}

fn log_watch_stop_inner(app: &AppHandle) -> Result<(), String> {
    if let Some(state) = app.try_state::<Mutex<Option<WatcherState>>>() {
        let mut guard = state.lock().map_err(|e| format!("Lock error: {}", e))?;
        *guard = None; // Drop the watcher
    }
    Ok(())
}

#[tauri::command]
pub async fn log_watch_stop(app: AppHandle) -> Result<(), String> {
    log_watch_stop_inner(&app)
}
