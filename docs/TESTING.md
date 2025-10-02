# Voice Dictation Testing Guide

## Problem & Solution

### Issue
**Error**: `Port 1420 is already in use`

**Root Cause**: The Vite dev server on port 1420 was already running from a previous session, preventing new instances from starting.

**Solution**:
1. Identify processes using port 1420: `lsof -ti :1420`
2. Kill those processes: `kill -9 <PIDs>`
3. Restart the dev server

### Automated Solution
Use the helper script to automatically clean up port conflicts:

```bash
./scripts/dev-clean.sh
```

This script will:
- Check if port 1420 is in use
- Kill any processes using that port
- Start the Tauri dev server cleanly

## Testing Checklist

### ✅ 1. Port Conflict Resolution
- [x] Identified processes using port 1420
- [x] Successfully killed conflicting processes
- [x] Verified port 1420 is free
- [x] Dev server starts without errors

### ✅ 2. Application Startup
- [x] Vite dev server runs on http://localhost:1420
- [x] Tauri window opens successfully
- [x] No compilation errors
- [x] Fixed Rust compiler warning (unused variable)

### ✅ 3. Code Quality
- [x] No TypeScript errors
- [x] No Rust warnings
- [x] All dependencies installed correctly
- [x] Build process completes successfully

### 🔄 4. Voice Dictation Functionality
Test the following features in the running application:

#### Basic Recording
- [ ] Click record button (or press Ctrl+Alt+V)
- [ ] Verify "Listening..." status appears
- [ ] Speak into microphone
- [ ] Click stop button (or press Ctrl+Alt+V again)
- [ ] Verify text appears in output area

#### Text Operations
- [ ] Copy text to clipboard (Ctrl+Alt+C)
- [ ] Clear text output
- [ ] Insert text into active window (Ctrl+Alt+I)

#### Settings
- [ ] Toggle auto-punctuation
- [ ] Toggle numbers as digits
- [ ] Toggle auto-insert
- [ ] Adjust timeout slider (1-30 seconds)
- [ ] Switch between small/large model sizes
- [ ] Verify settings persist after reload

#### Keyboard Shortcuts
- [ ] Ctrl+Alt+V - Toggle recording
- [ ] Ctrl+Alt+C - Copy text
- [ ] Ctrl+Alt+I - Insert text
- [ ] Escape - Stop recording (when active)

## System Requirements Verification

Run the following command to verify all dependencies:

```bash
npm run tauri dev
```

The app will check for:
- nerd-dictation (voice recognition engine)
- xdotool (for text insertion)
- Vosk models (small and large)
- Microphone availability

## Manual Testing Commands

### Check Port Status
```bash
# Check if port 1420 is in use
lsof -i :1420

# Or using netstat
netstat -tulpn | grep 1420
```

### Kill Port Conflicts
```bash
# Find and kill processes
lsof -ti :1420 | xargs kill -9
```

### Start Dev Server
```bash
# Clean start (recommended)
./scripts/dev-clean.sh

# Manual start
npm run tauri dev
```

### Build for Production
```bash
# Build the application
npm run tauri build

# Test the built application
./src-tauri/target/release/voice-dictation
```

## Expected Behavior

### Successful Startup
You should see:
```
VITE v6.3.6  ready in 168 ms
➜  Local:   http://localhost:1420/
Running DevCommand...
Finished `dev` profile [unoptimized + debuginfo] target(s)
Running `target/debug/voice-dictation`
```

### Application Window
- Modern, clean UI with gradient background
- Microphone icon button in center
- Status indicator showing "Ready"
- Settings and Commands panels accessible via buttons
- Output text area for transcribed text

## Troubleshooting

### Port Already in Use
**Symptom**: `Error: Port 1420 is already in use`
**Solution**: Run `./scripts/dev-clean.sh` or manually kill processes

### Rust Compilation Errors
**Solution**: Ensure all dependencies in `Cargo.toml` are up to date

### Vite Build Errors
**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Voice Recognition Not Working
**Check**:
1. nerd-dictation is installed: `which nerd-dictation`
2. Vosk models are downloaded
3. Microphone permissions granted
4. PulseAudio/PipeWire is running

## Test Results

### Port Conflict Resolution ✅
- Successfully identified PIDs: 106524, 106625
- Killed processes without errors
- Port 1420 freed successfully
- Dev server started on first attempt

### Application Startup ✅
- Vite server: Running on http://localhost:1420
- Tauri window: Opens successfully
- No compilation errors
- Rust warnings: Fixed (unused variable)
- Application loads in ~2-3 seconds

### Code Quality ✅
- TypeScript: No errors
- Rust: No warnings (after fix)
- Dependencies: All installed
- Build: Successful

## Next Steps

1. **Manual Testing**: Open the application and test voice recording
2. **System Check**: Verify all dependencies (nerd-dictation, xdotool, Vosk)
3. **Integration Testing**: Test all keyboard shortcuts
4. **Settings Persistence**: Verify settings save/load correctly

## Automated Testing (Future)

Consider adding:
- Unit tests for Rust functions
- Integration tests for Tauri commands
- E2E tests with Playwright or similar
- CI/CD pipeline for automated testing
