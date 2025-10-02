# Voice Dictation System Architecture

**Version:** 1.0
**Date:** 2025-10-02
**Status:** Design Phase

## Executive Summary

This document provides a comprehensive architecture design for the Voice Dictation Tauri application, including missing system integration components required to implement the features described in the README.

### Key Components Designed

1. **nerd-dictation Configuration** - Python module for voice command processing
2. **Voice Command System** - Dictionary-based command mapping with priority
3. **Auto Punctuation Engine** - Rule-based FSM for intelligent punctuation
4. **System Integration Scripts** - Bash scripts for installation and configuration

## System Overview

### High-Level Architecture (C4 Level 1)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Voice Dictation System                        │
│                                                                      │
│  ┌────────────────┐          ┌───────────────┐                     │
│  │                │          │               │                     │
│  │   User via     │◀────────▶│  Tauri App    │                     │
│  │   Browser UI   │          │  (Frontend)   │                     │
│  │                │          │               │                     │
│  └────────────────┘          └───────┬───────┘                     │
│                                      │                              │
│                                      ▼                              │
│                              ┌───────────────┐                      │
│                              │               │                      │
│                              │  Rust Backend │                      │
│                              │    (Tauri)    │                      │
│                              │               │                      │
│                              └───────┬───────┘                      │
│                                      │                              │
│                    ┌─────────────────┼─────────────────┐           │
│                    │                 │                 │           │
│                    ▼                 ▼                 ▼           │
│            ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│            │              │  │              │  │              │  │
│            │    nerd-     │  │   xdotool    │  │   xclip      │  │
│            │  dictation   │  │  (Text       │  │  (Clipboard) │  │
│            │  (Voice      │  │   Insertion) │  │              │  │
│            │   Engine)    │  │              │  │              │  │
│            │              │  │              │  │              │  │
│            └──────┬───────┘  └──────────────┘  └──────────────┘  │
│                   │                                                │
│                   ▼                                                │
│          ┌────────────────┐                                       │
│          │                │                                       │
│          │  Configuration │                                       │
│          │     Module     │                                       │
│          │  (Python)      │                                       │
│          │                │                                       │
│          └────────┬───────┘                                       │
│                   │                                                │
│                   ▼                                                │
│          ┌────────────────┐                                       │
│          │                │                                       │
│          │  Vosk Model    │                                       │
│          │  (ASR Engine)  │                                       │
│          │                │                                       │
│          └────────────────┘                                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

