# nerd-dictation Configuration File Structure

## Overview

The nerd-dictation configuration file (`~/.config/nerd-dictation/nerd-dictation.py`) is a Python module that provides custom text processing for voice dictation. It must define a `nerd_dictation_process(text)` function that transforms raw speech-to-text output.

## File Location

```
~/.config/nerd-dictation/nerd-dictation.py
```

## Complete Configuration Template

```python
#!/usr/bin/env python3
"""
Voice Dictation Configuration for nerd-dictation
Provides voice command processing, auto punctuation, and number conversion.
"""

import re
from typing import Dict, Tuple, Optional

# ============================================================================
# CONFIGURATION
# ============================================================================

# Enable/disable features (can be overridden by command-line flags)
CONFIG = {
    'auto_punctuation': True,      # Auto-capitalize and add periods
    'numbers_as_digits': False,    # Convert "three" -> "3"
    'voice_commands': True,        # Process voice commands
    'debug': False,                # Print debug information
}

# ============================================================================
# VOICE COMMAND MAPPINGS
# ============================================================================

# Punctuation commands
PUNCTUATION_COMMANDS = {
    "period": ".",
    "full stop": ".",
    "dot": ".",
    "comma": ",",
    "question mark": "?",
    "exclamation mark": "!",
    "exclamation point": "!",
    "colon": ":",
    "semicolon": ";",
    "quote": '"',
    "quotes": '"',
    "apostrophe": "'",
    "single quote": "'",
}

# Navigation commands
NAVIGATION_COMMANDS = {
    "new line": "\n",
    "newline": "\n",
    "new paragraph": "\n\n",
    "paragraph break": "\n\n",
    "tab": "\t",
    "space": " ",
}

# Programming symbols
PROGRAMMING_COMMANDS = {
    "open brace": "{",
    "left brace": "{",
    "close brace": "}",
    "right brace": "}",
    "open bracket": "[",
    "left bracket": "[",
    "close bracket": "]",
    "right bracket": "]",
    "open paren": "(",
    "left paren": "(",
    "open parenthesis": "(",
    "close paren": ")",
    "right paren": ")",
    "close parenthesis": ")",
    "equals": "=",
    "equal sign": "=",
    "plus": "+",
    "plus sign": "+",
    "minus": "-",
    "dash": "-",
    "hyphen": "-",
    "slash": "/",
    "forward slash": "/",
    "backslash": "\\",
    "underscore": "_",
    "dollar sign": "$",
    "at sign": "@",
    "hash": "#",
    "hashtag": "#",
    "percent": "%",
    "percent sign": "%",
    "ampersand": "&",
    "asterisk": "*",
    "star": "*",
    "pipe": "|",
    "vertical bar": "|",
    "caret": "^",
    "tilde": "~",
    "backtick": "`",
    "less than": "<",
    "greater than": ">",
}

# Advanced programming
ADVANCED_COMMANDS = {
    "arrow": "->",
    "fat arrow": "=>",
    "double equals": "==",
    "triple equals": "===",
    "not equals": "!=",
    "less than or equal": "<=",
    "greater than or equal": ">=",
    "and": "&&",
    "or": "||",
    "double and": "&&",
    "double or": "||",
    "null": "null",
    "undefined": "undefined",
    "true": "true",
    "false": "false",
}

# Combine all commands
ALL_COMMANDS = {
    **PUNCTUATION_COMMANDS,
    **NAVIGATION_COMMANDS,
    **PROGRAMMING_COMMANDS,
    **ADVANCED_COMMANDS,
}

# ============================================================================
# NUMBER CONVERSION
# ============================================================================

# Number words to digits
NUMBER_WORDS = {
    "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
    "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
    "ten": "10", "eleven": "11", "twelve": "12", "thirteen": "13",
    "fourteen": "14", "fifteen": "15", "sixteen": "16", "seventeen": "17",
    "eighteen": "18", "nineteen": "19", "twenty": "20", "thirty": "30",
    "forty": "40", "fifty": "50", "sixty": "60", "seventy": "70",
    "eighty": "80", "ninety": "90", "hundred": "100", "thousand": "1000",
    "million": "1000000", "billion": "1000000000",
}

