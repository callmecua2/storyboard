import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import {
  ResolvedProps,
  ResolvedScene,
  StoryboardInput,
} from '../schema/storyboard';

export interface ResolveOptions {
  storyboardPath: string;
  audioDir: string;
  publicDir: string;
  endPaddingSeconds?: number;
  transitionDurationSeconds?: number;
  enableSubtitles?: boolean;
  sceneFilter?: number;
  draft?: boolean;
}

export interface ResolveResult {
  props: ResolvedProps;
  warnings: string[];
  summary: {
    sceneCount: number;
    totalDurationSeconds: number;
    perScene: Array<{ id: number; durationSeconds: number; hasAudio: boolean }>;
  };
}

/**
 * Membaca durasi file audio menggunakan ffprobe (bawaan FFmpeg / Remotion).
 */
function getAudioDurationWithFfprobe(filePath: string): number {
  try {
    const output = execFileSync(
      'ffprobe',
      [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        filePath,
      ],
      { encoding: 'utf-8' }
    ).trim();

    const duration = parseFloat(output);
    if (isNaN(duration) || duration <= 0) {
      throw new Error(`Nilai durasi tidak valid: ${output}`);
    }
    return duration;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Gagal membaca durasi audio '${filePath}' via ffprobe. Pastikan FFmpeg/ffprobe terpasang di PATH.
Detail: ${msg}`
    );
  }
}

/**
 * Mencari file audio adegan berdasarkan field audio eksplisit atau konvensi nama 01.wav / 01.m4a / 01.mp3
 */
function findSceneAudioFile(
  sceneId: number,
  explicitAudio: string | null | undefined,
  storyboardDir: string,
  audioDir: string
): string | null {
  if (explicitAudio) {
    const candidateFromStoryboard = path.resolve(storyboardDir, explicitAudio);
    if (fs.existsSync(candidateFromStoryboard)) return candidateFromStoryboard;

    const candidateFromCwd = path.resolve(explicitAudio);
    if (fs.existsSync(candidateFromCwd)) return candidateFromCwd;

    return candidateFromStoryboard; // Akan dilaporkan hilang pada pemeriksaan berikutnya
  }

  const paddedId = String(sceneId).padStart(2, '0');
  const extensions = ['.wav', '.m4a', '.mp3'];

  for (const ext of extensions) {
    const candidate = path.resolve(audioDir, `${paddedId}${ext}`);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function resolveAssetsAndDurations(
  storyboard: StoryboardInput,
  options: ResolveOptions
): ResolveResult {
  const warnings: string[] = [];
  const missingAssets: string[] = [];

  const endPadding = options.endPaddingSeconds ?? 0.6;
  const transitionDuration = options.transitionDurationSeconds ?? 0.5;
  const enableSubtitles = options.enableSubtitles ?? true;

  if (endPadding < transitionDuration) {
    warnings.push(
      `Jeda akhir audio (${endPadding}s) lebih pendek dari durasi transisi (${transitionDuration}s). Narasi antar adegan berisiko tumpang tindih.`
    );
  }

  const storyboardDir = path.dirname(path.resolve(options.storyboardPath));
  const resolvedAudioDir = path.resolve(options.audioDir);
  const publicAudioDir = path.resolve(options.publicDir, 'audio');

  // Siapkan folder public/audio bersih agar Remotion bisa memuat aset lewat staticFile()
  fs.mkdirSync(publicAudioDir, { recursive: true });

  const targetScenes = options.sceneFilter
    ? storyboard.scenes.filter((s) => s.id === options.sceneFilter)
    : storyboard.scenes;

  if (options.sceneFilter && targetScenes.length === 0) {
    throw new Error(`Adegan dengan ID ${options.sceneFilter} tidak ditemukan di storyboard.`);
  }

  const videoConfig = options.draft
    ? {
        width: Math.round(storyboard.video.width / 2),
        height: Math.round(storyboard.video.height / 2),
        fps: 15,
      }
    : storyboard.video;

  const resolvedScenes: ResolvedScene[] = [];
  const perSceneSummary: Array<{ id: number; durationSeconds: number; hasAudio: boolean }> = [];

  for (const scene of targetScenes) {
    const audioPath = findSceneAudioFile(
      scene.id,
      scene.audio,
      storyboardDir,
      resolvedAudioDir
    );

    if (audioPath && fs.existsSync(audioPath)) {
      const ext = path.extname(audioPath).toLowerCase();
      if (ext === '.mp3') {
        warnings.push(
          `Adegan ${scene.id}: Menggunakan format MP3 (${path.basename(audioPath)}). Disarankan WAV atau M4A agar durasi frame lebih presisi.`
        );
      }

      const rawDuration = getAudioDurationWithFfprobe(audioPath);
      const totalSceneSeconds = Number((rawDuration + endPadding).toFixed(3));
      const durationInFrames = Math.max(1, Math.round(totalSceneSeconds * videoConfig.fps));

      // Salin file audio ke public/audio/<id><ext> untuk Remotion staticFile()
      const destFileName = `${String(scene.id).padStart(2, '0')}${ext}`;
      const destPath = path.join(publicAudioDir, destFileName);
      fs.copyFileSync(audioPath, destPath);

      resolvedScenes.push({
        id: scene.id,
        narration: scene.narration,
        visual: scene.visual,
        on_screen_text: scene.on_screen_text ?? null,
        motion: scene.motion,
        transition: scene.transition,
        audioSrc: `audio/${destFileName}`,
        durationInSeconds: totalSceneSeconds,
        durationInFrames,
      });

      perSceneSummary.push({
        id: scene.id,
        durationSeconds: totalSceneSeconds,
        hasAudio: true,
      });
    } else if (scene.duration && scene.duration > 0) {
      // Mode preview tanpa suara
      const totalSceneSeconds = scene.duration;
      const durationInFrames = Math.max(1, Math.round(totalSceneSeconds * videoConfig.fps));

      warnings.push(
        `Adegan ${scene.id}: Tidak ada file audio, menggunakan durasi fallback (${scene.duration}s).`
      );

      resolvedScenes.push({
        id: scene.id,
        narration: scene.narration,
        visual: scene.visual,
        on_screen_text: scene.on_screen_text ?? null,
        motion: scene.motion,
        transition: scene.transition,
        audioSrc: null,
        durationInSeconds: totalSceneSeconds,
        durationInFrames,
      });

      perSceneSummary.push({
        id: scene.id,
        durationSeconds: totalSceneSeconds,
        hasAudio: false,
      });
    } else {
      const expectedPath = audioPath || path.join(resolvedAudioDir, `${String(scene.id).padStart(2, '0')}.wav`);
      missingAssets.push(`  - Adegan ${scene.id}: File audio tidak ditemukan (${expectedPath}) dan field 'duration' kosong.`);
    }
  }

  if (missingAssets.length > 0) {
    throw new Error(
      `Pemeriksaan aset gagal. Adegan berikut tidak memiliki audio maupun durasi fallback:
` +
        missingAssets.join('
')
    );
  }

  // Hitung total durasi dengan memperhitungkan overlap transisi antar adegan
  const transitionDurationInFrames = Math.round(transitionDuration * videoConfig.fps);
  let totalFrames = 0;

  resolvedScenes.forEach((scene, idx) => {
    totalFrames += scene.durationInFrames;
    if (idx > 0 && scene.transition !== 'none') {
      totalFrames -= Math.min(transitionDurationInFrames, Math.floor(scene.durationInFrames / 2));
    }
  });

  const totalDurationSeconds = Number((totalFrames / videoConfig.fps).toFixed(2));

  // FR-4: Peringatkan jika durasi video penuh di luar rentang 3-5 menit (180-300 detik)
  if (!options.sceneFilter && (totalDurationSeconds < 180 || totalDurationSeconds > 300)) {
    warnings.push(
      `Total durasi video adalah ${totalDurationSeconds} detik (${(totalDurationSeconds / 60).toFixed(1)} menit), di luar target ideal 3-5 menit.`
    );
  }

  const props: ResolvedProps = {
    title: storyboard.title,
    language: storyboard.language,
    video: videoConfig,
    theme: storyboard.theme,
    scenes: resolvedScenes,
    totalDurationInFrames: Math.max(1, totalFrames),
    transitionDurationInFrames,
    enableSubtitles,
  };

  return {
    props,
    warnings,
    summary: {
      sceneCount: resolvedScenes.length,
      totalDurationSeconds,
      perScene: perSceneSummary,
    },
  };
}
