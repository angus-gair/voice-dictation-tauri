# ADR-004: System Integration Scripts Design

**Status:** Proposed
**Date:** 2025-10-02
**Decision Makers:** System Architecture Team

## Context

The voice dictation app requires deep OS integration for seamless operation. The README mentions system integration scripts for installation, autostart, keyboard shortcuts, and service management. These scripts must work reliably across different Linux distributions and configurations.

## Decision

Create a comprehensive set of bash scripts for system integration with:

1. **Installation script** - Setup all dependencies and configuration
2. **Service management** - systemd/init integration
3. **Desktop integration** - GNOME keyboard shortcuts and autostart
4. **Validation script** - Health checks and troubleshooting
5. **Uninstall script** - Clean removal

## Architecture Design

### System Integration Components

```
┌──────────────────────────────────────────────────────────────┐
│                  System Integration Layer                     │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐        │
│  │Installation │  │   Service   │  │   Desktop    │        │
│  │   Script    │  │ Management  │  │ Integration  │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘        │
│         │                │                 │                 │
│         ▼                ▼                 ▼                 │
│  ┌──────────────────────────────────────────────┐          │
│  │         System Configuration Layer            │          │
│  ├──────────────────────────────────────────────┤          │
│  │ • nerd-dictation config                      │          │
│  │ • Vosk model installation                    │          │
│  │ • GNOME keyboard shortcuts                   │          │
│  │ • systemd service units                      │          │
│  │ • Desktop autostart entries                  │          │
│  └──────────┬───────────────────────────────────┘          │
│             │                                                │
│             ▼                                                │
│  ┌──────────────────────────────────────────────┐          │
│  │         Operating System Layer                │          │
│  ├──────────────────────────────────────────────┤          │
│  │ • File system (/home, /usr, /etc)            │          │
│  │ • systemd daemon                              │          │
│  │ • GNOME Settings (gsettings)                 │          │
│  │ • Package managers (apt, dnf, pacman)        │          │
│  │ • X11/Wayland display server                 │          │
│  └──────────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────────┘
```

### Installation Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│              Installation Workflow                       │
│                                                          │
│  START                                                   │
│    │                                                     │
│    ▼                                                     │
│  ┌──────────────────────────┐                          │
│  │ Check OS & Architecture  │                          │
│  └────────┬─────────────────┘                          │
│           │                                              │
│           ▼                                              │
│  ┌──────────────────────────┐                          │
│  │ Detect Package Manager   │                          │
│  │ (apt/dnf/pacman)         │                          │
│  └────────┬─────────────────┘                          │
│           │                                              │
│           ▼                                              │
│  ┌──────────────────────────┐                          │
│  │ Install System Deps      │                          │
│  │ - python3-pip            │                          │
│  │ - portaudio19-dev        │                          │
│  │ - xdotool, xclip         │                          │
│  │ - pulseaudio-utils       │                          │
│  └────────┬─────────────────┘                          │
│           │                                              │
│           ▼                                              │
│  ┌──────────────────────────┐                          │
│  │ Install Python Deps      │                          │
│  │ - vosk                   │                          │
│  │ - soundfile              │                          │
│  │ - num2words              │                          │
│  └────────┬─────────────────┘                          │
│           │                                              │
│           ▼                                              │
│  ┌──────────────────────────┐                          │
│  │ Install nerd-dictation   │                          │
│  │ from GitHub              │                          │
│  └────────┬─────────────────┘                          │
│           │                                              │
│           ▼                                              │
│  ┌──────────────────────────┐                          │
│  │ Download Vosk Models     │                          │
│  │ - Small (45MB) required  │                          │
│  │ - Large (1.8GB) optional │                          │
│  └────────┬─────────────────┘                          │
│           │                                              │
│           ▼                                              │
│  ┌──────────────────────────┐                          │
│  │ Create Config Files      │                          │
│  │ - nerd-dictation.py      │                          │
│  │ - app settings           │                          │
│  └────────┬─────────────────┘                          │
│           │                                              │
│           ▼                                              │
│  ┌──────────────────────────┐                          │
│  │ Setup Desktop Integration│                          │
│  │ - GNOME shortcuts        │                          │
│  │ - Autostart entry        │                          │
│  └────────┬─────────────────┘                          │
│           │                                              │
│           ▼                                              │
│  ┌──────────────────────────┐                          │
│  │ Validate Installation    │                          │
│  │ - Check all components   │                          │
│  │ - Test microphone        │                          │
│  │ - Run smoke tests        │                          │
│  └────────┬─────────────────┘                          │
│           │                                              │
│           ▼                                              │
│  END (Success/Failure Report)                           │
└─────────────────────────────────────────────────────────┘
```

## Script Specifications

### 1. Installation Script (`install.sh`)

**Location**: `/home/thunder/projects/voice-dictation-tauri/scripts/install.sh`

**Responsibilities**:
- Detect Linux distribution and package manager
- Install system dependencies
- Install Python dependencies
- Clone and setup nerd-dictation
- Download Vosk models
- Create configuration files
- Setup desktop integration
- Validate installation

**Key Features**:
- Idempotent (safe to run multiple times)
- Non-destructive (preserves existing configs)
- Interactive prompts for optional components
- Progress reporting
- Rollback on failure
- Post-install validation

### 2. Configuration Generator (`generate-config.sh`)

**Location**: `/home/thunder/projects/voice-dictation-tauri/scripts/generate-config.sh`

**Responsibilities**:
- Generate `~/.config/nerd-dictation/nerd-dictation.py`
- Create command mappings file
- Setup auto punctuation rules
- Configure number conversion

**Features**:
- Template-based generation
- User customization options
- Backup existing configs
- Syntax validation

### 3. Desktop Integration (`setup-desktop.sh`)

**Location**: `/home/thunder/projects/voice-dictation-tauri/scripts/setup-desktop.sh`

**Responsibilities**:
- Create GNOME keyboard shortcuts
- Setup autostart entry
- Configure CopyQ integration
- Set default keybindings

**GNOME Keyboard Shortcuts**:
```bash
# Ctrl+Alt+V: Toggle recording
gsettings set org.gnome.settings-daemon.plugins.media-keys custom-keybindings \
  "['/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/voice-dictation/']"

gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/voice-dictation/ \
  name 'Voice Dictation'

gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/voice-dictation/ \
  command 'voice-dictation-toggle'

gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/voice-dictation/ \
  binding '<Primary><Alt>v'
```

**Autostart Entry**:
```desktop
[Desktop Entry]
Type=Application
Name=Voice Dictation
Comment=Universal voice-to-text app
Exec=/path/to/voice-dictation-tauri
Icon=microphone
Terminal=false
Categories=Utility;Accessibility;
StartupNotify=false
X-GNOME-Autostart-enabled=true
```

### 4. Validation Script (`validate.sh`)

**Location**: `/home/thunder/projects/voice-dictation-tauri/scripts/validate.sh`

**Responsibilities**:
- Check all dependencies
- Validate configuration files
- Test microphone
- Verify Vosk models
- Check permissions
- Test xdotool/xclip
- Generate health report

**Output Example**:
```
Voice Dictation System Validation
==================================

✓ Operating System: Ubuntu 24.04 LTS
✓ Python: 3.12.3
✓ pip: 24.0

System Dependencies:
✓ xdotool: 3.20160805.1
✓ xclip: 0.13
✓ portaudio: 19.6.0
✗ pactl: Command not found (WARNING: Microphone detection may fail)

Python Dependencies:
✓ vosk: 0.3.45
✓ soundfile: 0.12.1
✓ num2words: 0.5.13

nerd-dictation:
✓ Installed: /home/user/.local/bin/nerd-dictation
✓ Version: 1.8.0

Vosk Models:
✓ Small model: ~/.local/share/vosk-models/vosk-model-small-en-us-0.15 (45MB)
✗ Large model: Not found (OPTIONAL)

Configuration:
✓ Config file: ~/.config/nerd-dictation/nerd-dictation.py
✓ Syntax: Valid Python
✓ Required functions: nerd_dictation_process ✓

Audio:
✓ Microphone detected: HDA Intel PCH (input device)
✓ PulseAudio: Running
✓ Sample recording: Success (3 seconds)

Desktop Integration:
✓ GNOME shortcuts: Configured
✓ Autostart entry: ~/.config/autostart/voice-dictation.desktop

Overall Status: READY ✓
Some optional components missing (see warnings above)
```

### 5. Service Management Script (`service-manager.sh`)

**Location**: `/home/thunder/projects/voice-dictation-tauri/scripts/service-manager.sh`

**Commands**:
- `start` - Start the application
- `stop` - Stop the application
- `restart` - Restart the application
- `status` - Check if running
- `enable` - Enable autostart
- `disable` - Disable autostart
- `logs` - View application logs

**systemd Service Unit** (Optional):
```ini
[Unit]
Description=Voice Dictation Service
After=graphical-session.target

