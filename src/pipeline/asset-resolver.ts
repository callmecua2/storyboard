import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { ResolvedProps, ResolvedScene, StoryboardInput } from '../schema/storyboard';
import { parseSrtFile } from './transcript-parser';

export interface ResolveOptions {
  storyboardPath: string; publicDir: string; transitionDurationSeconds?: number;
  enableSubtitles?: boolean; draft?: boolean;
}
export interface ResolveResult {
  props: ResolvedProps; warnings: string[];
  summary: { sceneCount: number; totalDurationSeconds: number; audioDurationSeconds: number };
}
function getAudioDuration(filePath: string): number {
  try {
    const output = execFileSync('ffprobe', ['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',filePath], { encoding: 'utf8' }).trim();
    const duration = Number.parseFloat(output);
    if (!Number.isFinite(duration) || duration <= 0) throw new Error(`Durasi tidak valid: ${output}`);
    return duration;
  } catch (error) {
    throw new Error(`Gagal membaca audio dengan ffprobe. Pastikan FFmpeg terpasang. Detail: ${error instanceof Error ? error.message : String(error)}`);
  }
}
export function resolveAssetsAndDurations(storyboard: StoryboardInput, options: ResolveOptions): ResolveResult {
  const warnings: string[] = [];
  const storyboardDir = path.dirname(path.resolve(options.storyboardPath));
  const audioPath = path.resolve(storyboardDir, storyboard.audio.file);
  const transcriptPath = path.resolve(storyboardDir, storyboard.audio.transcript);
  if (!fs.existsSync(audioPath)) throw new Error(`File audio tidak ditemukan: ${audioPath}`);
  const audioDurationSeconds = getAudioDuration(audioPath);
  const fps = options.draft ? 15 : storyboard.video.fps;
  const video = options.draft ? { ...storyboard.video, width: Math.round(storyboard.video.width / 2), height: Math.round(storyboard.video.height / 2), fps } : storyboard.video;
  const cues = parseSrtFile(transcriptPath);
  const tolerance = 1 / fps;
  for (const cue of cues) {
    if (cue.end > audioDurationSeconds + tolerance) throw new Error(`Cue transkrip berakhir pada ${cue.end}s, melewati durasi audio ${audioDurationSeconds.toFixed(3)}s.`);
  }
  const resolvedScenes: ResolvedScene[] = storyboard.scenes.map((scene) => {
    if (scene.end > audioDurationSeconds + tolerance) throw new Error(`Adegan ${scene.id} berakhir setelah audio selesai.`);
    return { ...scene, startFrame: Math.round(scene.start * fps), endFrame: Math.round(scene.end * fps) };
  });
  const publicAudioDir = path.resolve(options.publicDir, 'audio');
  fs.mkdirSync(publicAudioDir, { recursive: true });
  const ext = path.extname(audioPath) || '.mp3';
  const destName = `narration${ext}`;
  fs.copyFileSync(audioPath, path.join(publicAudioDir, destName));
  const subtitles = cues.map((cue) => ({ text: cue.text, startFrame: Math.round(cue.start * fps), endFrame: Math.round(cue.end * fps) }));
  const totalDurationInFrames = Math.max(1, Math.ceil(audioDurationSeconds * fps));
  const transitionDurationInFrames = Math.max(0, Math.round((options.transitionDurationSeconds ?? 0.5) * fps));
  if (resolvedScenes[0].start > 0) warnings.push('Terdapat jeda visual sebelum adegan pertama dimulai.');
  if (resolvedScenes[resolvedScenes.length - 1].end < audioDurationSeconds) warnings.push('Audio berlanjut setelah adegan visual terakhir selesai.');
  const props: ResolvedProps = {
    title: storyboard.title, language: storyboard.language, video, theme: storyboard.theme,
    audioSrc: `audio/${destName}`, subtitles, scenes: resolvedScenes,
    totalDurationInFrames, transitionDurationInFrames, enableSubtitles: options.enableSubtitles ?? true,
  };
  return { props, warnings, summary: { sceneCount: resolvedScenes.length, totalDurationSeconds: Number((totalDurationInFrames / fps).toFixed(3)), audioDurationSeconds: Number(audioDurationSeconds.toFixed(3)) } };
}
