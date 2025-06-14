import * as fs from 'fs/promises';
import * as path from 'path';
import { PromptTemplate } from '@langchain/core/prompts';

/**
 * Loads a prompt template from a .prompt.md file
 * @param promptName - Name of the prompt file (without .prompt.md extension)
 * @returns Promise resolving to PromptTemplate
 */
export async function loadPromptTemplate(promptName: string): Promise<PromptTemplate> {
  const promptPath = path.join(process.cwd(), 'prompts', `${promptName}.prompt.md`);
  
  try {
    const promptContent = await fs.readFile(promptPath, 'utf-8');
    
    // Extract the actual prompt content by removing markdown headers and comments
    const cleanedPrompt = extractPromptContent(promptContent);
    
    return PromptTemplate.fromTemplate(cleanedPrompt);
  } catch (error) {
    throw new Error(`Failed to load prompt template "${promptName}": ${error}`);
  }
}

/**
 * Extracts the actual prompt content from a markdown file
 * Removes markdown headers and keeps only the prompt content
 * @param content - Raw markdown content
 * @returns Cleaned prompt content
 */
function extractPromptContent(content: string): string {
  const lines = content.split('\n');
  const promptLines: string[] = [];
  let inPromptSection = false;
  
  for (const line of lines) {
    // Skip markdown headers (lines starting with #)
    if (line.startsWith('#')) {
      inPromptSection = false;
      continue;
    }
    
    // Start collecting content after headers
    if (line.trim() !== '' || inPromptSection) {
      inPromptSection = true;
      promptLines.push(line);
    }
  }
  
  // Remove leading and trailing empty lines
  while (promptLines.length > 0 && promptLines[0].trim() === '') {
    promptLines.shift();
  }
  while (promptLines.length > 0 && promptLines[promptLines.length - 1].trim() === '') {
    promptLines.pop();
  }
  
  return promptLines.join('\n');
}

/**
 * Lists all available prompt templates
 * @returns Promise resolving to array of prompt names (without .prompt.md extension)
 */
export async function listPromptTemplates(): Promise<string[]> {
  const promptsDir = path.join(process.cwd(), 'prompts');
  
  try {
    const files = await fs.readdir(promptsDir);
    return files
      .filter(file => file.endsWith('.prompt.md'))
      .map(file => file.replace('.prompt.md', ''));
  } catch (error) {
    throw new Error(`Failed to list prompt templates: ${error}`);
  }
}