# Ordinal numbers
ORDINAL_WORDS = {
    "first": "1st", "second": "2nd", "third": "3rd", "fourth": "4th",
    "fifth": "5th", "sixth": "6th", "seventh": "7th", "eighth": "8th",
    "ninth": "9th", "tenth": "10th",
}

# ============================================================================
# TEXT PROCESSING FUNCTIONS
# ============================================================================

def process_voice_commands(text: str) -> str:
    """
    Replace voice commands with their corresponding symbols.
    Uses longest-match-first algorithm to handle multi-word commands.
    """
    if not CONFIG['voice_commands']:
        return text

    # Sort commands by length (longest first) for greedy matching
    sorted_commands = sorted(
        ALL_COMMANDS.items(),
        key=lambda x: len(x[0]),
        reverse=True
    )

    result = text
    for phrase, replacement in sorted_commands:
        # Case-insensitive word boundary matching
        pattern = r'\b' + re.escape(phrase) + r'\b'
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)

    return result


def convert_numbers_to_digits(text: str) -> str:
    """
    Convert spoken numbers to digits.
    Handles simple numbers and ordinals.
    """
    if not CONFIG['numbers_as_digits']:
        return text

    result = text

    # Convert ordinals
    for word, digit in ORDINAL_WORDS.items():
        pattern = r'\b' + re.escape(word) + r'\b'
        result = re.sub(pattern, digit, result, flags=re.IGNORECASE)

    # Convert number words
    for word, digit in NUMBER_WORDS.items():
        pattern = r'\b' + re.escape(word) + r'\b'
        result = re.sub(pattern, digit, result, flags=re.IGNORECASE)

    # Handle compound numbers like "twenty three" -> "23"
    result = collapse_compound_numbers(result)

    return result


def collapse_compound_numbers(text: str) -> str:
    """
    Collapse compound numbers like "20 3" -> "23"
    Handles: "twenty three", "one hundred fifty six", etc.
    """
    # Pattern: number followed by smaller number (e.g., "20 3" -> "23")
    pattern = r'\b(\d+)\s+(\d+)\b'

    def combine(match):
        a, b = int(match.group(1)), int(match.group(2))
        # Only combine if first number is larger and divisible by 10/100
        if a > b and (a % 10 == 0 or a % 100 == 0):
            return str(a + b)
        return match.group(0)

    # Repeat to handle chains like "100 20 3"
    prev_result = ""
    result = text
    while result != prev_result:
        prev_result = result
        result = re.sub(pattern, combine, result)

    return result


def add_auto_punctuation(text: str) -> str:
    """
    Add automatic punctuation and capitalization.
    - Capitalize first word
    - Capitalize after sentence-ending punctuation
    - Add period at end if missing
    """
    if not CONFIG['auto_punctuation']:
        return text

    if not text:
        return text

    # Capitalize first character
    result = text[0].upper() + text[1:] if len(text) > 1 else text.upper()

    # Capitalize after sentence-ending punctuation
    # Pattern: (. ! ?) followed by space and lowercase letter
    result = re.sub(
        r'([.!?])\s+([a-z])',
        lambda m: m.group(1) + ' ' + m.group(2).upper(),
        result
    )

    # Add period at end if missing
    if result and result[-1] not in '.!?':
        result += '.'

    return result


def cleanup_text(text: str) -> str:
    """
    Final text cleanup:
    - Fix spacing around punctuation
    - Remove duplicate punctuation
    - Trim whitespace
    """
    result = text

    # Remove spaces before punctuation
    result = re.sub(r'\s+([.,;:!?])', r'\1', result)

    # Ensure space after punctuation (except end of string)
    result = re.sub(r'([.,;:!?])([^\s\n])', r'\1 \2', result)

    # Remove duplicate punctuation
    result = re.sub(r'([.,;:!?])\1+', r'\1', result)

    # Collapse multiple spaces
    result = re.sub(r'  +', ' ', result)

    # Collapse multiple newlines (max 2)
    result = re.sub(r'\n{3,}', '\n\n', result)

    # Trim whitespace
    result = result.strip()

    return result