[Service]
Type=simple
ExecStart=/path/to/voice-dictation-tauri
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=default.target
```

### 6. Uninstall Script (`uninstall.sh`)

**Location**: `/home/thunder/projects/voice-dictation-tauri/scripts/uninstall.sh`

**Responsibilities**:
- Remove application files
- Remove configuration (with backup option)
- Remove desktop integration
- Remove keyboard shortcuts
- Optionally remove dependencies
- Clean up Vosk models
- Generate uninstall report

## File Structure

```
voice-dictation-tauri/
├── scripts/
│   ├── install.sh                 # Main installation script
│   ├── generate-config.sh         # Config file generator
│   ├── setup-desktop.sh          # Desktop integration
│   ├── validate.sh               # System validation
│   ├── service-manager.sh        # Service control
│   ├── uninstall.sh              # Uninstaller
│   ├── utils/
│   │   ├── detect-os.sh          # OS detection utility
│   │   ├── download-models.sh    # Vosk model downloader
│   │   ├── test-audio.sh         # Audio testing
│   │   └── logger.sh             # Logging utility
│   └── templates/
│       ├── nerd-dictation.py.template
│       ├── autostart.desktop.template
│       └── service.template
└── config/
    └── default-settings.json
```

## Quality Attributes

### Reliability
- Scripts must handle errors gracefully
- Rollback mechanism for failed installations
- Preserve existing configurations
- Safe defaults for all options

### Usability
- Clear progress indicators
- Helpful error messages
- Interactive mode for beginners
- Silent mode for automation

### Portability
- Support major Linux distros (Ubuntu, Fedora, Arch)
- Detect and adapt to different package managers
- Handle X11 and Wayland
- Work with different desktop environments

### Maintainability
- Modular script design
- Shared utility functions
- Template-based config generation
- Version checking and updates

## Trade-offs Analysis

### Chosen: Bash Scripts

**Pros:**
- Native to Linux, no dependencies
- Direct system integration
- Easy to debug and modify
- Transparent operation

**Cons:**
- Platform-specific (Linux only)
- Complex error handling
- Limited testing frameworks

### Alternative: Python Installation Script

**Pros:**
- Cross-platform potential
- Better error handling
- Rich libraries available
- Easier testing

**Cons:**
- Requires Python (circular dependency)
- Less native system integration
- More complex for simple tasks

**Decision:** Use bash for system scripts, Python only for app logic.

## Security Considerations

### Privilege Management
- Run as non-root by default
- Use sudo only when necessary
- Validate file permissions
- Avoid world-writable files

### Input Validation
- Sanitize all user inputs
- Validate file paths
- Check downloaded file checksums
- Verify digital signatures (future)

### Configuration Security
- Set appropriate file permissions (600 for configs)
- No hardcoded passwords
- Warn about sensitive data

## Testing Strategy

### Unit Tests (bats framework)
```bash
@test "detect OS correctly" {
  run detect_os
  [ "$status" -eq 0 ]
  [[ "$output" =~ "Ubuntu" ]]
}

@test "install dependencies idempotent" {
  run install_system_deps
  [ "$status" -eq 0 ]
  run install_system_deps
  [ "$status" -eq 0 ]
}
```

### Integration Tests
- Fresh Ubuntu VM installation
- Upgrade from previous version
- Uninstall and reinstall
- Multiple user accounts

### Platform Tests
- Ubuntu 22.04, 24.04
- Fedora 39, 40
- Arch Linux
- GNOME, KDE, XFCE environments

## Implementation Plan

### Phase 1: Core Scripts
1. Installation script (basic)
2. Validation script
3. Config generator
4. Uninstall script

### Phase 2: Desktop Integration
1. GNOME shortcuts setup
2. Autostart configuration
3. CopyQ integration
4. System tray icon (future)

### Phase 3: Service Management
1. systemd service unit
2. Service manager script
3. Log management
4. Update mechanism

### Phase 4: Advanced Features
1. Multi-distro support
2. Wayland compatibility
3. Automated testing
4. Update notifications

## Success Metrics

1. **Installation Success Rate**: >95% on supported distros
2. **Installation Time**: <5 minutes on good connection
3. **User Satisfaction**: >80% find installation easy
4. **Support Requests**: <10% of installs need help
5. **Uninstall Cleanliness**: 100% file removal verification

## Related Decisions

- ADR-001: nerd-dictation Integration
- ADR-002: Voice Command Mapping
- ADR-003: Auto Punctuation System

## References

- [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html)
- [Desktop Entry Specification](https://specifications.freedesktop.org/desktop-entry-spec/latest/)
- [systemd Service Files](https://www.freedesktop.org/software/systemd/man/systemd.service.html)
- [GNOME Settings Schema](https://developer.gnome.org/GSettings/)
