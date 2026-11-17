import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { Command } from 'commander';
import { runPipeline } from '../pipeline';

const program = new Command();

function slugifyTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'video'
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function printWarningsAndSummary(result: ReturnType<typeof runPipeline>) {
  if (result.warnings.length > 0) {
    console.log('
⚠️  Peringatan:');
    result.warnings.forEach((w) => console.log(`  - ${w}`));
  }

  console.log('
📊 Ringkasan Durasi:');
  console.log(`  - Jumlah adegan : ${result.summary.sceneCount}`);
  console.log(
    `  - Total durasi  : ${result.summary.totalDurationSeconds}s (${(
      result.summary.totalDurationSeconds / 60
    ).toFixed(2)} menit)`
  );
  result.summary.perScene.forEach((s) => {
    console.log(
      `    • Adegan ${String(s.id).padStart(2, '0')}: ${s.durationSeconds}s (${
        s.hasAudio ? 'Audio' : 'Durasi Manual'
      })`
    );
  });
}

program
  .name('storyboard-to-video')
  .description('CLI untuk validasi, preview, dan render video dari storyboard JSON')
  .version('1.0.0');

// Perintah: validate
program
  .command('validate')
  .description('Validasi storyboard JSON, sanitasi visual, dan pemeriksaan aset audio')
  .option('--storyboard <path>', 'Path ke file storyboard.json', 'storyboard.json')
  .option('--audio-dir <path>', 'Path ke folder audio', 'audio')
  .option('--no-subtitles', 'Nonaktifkan subtitle')
  .action((opts) => {
    try {
      const result = runPipeline({
        storyboardPath: opts.storyboard,
        audioDir: opts.audioDir,
        publicDir: 'public',
        propsOutputPath: 'props.json',
        enableSubtitles: opts.subtitles,
      });

      printWarningsAndSummary(result);
      console.log('
✅ Validasi berhasil! props.json siap digunakan.');
    } catch (err) {
      console.error(`
❌ ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

// Perintah: preview
program
  .command('preview')
  .description('Jalankan pipeline validasi lalu buka Remotion Studio')
  .option('--storyboard <path>', 'Path ke file storyboard.json', 'storyboard.json')
  .option('--audio-dir <path>', 'Path ke folder audio', 'audio')
  .option('--no-subtitles', 'Nonaktifkan subtitle')
  .action((opts) => {
    try {
      const result = runPipeline({
        storyboardPath: opts.storyboard,
        audioDir: opts.audioDir,
        publicDir: 'public',
        propsOutputPath: 'props.json',
        enableSubtitles: opts.subtitles,
      });

      printWarningsAndSummary(result);
      console.log('
🚀 Membuka Remotion Studio...');

      const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      execFileSync(
        npxCmd,
        ['remotion', 'studio', 'src/remotion/index.ts', '--props=props.json'],
        { stdio: 'inherit' }
      );
    } catch (err) {
      console.error(`
❌ ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

// Perintah: render
program
  .command('render')
  .description('Render video penuh atau satu adegan ke format MP4')
  .option('--storyboard <path>', 'Path ke file storyboard.json', 'storyboard.json')
  .option('--audio-dir <path>', 'Path ke folder audio', 'audio')
  .option('--scene <id>', 'Render hanya satu adegan tertentu berdasarkan ID')
  .option('--draft', 'Render cepat resolusi rendah (50% resolusi, 15fps)', false)
  .option('--no-subtitles', 'Nonaktifkan subtitle')
  .action((opts) => {
    const startTime = Date.now();

    try {
      const sceneFilter = opts.scene ? parseInt(opts.scene, 10) : undefined;
      if (opts.scene && (isNaN(sceneFilter!) || sceneFilter! <= 0)) {
        throw new Error('--scene harus berupa bilangan bulat positif.');
      }

      const result = runPipeline({
        storyboardPath: opts.storyboard,
        audioDir: opts.audioDir,
        publicDir: 'public',
        propsOutputPath: 'props.json',
        enableSubtitles: opts.subtitles,
        sceneFilter,
        draft: Boolean(opts.draft),
      });

      printWarningsAndSummary(result);

      const outDir = path.resolve('out');
      fs.mkdirSync(outDir, { recursive: true });

      const baseSlug = slugifyTitle(result.props.title);
      const suffix = [
        sceneFilter ? `scene-${String(sceneFilter).padStart(2, '0')}` : '',
        opts.draft ? 'draft' : '',
      ]
        .filter(Boolean)
        .join('-');

      const outputFileName = suffix ? `${baseSlug}-${suffix}.mp4` : `${baseSlug}.mp4`;
      const outputPath = path.join(outDir, outputFileName);

      console.log(`
🎬 Memulai proses render ke: ${outputPath}
`);

      const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      execFileSync(
        npxCmd,
        [
          'remotion',
          'render',
          'src/remotion/index.ts',
          'MainVideo',
          outputPath,
          '--props=props.json',
          '--codec=h264',
          '--audio-codec=aac',
        ],
        { stdio: 'inherit' }
      );

      const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
      const fileSize = fs.existsSync(outputPath)
        ? formatBytes(fs.statSync(outputPath).size)
        : 'N/A';

      const report = [
        `=== RENDER REPORT (${new Date().toISOString()}) ===`,
        `Output Path : ${outputPath}`,
        `Durasi Video: ${result.summary.totalDurationSeconds}s`,
        `Ukuran File : ${fileSize}`,
        `Waktu Render: ${elapsedSeconds}s`,
        `Mode Draft  : ${opts.draft ? 'Ya' : 'Tidak'}`,
        `Adegan      : ${sceneFilter ? `Hanya adegan ${sceneFilter}` : `Semua (${result.summary.sceneCount} adegan)`}`,
        `==================================================
`,
      ].join('
');

      console.log(`
✅ Render selesai!
${report}`);

      const logPath = path.join(outDir, 'render.log');
      fs.appendFileSync(logPath, report, 'utf-8');
    } catch (err) {
      console.error(`
❌ ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
