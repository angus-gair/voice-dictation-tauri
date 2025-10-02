#!/bin/bash
# Voice Dictation - System Installation Script
# Installs all required dependencies and configures the system

set -e

echo "🎤 Voice Dictation - Installation Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo -e "${RED}Error: This script only supports Linux${NC}"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Install system dependencies
echo "📦 Installing system dependencies..."
if command_exists apt; then
    sudo apt update
    sudo apt install -y \
        python3-pip \
        portaudio19-dev \
        xdotool \
        xclip \
        pactl \
        unzip \
        wget \
        git
    echo -e "${GREEN}✓ System dependencies installed${NC}"
else
    echo -e "${RED}Error: apt package manager not found. Please install manually.${NC}"
    exit 1
fi

# Step 2: Install nerd-dictation
echo ""
echo "🗣️  Installing nerd-dictation..."
if [ ! -d ~/.local/share/nerd-dictation ]; then
    git clone https://github.com/ideasman42/nerd-dictation.git ~/.local/share/nerd-dictation
    echo -e "${GREEN}✓ nerd-dictation cloned${NC}"
else
    echo -e "${YELLOW}⚠ nerd-dictation already exists, skipping...${NC}"
fi

# Create symlink
mkdir -p ~/.local/bin
ln -sf ~/.local/share/nerd-dictation/nerd-dictation ~/.local/bin/nerd-dictation
echo -e "${GREEN}✓ nerd-dictation symlink created${NC}"

# Step 3: Install Python dependencies
echo ""
echo "🐍 Installing Python dependencies..."
pip3 install --user vosk soundfile pyaudio
echo -e "${GREEN}✓ Python dependencies installed${NC}"

# Step 4: Download Vosk models
echo ""
echo "📥 Downloading Vosk models..."
mkdir -p ~/.local/share/vosk-models
cd ~/.local/share/vosk-models

# Download small model (45MB)
if [ ! -d "vosk-model-small-en-us-0.15" ]; then
    echo "Downloading small model (45MB)..."
    wget -q --show-progress https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
    unzip -q vosk-model-small-en-us-0.15.zip
    rm vosk-model-small-en-us-0.15.zip
    echo -e "${GREEN}✓ Small model installed${NC}"
else
    echo -e "${YELLOW}⚠ Small model already exists, skipping...${NC}"
fi

# Optionally download large model (1.8GB)
read -p "Download large model for better accuracy? (1.8GB) [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ ! -d "vosk-model-en-us-0.22" ]; then
        echo "Downloading large model (1.8GB)..."
        wget -q --show-progress https://alphacephei.com/vosk/models/vosk-model-en-us-0.22.zip
        unzip -q vosk-model-en-us-0.22.zip
        rm vosk-model-en-us-0.22.zip
        echo -e "${GREEN}✓ Large model installed${NC}"
    else
        echo -e "${YELLOW}⚠ Large model already exists, skipping...${NC}"
    fi
fi

# Step 5: Create nerd-dictation config directory
echo ""
echo "⚙️  Creating configuration directory..."
mkdir -p ~/.config/nerd-dictation

# Copy config file if it exists in project
if [ -f "$(dirname "$0")/../.config/nerd-dictation/nerd-dictation.py" ]; then
    cp "$(dirname "$0")/../.config/nerd-dictation/nerd-dictation.py" ~/.config/nerd-dictation/
    chmod +x ~/.config/nerd-dictation/nerd-dictation.py
    echo -e "${GREEN}✓ Configuration file installed${NC}"
else
    echo -e "${YELLOW}⚠ Config file not found in project, will need to be created manually${NC}"
fi

# Step 6: Verify installation
echo ""
echo "🔍 Verifying installation..."

errors=0

if command_exists nerd-dictation; then
    echo -e "${GREEN}✓ nerd-dictation installed${NC}"
else
    echo -e "${RED}✗ nerd-dictation not found${NC}"
    ((errors++))
fi

if command_exists xdotool; then
    echo -e "${GREEN}✓ xdotool installed${NC}"
else
    echo -e "${RED}✗ xdotool not found${NC}"
    ((errors++))
fi

if command_exists xclip; then
    echo -e "${GREEN}✓ xclip installed${NC}"
else
    echo -e "${RED}✗ xclip not found${NC}"
    ((errors++))
fi

if [ -d ~/.local/share/vosk-models/vosk-model-small-en-us-0.15 ]; then
    echo -e "${GREEN}✓ Vosk small model installed${NC}"
else
    echo -e "${RED}✗ Vosk small model not found${NC}"
    ((errors++))
fi

if python3 -c "import vosk" 2>/dev/null; then
    echo -e "${GREEN}✓ Vosk Python module installed${NC}"
else
    echo -e "${RED}✗ Vosk Python module not found${NC}"
    ((errors++))
fi

echo ""
if [ $errors -eq 0 ]; then
    echo -e "${GREEN}=========================================="
    echo -e "✓ Installation completed successfully!"
    echo -e "==========================================${NC}"
    echo ""
    echo "Next steps:"
    echo "1. cd voice-dictation-tauri"
    echo "2. npm install"
    echo "3. npm run tauri dev"
else
    echo -e "${RED}Installation completed with $errors error(s)${NC}"
    echo "Please fix the errors above and try again."
    exit 1
fi
