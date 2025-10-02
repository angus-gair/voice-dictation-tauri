# ADR-001: nerd-dictation Configuration Integration

**Status:** Proposed
**Date:** 2025-10-02
**Decision Makers:** System Architecture Team

## Context

The voice dictation app requires deep integration with nerd-dictation for speech recognition. The README specifies features including voice command processing, auto punctuation, number recognition, and system integration scripts. Currently, the Rust backend calls nerd-dictation as a subprocess, but lacks the configuration file that enables advanced features.

## Decision

Implement a comprehensive nerd-dictation configuration file at `~/.config/nerd-dictation/nerd-dictation.py` that provides:

1. **Voice Command Mappings** - Transform spoken commands into symbols and formatting
2. **Auto Punctuation Logic** - Intelligent sentence detection and capitalization
3. **Number Recognition** - Convert spoken numbers to digits with context awareness
4. **Text Processing Pipeline** - Multi-stage transformation of voice input

## Architecture Design

### Component Diagram (C4 Level 2)

```
┌─────────────────────────────────────────────────────────────┐
│                    Voice Dictation App                       │
│  ┌──────────────┐      ┌──────────────┐    ┌─────────────┐ │
│  │   Frontend   │─────▶│ Rust Backend │───▶│  OS Layer   │ │
│  │  (TypeScript)│      │    (Tauri)   │    │  (xdotool)  │ │
│  └──────────────┘      └──────┬───────┘    └─────────────┘ │
│                               │                              │
│                               ▼                              │
│                    ┌──────────────────┐                     │
│                    │ nerd-dictation   │                     │
│                    │   subprocess     │                     │
│                    └────────┬─────────┘                     │
│                             │                               │
│                             ▼                               │
│              ┌──────────────────────────┐                  │
│              │  nerd-dictation.py       │                  │
│              │  Configuration File      │                  │
│              ├──────────────────────────┤                  │
│              │ • Voice Commands Map     │                  │
│              │ • Text Processors        │                  │
│              │ • Number Converters      │                  │
│              │ • Punctuation Rules      │                  │
│              └────────┬─────────────────┘                  │
│                       │                                     │
│                       ▼                                     │
│            ┌──────────────────────┐                        │
│            │   Vosk ASR Model     │                        │
│            │  (Speech Recognition)│                        │
│            └──────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
┌─────────┐     ┌──────────────┐     ┌──────────────┐
│  User   │────▶│  Microphone  │────▶│ nerd-dict.py │
│ Speech  │     │  Audio Input │     │   (Vosk)     │
└─────────┘     └──────────────┘     └──────┬───────┘
                                             │
                                             ▼
                                    ┌────────────────┐
                                    │ Raw Text       │
                                    │ "hello world"  │
                                    └───────┬────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │       Text Processing Pipeline                │
                    │                                               │
                    │  1. Voice Command Mapper                      │
                    │     "period" → "."                            │
                    │     "new line" → "\n"                         │
                    │                                               │
                    │  2. Number Converter                          │
                    │     "three hundred" → "300"                   │
                    │     "first" → "1st"                          │
                    │                                               │
                    │  3. Auto Punctuation                          │
                    │     Capitalize sentences                      │
                    │     Add periods at boundaries                 │
                    │                                               │
                    │  4. Text Finalizer                            │
                    │     Trim whitespace                           │
                    │     Fix spacing around punctuation            │
                    │                                               │
                    └───────────────────┬───────────────────────────┘
                                        │
                                        ▼
                              ┌─────────────────┐
                              │ Processed Text  │
                              │ "Hello world."  │
                              └────────┬────────┘
                                       │
                                       ▼
                            ┌──────────────────┐
                            │  xdotool/xclip   │
                            │  System Output   │
                            └──────────────────┘
```

## Rationale

### Quality Attributes

1. **Accuracy** - Voice command processing must handle ambiguous speech
2. **Performance** - Text processing should add <100ms latency
3. **Extensibility** - Easy to add new commands and processing rules
4. **Reliability** - Gracefully handle malformed input
5. **Usability** - Commands should feel natural to speak

### Technology Choices

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Configuration Format | Python Module | nerd-dictation native format, full language power |
| Command Mapping | Dictionary-based | Fast O(1) lookup, easy to maintain |
| Number Processing | Regex + Library | num2words library for comprehensive number handling |
| Punctuation | Rule-based FSM | Predictable, debuggable behavior |

### Trade-offs

**Chosen: Python Configuration File**

✅ Pros:
- Full programming language for complex logic
- Direct integration with nerd-dictation
- Can leverage Python libraries (num2words, regex)
- Hot-reloadable without app restart

❌ Cons:
- Requires Python knowledge to modify
- Not sandboxed (can run arbitrary code)
- Debugging harder than declarative config

**Alternative: JSON/YAML Configuration**

✅ Pros:
- Declarative, easy to understand
- Safe (no code execution)
- Multiple language support

❌ Cons:
- Limited to simple mappings
- Can't implement complex logic
- Would require Rust reimplementation of processors

**Decision:** Use Python for flexibility and native nerd-dictation support, document security considerations.

## Implementation Plan

### Phase 1: Core Configuration Structure
1. Create `~/.config/nerd-dictation/nerd-dictation.py`
2. Implement `nerd_dictation_process()` function
3. Define voice command dictionary
4. Setup basic text processing pipeline

### Phase 2: Advanced Features
1. Number-to-digit conversion with num2words
2. Auto-punctuation with sentence detection
3. Programming command mappings
4. Context-aware processing

### Phase 3: System Integration
1. Installation script for config file
2. Validation script to check configuration
3. Update Rust backend to pass correct flags
4. Add error handling and fallbacks

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|------------|------------|
| Configuration syntax errors | High | Medium | Validation script, safe defaults |
| num2words library missing | Medium | Low | Graceful fallback, installation check |
| Performance degradation | Medium | Low | Benchmark tests, optional features |
| Voice command conflicts | Low | Medium | Priority ordering, user customization |

## Success Metrics

1. Voice command recognition accuracy >95%
2. Text processing latency <100ms
3. Number conversion accuracy >98%
4. Zero crashes from malformed config
5. User satisfaction with natural language commands

## Related Decisions

- ADR-002: Voice Command Mapping Design
- ADR-003: Auto Punctuation Algorithm
- ADR-004: System Integration Scripts

## References

- [nerd-dictation Documentation](https://github.com/ideasman42/nerd-dictation)
- [Vosk Speech Recognition](https://alphacephei.com/vosk/)
- [num2words Library](https://github.com/savoirfairelinux/num2words)
