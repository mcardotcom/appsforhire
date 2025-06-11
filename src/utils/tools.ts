import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

export async function codebase_search(query: string) {
  try {
    // Use ripgrep to search through the codebase
    const { stdout } = await execAsync(`rg -i "${query}" --type-add 'typescript:*.ts' --type typescript --type javascript --type json --type md`);
    
    // Parse the results
    const results = stdout.split('\n')
      .filter(Boolean)
      .map(line => {
        const [file, lineNum, ...content] = line.split(':');
        return {
          type: 'semantic',
          content: content.join(':').trim(),
          file,
          line: parseInt(lineNum, 10),
          score: 1.0, // Simple scoring for now
        };
      });

    return results;
  } catch (error) {
    console.error('Error performing semantic search:', error);
    return [];
  }
}

export async function grep_search(query: string) {
  try {
    // Use ripgrep to search for exact matches
    const { stdout } = await execAsync(`rg -i "${query}" --type-add 'typescript:*.ts' --type typescript --type javascript --type json --type md`);
    
    // Parse the results
    const results = stdout.split('\n')
      .filter(Boolean)
      .map(line => {
        const [file, lineNum, ...content] = line.split(':');
        return {
          type: 'grep',
          content: content.join(':').trim(),
          file,
          line: parseInt(lineNum, 10),
          match: query,
        };
      });

    return results;
  } catch (error) {
    console.error('Error performing grep search:', error);
    return [];
  }
} 