External Systems:
- Operating System (Linux)
- Audio System (PulseAudio/PipeWire)
- X11/Wayland Display Server
- GNOME Settings
```

### Component Interaction Diagram (C4 Level 2)

```
┌───────────────────────────────────────────────────────────────────────┐
│                         Component Interactions                        │
│                                                                       │
│   ┌──────────┐                                                        │
│   │   User   │                                                        │
│   └────┬─────┘                                                        │
│        │ 1. Click Record                                              │
│        ▼                                                               │
│   ┌──────────────────────────────────────┐                           │
│   │        TypeScript Frontend           │                           │
│   │  ┌────────────┐    ┌──────────────┐ │                           │
│   │  │  UI State  │    │   Settings   │ │                           │
│   │  │  Manager   │    │   Manager    │ │                           │
│   │  └────────────┘    └──────────────┘ │                           │
│   └──────────┬───────────────────────────┘                           │
│              │ 2. invoke('start_recording', config)                  │
│              ▼                                                         │
│   ┌──────────────────────────────────────┐                           │
│   │         Rust Backend (Tauri)         │                           │
│   │  ┌────────────────────────────────┐  │                           │
│   │  │  Command Handlers              │  │                           │
│   │  │  - start_recording()           │  │                           │
│   │  │  - stop_recording()            │  │                           │
│   │  │  - insert_text()               │  │                           │
│   │  │  - check_voice_system()        │  │                           │
│   │  └────────────┬───────────────────┘  │                           │
│   │               │                       │                           │
│   │  ┌────────────▼───────────────────┐  │                           │
│   │  │  Process Manager               │  │                           │
│   │  │  - Spawn nerd-dictation        │  │                           │
│   │  │  - Monitor subprocess          │  │                           │
│   │  │  - Handle output               │  │                           │
│   │  └────────────┬───────────────────┘  │                           │
│   │               │                       │                           │
│   │  ┌────────────▼───────────────────┐  │                           │
│   │  │  System Integration Layer      │  │                           │
│   │  │  - xdotool wrapper             │  │                           │
│   │  │  - xclip wrapper               │  │                           │
│   │  │  - pactl wrapper               │  │                           │
│   │  └────────────────────────────────┘  │                           │
│   └──────────────┬────────────────────────┘                           │
│                  │ 3. Execute: nerd-dictation begin                  │
│                  ▼                                                     │
│   ┌──────────────────────────────────────┐                           │
│   │       nerd-dictation Process         │                           │
│   │  ┌────────────────────────────────┐  │                           │
│   │  │  Audio Capture                 │  │                           │
│   │  │  - PulseAudio/PipeWire         │  │                           │
│   │  │  - Microphone input            │  │                           │
│   │  └────────────┬───────────────────┘  │                           │
│   │               │ 4. Audio stream       │                           │
│   │               ▼                       │                           │
│   │  ┌────────────────────────────────┐  │                           │
│   │  │  Vosk Speech Recognition       │  │                           │
│   │  │  - Load model                  │  │                           │
│   │  │  - Process audio               │  │                           │
│   │  │  - Generate text               │  │                           │
│   │  └────────────┬───────────────────┘  │                           │
│   │               │ 5. Raw text           │                           │
│   │               ▼                       │                           │
│   │  ┌────────────────────────────────┐  │                           │
│   │  │  Configuration Module          │  │                           │
│   │  │  (nerd-dictation.py)           │  │                           │
│   │  │                                │  │                           │
│   │  │  Pipeline:                     │  │                           │
│   │  │  1. Voice Commands             │  │                           │
│   │  │  2. Number Conversion          │  │                           │
│   │  │  3. Auto Punctuation           │  │                           │
│   │  │  4. Text Cleanup               │  │                           │
│   │  └────────────┬───────────────────┘  │                           │
│   │               │ 6. Processed text     │                           │
│   │               ▼                       │                           │
│   │  ┌────────────────────────────────┐  │                           │
│   │  │  Output Handler                │  │                           │
│   │  │  - Send to clipboard (xclip)   │  │                           │
│   │  │  - Return to app               │  │                           │
│   │  └────────────────────────────────┘  │                           │
│   └──────────────┬────────────────────────┘                           │
│                  │ 7. Return text                                    │
│                  ▼                                                     │
│   ┌──────────────────────────────────────┐                           │
│   │         Rust Backend (Tauri)         │                           │
│   │  - Read clipboard                    │                           │
│   │  - Return to frontend                │                           │
│   └──────────────┬───────────────────────┘                           │
│                  │ 8. Update UI                                      │
│                  ▼                                                     │
│   ┌──────────────────────────────────────┐                           │
│   │        TypeScript Frontend           │                           │
│   │  - Display transcribed text          │                           │
│   │  - Update status                     │                           │
│   │  - Optional: auto-insert             │                           │
│   └──────────────────────────────────────┘                           │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Frontend Layer (TypeScript)

**Technology**: Vanilla TypeScript, HTML5, CSS3

**Responsibilities**:
- User interface rendering
- State management
- Settings persistence (localStorage)
- Tauri backend communication
- Error handling and user feedback

**Key Files**:
- `/src/main.ts` - Application logic
- `/src/styles.css` - UI styling
- `/index.html` - HTML structure

**State Management**:
```typescript
interface AppState {
  isRecording: boolean;
  text: string;
  isInitialized: boolean;
  systemStatus: VoiceSystemStatus | null;
  settings: {
    autoPunctuation: boolean;
    numbersAsDigits: boolean;
    autoInsert: boolean;
    timeout: number;
    modelSize: 'small' | 'large';
  };
}
```

### 2. Backend Layer (Rust)

**Technology**: Rust, Tauri 2.0

