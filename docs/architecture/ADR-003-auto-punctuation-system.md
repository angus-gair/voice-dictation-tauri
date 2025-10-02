# ADR-003: Auto Punctuation System Design

**Status:** Proposed
**Date:** 2025-10-02
**Decision Makers:** System Architecture Team

## Context

The auto punctuation feature must intelligently add periods and capitalize sentences without explicit voice commands. This requires understanding sentence boundaries, maintaining context, and avoiding false positives. The challenge is balancing automation with accuracy.

## Decision

Implement a rule-based finite state machine (FSM) for auto punctuation with:

1. **Sentence boundary detection** - Heuristics for ending sentences
2. **Capitalization rules** - First word and proper nouns
3. **Context awareness** - Track punctuation state
4. **User override** - Explicit commands take precedence

## Architecture Design

### Finite State Machine

```
┌─────────────────────────────────────────────────────────────┐
│            Auto Punctuation State Machine                   │
│                                                              │
│   ┌─────────────┐                                           │
│   │  SENTENCE   │◀─────────────────┐                       │
│   │   START     │                  │                       │
│   └──────┬──────┘                  │                       │
│          │ word                     │ period/exclamation/  │
│          │                          │ question mark        │
│          ▼                          │                       │
│   ┌─────────────┐                  │                       │
│   │  IN         │──────────────────┘                       │
│   │  SENTENCE   │                                           │
│   └──────┬──────┘                                           │
│          │ comma/semicolon                                  │
│          │                                                   │
│          ▼                                                   │
│   ┌─────────────┐                                           │
│   │  MID        │─────────────────┐                        │
│   │  CLAUSE     │                 │ long pause            │
│   └─────────────┘                 │                        │
│          ▲                         │                        │
│          └─────────────────────────┘                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Sentence Boundary Detection Algorithm

```
Input: Raw transcribed text
Output: Text with auto punctuation

Rules for adding periods:
1. Long pause detected (>2 seconds in silence)
2. Sentence length exceeds threshold (>15 words)
3. Sentence structure indicators:
   - Subject-verb-object pattern complete
   - Conjunction followed by new clause
   - Time/location transitions

Rules for capitalization:
1. First word after sentence boundary
2. First word of text
3. After manual punctuation (., !, ?)
4. Proper nouns (name detection)

Exceptions (do NOT add period):
- Incomplete sentence indicators: "and", "but", "or"
- Questions in progress
- Lists and enumerations
- Code blocks
- User already added punctuation
```

### Implementation Structure

```python
class AutoPunctuator:
    """Intelligent auto punctuation processor."""

    def __init__(self):
        self.state = SentenceState.START
        self.word_count = 0
        self.last_punctuation = ""
        self.pause_threshold = 2.0  # seconds

    def process(self, text: str, pause_duration: float = 0) -> str:
        """
        Add automatic punctuation to text.

        Args:
            text: Raw text from speech recognition
            pause_duration: Time since last speech (seconds)

        Returns:
            Text with auto punctuation added
        """
        words = text.split()
        result = []

        for i, word in enumerate(words):
            # Check if we should add period before this word
            if self._should_end_sentence(word, i, pause_duration):
                result.append(".")
                self.state = SentenceState.START
                self.word_count = 0

            # Capitalize if at sentence start
            if self.state == SentenceState.START:
                word = self._capitalize_word(word)

            result.append(word)
            self.word_count += 1

            # Update state based on word content
            if word.endswith((',', ';')):
                self.state = SentenceState.MID_CLAUSE
            elif word.endswith(('.', '!', '?')):
                self.state = SentenceState.START
                self.word_count = 0
            else:
                self.state = SentenceState.IN_SENTENCE

        # Add final period if needed
        if self._should_end_sentence_final():
            result.append(".")

        return " ".join(result)

    def _should_end_sentence(
        self,
        word: str,
        position: int,
        pause: float
    ) -> bool:
        """Determine if sentence should end before this word."""

        # Don't add period at start
        if position == 0:
            return False

        # User already added punctuation
        if self.last_punctuation in (".", "!", "?"):
            return False

        # Long pause indicates sentence end
        if pause > self.pause_threshold:
            return True

        # Sentence too long
        if self.word_count > 15:
            # Check for natural break
            if word.lower() in SENTENCE_STARTERS:
                return True

        # Conjunction after complete thought
        if word.lower() in ("but", "however", "although"):
            if self.word_count > 8:
                return True

        return False

    def _capitalize_word(self, word: str) -> str:
        """Capitalize word appropriately."""

        # Already has punctuation
        if word[0].isupper():
            return word

        # First letter capitalization
        if len(word) > 0:
            return word[0].upper() + word[1:]

        return word

    def _should_end_sentence_final(self) -> bool:
        """Check if final sentence needs period."""

        # Already has ending punctuation
        if self.last_punctuation in (".", "!", "?"):
            return False

        # Has enough words to be a sentence
        if self.word_count >= 3:
            return True

        return False

