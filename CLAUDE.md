# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

```bash
# Run the translation tool
pnpm dev <input_file> [output_file] [options]

# Example usage
pnpm dev fixtures/overview.md fixtures/overview_ja.md
pnpm dev doc.md --debug
pnpm dev doc.md --debug --debug-dir debug-output
pnpm dev doc.md --instruction-file custom-instructions.md

# Type checking
pnpm run tsc:check

# Run tests
pnpm test
pnpm test:watch

# Run specific test files
pnpm test translator
pnpm test retry
pnpm test agent
pnpm test textlint

# Code formatting
pnpm format
pnpm format:check
```

### Options

- `-d, --debug`: Enable debug file output (default: false)
- `--debug-dir <directory>`: Debug output directory (default: tmp)
- `--instruction-file <file>`: Translation instruction file (default: translator-instructions.md)
- `-h, --help`: Show help message

## Architecture

This is a **semantic markdown translation tool** that translates technical documents from English to Japanese using LLM (Google Gemini) with intelligent chunking and automated proofreading.

### Project Structure

```
src/
├── main.ts                    # CLI entry point
├── types.ts                   # Shared type definitions
├── agent.ts                   # Agent interface definition
├── translation-workflow.ts    # Main workflow orchestrator
├── translator.ts              # Translation agent
├── proofreader.ts            # Proofreading agent
├── semantic-chunker.ts       # Markdown chunking and processing
├── textlint-runner.ts        # Textlint service and integration
└── utils/                    # Utility modules
    ├── retry.ts              # Retry logic
    ├── debug-writer.ts       # Debug file output
    ├── line-validation.ts    # Line count validation
    ├── logger.ts             # Console logging
    └── file-io.ts            # File I/O operations
```

### Core Components

1. **TranslationWorkflow** (`translation-workflow.ts`)

   - Main orchestrator that coordinates the entire translation process
   - Implements `Agent<TranslationWorkflowInput, TranslationWorkflowOutput>` interface
   - Creates separate LLM instances for Translator (temperature 0.5) and Proofreader (temperature 0.8)
   - Centralizes retry logic for both translation and proofreading operations
   - Manages debug output writer for structured debug output
   - Entry point for all translation operations

2. **Translator** (`translator.ts`)

   - Implements `Agent<TranslationInput, string>` interface
   - Handles LLM-based translation with context from previous chunks
   - Includes embedded prompt templates as constants
   - Supports additional instructions and retry context with previous failed attempts
   - Mandatory LLM dependency injection for testability

3. **Proofreader** (`proofreader.ts`)

   - Implements `Agent<ProofreadInput, ProofreadResult>` interface
   - Integrates textlint for Japanese grammar checking
   - Uses LLM to fix detected textlint errors iteratively
   - Returns structured `ProofreadResult` with both corrected text and remaining errors
   - Includes embedded prompt templates as constants
   - Mandatory LLM dependency injection for testability

4. **SemanticChunker** (`semantic-chunker.ts`)
   - Pure function-based implementation for intelligent content splitting and processing
   - `chunkMarkdown()`: Splits content on heading boundaries (H1-H3 levels)
   - `getChunkStats()`: Provides detailed chunk statistics and metadata
   - `joinChunks()`: Reassembles processed chunks maintaining structure
   - `processChunkPipeline()`: End-to-end chunking pipeline for testing
   - `validateChunkPipeline()`: Validates line count preservation
   - `analyzeChunks()`: Detailed chunk analysis for debugging
   - Preserves semantic boundaries and markdown structure completely

5. **Agent Interface** (`agent.ts`)
   - Generic `Agent<In, Out>` interface with single `run(input: In): Promise<Out>` method
   - Enforces consistent processing patterns across Translator, Proofreader, and TranslationWorkflow
   - Input types (`TranslationInput`, `ProofreadInput`) co-located with implementations

6. **TextlintRunner** (`textlint-runner.ts`)
   - Core textlint service for Japanese grammar checking and auto-fixing
   - `TextlintRunner` interface for dependency injection
   - `createTextlintRunner()` factory function with caching
   - Integrates textlint configuration and formatting
   - Centralized textlint error handling and diagnostics

7. **Utility Modules** (`utils/` directory)
   - `retry.ts`: Enhanced retry logic with `LastAttemptResult<T>` interface for failure context
   - `debug-writer.ts`: Centralized debug file output management with structured naming
   - `line-validation.ts`: Line count validation and adjustment utilities
   - `logger.ts`: Standardized console logging utilities (no workflow-specific methods)
   - `file-io.ts`: Standardized file I/O operations

### Key Design Principles

- **Immutable code style**: Uses `const` exclusively, avoiding `let`
- **Functional programming**: Core utilities use pure functions (SemanticChunker, retry-utils)
- **Agent pattern**: All processing components implement common `Agent<In, Out>` interface
- **Mandatory dependency injection**: LLM instances must be provided, no fallback instantiation
- **Co-located types and prompts**: Input/Output types and prompt templates stored with their respective Agent classes
- **Enhanced retry logic**: Conditional retry patterns with previous failure context and success predicates
- **Centralized workflow management**: TranslationWorkflow orchestrates all operations and handles retry logic
- **Separation of concerns**: Debug output, logging, and processing logic are clearly separated