**Responsibilities**:
- Process lifecycle management
- System integration (xdotool, xclip, pactl)
- Configuration file management
- Command handling
- Error propagation

**Key Files**:
- `/src-tauri/src/lib.rs` - Core logic and commands
- `/src-tauri/src/main.rs` - Entry point
- `/src-tauri/Cargo.toml` - Dependencies

**Commands**:
```rust
#[tauri::command]
async fn start_recording(config: RecordingConfig) -> Result<(), String>

#[tauri::command]
async fn stop_recording() -> Result<String, String>

#[tauri::command]
async fn insert_text(text: String) -> Result<(), String>

#[tauri::command]
async fn check_voice_system() -> Result<VoiceSystemStatus, String>
```

### 3. Voice Processing Layer (Python)

**Technology**: Python 3.7+, nerd-dictation, Vosk

**Location**: `~/.config/nerd-dictation/nerd-dictation.py`

**Responsibilities**:
- Voice command mapping
- Number conversion
- Auto punctuation
- Text cleanup

**Processing Pipeline**:
```python
def nerd_dictation_process(text: str) -> str:
    # 1. Voice commands
    text = process_voice_commands(text)

    # 2. Number conversion
    text = convert_numbers_to_digits(text)

    # 3. Auto punctuation
    text = add_auto_punctuation(text)

    # 4. Cleanup
    text = cleanup_text(text)

    return text
```

**Dependencies**:
- `vosk` - Speech recognition
- `soundfile` - Audio processing
- `num2words` - Number conversion (optional)

### 4. System Integration Layer (Bash)

**Technology**: Bash scripts

**Location**: `/scripts/`

**Scripts**:
- `install.sh` - Complete installation automation
- `generate-config.sh` - Configuration file generation
- `setup-desktop.sh` - GNOME integration
- `validate.sh` - System health checks
- `service-manager.sh` - Service control
- `uninstall.sh` - Clean removal

**Responsibilities**:
- Dependency installation
- Configuration file creation
- Desktop environment integration
- System validation
- Service management

### 5. Speech Recognition Engine (Vosk)

**Technology**: Vosk offline ASR

**Models**:
- Small: `vosk-model-small-en-us-0.15` (45MB)
- Large: `vosk-model-en-us-0.22` (1.8GB)

**Location**: `~/.local/share/vosk-models/`

**Characteristics**:
- 100% offline processing
- No cloud dependencies
- Real-time transcription
- Multiple language support

## Data Flow

### Recording Flow

```
User clicks "Record"
  ↓
Frontend invokes start_recording(config)
  ↓
Rust spawns nerd-dictation subprocess
  ↓
nerd-dictation captures audio from microphone
  ↓
Audio streams to Vosk model
  ↓
Vosk generates raw text
  ↓
nerd-dictation.py processes text:
  - Voice commands → symbols
  - Numbers → digits
  - Auto punctuation
  ↓
Processed text sent to clipboard (xclip)
  ↓
User clicks "Stop"
  ↓
Frontend invokes stop_recording()
  ↓
Rust reads clipboard, returns text
  ↓
Frontend displays text in UI
  ↓
Optional: Auto-insert via xdotool
```

### Text Insertion Flow

```
User clicks "Insert" (or auto-insert enabled)
  ↓
Frontend invokes insert_text(text)
  ↓
Rust executes: xdotool type --clearmodifiers -- "text"
  ↓
xdotool simulates keyboard typing
  ↓
Text appears in active window
  ↓
Success status returned to frontend
```

## Configuration Management

### Settings Hierarchy

```
1. Application Defaults (hardcoded)
   ↓
2. Configuration File (~/.config/nerd-dictation/nerd-dictation.py)
   ↓
3. Command-line Flags (passed from Rust)
   ↓
4. User Settings (localStorage in frontend)
   ↓
5. Runtime Settings (current session)
```

### Configuration Files

| File | Purpose | Format | Location |
|------|---------|--------|----------|
| `nerd-dictation.py` | Voice processing rules | Python | `~/.config/nerd-dictation/` |
| `tauri.conf.json` | Tauri app configuration | JSON | `/src-tauri/` |
| `settings.json` | User preferences (future) | JSON | `~/.config/voice-dictation/` |
| `voice-dictation.desktop` | Autostart entry | Desktop | `~/.config/autostart/` |

