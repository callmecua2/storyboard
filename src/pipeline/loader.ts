import fs from 'fs';
import path from 'path';
import { jsonrepair } from 'jsonrepair';
import { StoryboardInput, StoryboardSchema } from '../schema/storyboard';

export interface LoadResult {
  storyboard: StoryboardInput;
  warnings: string[];
}

export function loadAndValidateStoryboard(storyboardPath: string): LoadResult {
  const warnings: string[] = [];
  const resolvedPath = path.resolve(storyboardPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File storyboard tidak ditemukan: ${resolvedPath}`);
  }

  const rawContent = fs.readFileSync(resolvedPath, 'utf-8');
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(rawContent);
  } catch (err) {
    // Coba perbaiki otomatis jika JSON rusak akibat escaping LLM
    try {
      const repaired = jsonrepair(rawContent);
      parsedJson = JSON.parse(repaired);
      warnings.push(
        'Format JSON awal memiliki kesalahan sintaks ringan dan telah diperbaiki otomatis oleh jsonrepair.'
      );
    } catch {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Gagal mem-parsing JSON pada ${resolvedPath}.
` +
          `Detail: ${msg}
` +
          `Penyebab umum: kutip ganda tidak di-escape di dalam HTML/SVG atau koma berlebih.`
      );
    }
  }

  const result = StoryboardSchema.safeParse(parsedJson);

  if (!result.success) {
    const errorLines = result.error.issues.map((issue) => {
      const fieldPath = issue.path
        .map((segment, idx) =>
          typeof segment === 'number' ? `[${segment}]` : idx === 0 ? segment : `.${segment}`
        )
        .join('');
      return `  - ${fieldPath || 'root'}: ${issue.message}`;
    });

    throw new Error(
      `Validasi skema storyboard gagal (${result.error.issues.length} error):
` +
        errorLines.join('\n')
    );
  }

  return {
    storyboard: result.data,
    warnings,
  };
}