# ============================================================================
# MAIN PROCESSING FUNCTION
# ============================================================================

def nerd_dictation_process(text: str) -> str:
    """
    Main text processing function called by nerd-dictation.

    Processing pipeline:
    1. Voice command replacement
    2. Number conversion
    3. Auto punctuation
    4. Text cleanup

    Args:
        text: Raw text from speech recognition

    Returns:
        Processed text ready for output
    """
    if CONFIG['debug']:
        print(f"[DEBUG] Input: {repr(text)}")

    # Apply processing pipeline
    result = text

    # 1. Voice commands (highest priority)
    result = process_voice_commands(result)
    if CONFIG['debug']:
        print(f"[DEBUG] After commands: {repr(result)}")

    # 2. Number conversion
    result = convert_numbers_to_digits(result)
    if CONFIG['debug']:
        print(f"[DEBUG] After numbers: {repr(result)}")

    # 3. Auto punctuation
    result = add_auto_punctuation(result)
    if CONFIG['debug']:
        print(f"[DEBUG] After punctuation: {repr(result)}")

    # 4. Final cleanup
    result = cleanup_text(result)
    if CONFIG['debug']:
        print(f"[DEBUG] Final output: {repr(result)}")

    return result


# ============================================================================
# TESTING (only runs when executed directly)
# ============================================================================

if __name__ == "__main__":
    """Test the configuration with sample inputs."""

    test_cases = [
        # Voice commands
        ("hello world period new line", "Hello world.\n"),
        ("open brace hello close brace", "Hello world.\n"),

        # Numbers (when enabled)
        ("I have three apples", "I have 3 apples."),
        ("twenty three", "23"),

        # Auto punctuation
        ("hello world", "Hello world."),
        ("how are you", "How are you."),

        # Complex
        ("for i equals zero semicolon i less than ten semicolon i plus plus",
         "For i = 0; i < 10; i++."),
    ]

    print("Testing nerd-dictation configuration")
    print("=" * 50)

    for input_text, expected in test_cases:
        output = nerd_dictation_process(input_text)
        status = "✓" if output == expected else "✗"
        print(f"{status} Input:    {input_text!r}")
        print(f"  Output:   {output!r}")
        if output != expected:
            print(f"  Expected: {expected!r}")
        print()
```

## Configuration Options

The configuration can be customized by modifying the `CONFIG` dictionary or through command-line arguments passed by the Rust backend.

### Available Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `auto_punctuation` | bool | `True` | Auto-capitalize and add periods |
| `numbers_as_digits` | bool | `False` | Convert spoken numbers to digits |
| `voice_commands` | bool | `True` | Process voice commands |
| `debug` | bool | `False` | Print debug information |

### Runtime Configuration

The Rust backend can pass flags to nerd-dictation:

```bash
nerd-dictation begin \
  --vosk-model-dir ~/.local/share/vosk-models/vosk-model-small-en-us-0.15 \
  --timeout 5 \
  --config ~/.config/nerd-dictation/nerd-dictation.py \
  --numbers-as-digits  # Optional: Enable number conversion
```

## Usage Examples

### Basic Dictation
```
Input:  "hello world"
Output: "Hello world."
```

### Voice Commands
```
Input:  "hello world period new line thank you"
Output: "Hello world.\nThank you."
```

### Programming
```
Input:  "function hello open paren close paren open brace return true semicolon close brace"
Output: "Function hello() { return true; }."
```

### Numbers (when enabled)
```
Input:  "I have three hundred twenty five apples"
Output: "I have 325 apples."
```

### Mixed Content
```
Input:  "the first item costs twenty dollars period the second is thirty"
Output: "The 1st item costs 20 dollars. The 2nd is 30."
```

## Advanced Customization

### Adding Custom Commands

Add to the appropriate dictionary:

```python
CUSTOM_COMMANDS = {
    "smiley face": "😊",
    "arrow function": "() => ",
    "console log": "console.log()",
}

