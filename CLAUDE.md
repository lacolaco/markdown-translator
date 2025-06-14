# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

```bash
# Run the translation tool (requires GOOGLE_API_KEY environment variable)
pnpm dev <input_file> [output_file]

# Example usage
pnpm dev fixtures/overview.md fixtures/overview_ja.md

# Essential development commands
pnpm run tsc:check    # Type checking
pnpm test             # Run all tests
pnpm test:watch       # Watch mode for tests
pnpm format           # Format code

# Run specific test files
pnpm test translator
pnpm test retry-utils
```

### Options

- `-h, --help`: Show help message

## Architecture

This is a **semantic markdown translation tool** that translates technical documents from English to Japanese using LLM (Google Gemini) with intelligent chunking and automated proofreading.

### Core Components

1. **TranslationWorkflow** (`translation-workflow.ts`)

   - Implements `Agent<TranslationWorkflowInput, TranslationWorkflowOutput>` interface
   - Main orchestrator that coordinates the entire translation process
   - Manages file I/O, debug logging, and workflow sequencing
   - Creates separate LLM instances for Translator (temperature 0.3) and Proofreader (temperature 0.1)
   - Entry point for all translation operations
   - Provides both Agent interface (`run()`) and file-based interface (`translateMarkdownFile()`)

2. **Translator** (`translator.ts`)

   - Implements `Agent<TranslationInput, string>` interface
   - Handles LLM-based translation with context from previous chunks
   - Uses `retryUntilSuccess` utility for retry logic with line count validation
   - Preserves markdown structure and line counts through `validateLineCount`
   - Mandatory LLM dependency injection for testability
   - Pure processing agent with no debug logging dependencies

3. **Proofreader** (`proofreader.ts`)

   - Implements `Agent<ProofreadInput, ProofreadResult>` interface
   - Integrates textlint for Japanese grammar checking
   - Uses LLM to fix detected textlint errors iteratively
   - Preserves markdown structure and line counts through `validateLineCount`
   - Returns detailed error information for remaining issues
   - Mandatory LLM dependency injection for testability

4. **SemanticChunker** (`semantic-chunker.ts`)

   - Pure function-based implementation for intelligent content splitting
   - `chunkMarkdown()`: Splits content on heading boundaries (H1-H3 levels)
   - `getChunkStats()`: Provides detailed chunk statistics and metadata
   - Preserves semantic boundaries and markdown structure completely

5. **Agent Interface** (`agent.ts`)

   - Generic `Agent<In, Out>` interface with single `run(input: In): Promise<Out>` method
   - Enforces consistent processing patterns across Translator and Proofreader
   - Input types (`TranslationInput`, `ProofreadInput`) co-located with implementations

6. **Utility Modules**
   - `retry-utils.ts`: Declarative conditional retry loops with `retryUntilSuccess`
   - `line-count-validator.ts`: Line count preservation validation and adjustment
   - `chunk-utils.ts`: Pure functions for chunk processing and pipeline operations

### Key Design Principles

- **Immutable code style**: Uses `const` exclusively, avoiding `let`
- **Functional programming**: Core utilities use pure functions (SemanticChunker, chunk-utils, retry-utils)
- **Agent pattern**: Translator and Proofreader implement common `Agent<In, Out>` interface
- **Mandatory dependency injection**: LLM instances must be provided, no fallback instantiation
- **Co-located types and prompts**: Input/Output types and prompt templates stored with their respective Agent classes
- **Conditional retry logic**: Declarative retry patterns with success conditions and error handling
- **Centralized debug logging**: All debug output handled in TranslationWorkflow, not individual agents
- **Agent pattern consistency**: All processing components implement the `Agent<In, Out>` interface

### Data Flow

```
TranslationWorkflow.create(googleApiKey)
        ↓
   LLM Instances Creation
   ↙                    ↘
Translator LLM        Proofreader LLM
(temp: 0.5)          (temp: 0.7)
   ↓                    ↓
Translator.create()   Proofreader.create()
   ↓                    ↓
Input MD → SemanticChunker → For Each Chunk:
           ↓                 Translator.run() → Proofreader.run() → joinChunks() → Output MD
        DebugLogger          ↓                   ↓
                    validateLineCount()   validateLineCount()
```

### Processing Architecture

The system processes documents chunk-by-chunk with translation and proofreading as a paired operation per chunk:

