use std::{fs, path::Path};

use base64::{engine::general_purpose::STANDARD_NO_PAD, Engine};
use rand::{rngs::OsRng, RngCore};
use serde::{Deserialize, Serialize};
use thiserror::Error;

const ENV_KEY: &str = "PF_APP_DB_KEY";

#[derive(Debug, Clone)]
pub struct AppSecrets {
    db_key: String,
}

impl AppSecrets {
    pub fn new(db_key: String) -> Self {
        Self { db_key }
    }

    pub fn sqlcipher_key(&self) -> &str {
        &self.db_key
    }
}

#[derive(Debug, Error)]
pub enum SecretError {
    #[error("utf8 error: {0}")]
    Utf8(#[from] std::string::FromUtf8Error),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("serde error: {0}")]
    Serde(#[from] serde_json::Error),
    #[cfg(target_os = "windows")]
    #[error("credential manager error code: {0}")]
    CredentialManager(u32),
}

#[derive(Serialize, Deserialize)]
struct SecretFile {
    sqlcipher_key: String,
}

pub fn load_or_create(service_name: &str, fallback_file: &Path) -> Result<AppSecrets, SecretError> {
    if let Some(value) = std::env::var_os(ENV_KEY) {
        if let Ok(secret) = value.into_string() {
            return Ok(AppSecrets::new(secret));
        }
    }

    #[cfg(target_os = "windows")]
    if let Ok(Some(secret)) = read_windows_credential(service_name) {
        return Ok(AppSecrets::new(secret));
    }

    if let Some(secret) = read_secret_file(fallback_file)? {
        return Ok(AppSecrets::new(secret));
    }

    let generated = generate_key();

    #[cfg(target_os = "windows")]
    if write_windows_credential(service_name, &generated).is_err() {
        tracing::warn!("Failed to write to Windows Credential Manager, using fallback file");
    }

    write_secret_file(fallback_file, &generated)?;

    Ok(AppSecrets::new(generated))
}

fn generate_key() -> String {
    let mut bytes = [0u8; 32];
    OsRng.fill_bytes(&mut bytes);
    STANDARD_NO_PAD.encode(bytes)
}

fn read_secret_file(path: &Path) -> Result<Option<String>, SecretError> {
    if !path.exists() {
        return Ok(None);
    }

    let contents = fs::read_to_string(path)?;
    let parsed: SecretFile = serde_json::from_str(&contents)?;
    Ok(Some(parsed.sqlcipher_key))
}

fn write_secret_file(path: &Path, secret: &str) -> Result<(), SecretError> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let payload = SecretFile {
        sqlcipher_key: secret.to_string(),
    };
    let serialized = serde_json::to_string_pretty(&payload)?;
    fs::write(path, serialized)?;
    Ok(())
}

#[cfg(target_os = "windows")]
fn read_windows_credential(service_name: &str) -> Result<Option<String>, SecretError> {
    use std::ffi::OsStr;
    use std::os::windows::prelude::OsStrExt;

    use windows::core::PCWSTR;
    use windows::Win32::Foundation::ERROR_NOT_FOUND;
    use windows::Win32::Security::Credentials::{
        CredFree, CredReadW, CREDENTIALW, CRED_TYPE_GENERIC,
    };

    let mut encoded: Vec<u16> = OsStr::new(service_name).encode_wide().collect();
    encoded.push(0);

    let mut credential: *mut CREDENTIALW = std::ptr::null_mut();
    match unsafe {
        CredReadW(
            PCWSTR(encoded.as_ptr()),
            CRED_TYPE_GENERIC,
            0,
            &mut credential,
        )
    } {
        Ok(_) => {}
        Err(err) => {
            let code = err.code().0 as u32;
            if code == ERROR_NOT_FOUND.0 {
                return Ok(None);
            }
            return Err(SecretError::CredentialManager(code));
        }
    }

    let cred = unsafe { credential.as_ref() }.ok_or(SecretError::CredentialManager(0))?;
    let buffer = unsafe {
        std::slice::from_raw_parts(cred.CredentialBlob, cred.CredentialBlobSize as usize)
    };
    let secret = String::from_utf8(buffer.to_vec())?;

    unsafe { CredFree(credential as *mut _) };

    Ok(Some(secret))
}

#[cfg(target_os = "windows")]
fn write_windows_credential(service_name: &str, secret: &str) -> Result<(), SecretError> {
    use std::ffi::OsStr;
    use std::os::windows::prelude::OsStrExt;

    use windows::core::PWSTR;
    use windows::Win32::Security::Credentials::{
        CredWriteW, CREDENTIALW, CRED_PERSIST_ENTERPRISE, CRED_TYPE_GENERIC,
    };

    let mut encoded: Vec<u16> = OsStr::new(service_name).encode_wide().collect();
    encoded.push(0);

    let mut blob = secret.as_bytes().to_vec();

    let credential = CREDENTIALW {
        Type: CRED_TYPE_GENERIC,
        TargetName: PWSTR(encoded.as_mut_ptr()),
        CredentialBlobSize: blob.len() as u32,
        CredentialBlob: blob.as_mut_ptr(),
        Persist: CRED_PERSIST_ENTERPRISE,
        AttributeCount: 0,
        Comment: PWSTR::null(),
        TargetAlias: PWSTR::null(),
        UserName: PWSTR::null(),
        ..Default::default()
    };

    if let Err(err) = unsafe { CredWriteW(&credential, 0) } {
        return Err(SecretError::CredentialManager(err.code().0 as u32));
    }

    Ok(())
}
