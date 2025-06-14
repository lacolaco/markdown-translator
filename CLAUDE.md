# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

```bash
# Run the translation tool
pnpm dev <input_file> [output_file] [options]

# Example usage
pnpm dev fixtures/overview.md fixtures/overview_ja.md
pnpm dev doc.md --debug-chunks

# Type checking
pnpm run tsc:check

# Run tests
pnpm test
pnpm run test:run

# Code formatting
pnpm format
pnpm format:check
```

### Options

- `-d, --debug-chunks`: Display chunk division results only (no translation)
- `-h, --help`: Show help message

## Architecture

This is a **semantic markdown translation tool** that translates technical documents from English to Japanese using LLM (Google Gemini) with intelligent chunking and automated proofreading.

### Core Components

1. **TranslationWorkflow** (`translation-workflow.ts`)

   - Main orchestrator that coordinates the entire translation process
   - Manages file I/O, debug logging, and workflow sequencing
   - Creates separate LLM instances for Translator (temperature 0.3) and Proofreader (temperature 0.1)
   - Entry point for all translation operations

2. **Translator** (`translator.ts`)

   - Handles LLM-based translation using semantic chunking
   - Uses `SemanticChunker` to split content intelligently
   - Implements retry logic for failed translations
   - Preserves markdown structure and line counts
   - Accepts LLM dependency injection for testability

3. **Proofreader** (`proofreader.ts`)

   - Integrates textlint for Japanese grammar checking
   - Uses LLM to fix detected textlint errors
   - Implements iterative correction up to maxRetries
   - Ensures final output meets Japanese writing standards
   - Accepts LLM dependency injection for testability

4. **SemanticChunker** (`semantic-chunker.ts`)
   - Pure function-based implementation for intelligent content splitting
   - `chunkMarkdown()`: Splits content on heading boundaries (H1-H3 levels)
   - `getChunkStats()`: Provides detailed chunk statistics and metadata
   - Preserves semantic boundaries and markdown structure completely

### Key Design Principles

- **Immutable code style**: Uses `const` exclusively, avoiding `let`
- **Functional programming**: Core utilities like SemanticChunker use pure functions
- **Separation of concerns**: Translation, proofreading, and workflow management are distinct
- **Dependency injection**: LLM instances are injected for improved testability and flexibility
- **Retry mechanisms**: Both translation and proofreading support configurable retry attempts
- **Debug logging**: Comprehensive logging via `DebugLogger` for troubleshooting
- **Type safety**: Shared types in `types.ts` for consistency

### Data Flow

```
TranslationWorkflow
        ↓
   LLM Instances Creation
   ↙                    ↘
Translator LLM        Proofreader LLM
(temp: 0.3)          (temp: 0.1)
   ↓                    ↓
Translator         Proofreader
    ↓                    ↓
Input MD → SemanticChunker → Translator → Proofreader → Output MD
           ↓                    ↓            ↓
        DebugLogger ←——————— DebugLogger ← DebugLogger
```

### Environment Setup

Requires `GOOGLE_API_KEY` environment variable for Gemini API access.

### Dependency Injection

The system supports separate LLM dependency injection for Translator and Proofreader:

```typescript
// Production usage (uses default Gemini LLMs with different temperatures)
const workflow = new TranslationWorkflow();

// Custom LLM injection for both components
const translatorLLM = new ChatGoogleGenerativeAI({ temperature: 0.3 });
const proofreaderLLM = new ChatGoogleGenerativeAI({ temperature: 0.1 });
const workflow = new TranslationWorkflow({}, translatorLLM, proofreaderLLM);

// Testing with mock LLMs
const mockTranslatorLLM = new MockLLM();
const mockProofreaderLLM = new MockLLM();
const workflow = new TranslationWorkflow(
  {},
  mockTranslatorLLM,
  mockProofreaderLLM
);
```

### Debug Output

Debug files are saved to `./tmp/` with timestamped filenames:

- `{session}-01-original.md`: Original input
- `{session}-02-chunks.json`: Semantic chunk analysis
- `{session}-03-chunk-XXX.md`: Individual chunks
- `{session}-04-translation-XXX.txt`: Translation comparisons
- `{session}-06-translated-full.md`: Full translation (pre-proofreading)
- `{session}-08-final.md`: Final result

### textlint Configuration

Uses `textlint-rule-preset-ja-technical-writing` with customizations in `.textlintrc.json` for Japanese technical writing standards.

## Coding Rules

### TypeScript Standards

- **Strict type checking**: Always adhere to TypeScript's strict mode configuration
- **No `any` types**: Use proper type definitions or `unknown` when type is truly unknown
- **Type imports**: Use `import type` for type-only imports to improve build performance

### Immutability

- **Prefer `const`**: Use `const` exclusively instead of `let` whenever possible
- **Functional approaches**: Use functional programming patterns (map, filter, reduce) over imperative loops
- **Immutable data structures**: Avoid mutating objects/arrays; create new instances instead

### Documentation

- **Function specifications**: Document what each function/method accomplishes, its parameters, and return value
- **Complex logic**: Add inline comments for non-obvious business logic
- **Interface documentation**: Document interface properties and their purposes

### Code Style

- **Single responsibility**: Each function/class should have one clear responsibility
- **Pure functions**: Prefer functions without side effects when possible
- **Extract pure logic**: Extract logic that can be pure functions into small, testable functions
- **Error handling**: Use proper error handling with try-catch and meaningful error messages
