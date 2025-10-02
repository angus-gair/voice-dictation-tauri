# 🚀 Quick Start - Voice Dictation

## Prerequisites Check

Run this to verify your system is ready:

```bash
# Check if all dependencies are installed
which nerd-dictation xdotool xclip pactl
ls -la ~/.local/share/vosk-models/vosk-model-small-en-us-0.15
ls -la ~/.config/nerd-dictation/nerd-dictation.py
```

All commands should return paths (no errors).

## Running the App

### Development Mode

```bash
cd /home/thunder/projects/voice-dictation-tauri
npm run tauri dev
```

### Production Build

```bash
npm run tauri build
# Binary will be in: src-tauri/target/release/voice-dictation
```

## First Time Setup (If Dependencies Missing)

If the checks above fail, run the installation script:

```bash
./scripts/install.sh
```

This will:
- Install system dependencies (xdotool, xclip, etc.)
- Install nerd-dictation
- Download and extract Vosk models
- Set up configuration files

## Usage

1. **Start Recording**: Click the big microphone button or press `Ctrl+Alt+V`
2. **Speak**: Say your text and voice commands
3. **Stop**: Click again or press `Ctrl+Alt+V`
4. **Insert**: Click "Insert" or press `Ctrl+Alt+I` to type into active window

### Voice Commands

While speaking, use these commands:

**Punctuation:**
- "period" → .
- "comma" → ,
- "question mark" → ?
- "new line" → ↵

**Programming:**
- "open brace" → {
- "close brace" → }
- "equals" → =

See the Commands panel (bottom right) for full list.

## Troubleshooting

### "System not initialized" error

The app checks dependencies on startup. If you see this:

1. Open browser console (F12) to see which dependency is missing
2. Install missing dependency
3. Restart the app

### "nerd-dictation not found"

```bash
# Check installation
which nerd-dictation

# If not found, install
git clone https://github.com/ideasman42/nerd-dictation.git ~/.local/share/nerd-dictation
ln -sf ~/.local/share/nerd-dictation/nerd-dictation ~/.local/bin/nerd-dictation
```

### "Vosk model not found"

```bash
# Extract the model
cd ~/.local/share/vosk-models
unzip vosk-model-small-en-us-0.15.zip
```

### "No microphone detected"

```bash
# Check audio devices
pactl list sources short

# Make sure your mic is not muted
```

## Settings

- **Auto Punctuation**: Automatically adds periods and capitalizes sentences
- **Numbers as Digits**: Converts "three" → "3"
- **Auto Insert**: Automatically types text without clicking Insert
- **Silence Timeout**: Stop recording after N seconds of silence
- **Model Size**: Small (fast) or Large (accurate)

Settings are saved automatically in browser localStorage.

## Keyboard Shortcuts

- `Ctrl+Alt+V` - Toggle recording
- `Ctrl+Alt+C` - Copy text
- `Ctrl+Alt+I` - Insert text
- `Escape` - Stop recording

---

**Need help?** Check `/home/thunder/projects/voice-dictation-tauri/docs/README.md` for full documentation.
