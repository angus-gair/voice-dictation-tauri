# ADR-002: Voice Command Mapping Design

**Status:** Proposed
**Date:** 2025-10-02
**Decision Makers:** System Architecture Team

## Context

Voice commands need to transform spoken words into symbols, formatting, and actions. The README specifies categories: punctuation, navigation, and programming commands. The challenge is designing a system that's both comprehensive and extensible.

## Decision

Implement a hierarchical command mapping system with:

1. **Category-based organization** - Group commands by purpose
2. **Priority levels** - Handle ambiguous matches
3. **Context awareness** - Different behavior based on state
4. **Alias support** - Multiple phrases for same command

## Architecture Design

### Command Map Structure

```python
VOICE_COMMANDS = {
    # Punctuation (Priority: High)
    "punctuation": {
        "period": {"output": ".", "priority": 100},
        "full stop": {"output": ".", "priority": 90},
        "dot": {"output": ".", "priority": 80},
        "comma": {"output": ",", "priority": 100},
        "question mark": {"output": "?", "priority": 100},
        "exclamation mark": {"output": "!", "priority": 100},
        "exclamation point": {"output": "!", "priority": 90},
        "colon": {"output": ":", "priority": 100},
        "semicolon": {"output": ";", "priority": 100},
        "quote": {"output": '"', "priority": 100},
        "apostrophe": {"output": "'", "priority": 100},
        "single quote": {"output": "'", "priority": 90},
    },

    # Navigation (Priority: Medium)
    "navigation": {
        "new line": {"output": "\n", "priority": 100},
        "newline": {"output": "\n", "priority": 90},
        "new paragraph": {"output": "\n\n", "priority": 100},
        "tab": {"output": "\t", "priority": 100},
        "space": {"output": " ", "priority": 100},
    },

    # Programming (Priority: Medium)
    "programming": {
        "open brace": {"output": "{", "priority": 100},
        "left brace": {"output": "{", "priority": 90},
        "close brace": {"output": "}", "priority": 100},
        "right brace": {"output": "}", "priority": 90},
        "open bracket": {"output": "[", "priority": 100},
        "left bracket": {"output": "[", "priority": 90},
        "close bracket": {"output": "]", "priority": 100},
        "right bracket": {"output": "]", "priority": 90},
        "open paren": {"output": "(", "priority": 100},
        "left paren": {"output": "(", "priority": 90},
        "open parenthesis": {"output": "(", "priority": 80},
        "close paren": {"output": ")", "priority": 100},
        "right paren": {"output": ")", "priority": 90},
        "close parenthesis": {"output": ")", "priority": 80},
        "equals": {"output": "=", "priority": 100},
        "equal sign": {"output": "=", "priority": 90},
        "plus": {"output": "+", "priority": 100},
        "plus sign": {"output": "+", "priority": 90},
        "minus": {"output": "-", "priority": 100},
        "dash": {"output": "-", "priority": 90},
        "hyphen": {"output": "-", "priority": 80},
        "slash": {"output": "/", "priority": 100},
        "forward slash": {"output": "/", "priority": 90},
        "backslash": {"output": "\\", "priority": 100},
        "underscore": {"output": "_", "priority": 100},
        "dollar sign": {"output": "$", "priority": 100},
        "at sign": {"output": "@", "priority": 100},
        "hash": {"output": "#", "priority": 100},
        "percent": {"output": "%", "priority": 100},
        "ampersand": {"output": "&", "priority": 100},
        "asterisk": {"output": "*", "priority": 100},
        "star": {"output": "*", "priority": 90},
        "pipe": {"output": "|", "priority": 100},
        "vertical bar": {"output": "|", "priority": 90},
        "caret": {"output": "^", "priority": 100},
        "tilde": {"output": "~", "priority": 100},
        "backtick": {"output": "`", "priority": 100},
    },

    # Advanced programming (Priority: Low)
    "advanced": {
        "arrow": {"output": "->", "priority": 100},
        "fat arrow": {"output": "=>", "priority": 100},
        "double equals": {"output": "==", "priority": 100},
        "triple equals": {"output": "===", "priority": 100},
        "not equals": {"output": "!=", "priority": 100},
        "less than or equal": {"output": "<=", "priority": 100},
        "greater than or equal": {"output": ">=", "priority": 100},
        "and": {"output": "&&", "priority": 100},
        "or": {"output": "||", "priority": 100},
        "null": {"output": "null", "priority": 100},
        "undefined": {"output": "undefined", "priority": 100},
        "true": {"output": "true", "priority": 100},
        "false": {"output": "false", "priority": 100},
    }
}
```

### Command Matching Algorithm

```
┌─────────────────────────────────────────────────────────┐
│          Voice Command Matching Pipeline                │
│                                                          │
│  Input: Raw text from Vosk                              │
│  "hello world period new line"                          │
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │ 1. Tokenization                             │        │
│  │    Split on whitespace                      │        │
│  │    ["hello", "world", "period", "new line"] │        │
│  └────────────┬───────────────────────────────┘        │
│               │                                          │
│  ┌────────────▼───────────────────────────────┐        │
│  │ 2. Multi-word Command Detection             │        │
│  │    Greedy longest match                     │        │
│  │    "new line" matched before "new" "line"   │        │
│  └────────────┬───────────────────────────────┘        │
│               │                                          │
│  ┌────────────▼───────────────────────────────┐        │
│  │ 3. Command Lookup                           │        │
│  │    Check against VOICE_COMMANDS dict        │        │
│  │    Use priority for ambiguous matches       │        │
│  └────────────┬───────────────────────────────┘        │
│               │                                          │
│  ┌────────────▼───────────────────────────────┐        │
│  │ 4. Replacement                              │        │
│  │    "period" → "."                           │        │
│  │    "new line" → "\n"                        │        │
│  └────────────┬───────────────────────────────┘        │
│               │                                          │
│  Output: "hello world.\n"                               │
└─────────────────────────────────────────────────────────┘
```

## Implementation Details

### Command Processor Function

```python
def process_voice_commands(text: str) -> str:
    """
    Process voice commands in text, replacing them with symbols.
    Uses greedy longest-match algorithm.
    """
    # Build flat command map with all categories
    command_map = {}
    for category, commands in VOICE_COMMANDS.items():
        for phrase, config in commands.items():
            command_map[phrase] = config

    # Sort by length (longest first) and priority
    sorted_commands = sorted(
        command_map.items(),
        key=lambda x: (len(x[0].split()), x[1]['priority']),
        reverse=True
    )

    # Process text
    result = text
    for phrase, config in sorted_commands:
        # Case-insensitive matching
        pattern = r'\b' + re.escape(phrase) + r'\b'
        result = re.sub(pattern, config['output'], result, flags=re.IGNORECASE)

    return result