# Sentence starter words that indicate new sentence
SENTENCE_STARTERS = {
    "however", "therefore", "thus", "meanwhile", "furthermore",
    "moreover", "additionally", "consequently", "subsequently",
    "first", "second", "third", "finally", "lastly",
    "i", "you", "he", "she", "it", "we", "they",
    "the", "a", "an"
}
```

## Quality Attributes

### Accuracy Requirements

- **True Positive Rate**: >90% - Correctly identify sentence boundaries
- **False Positive Rate**: <5% - Don't break mid-sentence
- **User Override**: 100% - Explicit commands always take precedence

### Performance

- Processing time: <5ms per sentence
- Memory usage: <1MB for state machine
- No external API calls (fully local)

### Usability

- Transparent operation - user shouldn't need to think about it
- Consistent behavior - same input produces same output
- Easy to disable - toggle in settings

## Trade-offs Analysis

### Chosen: Rule-based FSM

**Pros:**
- Predictable, deterministic behavior
- Fast processing (no ML inference)
- Easy to debug and adjust
- Works offline
- Transparent logic

**Cons:**
- Limited to defined rules
- May miss edge cases
- Requires manual tuning
- Can't learn user patterns

### Alternative: Machine Learning Model

**Pros:**
- Can learn complex patterns
- Adapts to user style
- Handles edge cases better
- Improves over time

**Cons:**
- Unpredictable behavior
- Requires training data
- Higher latency
- Needs retraining for changes
- Black box decision making

**Decision:** Use rule-based FSM for predictability and performance. Can enhance with ML later if needed.

### Alternative: Natural Language Processing Library

**Pros:**
- Professional-grade parsing
- Handles complex grammar
- Well-tested

**Cons:**
- Large dependency (spaCy ~500MB)
- Slow initialization
- Overkill for this use case

**Decision:** Custom rules are sufficient for dictation use case.

## Integration Points

### With Voice Command Processing

```python
def nerd_dictation_process(text: str) -> str:
    """Main processing pipeline."""

    # 1. Voice commands (explicit punctuation)
    text = process_voice_commands(text)

    # 2. Auto punctuation (only if enabled and no explicit punctuation)
    if config.auto_punctuation:
        # Only add auto punctuation if user didn't specify it
        if not has_manual_punctuation(text):
            punctuator = AutoPunctuator()
            text = punctuator.process(text)

    return text
```

### Pause Detection Integration

```python
# nerd-dictation can provide silence duration
def on_speech_segment(text: str, silence_duration: float):
    """Called when speech segment is recognized."""

    processor = AutoPunctuator()
    processed = processor.process(text, pause_duration=silence_duration)

    return processed
```

## Implementation Phases

### Phase 1: Basic Rules (MVP)
- Capitalize first word
- Add period at end if missing
- Capitalize after explicit punctuation

### Phase 2: Sentence Detection
- Word count threshold
- Pause-based boundaries
- Conjunction detection

### Phase 3: Advanced Features
- Proper noun detection
- Quote handling
- Abbreviation awareness

### Phase 4: User Customization
- Adjustable thresholds
- Custom word lists
- Mode switching (formal/casual)

## Configuration Options

```python
class PunctuationConfig:
    """User-configurable auto punctuation settings."""

    # Enable auto punctuation
    enabled: bool = True

    # Minimum words before auto period
    min_words_for_period: int = 3

    # Maximum words before forcing period
    max_words_without_period: int = 20

    # Pause duration to trigger sentence end (seconds)
    pause_threshold: float = 2.0

    # Capitalize first word of sentences
    auto_capitalize: bool = True

    # Add period at end if missing
    add_final_period: bool = True
```

## Error Handling

### Failure Modes

1. **Over-punctuation**: Too many periods added
   - Mitigation: Conservative thresholds, user testing

2. **Under-punctuation**: Missing sentence boundaries
   - Mitigation: Pause detection, word count limits

3. **Wrong capitalization**: Mid-sentence capitals
   - Mitigation: State tracking, proper noun detection

4. **Conflicts with voice commands**: User says "period" but auto adds one too
   - Mitigation: Voice commands take precedence, disable auto for that segment

## Testing Strategy

### Unit Tests
- Sentence boundary detection accuracy
- Capitalization rules
- State machine transitions
- Configuration handling

### Integration Tests
- Combined with voice commands
- Pause detection integration
- User settings persistence

### User Acceptance Tests
- Natural dictation flows
- Edge cases (lists, code, questions)
- Multiple languages (future)

## Success Metrics

1. **User Surveys**: >80% find auto punctuation helpful
2. **Accuracy**: >90% correct sentence boundaries
3. **Performance**: <5ms processing time per sentence
4. **Adoption**: >70% of users keep feature enabled
5. **False Positives**: <5% incorrect punctuation

## Future Enhancements

1. **Context-aware Modes**
   - Prose mode: More aggressive auto punctuation
   - Code mode: Minimal auto punctuation
   - Chat mode: Casual punctuation style

2. **Learning System**
   - Track user corrections
   - Adjust thresholds based on patterns
   - Personalized punctuation style

3. **Multi-language Support**
   - Language-specific rules
   - Cultural punctuation differences
   - Unicode support

4. **Advanced Grammar**
   - Question detection (rising intonation)
   - List formatting
   - Quote and parenthesis balancing

## References

- [Automatic Punctuation Prediction](https://arxiv.org/abs/1908.00097)
- [Sentence Boundary Detection Algorithms](https://www.nltk.org/)
- [Dragon NaturallySpeaking Auto Formatting](https://www.nuance.com/dragon.html)
- [Finite State Machines in NLP](https://web.stanford.edu/~jurafsky/slp3/)
