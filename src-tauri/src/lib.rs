use serde::{Deserialize, Serialize};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::State;

#[derive(Default)]
struct VoiceState {
    process: Mutex<Option<Child>>,
    model_path: Mutex<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct RecordingConfig {
    timeout: u32,
    model_size: String,
    auto_punctuation: bool,
    numbers_as_digits: bool,
}

// Start voice recording using nerd-dictation
#[tauri::command]
async fn start_recording(
    config: RecordingConfig,
    state: State<'_, VoiceState>,
) -> Result<(), String> {
    // Determine model path based on size
    let home = std::env::var("HOME").unwrap_or_default();
    let model_name = if config.model_size == "large" {
        "vosk-model-en-us-0.22"
    } else {
        "vosk-model-small-en-us-0.15"
    };
    let model_dir = format!("{}/.local/share/vosk-models/{}", home, model_name);

    // Save model path for later use
    *state.model_path.lock().unwrap() = model_dir.clone();

    // Check if nerd-dictation is available
    let nerd_dictation_path = which::which("nerd-dictation")
        .or_else(|_| {
            let home = std::env::var("HOME").unwrap_or_default();
            which::which(format!("{}/.local/bin/nerd-dictation", home))
        })
        .map_err(|e| format!("nerd-dictation not found: {}", e))?;

    // Get config file path
    let config_file = format!("{}/.config/nerd-dictation/nerd-dictation.py", home);

    // Validate config file exists
    if !std::path::Path::new(&config_file).exists() {
        return Err(format!("Configuration file not found: {}. Please create the nerd-dictation config file.", config_file));
    }

    // Build command with configuration
    let mut cmd = Command::new(nerd_dictation_path);
    cmd.arg("begin")
        .arg("--vosk-model-dir")
        .arg(&model_dir)
        .arg("--timeout")
        .arg(config.timeout.to_string())
        .arg("--config")
        .arg(&config_file)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    // Add numbers as digits flag if enabled
    if config.numbers_as_digits {
        cmd.arg("--numbers-as-digits");
    }

    // Start the process
    let child = cmd
        .spawn()
        .map_err(|e| format!("Failed to start recording: {}", e))?;

    // Store the process handle
    *state.process.lock().unwrap() = Some(child);

    Ok(())
}

// Stop voice recording
#[tauri::command]
async fn stop_recording(state: State<'_, VoiceState>) -> Result<String, String> {
    // End nerd-dictation
    let nerd_dictation_path = which::which("nerd-dictation")
        .or_else(|_| {
            let home = std::env::var("HOME").unwrap_or_default();
            which::which(format!("{}/.local/bin/nerd-dictation", home))
        })
        .map_err(|e| format!("nerd-dictation not found: {}", e))?;

    let _output = Command::new(nerd_dictation_path)
        .arg("end")
        .output()
        .map_err(|e| format!("Failed to stop recording: {}", e))?;

    // Kill the stored process if it exists
    if let Some(mut child) = state.process.lock().unwrap().take() {
        if let Err(e) = child.kill() {
            eprintln!("Warning: Failed to kill recording process: {}", e);
        }
    }

    // The text output is typically in clipboard via xdotool
    // We'll use xclip to get it
    let clipboard_output = Command::new("xclip")
        .args(["-selection", "clipboard", "-o"])
        .output()
        .map_err(|e| format!("Failed to read clipboard: {}", e))?;

    let text = String::from_utf8_lossy(&clipboard_output.stdout).to_string();

    Ok(text)
}

// Insert text into active window using xdotool
#[tauri::command]
async fn insert_text(text: String) -> Result<(), String> {
    // Use xdotool to type the text
    let output = Command::new("xdotool")
        .arg("type")
        .arg("--clearmodifiers")
        .arg("--")
        .arg(&text)
        .output()
        .map_err(|e| format!("Failed to insert text: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "xdotool failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    Ok(())
}

// Check if voice system is available
#[tauri::command]
async fn check_voice_system() -> Result<VoiceSystemStatus, String> {
    let mut status = VoiceSystemStatus {
        nerd_dictation: false,
        xdotool: false,
        vosk_model_small: false,
        vosk_model_large: false,
        microphone: false,
    };

    // Check nerd-dictation
    status.nerd_dictation = which::which("nerd-dictation").is_ok()
        || which::which(format!("{}/.local/bin/nerd-dictation",
            std::env::var("HOME").unwrap_or_default())).is_ok();

    // Check xdotool
    status.xdotool = which::which("xdotool").is_ok();

    // Check Vosk models
    let home = std::env::var("HOME").unwrap_or_default();
    let models_dir = format!("{}/.local/share/vosk-models", home);

    status.vosk_model_small = std::path::Path::new(&format!(
        "{}/vosk-model-small-en-us-0.15",
        models_dir
    ))
    .exists();

    status.vosk_model_large = std::path::Path::new(&format!(
        "{}/vosk-model-en-us-0.22",
        models_dir
    ))
    .exists();

    // Check microphone (using pactl)
    if let Ok(output) = Command::new("pactl")
        .args(["list", "sources", "short"])
        .output()
    {
        status.microphone = String::from_utf8_lossy(&output.stdout).contains("input");
    }

    Ok(status)
}

#[derive(Debug, Serialize)]
struct VoiceSystemStatus {
    nerd_dictation: bool,
    xdotool: bool,
    vosk_model_small: bool,
    vosk_model_large: bool,
    microphone: bool,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(VoiceState::default())
        .invoke_handler(tauri::generate_handler![
            start_recording,
            stop_recording,
            insert_text,
            check_voice_system
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
