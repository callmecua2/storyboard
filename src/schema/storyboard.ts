import { z } from 'zod';

export const VideoConfigSchema = z.object({
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  fps: z.number().int().min(1).max(120).default(30),
});
export const ThemeSchema = z.object({
  background: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/).default('#0F172A'),
  accent: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/).default('#F59E0B'),
  text: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/).default('#F8FAFC'),
  fontHeading: z.string().min(1).default('Poppins'),
  fontBody: z.string().min(1).default('Inter'),
});
export const SvgVisualSchema = z.object({ type: z.literal('svg'), code: z.string().min(1) });
export const HtmlVisualSchema = z.object({ type: z.literal('html'), code: z.string().min(1) });
export const VisualSchema = z.discriminatedUnion('type', [SvgVisualSchema, HtmlVisualSchema]);
export const MotionTypeSchema = z.enum(['none', 'zoom_in', 'zoom_out', 'pan_left', 'pan_right']);
export const TransitionTypeSchema = z.enum(['none', 'fade', 'slide']);
export const AudioSchema = z.object({
  file: z.string().min(1, 'Path audio narasi wajib diisi'),
  transcript: z.string().min(1, 'Path file transkrip SRT wajib diisi'),
});
export const SceneSchema = z.object({
  id: z.number().int().positive(),
  start: z.number().nonnegative('Waktu mulai tidak boleh negatif'),
  end: z.number().positive('Waktu selesai harus lebih dari 0'),
  visual: VisualSchema,
  on_screen_text: z.string().nullable().optional(),
  motion: MotionTypeSchema.default('zoom_in'),
  transition: TransitionTypeSchema.default('fade'),
}).superRefine((scene, ctx) => {
  if (scene.end <= scene.start) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['end'], message: 'end harus lebih besar dari start' });
});
export const StoryboardSchema = z.object({
  title: z.string().min(1),
  language: z.string().min(2).max(10).default('id'),
  video: VideoConfigSchema.default({}),
  theme: ThemeSchema.default({}),
  audio: AudioSchema,
  scenes: z.array(SceneSchema).min(1),
}).superRefine((data, ctx) => {
  const ids = new Set<number>();
  data.scenes.forEach((scene, index) => {
    if (ids.has(scene.id)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['scenes', index, 'id'], message: `ID adegan duplikat: ${scene.id}` });
    ids.add(scene.id);
    if (scene.id !== index + 1) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['scenes', index, 'id'], message: `ID adegan harus berurutan mulai dari 1` });
    if (index > 0 && scene.start < data.scenes[index - 1].end) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['scenes', index, 'start'], message: 'Adegan tidak boleh saling tumpang tindih' });
  });
});
export type VideoConfig = z.infer<typeof VideoConfigSchema>;
export type ThemeConfig = z.infer<typeof ThemeSchema>;
export type VisualConfig = z.infer<typeof VisualSchema>;
export type MotionType = z.infer<typeof MotionTypeSchema>;
export type TransitionType = z.infer<typeof TransitionTypeSchema>;
export type SceneInput = z.infer<typeof SceneSchema>;
export type StoryboardInput = z.infer<typeof StoryboardSchema>;
export interface ResolvedScene extends SceneInput { startFrame: number; endFrame: number; }
export interface SubtitleCue { text: string; startFrame: number; endFrame: number; }
export interface ResolvedProps {
  title: string; language: string; video: VideoConfig; theme: ThemeConfig;
  audioSrc: string; subtitles: SubtitleCue[]; scenes: ResolvedScene[];
  totalDurationInFrames: number; transitionDurationInFrames: number; enableSubtitles: boolean;
}
