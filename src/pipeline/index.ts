import fs from 'fs';
import path from 'path';
import { loadAndValidateStoryboard } from './loader';
import { sanitizeStoryboard } from './sanitizer';
import { resolveAssetsAndDurations, ResolveOptions, ResolveResult } from './asset-resolver';

export interface PipelineOptions extends ResolveOptions {
  propsOutputPath: string;
}

export function runPipeline(options: PipelineOptions): ResolveResult {
  // 1. Loader + Validator (Zod)
  const loadResult = loadAndValidateStoryboard(options.storyboardPath);

  // 2. Sanitizer HTML/SVG
  const sanitizeResult = sanitizeStoryboard(loadResult.storyboard);

  // 3. Asset checker + Duration resolver
  const resolveResult = resolveAssetsAndDurations(sanitizeResult.storyboard, options);

  // 4. Tulis props.json sebagai single source of truth untuk Remotion
  const propsPath = path.resolve(options.propsOutputPath);
  fs.mkdirSync(path.dirname(propsPath), { recursive: true });
  fs.writeFileSync(propsPath, JSON.stringify(resolveResult.props, null, 2), 'utf-8');

  return {
    ...resolveResult,
    warnings: [
      ...loadResult.warnings,
      ...sanitizeResult.warnings,
      ...resolveResult.warnings,
    ],
  };
}
