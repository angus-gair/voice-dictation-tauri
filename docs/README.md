# 🎤 Voice Dictation - Universal Speech-to-Text App

A lightweight, mobile-first Tauri application that provides seamless voice dictation across any application. Built with the best features from nerd-dictation and terminal-voice-setup, this app offers a clean, modern interface with powerful voice recognition capabilities.

## ✨ Features

### Core Functionality
- **🎯 One-Click Recording** - Tap to start speaking, tap to stop
- **📝 Universal Text Input** - Insert dictated text into any application
- **⚡ Real-time Processing** - Local speech-to-text using Vosk models
- **🔒 Privacy First** - All processing happens locally, no cloud services

### Smart Features
- **Auto Punctuation** - Automatic sentence capitalization and punctuation
- **Number Recognition** - Convert spoken numbers to digits ("three million" → 3,000,000)
- **Voice Commands** - Control punctuation and formatting with voice
- **Silence Detection** - Configurable timeout for automatic recording stop

### UI/UX
- **📱 Mobile-First Design** - Optimized for touch and small screens
- **🌙 Dark Theme** - Easy on the eyes with modern gradient design
- **⚡ Lightweight** - Fast startup, minimal resource usage
- **♿ Accessible** - Full keyboard navigation and screen reader support

## 🚀 Quick Start

### Prerequisites

1. **Install nerd-dictation and dependencies:**
```bash
# Install system dependencies
sudo apt install -y python3-pip portaudio19-dev xdotool xclip

# Install nerd-dictation
git clone https://github.com/ideasman42/nerd-dictation.git ~/.local/share/nerd-dictation
ln -sf ~/.local/share/nerd-dictation/nerd-dictation ~/.local/bin/nerd-dictation

# Install Vosk
pip3 install vosk soundfile

# Download Vosk model (small - 45MB)
mkdir -p ~/.local/share/vosk-models
cd ~/.local/share/vosk-models
wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
unzip vosk-model-small-en-us-0.15.zip
```

2. **Optional: Download large model for better accuracy (1.8GB):**
```bash
cd ~/.local/share/vosk-models
wget https://alphacephei.com/vosk/models/vosk-model-en-us-0.22.zip
unzip vosk-model-en-us-0.22.zip
```

### Install the App

```bash
# Clone the repository
cd /home/thunder/projects/voice-dictation-tauri

# Install npm dependencies
npm install

# Run in development
npm run tauri dev

# Or build for production
npm run tauri build
```

## 🎮 Usage

### Basic Controls

**Main Recording Button:**
- Click/Tap to start recording
- Click/Tap again to stop and process
- Button turns red while recording with animated waveform

**Action Buttons:**
- **Copy** - Copy transcribed text to clipboard
- **Clear** - Clear the text output
- **Insert** - Type the text into active window (uses xdotool)

**Keyboard Shortcuts:**
- `Ctrl+Alt+V` - Toggle recording
- `Ctrl+Alt+C` - Copy text
- `Ctrl+Alt+I` - Insert text
- `Esc` - Stop recording (if active)

### Voice Commands

While dictating, use these voice commands:

**Punctuation:**
- "period" → .
- "comma" → ,
- "question mark" → ?
- "exclamation mark" → !
- "colon" → :
- "semicolon" → ;
- "quote" → "
- "apostrophe" → '

**Navigation:**
- "new line" → ↵
- "new paragraph" → ↵↵
- "tab" → ⇥
- "space" → (space)

**Programming:**
- "open brace" → {
- "close brace" → }
- "open bracket" → [
- "close bracket" → ]
- "open paren" → (
- "close paren" → )
- "equals" → =
- "plus" → +
- "minus" → -
- "slash" → /

### Settings

**Auto Punctuation** - Automatically capitalize sentences and add periods
**Numbers as Digits** - Convert spoken numbers to numerical format
**Auto Insert** - Automatically type text without confirmation
**Silence Timeout** - Stop recording after X seconds of silence (1-30s)
**Model Size** - Choose between small (fast) or large (accurate) model

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- TypeScript
- Vanilla JS (no framework overhead)
- Mobile-first CSS with modern gradients
- CSS Grid & Flexbox for responsive layout