```

### Context-Aware Processing

```python
class CommandContext:
    """Maintains state for context-aware command processing."""

    def __init__(self):
        self.mode = "normal"  # normal, programming, markdown
        self.last_char = ""
        self.sentence_start = True

    def should_capitalize(self) -> bool:
        """Determine if next word should be capitalized."""
        return self.sentence_start and self.mode == "normal"

    def process_command(self, command: str) -> str:
        """Process command with context."""
        # Update context based on command
        if command in [".", "!", "?"]:
            self.sentence_start = True
        elif command.strip():
            self.sentence_start = False

        return command
```

## Quality Attributes

### Performance Requirements

- Command lookup: O(n*m) where n=words, m=commands
- Target: <10ms for typical dictation (<100 words)
- Optimization: Pre-compile regex patterns, cache results

### Extensibility

- New commands: Add to dictionary, no code changes
- User customization: Load from user config file
- Plugin system: Custom categories and processors

### Accuracy

- Multi-word commands detected before single words
- Priority system resolves ambiguities
- Case-insensitive matching reduces errors

## Trade-offs Analysis

### Chosen: Dictionary-based with Priority

**Pros:**
- Simple to understand and maintain
- Fast lookup with O(1) average case
- Easy to add new commands
- Priority system handles conflicts

**Cons:**
- Limited to exact phrase matching
- No fuzzy matching for speech errors
- All commands loaded in memory

### Alternative: Machine Learning Model

**Pros:**
- Can learn user patterns
- Handles speech recognition errors
- Adapts to user vocabulary

**Cons:**
- Requires training data
- Unpredictable behavior
- Higher latency
- Complex to maintain

**Decision:** Use dictionary-based approach for predictability and performance. Can add ML enhancement later.

## Integration Points

### With nerd-dictation Configuration

```python
def nerd_dictation_process(text: str) -> str:
    """Main processing function called by nerd-dictation."""

    # 1. Voice command processing
    text = process_voice_commands(text)

    # 2. Number conversion (if enabled)
    if config.numbers_as_digits:
        text = convert_numbers_to_digits(text)

    # 3. Auto punctuation (if enabled)
    if config.auto_punctuation:
        text = add_auto_punctuation(text)

    # 4. Final cleanup
    text = cleanup_text(text)

    return text
```

### With Rust Backend

The Rust backend passes configuration flags to nerd-dictation:

```rust
cmd.arg("--config")
   .arg(&config_file);  // ~/.config/nerd-dictation/nerd-dictation.py

if config.numbers_as_digits {
    cmd.arg("--numbers-as-digits");
}
```

## Success Metrics

1. **Command Recognition Rate**: >98% for all defined commands
2. **False Positive Rate**: <1% (normal words not mistaken for commands)
3. **Latency**: <10ms added to processing time
4. **User Satisfaction**: Commands feel natural to speak

## Future Enhancements

1. **User-defined Commands**: Load from ~/.config/voice-dictation/custom-commands.yaml
2. **Context Modes**: Switch between programming, prose, markdown modes
3. **Language Support**: Multi-language command sets
4. **Voice Macros**: Complex multi-step actions from single phrase

## References

- [Speech Recognition Command Patterns](https://www.w3.org/TR/speech-grammar/)
- [Dragon NaturallySpeaking Command Reference](https://www.nuance.com/dragon.html)
- [Talon Voice Command System](https://talonvoice.com/)
