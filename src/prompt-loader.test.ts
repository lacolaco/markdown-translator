import { describe, it, expect } from 'vitest';
import { loadPromptTemplate, listPromptTemplates } from './prompt-loader';

describe('Prompt Loader', () => {
  describe('loadPromptTemplate', () => {
    it('should load translate prompt template', async () => {
      const prompt = await loadPromptTemplate('translate');
      
      expect(prompt).toBeDefined();
      expect(prompt.inputVariables).toContain('context');
      expect(prompt.inputVariables).toContain('content');
      
      // Check that the template contains key instructions
      const templateString = prompt.template;
      expect(templateString).toContain('技術文書の翻訳専門家');
      expect(templateString).toContain('行数を絶対に変更しないでください');
      expect(templateString).toContain('マークダウンの構造を絶対に変更しないでください');
    });

    it('should load proofread prompt template', async () => {
      const prompt = await loadPromptTemplate('proofread');
      
      expect(prompt).toBeDefined();
      expect(prompt.inputVariables).toContain('message');
      expect(prompt.inputVariables).toContain('content');
      
      // Check that the template contains key instructions
      const templateString = prompt.template;
      expect(templateString).toContain('技術文書の校正専門家');
      expect(templateString).toContain('textlintによる校正エラー');
      expect(templateString).toContain('行数を絶対に変更しないでください');
    });

    it('should throw error for non-existent prompt', async () => {
      await expect(loadPromptTemplate('nonexistent')).rejects.toThrow(
        'Failed to load prompt template "nonexistent"'
      );
    });
  });

  describe('listPromptTemplates', () => {
    it('should list available prompt templates', async () => {
      const prompts = await listPromptTemplates();
      
      expect(prompts).toBeInstanceOf(Array);
      expect(prompts).toContain('translate');
      expect(prompts).toContain('proofread');
      expect(prompts.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('template content extraction', () => {
    it('should extract clean prompt content from markdown', async () => {
      const prompt = await loadPromptTemplate('translate');
      const templateContent = prompt.template;
      
      // Should not contain markdown headers
      expect(templateContent).not.toContain('# Translation Prompt');
      expect(templateContent).not.toContain('## 重要な注意事項');
      expect(templateContent).not.toContain('## Context');
      expect(templateContent).not.toContain('## Content to Translate');
      
      // Should contain the actual prompt content
      expect(templateContent).toContain('あなたは技術文書の翻訳専門家です');
      expect(templateContent).toContain('{context}');
      expect(templateContent).toContain('{content}');
    });
  });
});