use chrono::{NaiveDate, NaiveDateTime, NaiveTime};
use serde::{Deserialize, Serialize};
use sqlx::mysql::{MySqlPool, MySqlRow};
use sqlx::postgres::{PgPool, PgRow};
use sqlx::sqlite::{SqlitePool, SqliteRow};
use sqlx::{Column, Row, TypeInfo, ValueRef};
use std::collections::HashMap;
use std::time::{Instant, SystemTime, UNIX_EPOCH};
use tokio::sync::Mutex;

// --- Types ---

#[derive(Debug, Clone, Deserialize)]
pub struct DbConfig {
    pub db_type: String,
    pub host: String,
    pub port: u16,
    pub database: String,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct DbQueryResult {
    pub columns: Vec<String>,
    pub column_types: Vec<String>,
    pub rows: Vec<Vec<Option<String>>>,
    pub row_count: usize,
    pub affected_rows: u64,
    pub execution_time_ms: u64,
}

#[derive(Debug, Serialize, Clone)]
pub struct DbTableInfo {
    pub name: String,
    pub table_type: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct DbColumnInfo {
    pub name: String,
    pub data_type: String,
    pub is_nullable: bool,
    pub is_primary_key: bool,
    pub default_value: Option<String>,
}

// --- Pool enum ---

enum DbPool {
    Postgres(PgPool),
    MySql(MySqlPool),
    Sqlite(SqlitePool),
}

impl DbPool {
    async fn close(&self) {
        match self {
            DbPool::Postgres(p) => p.close().await,
            DbPool::MySql(p) => p.close().await,
            DbPool::Sqlite(p) => p.close().await,
        }
    }
}

impl Clone for DbPool {
    fn clone(&self) -> Self {
        match self {
            DbPool::Postgres(p) => DbPool::Postgres(p.clone()),
            DbPool::MySql(p) => DbPool::MySql(p.clone()),
            DbPool::Sqlite(p) => DbPool::Sqlite(p.clone()),
        }
    }
}

// --- State ---

struct DbConnection {
    pool: DbPool,
    db_type: String,
}

pub struct DbState {
    connections: Mutex<HashMap<String, DbConnection>>,
}

impl DbState {
    pub fn new() -> Self {
        Self {
            connections: Mutex::new(HashMap::new()),
        }
    }
}

// --- Helpers ---

fn url_encode(s: &str) -> String {
    let mut result = String::new();
    for b in s.bytes() {
        match b {
            b'a'..=b'z' | b'A'..=b'Z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                result.push(b as char);
            }
            _ => {
                result.push_str(&format!("%{:02X}", b));
            }
        }
    }
    result
}

fn build_url(config: &DbConfig) -> Result<String, String> {
    match config.db_type.as_str() {
        "postgresql" => Ok(format!(
            "postgres://{}:{}@{}:{}/{}",
            url_encode(&config.username),
            url_encode(&config.password),
            config.host,
            config.port,
            url_encode(&config.database)
        )),
        "mysql" => Ok(format!(
            "mysql://{}:{}@{}:{}/{}",
            url_encode(&config.username),
            url_encode(&config.password),
            config.host,
            config.port,
            url_encode(&config.database)
        )),
        "sqlite" => Ok(format!("sqlite:{}", config.database)),
        other => Err(format!("Unsupported database type: {}", other)),
    }
}

async fn connect_pool(config: &DbConfig) -> Result<DbPool, String> {
    let url = build_url(config)?;
    match config.db_type.as_str() {
        "postgresql" => {
            let pool = PgPool::connect(&url)
                .await
                .map_err(|e| format!("Connection failed: {}", e))?;
            Ok(DbPool::Postgres(pool))
        }
        "mysql" => {
            let pool = MySqlPool::connect(&url)
                .await
                .map_err(|e| format!("Connection failed: {}", e))?;
            Ok(DbPool::MySql(pool))
        }
        "sqlite" => {
            let pool = SqlitePool::connect(&url)
                .await
                .map_err(|e| format!("Connection failed: {}", e))?;
            Ok(DbPool::Sqlite(pool))
        }
        other => Err(format!("Unsupported database type: {}", other)),
    }
}

fn generate_id() -> String {
    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    format!("conn_{}", ts)
}

// --- Value extraction (database-specific) ---

fn extract_pg_value(row: &PgRow, i: usize) -> Option<String> {
    if let Ok(raw) = row.try_get_raw(i) {
        if raw.is_null() {
            return None;
        }
    } else {
        return None;
    }

    row.try_get::<String, _>(i)
        .ok()
        .or_else(|| row.try_get::<i64, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<i32, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<i16, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<f64, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<f32, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<bool, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<NaiveDateTime, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<NaiveDate, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<NaiveTime, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<serde_json::Value, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| {
            row.try_get::<Vec<u8>, _>(i)
                .ok()
                .map(|v| format!("0x{}", v.iter().map(|b| format!("{:02x}", b)).collect::<String>()))
        })
        .or_else(|| {
            // Fallback: report type name
            let type_name = row.columns().get(i).map(|c| c.type_info().name().to_string()).unwrap_or_default();
            Some(format!("<{}>", type_name))
        })
}

fn extract_mysql_value(row: &MySqlRow, i: usize) -> Option<String> {
    if let Ok(raw) = row.try_get_raw(i) {
        if raw.is_null() {
            return None;
        }
    } else {
        return None;
    }

    row.try_get::<String, _>(i)
        .ok()
        .or_else(|| row.try_get::<i64, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<i32, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<i16, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<i8, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<u64, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<u32, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<u16, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<u8, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<f64, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<f32, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<bool, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<NaiveDateTime, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<NaiveDate, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<NaiveTime, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<serde_json::Value, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| {
            row.try_get::<Vec<u8>, _>(i)
                .ok()
                .map(|v| format!("0x{}", v.iter().map(|b| format!("{:02x}", b)).collect::<String>()))
        })
        .or_else(|| {
            let type_name = row.columns().get(i).map(|c| c.type_info().name().to_string()).unwrap_or_default();
            Some(format!("<{}>", type_name))
        })
}

fn extract_sqlite_value(row: &SqliteRow, i: usize) -> Option<String> {
    if let Ok(raw) = row.try_get_raw(i) {
        if raw.is_null() {
            return None;
        }
    } else {
        return None;
    }

    row.try_get::<String, _>(i)
        .ok()
        .or_else(|| row.try_get::<i64, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<i32, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<f64, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| row.try_get::<bool, _>(i).ok().map(|v| v.to_string()))
        .or_else(|| {
            row.try_get::<Vec<u8>, _>(i)
                .ok()
                .map(|v| format!("0x{}", v.iter().map(|b| format!("{:02x}", b)).collect::<String>()))
        })
        .or_else(|| {
            let type_name = row.columns().get(i).map(|c| c.type_info().name().to_string()).unwrap_or_default();
            Some(format!("<{}>", type_name))
        })
}

// --- Rows to result (database-specific) ---

fn pg_rows_to_result(rows: Vec<PgRow>, elapsed_ms: u64) -> DbQueryResult {
    let columns: Vec<String> = if !rows.is_empty() {
        rows[0].columns().iter().map(|c| c.name().to_string()).collect()
    } else {
        Vec::new()
    };
    let column_types: Vec<String> = if !rows.is_empty() {
        rows[0].columns().iter().map(|c| c.type_info().name().to_string()).collect()
    } else {
        Vec::new()
    };
    let row_count = rows.len();
    let data: Vec<Vec<Option<String>>> = rows
        .iter()
        .take(1000)
        .map(|row| (0..row.columns().len()).map(|i| extract_pg_value(row, i)).collect())
        .collect();

    DbQueryResult { columns, column_types, rows: data, row_count, affected_rows: 0, execution_time_ms: elapsed_ms }
}

fn mysql_rows_to_result(rows: Vec<MySqlRow>, elapsed_ms: u64) -> DbQueryResult {
    let columns: Vec<String> = if !rows.is_empty() {
        rows[0].columns().iter().map(|c| c.name().to_string()).collect()
    } else {
        Vec::new()
    };
    let column_types: Vec<String> = if !rows.is_empty() {
        rows[0].columns().iter().map(|c| c.type_info().name().to_string()).collect()
    } else {
        Vec::new()
    };
    let row_count = rows.len();
    let data: Vec<Vec<Option<String>>> = rows
        .iter()
        .take(1000)
        .map(|row| (0..row.columns().len()).map(|i| extract_mysql_value(row, i)).collect())
        .collect();

    DbQueryResult { columns, column_types, rows: data, row_count, affected_rows: 0, execution_time_ms: elapsed_ms }
}

fn sqlite_rows_to_result(rows: Vec<SqliteRow>, elapsed_ms: u64) -> DbQueryResult {
    let columns: Vec<String> = if !rows.is_empty() {
        rows[0].columns().iter().map(|c| c.name().to_string()).collect()
    } else {
        Vec::new()
    };
    let column_types: Vec<String> = if !rows.is_empty() {
        rows[0].columns().iter().map(|c| c.type_info().name().to_string()).collect()
    } else {
        Vec::new()
    };
    let row_count = rows.len();
    let data: Vec<Vec<Option<String>>> = rows
        .iter()
        .take(1000)
        .map(|row| (0..row.columns().len()).map(|i| extract_sqlite_value(row, i)).collect())
        .collect();

    DbQueryResult { columns, column_types, rows: data, row_count, affected_rows: 0, execution_time_ms: elapsed_ms }
}

// --- Commands ---

#[tauri::command]
pub async fn db_test_connection(config: DbConfig) -> Result<String, String> {
    let pool = connect_pool(&config).await?;
    pool.close().await;
    Ok("Connection successful".to_string())
}

#[tauri::command]
pub async fn db_connect(
    config: DbConfig,
    state: tauri::State<'_, DbState>,
) -> Result<String, String> {
    let pool = connect_pool(&config).await?;

    let id = generate_id();
    let mut conns = state.connections.lock().await;
    conns.insert(
        id.clone(),
        DbConnection {
            pool,
            db_type: config.db_type.clone(),
        },
    );
    Ok(id)
}

#[tauri::command]
pub async fn db_disconnect(
    connection_id: String,
    state: tauri::State<'_, DbState>,
) -> Result<(), String> {
    let mut conns = state.connections.lock().await;
    if let Some(conn) = conns.remove(&connection_id) {
        conn.pool.close().await;
        Ok(())
    } else {
        Err("Connection not found".to_string())
    }
}

#[tauri::command]
pub async fn db_execute_query(
    connection_id: String,
    query: String,
    state: tauri::State<'_, DbState>,
) -> Result<DbQueryResult, String> {
    let (pool, _db_type) = {
        let conns = state.connections.lock().await;
        let conn = conns.get(&connection_id).ok_or("Connection not found".to_string())?;
        (conn.pool.clone(), conn.db_type.clone())
    };

    let start = Instant::now();

    match pool {
        DbPool::Postgres(ref p) => {
            match sqlx::query(&query).fetch_all(p).await {
                Ok(rows) => {
                    let elapsed = start.elapsed().as_millis() as u64;
                    Ok(pg_rows_to_result(rows, elapsed))
                }
                Err(fetch_err) => {
                    match sqlx::query(&query).execute(p).await {
                        Ok(result) => {
                            let elapsed = start.elapsed().as_millis() as u64;
                            Ok(DbQueryResult {
                                columns: Vec::new(), column_types: Vec::new(), rows: Vec::new(),
                                row_count: 0, affected_rows: result.rows_affected(), execution_time_ms: elapsed,
                            })
                        }
                        Err(_) => Err(format!("Query failed: {}", fetch_err)),
                    }
                }
            }
        }
        DbPool::MySql(ref p) => {
            match sqlx::query(&query).fetch_all(p).await {
                Ok(rows) => {
                    let elapsed = start.elapsed().as_millis() as u64;
                    Ok(mysql_rows_to_result(rows, elapsed))
                }
                Err(fetch_err) => {
                    match sqlx::query(&query).execute(p).await {
                        Ok(result) => {
                            let elapsed = start.elapsed().as_millis() as u64;
                            Ok(DbQueryResult {
                                columns: Vec::new(), column_types: Vec::new(), rows: Vec::new(),
                                row_count: 0, affected_rows: result.rows_affected(), execution_time_ms: elapsed,
                            })
                        }
                        Err(_) => Err(format!("Query failed: {}", fetch_err)),
                    }
                }
            }
        }
        DbPool::Sqlite(ref p) => {
            match sqlx::query(&query).fetch_all(p).await {
                Ok(rows) => {
                    let elapsed = start.elapsed().as_millis() as u64;
                    Ok(sqlite_rows_to_result(rows, elapsed))
                }
                Err(fetch_err) => {
                    match sqlx::query(&query).execute(p).await {
                        Ok(result) => {
                            let elapsed = start.elapsed().as_millis() as u64;
                            Ok(DbQueryResult {
                                columns: Vec::new(), column_types: Vec::new(), rows: Vec::new(),
                                row_count: 0, affected_rows: result.rows_affected(), execution_time_ms: elapsed,
                            })
                        }
                        Err(_) => Err(format!("Query failed: {}", fetch_err)),
                    }
                }
            }
        }
    }
}

#[tauri::command]
pub async fn db_list_databases(
    connection_id: String,
    state: tauri::State<'_, DbState>,
) -> Result<Vec<String>, String> {
    let (pool, db_type) = {
        let conns = state.connections.lock().await;
        let conn = conns.get(&connection_id).ok_or("Connection not found")?;
        (conn.pool.clone(), conn.db_type.clone())
    };

    let query = match db_type.as_str() {
        "postgresql" => "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname",
        "mysql" => "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA ORDER BY SCHEMA_NAME",
        "sqlite" => "SELECT 'main' AS name",
        _ => return Err("Unsupported database type".to_string()),
    };

    let names = match pool {
        DbPool::Postgres(ref p) => {
            let rows = sqlx::query(query).fetch_all(p).await
                .map_err(|e| format!("Failed to list databases: {}", e))?;
            rows.iter().filter_map(|r: &PgRow| r.try_get::<String, _>(0).ok()).collect()
        }
        DbPool::MySql(ref p) => {
            let rows = sqlx::query(query).fetch_all(p).await
                .map_err(|e| format!("Failed to list databases: {}", e))?;
            rows.iter().filter_map(|r: &MySqlRow| r.try_get::<String, _>(0).ok()).collect()
        }
        DbPool::Sqlite(ref p) => {
            let rows = sqlx::query(query).fetch_all(p).await
                .map_err(|e| format!("Failed to list databases: {}", e))?;
            rows.iter().filter_map(|r: &SqliteRow| r.try_get::<String, _>(0).ok()).collect()
        }
    };

    Ok(names)
}

#[tauri::command]
pub async fn db_list_tables(
    connection_id: String,
    state: tauri::State<'_, DbState>,
) -> Result<Vec<DbTableInfo>, String> {
    let (pool, db_type) = {
        let conns = state.connections.lock().await;
        let conn = conns.get(&connection_id).ok_or("Connection not found")?;
        (conn.pool.clone(), conn.db_type.clone())
    };

    let query = match db_type.as_str() {
        "postgresql" => {
            "SELECT table_name, table_type FROM information_schema.tables \
             WHERE table_schema = 'public' ORDER BY table_name"
        }
        "mysql" => {
            "SELECT TABLE_NAME, TABLE_TYPE FROM information_schema.TABLES \
             WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME"
        }
        "sqlite" => {
            "SELECT name, type FROM sqlite_master \
             WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%' \
             ORDER BY name"
        }
        _ => return Err("Unsupported database type".to_string()),
    };

    let tables = match pool {
        DbPool::Postgres(ref p) => {
            let rows = sqlx::query(query).fetch_all(p).await
                .map_err(|e| format!("Failed to list tables: {}", e))?;
            rows.iter().map(|r: &PgRow| DbTableInfo {
                name: r.try_get::<String, usize>(0).unwrap_or_default(),
                table_type: r.try_get::<String, usize>(1).unwrap_or_default(),
            }).collect()
        }
        DbPool::MySql(ref p) => {
            let rows = sqlx::query(query).fetch_all(p).await
                .map_err(|e| format!("Failed to list tables: {}", e))?;
            rows.iter().map(|r: &MySqlRow| DbTableInfo {
                name: r.try_get::<String, usize>(0).unwrap_or_default(),
                table_type: r.try_get::<String, usize>(1).unwrap_or_default(),
            }).collect()
        }
        DbPool::Sqlite(ref p) => {
            let rows = sqlx::query(query).fetch_all(p).await
                .map_err(|e| format!("Failed to list tables: {}", e))?;
            rows.iter().map(|r: &SqliteRow| DbTableInfo {
                name: r.try_get::<String, usize>(0).unwrap_or_default(),
                table_type: r.try_get::<String, usize>(1).unwrap_or_default(),
            }).collect()
        }
    };

    Ok(tables)
}

#[tauri::command]
pub async fn db_describe_table(
    connection_id: String,
    table_name: String,
    state: tauri::State<'_, DbState>,
) -> Result<Vec<DbColumnInfo>, String> {
    let (pool, db_type) = {
        let conns = state.connections.lock().await;
        let conn = conns.get(&connection_id).ok_or("Connection not found")?;
        (conn.pool.clone(), conn.db_type.clone())
    };

    match db_type.as_str() {
        "postgresql" => describe_pg(&pool, &table_name).await,
        "mysql" => describe_mysql(&pool, &table_name).await,
        "sqlite" => describe_sqlite(&pool, &table_name).await,
        _ => Err("Unsupported database type".to_string()),
    }
}

async fn describe_pg(pool: &DbPool, table: &str) -> Result<Vec<DbColumnInfo>, String> {
    let DbPool::Postgres(ref p) = pool else {
        return Err("Expected PostgreSQL pool".to_string());
    };

    let query = r#"
        SELECT
            c.column_name,
            c.data_type,
            c.is_nullable,
            c.column_default,
            CASE WHEN pk.column_name IS NOT NULL THEN 'YES' ELSE 'NO' END as is_pk
        FROM information_schema.columns c
        LEFT JOIN (
            SELECT ku.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage ku
                ON tc.constraint_name = ku.constraint_name
                AND tc.table_schema = ku.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
                AND tc.table_name = $1
                AND tc.table_schema = 'public'
        ) pk ON c.column_name = pk.column_name
        WHERE c.table_name = $1 AND c.table_schema = 'public'
        ORDER BY c.ordinal_position
    "#;

    let rows = sqlx::query(query)
        .bind(table)
        .fetch_all(p)
        .await
        .map_err(|e| format!("Failed to describe table: {}", e))?;

    Ok(rows
        .iter()
        .map(|row: &PgRow| DbColumnInfo {
            name: row.try_get::<String, _>(0).unwrap_or_default(),
            data_type: row.try_get::<String, _>(1).unwrap_or_default(),
            is_nullable: row.try_get::<String, _>(2).unwrap_or_default() == "YES",
            default_value: row.try_get::<String, _>(3).ok(),
            is_primary_key: row.try_get::<String, _>(4).unwrap_or_default() == "YES",
        })
        .collect())
}

async fn describe_mysql(pool: &DbPool, table: &str) -> Result<Vec<DbColumnInfo>, String> {
    let DbPool::MySql(ref p) = pool else {
        return Err("Expected MySQL pool".to_string());
    };

    let query = r#"
        SELECT
            COLUMN_NAME,
            COLUMN_TYPE,
            IS_NULLABLE,
            COLUMN_DEFAULT,
            COLUMN_KEY
        FROM information_schema.COLUMNS
        WHERE TABLE_NAME = ? AND TABLE_SCHEMA = DATABASE()
        ORDER BY ORDINAL_POSITION
    "#;

    let rows = sqlx::query(query)
        .bind(table)
        .fetch_all(p)
        .await
        .map_err(|e| format!("Failed to describe table: {}", e))?;

    Ok(rows
        .iter()
        .map(|row: &MySqlRow| DbColumnInfo {
            name: row.try_get::<String, _>(0).unwrap_or_default(),
            data_type: row.try_get::<String, _>(1).unwrap_or_default(),
            is_nullable: row.try_get::<String, _>(2).unwrap_or_default() == "YES",
            default_value: row.try_get::<String, _>(3).ok(),
            is_primary_key: row.try_get::<String, _>(4).unwrap_or_default() == "PRI",
        })
        .collect())
}

async fn describe_sqlite(pool: &DbPool, table: &str) -> Result<Vec<DbColumnInfo>, String> {
    let DbPool::Sqlite(ref p) = pool else {
        return Err("Expected SQLite pool".to_string());
    };

    let safe_name: String = table.chars().filter(|c| c.is_alphanumeric() || *c == '_').collect();
    let query = format!("PRAGMA table_info({})", safe_name);

    let rows = sqlx::query(&query)
        .fetch_all(p)
        .await
        .map_err(|e| format!("Failed to describe table: {}", e))?;

    Ok(rows
        .iter()
        .map(|row: &SqliteRow| {
            let pk_val = row.try_get::<i32, _>(5).unwrap_or(0);
            DbColumnInfo {
                name: row.try_get::<String, _>(1).unwrap_or_default(),
                data_type: row.try_get::<String, _>(2).unwrap_or_default(),
                is_nullable: row.try_get::<i32, _>(3).unwrap_or(0) == 0,
                default_value: row.try_get::<String, _>(4).ok(),
                is_primary_key: pk_val > 0,
            }
        })
        .collect())
}
