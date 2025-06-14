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
   - Entry point for all translation operations

2. **Translator** (`translator.ts`) 
   - Handles LLM-based translation using semantic chunking
   - Uses `SemanticChunker` to split content intelligently
   - Implements retry logic for failed translations
   - Preserves markdown structure and line counts

3. **Proofreader** (`proofreader.ts`)
   - Integrates textlint for Japanese grammar checking
   - Uses LLM to fix detected textlint errors  
   - Implements iterative correction up to maxRetries
   - Ensures final output meets Japanese writing standards

4. **SemanticChunker** (`semantic-chunker.ts`)
   - Intelligent content splitting that preserves semantic boundaries
   - Respects markdown structure (headings, code blocks, lists)
   - Configurable chunk size limits
   - Provides detailed chunk statistics

### Key Design Principles

- **Immutable code style**: Uses `const` exclusively, avoiding `let` 
- **Separation of concerns**: Translation, proofreading, and workflow management are distinct
- **Retry mechanisms**: Both translation and proofreading support configurable retry attempts
- **Debug logging**: Comprehensive logging via `DebugLogger` for troubleshooting
- **Type safety**: Shared types in `types.ts` for consistency

### Data Flow

```
Input MD → SemanticChunker → Translator → Proofreader → Output MD
           ↓                    ↓            ↓
        DebugLogger ←——————— DebugLogger ← DebugLogger
```

### Environment Setup

Requires `GOOGLE_API_KEY` environment variable for Gemini API access.

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