## Security Architecture

### Threat Model

| Threat | Mitigation |
|--------|------------|
| Malicious voice input | Input validation, sanitization |
| Configuration file tampering | File permissions (600), checksum validation |
| Subprocess injection | Argument escaping, whitelist validation |
| Clipboard hijacking | Immediate read/clear, timeout |
| Microphone eavesdropping | Visual recording indicator, user control |

### Security Boundaries

```
┌────────────────────────────────────────────┐
│  Trusted Zone (User Space)                 │
│  - Tauri frontend (sandboxed WebView)      │
│  - Rust backend (compiled binary)          │
│  - User configuration files                │
└─────────────┬──────────────────────────────┘
              │
              │ IPC boundary
              │
┌─────────────▼──────────────────────────────┐
│  Semi-trusted Zone                         │
│  - nerd-dictation (Python subprocess)      │
│  - Configuration module (Python code)      │
└─────────────┬──────────────────────────────┘
              │
              │ System boundary
              │
┌─────────────▼──────────────────────────────┐
│  System Zone                               │
│  - xdotool (X11 automation)                │
│  - xclip (clipboard access)                │
│  - Vosk models (data files)                │
│  - Audio system (PulseAudio/PipeWire)      │
└────────────────────────────────────────────┘
```

### Permissions Required

- **Microphone access** - Audio recording
- **Clipboard access** - Text transfer
- **X11/Wayland input** - Text insertion via xdotool
- **File system** - Configuration and models
- **Process spawning** - nerd-dictation subprocess

## Performance Characteristics

### Latency Budget

| Component | Target | Typical |
|-----------|--------|---------|
| Audio capture start | <100ms | 50ms |
| Speech recognition | <1s | 500ms |
| Text processing | <100ms | 10ms |
| Clipboard transfer | <50ms | 20ms |
| Text insertion | <200ms | 100ms |
| **Total (end-to-end)** | **<2s** | **~700ms** |

### Resource Usage

| Resource | Small Model | Large Model |
|----------|-------------|-------------|
| Disk space | 45MB | 1.8GB |
| RAM (idle) | 100MB | 100MB |
| RAM (active) | 300MB | 800MB |
| CPU (recording) | 20-40% | 40-80% |
| Startup time | 1-2s | 3-5s |

### Scalability

- **Concurrent sessions**: 1 (single microphone)
- **Text length**: Unlimited (streaming)
- **Session duration**: Configurable timeout (1-30s)
- **Model switching**: Requires restart

## Deployment Architecture

### Installation Paths

```
System Dependencies:
  /usr/bin/xdotool
  /usr/bin/xclip
  /usr/bin/pactl
  /usr/lib/libportaudio.so

User Installation:
  ~/.local/bin/nerd-dictation
  ~/.local/share/nerd-dictation/ (git clone)
  ~/.local/share/vosk-models/
    ├── vosk-model-small-en-us-0.15/
    └── vosk-model-en-us-0.22/

Python Dependencies:
  ~/.local/lib/python3.x/site-packages/
    ├── vosk/
    ├── soundfile/
    └── num2words/

Application:
  /opt/voice-dictation-tauri/ (or user-local)
    ├── voice-dictation-tauri (binary)
    └── resources/

Configuration:
  ~/.config/nerd-dictation/
    └── nerd-dictation.py
  ~/.config/voice-dictation/
    └── settings.json (future)
  ~/.config/autostart/
    └── voice-dictation.desktop
```

### Distribution Methods

1. **AppImage** (Recommended)
   - Self-contained executable
   - No installation required
   - Includes Tauri app, but requires system deps

2. **Debian Package (.deb)**
   - Native package manager integration
   - Automatic dependency resolution
   - System-wide or user installation

3. **Flatpak** (Future)
   - Sandboxed environment
   - Universal Linux distribution
   - Challenges: X11 access, subprocess spawning

4. **Source Installation**
   - Clone repository
   - Run installation script
   - Most flexible, requires build tools

