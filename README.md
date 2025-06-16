# mdtranslator

Semantic markdown translation tool that translates technical documents from English to Japanese using LLM with intelligent chunking and automated proofreading.

## Installation

```bash
npm install -g @lacolaco/mdtranslator
```

## Usage

### Basic Usage

```bash
mdtranslator input.md output.md
```

### With Options

```bash
# Enable debug output
mdtranslator input.md output.md --debug

# Specify debug output directory
mdtranslator input.md output.md --debug --debug-dir debug-output

# Use custom translation instructions
mdtranslator input.md output.md --instruction-file custom-instructions.md
```

### Using npx (without installation)

```bash
npx @lacolaco/mdtranslator input.md output.md
```

## Prerequisites

- Node.js 18 or higher
- Google API key for Gemini API

## Setup

1. Set your Google API key as an environment variable:
   ```bash
   export GOOGLE_API_KEY=your_api_key_here
   ```

2. Run the translation command:
   ```bash
   mdtranslator document.md document_ja.md
   ```

## Options

- `-d, --debug`: Enable debug file output (default: false)
- `--debug-dir <directory>`: Debug output directory (default: tmp)
- `--instruction-file <file>`: Translation instruction file (default: translator-instructions.md)
- `-h, --help`: Show help message

## Features

- **Semantic Chunking**: Intelligently splits documents at heading boundaries
- **Context-Aware Translation**: Maintains context across document sections
- **Automated Proofreading**: Integrates textlint for Japanese grammar checking
- **Debug Output**: Detailed debug files for troubleshooting
- **Retry Logic**: Automatic retry with failure context

## License

MIT