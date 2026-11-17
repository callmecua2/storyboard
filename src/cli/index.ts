import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { Command } from 'commander';
import { runPipeline } from '../pipeline';
const program = new Command();
function slugifyTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'video';
}
function printSummary(result: ReturnType<typeof runPipeline>) {
  if (result.warnings.length) { console.log('\n⚠️ Peringatan:'); result.warnings.forEach((warning) => console.log(`  - ${warning}`)); }
  console.log('\n📊 Ringkasan:');
  console.log(`  - Adegan: ${result.summary.sceneCount}`);
  console.log(`  - Durasi audio: ${result.summary.audioDurationSeconds}s`);
  console.log(`  - Durasi video: ${result.summary.totalDurationSeconds}s`);
}
program.name('storyboard-to-video').description('CLI untuk validasi, preview, dan render video dari storyboard JSON').version('1.1.0');
function options(command: Command) {
  return command.option('--storyboard <path>', 'Path ke storyboard.json', 'storyboard.json').option('--no-subtitles', 'Nonaktifkan subtitle');
}
options(program.command('validate').description('Validasi storyboard, audio tunggal, dan transkrip SRT')).action((opts) => {
  try {
    const result = runPipeline({ storyboardPath: opts.storyboard, publicDir: 'public', propsOutputPath: 'props.json', enableSubtitles: opts.subtitles });
    printSummary(result); console.log('\n✅ Validasi berhasil.');
  } catch (error) { console.error(`\n❌ ${error instanceof Error ? error.message : String(error)}`); process.exit(1); }
});
options(program.command('preview').description('Jalankan Remotion Studio')).action((opts) => {
  try {
    const result = runPipeline({ storyboardPath: opts.storyboard, publicDir: 'public', propsOutputPath: 'props.json', enableSubtitles: opts.subtitles });
    printSummary(result); execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['remotion','studio','src/remotion/index.ts','--props=props.json'], { stdio: 'inherit' });
  } catch (error) { console.error(`\n❌ ${error instanceof Error ? error.message : String(error)}`); process.exit(1); }
});
options(program.command('render').description('Render video MP4')).option('--draft', 'Render setengah resolusi pada 15fps', false).action((opts) => {
  const started = Date.now();
  try {
    const result = runPipeline({ storyboardPath: opts.storyboard, publicDir: 'public', propsOutputPath: 'props.json', enableSubtitles: opts.subtitles, draft: Boolean(opts.draft) });
    printSummary(result);
    const outDir = path.resolve('out'); fs.mkdirSync(outDir, { recursive: true });
    const output = path.join(outDir, `${slugifyTitle(result.props.title)}${opts.draft ? '-draft' : ''}.mp4`);
    execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['remotion','render','src/remotion/index.ts','MainVideo',output,'--props=props.json','--codec=h264','--audio-codec=aac'], { stdio: 'inherit' });
    console.log(`\n✅ Render selesai: ${output}\nWaktu: ${((Date.now()-started)/1000).toFixed(2)}s`);
  } catch (error) { console.error(`\n❌ ${error instanceof Error ? error.message : String(error)}`); process.exit(1); }
});
program.parse(process.argv);