## Error Handling Strategy

### Error Categories

| Category | Example | Handling |
|----------|---------|----------|
| **User Errors** | No microphone detected | User notification, guidance |
| **Configuration Errors** | Invalid config syntax | Validation, safe defaults |
| **System Errors** | xdotool not installed | Dependency check, installation prompt |
| **Runtime Errors** | Speech recognition timeout | Retry, user feedback |
| **Critical Errors** | Vosk model corrupted | Error message, suggest reinstall |

### Error Propagation

```
Python (nerd-dictation.py)
  → stderr/stdout
    → nerd-dictation subprocess
      → Rust backend
        → Result<T, String>
          → Frontend (TypeScript)
            → User notification (toast)
```

### Recovery Strategies

1. **Graceful Degradation**
   - Auto punctuation fails → Return raw text
   - Large model missing → Fall back to small model
   - xdotool fails → Copy to clipboard only

2. **Auto-Recovery**
   - Speech timeout → Stop and return partial text
   - Subprocess crash → Restart on next recording
   - Clipboard read fails → Retry with backoff

3. **User Intervention**
   - Missing dependencies → Show installation instructions
   - Permission denied → Guide to fix permissions
   - Unknown errors → Debug mode, log collection

## Testing Strategy

### Unit Testing

| Component | Framework | Coverage Target |
|-----------|-----------|-----------------|
| Frontend (TS) | Jest | >80% |
| Backend (Rust) | cargo test | >85% |
| Config (Python) | pytest | >90% |
| Scripts (Bash) | bats | >70% |

### Integration Testing

- Frontend ↔ Backend communication
- Backend ↔ nerd-dictation subprocess
- Configuration file processing
- System command execution

### System Testing

- End-to-end recording flow
- Multiple model sizes
- Different audio devices
- Various desktop environments

### Platform Testing

- Ubuntu 22.04, 24.04
- Fedora 39, 40
- Arch Linux (latest)
- GNOME, KDE, XFCE

## Monitoring and Observability

### Logging

```
Frontend (Browser Console):
  - User actions
  - API calls
  - State changes

Rust Backend (stderr):
  - Command execution
  - Subprocess management
  - System integration calls

nerd-dictation (stdout/stderr):
  - Voice recognition events
  - Configuration loading
  - Processing pipeline

System:
  - systemd journal (if using service)
  - Application log file (future)
```

### Metrics (Future)

- Recording sessions per day
- Average session length
- Speech recognition accuracy
- Command usage frequency
- Error rates by category

## Future Architecture Enhancements

### Phase 2 Features

1. **Machine Learning Integration**
   - User-specific voice model training
   - Personalized command learning
   - Accuracy improvement over time

2. **Multi-Language Support**
   - Language detection
   - Per-language command sets
   - Unicode handling

3. **Cloud Sync (Optional)**
   - Settings synchronization
   - Custom commands backup
   - Usage analytics (opt-in)

4. **Advanced Desktop Integration**
   - Wayland native support
   - System tray icon
   - Quick settings panel
   - Multiple output modes

### Architectural Evolution

```
Current: Monolithic Processing
  Voice → nerd-dictation → Text

Future: Plugin Architecture
  Voice → nerd-dictation → Plugin Chain → Text
                             ↓
                    [User Plugins]
                    [ML Enhancer]
                    [Grammar Checker]
                    [Custom Processors]
```

## Related Documentation

- [ADR-001: nerd-dictation Integration](./ADR-001-nerd-dictation-integration.md)
- [ADR-002: Voice Command Mapping](./ADR-002-voice-command-mapping.md)
- [ADR-003: Auto Punctuation System](./ADR-003-auto-punctuation-system.md)
- [ADR-004: System Integration Scripts](./ADR-004-system-integration-scripts.md)
- [Configuration Structure](./nerd-dictation-config-structure.md)

## Approval

This architecture design requires review and approval from:

- [ ] Lead Developer
- [ ] UX Designer
- [ ] Security Team
- [ ] DevOps Team

## Change Log

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-10-02 | 1.0 | System Architect | Initial architecture design |