**Backend:**
- Rust (via Tauri 2.0)
- Async command handlers
- Process management for voice recording
- System integration (xdotool, xclip)

**Voice Recognition:**
- nerd-dictation (Python)
- Vosk speech recognition
- Local audio processing (no cloud)
- PulseAudio/PipeWire support

### Key Features Integration

**From nerd-dictation:**
- ✅ Vosk model integration
- ✅ Local speech processing
- ✅ Configurable timeout
- ✅ Numbers as digits conversion
- ✅ Voice command system
- ✅ Multiple model sizes

**From terminal-voice-setup:**
- ✅ System integration scripts
- ✅ GNOME keyboard shortcuts
- ✅ CopyQ clipboard history support
- ✅ Autostart and systemd services
- ✅ xdotool text insertion
- ✅ Audio device detection

## 📁 Project Structure

```
voice-dictation-tauri/
├── src/                    # Frontend TypeScript/HTML/CSS
│   ├── main.ts            # App logic and Tauri integration
│   ├── styles.css         # Mobile-first responsive styles
│   └── assets/            # Images and icons
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── lib.rs        # Tauri commands and logic
│   │   └── main.rs       # Entry point
│   ├── Cargo.toml        # Rust dependencies
│   └── tauri.conf.json   # Tauri configuration
├── docs/                  # Documentation
│   └── README.md         # This file
├── index.html            # Main HTML entry point
└── package.json          # npm dependencies
```

## 🔧 Configuration

### Vosk Models

Models are stored in: `~/.local/share/vosk-models/`

**Available models:**
- `vosk-model-small-en-us-0.15` - 45MB, fast, good for quick dictation
- `vosk-model-en-us-0.22` - 1.8GB, slower, best accuracy

### Settings Persistence

Settings are saved to browser localStorage:
- Auto punctuation preference
- Numbers as digits setting
- Auto insert mode
- Silence timeout duration
- Model size preference

## 🛠️ Development

### Prerequisites
- Node.js 18+ and npm
- Rust 1.70+
- Tauri CLI: `cargo install tauri-cli`

### Development Mode
```bash
npm run tauri dev
```

### Build Production
```bash
npm run tauri build
```

Output will be in `src-tauri/target/release/`

### Mobile Development (Android)
```bash
npm run tauri android init
npm run tauri android dev
```

## 🐛 Troubleshooting

### Voice Recognition Not Working

**Check nerd-dictation:**
```bash
which nerd-dictation
# or
ls ~/.local/bin/nerd-dictation
```

**Check Vosk models:**
```bash
ls -la ~/.local/share/vosk-models/
```

**Test microphone:**
```bash
pactl list sources short
arecord -d 3 /tmp/test.wav && aplay /tmp/test.wav
```

### Text Not Inserting

**Check xdotool:**
```bash
which xdotool
xdotool type "test"
```

**Check active window:**
```bash
xdotool getactivewindow
```

### System Integration Issues

**Install missing dependencies:**
```bash
sudo apt install -y xdotool xclip python3-pip portaudio19-dev
pip3 install vosk soundfile pyaudio
```

## 🔐 Security & Privacy

- **100% Local Processing** - No data sent to cloud services
- **No Telemetry** - No usage tracking or analytics
- **Open Source** - Full transparency of code
- **Minimal Permissions** - Only requires microphone and clipboard access

## 🤝 Contributing

This project combines the best features from:
- [nerd-dictation](https://github.com/ideasman42/nerd-dictation) - Offline speech recognition
- [terminal-voice-setup](https://github.com/ruvnet) - System integration scripts

Contributions welcome! Please read the contributing guidelines before submitting PRs.

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Credits

- **Vosk** - Offline speech recognition
- **nerd-dictation** - Python speech-to-text utility
- **Tauri** - Lightweight desktop framework
- **xdotool** - X11 automation tool

## 📞 Support

For issues, improvements, or questions:
1. Check the troubleshooting section
2. Review existing GitHub issues
3. Create a new issue with detailed information

---

**Built with ❤️ using Tauri, Rust, and TypeScript**