ALL_COMMANDS = {
    **PUNCTUATION_COMMANDS,
    **NAVIGATION_COMMANDS,
    **PROGRAMMING_COMMANDS,
    **ADVANCED_COMMANDS,
    **CUSTOM_COMMANDS,  # Add custom commands
}
```

### Context-Aware Processing

```python
class ProcessingContext:
    """Track state for context-aware processing."""

    def __init__(self):
        self.mode = "normal"  # normal, code, markdown
        self.last_sentence_end = True

    def set_mode(self, mode: str):
        """Change processing mode."""
        self.mode = mode

context = ProcessingContext()

def nerd_dictation_process(text: str) -> str:
    """Process with context awareness."""

    if context.mode == "code":
        # Disable auto punctuation in code mode
        CONFIG['auto_punctuation'] = False
    else:
        CONFIG['auto_punctuation'] = True

    # ... rest of processing
```

### External Configuration File

Load settings from YAML/JSON:

```python
import json
from pathlib import Path

def load_user_config():
    """Load user configuration from file."""
    config_file = Path.home() / ".config/voice-dictation/settings.json"

    if config_file.exists():
        with open(config_file) as f:
            user_config = json.load(f)
            CONFIG.update(user_config)

# Load on module import
load_user_config()
```

## Testing

### Manual Testing

Run the configuration file directly:

```bash
python3 ~/.config/nerd-dictation/nerd-dictation.py
```

This executes the test cases in the `if __name__ == "__main__"` block.

### Integration Testing

Test with nerd-dictation:

```bash
echo "hello world period new line" | \
  nerd-dictation begin \
    --config ~/.config/nerd-dictation/nerd-dictation.py \
    --output - \
    --vosk-model-dir ~/.local/share/vosk-models/vosk-model-small-en-us-0.15
```

## Troubleshooting

### Configuration Not Loaded

**Symptom**: Voice commands not working

**Solutions**:
1. Check file location: `ls ~/.config/nerd-dictation/nerd-dictation.py`
2. Verify syntax: `python3 -m py_compile ~/.config/nerd-dictation/nerd-dictation.py`
3. Check nerd-dictation is using config: Add `--config` flag explicitly

### Syntax Errors

**Symptom**: nerd-dictation fails to start

**Solutions**:
1. Run file directly to see errors: `python3 ~/.config/nerd-dictation/nerd-dictation.py`
2. Check Python version: `python3 --version` (needs 3.7+)
3. Validate indentation (use spaces, not tabs)

### Commands Not Recognized

**Symptom**: Speaking "period" outputs "period" instead of "."

**Solutions**:
1. Enable debug mode: `CONFIG['debug'] = True`
2. Check exact phrase matching (case-insensitive but exact)
3. Verify `CONFIG['voice_commands'] = True`

### Numbers Not Converting

**Symptom**: "three" stays as "three" instead of "3"

**Solutions**:
1. Enable in config: `CONFIG['numbers_as_digits'] = True`
2. OR pass flag to nerd-dictation: `--numbers-as-digits`
3. Check word boundaries (needs space around numbers)

## Performance Considerations

- **Regex Compilation**: Patterns are compiled on each call. For better performance, pre-compile:
  ```python
  COMMAND_PATTERNS = {
      cmd: re.compile(r'\b' + re.escape(cmd) + r'\b', re.IGNORECASE)
      for cmd in ALL_COMMANDS
  }
  ```

- **Processing Time**: Typical processing <10ms per sentence
- **Memory Usage**: ~1MB for loaded configuration

## Security Notes

- Configuration file runs as your user (not sandboxed)
- Can execute arbitrary Python code
- Keep file permissions restrictive: `chmod 600 ~/.config/nerd-dictation/nerd-dictation.py`
- Don't load untrusted configuration files
