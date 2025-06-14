export interface ChunkInfo {
  content: string;
  startLine: number;
  endLine: number;
  hasCodeBlocks: boolean;
  needsTranslation: boolean;
}

export interface ChunkMetadata {
  index: number;
  totalChunks: number;
  hasCodeBlocks: boolean;
  headingLevel: number;
  startLine: number;
  endLine: number;
}

export interface LineInfo {
  content: string;
  lineNumber: number;
  isInCodeBlock: boolean;
  isEmpty: boolean;
  isHeading: boolean;
  needsTranslation: boolean;
}

// Translation options
export interface TranslationOptions {
  maxRetries?: number;
  chunkSize?: number;
  outputPath?: string;
}

// LLM configuration
export interface LLMConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
}
