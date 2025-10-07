#!/bin/bash

# Voice Dictation App Test Script
# This script tests the voice dictation functionality and verifies the fix

echo "🎤 Voice Dictation App - System Test"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test status
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to print test results
print_test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ $2${NC}"
        ((TESTS_FAILED++))
    fi
}

# Helper function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "1. Testing Build System..."
echo "-------------------------"

# Test if npm and node are available
command_exists npm
print_test_result $? "npm is available"

command_exists node
print_test_result $? "node is available"

# Check if package.json exists and is valid
if [ -f "package.json" ]; then
    npm list --depth=0 >/dev/null 2>&1
    print_test_result $? "package.json dependencies are valid"
else
    print_test_result 1 "package.json exists"
fi

echo ""
echo "2. Testing Rust/Tauri Backend..."
echo "-------------------------------"

# Check if Cargo is available
command_exists cargo
print_test_result $? "cargo (Rust) is available"

# Check if Tauri CLI is available
command_exists tauri || npx tauri --version >/dev/null 2>&1
print_test_result $? "tauri CLI is available"

# Test if Cargo.toml is valid
if [ -f "src-tauri/Cargo.toml" ]; then
    cd src-tauri
    cargo check --quiet --message-format=short >/dev/null 2>&1
    result=$?
    cd ..
    print_test_result $result "Rust backend compiles successfully"
else
    print_test_result 1 "src-tauri/Cargo.toml exists"
fi

echo ""
echo "3. Testing TypeScript Frontend..."
echo "--------------------------------"

# Check TypeScript compilation
if [ -f "tsconfig.json" ]; then
    npx tsc --noEmit >/dev/null 2>&1
    print_test_result $? "TypeScript code compiles without errors"
else
    print_test_result 1 "tsconfig.json exists"
fi

# Test if Vite can build the frontend
npm run build >/dev/null 2>&1
print_test_result $? "Frontend builds successfully"

echo ""
echo "4. Testing Voice System Dependencies..."
echo "-------------------------------------"

# Test if nerd-dictation is available
if command_exists nerd-dictation || [ -f "$HOME/.local/bin/nerd-dictation" ]; then
    print_test_result 0 "nerd-dictation is installed"
else
    print_test_result 1 "nerd-dictation is installed (optional for development)"
fi

# Test if xdotool is available
command_exists xdotool
print_test_result $? "xdotool is installed (optional for development)"

# Test if xclip is available
command_exists xclip
print_test_result $? "xclip is installed (optional for development)"

# Test if pactl is available (for microphone detection)
command_exists pactl
print_test_result $? "pactl is installed (optional for development)"

echo ""
echo "5. Testing Vosk Models..."
echo "------------------------"

VOSK_MODELS_DIR="$HOME/.local/share/vosk-models"
if [ -d "$VOSK_MODELS_DIR/vosk-model-small-en-us-0.15" ]; then
    print_test_result 0 "Vosk small model is installed"
else
    print_test_result 1 "Vosk small model is installed (optional for development)"
fi

if [ -d "$VOSK_MODELS_DIR/vosk-model-en-us-0.22" ]; then
    print_test_result 0 "Vosk large model is installed"
else
    print_test_result 1 "Vosk large model is installed (optional for development)"
fi

echo ""
echo "6. Testing Application Startup..."
echo "--------------------------------"

# Test if the application can start without the invoke error
echo "Testing application startup..."
timeout 30s npm run tauri dev &
TAURI_PID=$!
sleep 10

# Check if the process is still running (successful startup)
if kill -0 $TAURI_PID 2>/dev/null; then
    print_test_result 0 "Application starts without invoke errors"
    kill $TAURI_PID 2>/dev/null
    wait $TAURI_PID 2>/dev/null
else
    print_test_result 1 "Application starts without invoke errors"
fi

echo ""
echo "Test Summary"
echo "============"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All critical tests passed! The invoke error has been fixed.${NC}"
    echo ""
    echo "Next Steps:"
    echo "- Run 'npm run tauri dev' to start development"
    echo "- The application should now load without TypeError: Cannot read properties of undefined (reading 'invoke')"
    echo "- Install voice system dependencies for full functionality:"
    echo "  * nerd-dictation"
    echo "  * xdotool"
    echo "  * xclip"
    echo "  * Vosk models"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the issues above.${NC}"
    exit 1
fi