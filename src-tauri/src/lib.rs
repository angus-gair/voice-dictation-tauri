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

    // Build command with configuration that outputs to STDOUT instead of typing
    let mut cmd = Command::new(nerd_dictation_path);
    cmd.arg("begin")
        .arg("--vosk-model-dir")
        .arg(&model_dir)
        .arg("--timeout")
        .arg(config.timeout.to_string())
        .arg("--config")
        .arg(&config_file)
        .arg("--output")
        .arg("STDOUT")
        .arg("--defer-output")  // This ensures output is deferred until we call 'end'
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    // Add numbers as digits flag if enabled
    if config.numbers_as_digits {
        cmd.arg("--numbers-as-digits");
    }

    // Add auto punctuation if enabled
    if config.auto_punctuation {
        cmd.arg("--full-sentence");
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
    // Get the stored process
    let child_opt = state.process.lock().unwrap().take();
    
    if let Some(child) = child_opt {
        // End nerd-dictation first
        let nerd_dictation_path = which::which("nerd-dictation")
            .or_else(|_| {
                let home = std::env::var("HOME").unwrap_or_default();
                which::which(format!("{}/.local/bin/nerd-dictation", home))
            })
            .map_err(|e| format!("nerd-dictation not found: {}", e))?;

        let _end_output = Command::new(nerd_dictation_path)
            .arg("end")
            .output()
            .map_err(|e| format!("Failed to end recording: {}", e))?;

        // Now wait for the process to complete and capture its stdout
        let output = child
            .wait_with_output()
            .map_err(|e| format!("Failed to read recording output: {}", e))?;

        // Get the transcribed text from stdout
        let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
        
        // If there's an error in stderr, log it but don't fail
        if !output.stderr.is_empty() {
            let stderr_text = String::from_utf8_lossy(&output.stderr);
            eprintln!("nerd-dictation stderr: {}", stderr_text);
        }

        Ok(text)
    } else {
        // No process was running
        Err("No recording process found".to_string())
    }
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