### Data Flow

```
main.ts
  ↓
DebugWriter + TranslationWorkflow instantiation
  ↓
TranslationWorkflow.run()
  ↓
LLM Instances Creation (internal)
  ↙                    ↘
Translator LLM        Proofreader LLM
(temp: 0.5)          (temp: 0.8, no cache)
  ↓                    ↓
Input MD → SemanticChunker → For Each Chunk:
           ↓                 retryUntilSuccess(Translator.run()) → retryUntilSuccess(Proofreader.run()) → joinChunks() → Output MD
        DebugWriter      ↓                                   ↓
                       Line Count Validation               Line Count + textlint Validation
                       Previous Attempt Context           Previous Attempt Context
```

### Processing Architecture

The system processes documents chunk-by-chunk with translation and proofreading as a paired operation per chunk:

1. **Document Chunking**: `chunkMarkdown()` splits input into semantic boundaries
2. **Chunk Processing**: Each chunk goes through translation → proofreading sequentially  
3. **Retry with Context**: Failed attempts include previous results and failure reasons in subsequent attempts
4. **Context-Aware Validation**: Validation functions in retry logic provide specific failure reasons
5. **Error Reporting**: Proofreader returns `ProofreadResult` with remaining textlint errors
6. **Chunk Assembly**: `joinChunks()` reassembles processed chunks maintaining line counts

### Environment Setup

Requires `GOOGLE_API_KEY` environment variable for Gemini API access.

### Dependency Injection

The system enforces mandatory dependency injection with constructor-based instantiation:

```typescript
// Production workflow usage
const debugWriter = new DebugFileWriter('tmp', false);
const textlintRunner = createTextlintRunner();
const workflow = new TranslationWorkflow(
  process.env.GOOGLE_API_KEY,
  debugWriter,
  textlintRunner,
  additionalInstructions
);

// Direct agent usage with Runnable LLM and TextlintRunner
const llmRunnable = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.5
}).pipe(new StringOutputParser());

const translator = new Translator(llmRunnable, additionalInstructions);
const proofreader = new Proofreader(llmRunnable, textlintRunner);

// Enhanced retry with failure context
const result = await retryUntilSuccess<string>({
  maxAttempts: 3,
  attempt: async (lastAttemptResult?: LastAttemptResult<string>) => {
    return await translator.run({
      text: chunk.content,
      retryReason: lastAttemptResult?.failureReason,
      previousFailedAttempt: lastAttemptResult?.previousResult,
    });
  },
  validate: translatedText => {
    const validation = validateLineCount(original, translatedText);
    return validation.isValid ? true : '翻訳前後の行数が一致しません';
  },
});
```

### Debug Output

Debug files are saved to configurable directory with structured naming:

- `01-original.md`: Original input
- `02-chunk-XXX-input.md`: Individual chunk inputs
- `02-chunk-XXX-translated.md`: Translated chunks  
- `02-chunk-XXX-final.md`: Final processed chunks
- `07-final.md`: Final combined result

### External Configuration

- **Environment**: Requires `GOOGLE_API_KEY` for Gemini API access
- **Prompts**: Embedded as constants within Agent classes (`TRANSLATION_PROMPT`, `PROOFREADING_PROMPT`)
- **textlint**: Uses `textlint-rule-preset-ja-technical-writing` with customizations in `.textlintrc.json`
- **Instructions**: Optional additional translation instructions via `--instruction-file`

### Error Handling and Logging

- **Line Count Validation**: `validateLineCount()` ensures translation preserves document structure
- **Retry Context**: `LastAttemptResult<T>` provides failure reasons and previous results to subsequent attempts
- **Structured Error Reporting**: Proofreader returns `ProofreadResult.remainingErrors` for unresolved issues
- **Centralized Logging**: Generic `Logger` utilities for console output, no workflow-specific methods
- **Debug File Management**: `DebugFileWriter` handles all debug output with automatic directory management

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

### Agent Interface Implementation

When implementing the `Agent<In, Out>` interface:

#### Type Co-location
- **MUST**: Input and Output types must be co-located with the Agent implementation
- **Pattern**: `export interface XxxInput { ... }` and `export interface XxxOutput { ... }` in the same file as the Agent class

#### Interface Requirements
- **Single method**: Implement only `run(input: In): Promise<Out>`
- **Pure processing**: The `run()` method should focus on core processing logic
- **Dependency injection**: Accept all dependencies via constructor
- **No fallback instantiation**: Never create dependencies internally

#### Implementation Pattern

```typescript
// Co-located types
export interface MyAgentInput {
  data: string;
  retryReason?: string;
  previousFailedAttempt?: string;
}

export interface MyAgentOutput {
  result: string;
  metadata?: any;
}

// Agent implementation
export class MyAgent implements Agent<MyAgentInput, MyAgentOutput> {
  constructor(private readonly dependency: SomeDependency) {}

  async run(input: MyAgentInput): Promise<MyAgentOutput> {
    // Core processing logic with retry context
    const result = await this.processData(input.data, {
      retryReason: input.retryReason,
      previousAttempt: input.previousFailedAttempt
    });
    return { result };
  }
}
```

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.