1. **Document Chunking**: `chunkMarkdown()` splits input into semantic boundaries
2. **Chunk Processing**: Each chunk goes through translation → proofreading sequentially
3. **Context Preservation**: Previous translations provided as context to maintain consistency
4. **Error Reporting**: Proofreader returns `ProofreadResult` with remaining textlint errors
5. **Chunk Assembly**: `joinChunks()` reassembles processed chunks maintaining line counts

### Environment Setup

Requires `GOOGLE_API_KEY` environment variable for Gemini API access.

### Dependency Injection

The system enforces mandatory LLM dependency injection with static factory methods:

```typescript
// Production usage
const workflow = await TranslationWorkflow.create(process.env.GOOGLE_API_KEY!);
const result = await workflow.run({
  content: markdownContent,
  options: { maxRetries: 3, outputPath: 'output.md' },
});

// Direct agent usage
const translator = await Translator.create(llm);
const result = await translator.run({
  text: 'Hello world',
  previousTranslations: [],
  maxRetries: 3,
});
```

### Debug Output

Debug files are saved to `./tmp/` directory:

- `01-original.md`: Original input document
- `04-chunk-XXX-input.md`: Chunk input (original)
- `04-chunk-XXX-translated.md`: Chunk after translation
- `04-chunk-XXX-final.md`: Chunk after proofreading (final)
- `05-translated-full.md`: Full translation (pre-proofreading)
- `07-final.md`: Final result

### Configuration

- **Environment**: Requires `GOOGLE_API_KEY` environment variable
- **Prompt Templates**: Co-located as constants within Agent classes
- **textlint**: Uses `textlint-rule-preset-ja-technical-writing` preset

### Error Handling and Logging

- **Line Count Validation**: `validateLineCount()` ensures translation preserves document structure
- **Proofreading Errors**: Remaining textlint errors reported as `ProofreadResult.remainingErrors`
- **Workflow Logging**: All debug output centralized in TranslationWorkflow, not individual agents
- **Retry Logic**: `retryUntilSuccess()` provides declarative conditional retry with success predicates

## Coding Standards

- **Immutable code style**: Use `const` exclusively, avoid `let`
- **Functional programming**: Prefer pure functions and functional patterns
- **Type safety**: Use `import type` for type-only imports, avoid `any` types
- **Agent pattern**: All processing components must implement `Agent<In, Out>` interface

### Agent Interface Implementation

When implementing the `Agent<In, Out>` interface, follow these guidelines:

#### Type Co-location

- **MUST**: Input and Output types must be co-located with the Agent implementation
- **Pattern**: `export interface XxxInput { ... }` and `export interface XxxOutput { ... }` in the same file as the Agent class
- **Examples**:
  - `TranslationInput` with `Translator` in `translator.ts`
  - `ProofreadInput`, `ProofreadResult` with `Proofreader` in `proofreader.ts`
  - `TranslationWorkflowInput`, `TranslationWorkflowOutput` with `TranslationWorkflow` in `translation-workflow.ts`

#### Interface Requirements

- **Single method**: Implement only `run(input: In): Promise<Out>`
- **Pure processing**: The `run()` method should focus on core processing logic
- **No side effects**: Avoid file I/O, logging, or external dependencies in the `run()` method when possible
- **Testability**: Design for easy unit testing with dependency injection

#### Implementation Pattern

```typescript
// Co-located types
export interface MyAgentInput {
  data: string;
  options?: SomeOptions;
}

export interface MyAgentOutput {
  result: string;
  metadata?: any;
}

// Agent implementation
export class MyAgent implements Agent<MyAgentInput, MyAgentOutput> {
  constructor(private dependency: SomeDependency) {}

  static async create(dependency: SomeDependency): Promise<MyAgent> {
    // Factory method for async initialization
    return new MyAgent(dependency);
  }

  async run(input: MyAgentInput): Promise<MyAgentOutput> {
    // Core processing logic
    const result = await this.processData(input.data, input.options);
    return {
      result,
      metadata: {
        /* ... */
      },
    };
  }

  private async processData(
    data: string,
    options?: SomeOptions
  ): Promise<string> {
    // Implementation details
  }
}
```

#### Guidelines for Existing Code

- **Backward compatibility**: Maintain existing public methods when adding Agent interface
- **Wrapper methods**: Use Agent `run()` as core implementation, existing methods as wrappers
