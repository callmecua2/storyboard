import { z } from 'zod';

export const VideoConfigSchema = z.object({
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  fps: z.number().int().min(1).max(120).default(30),
});

export const ThemeSchema = z.object({
  background: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Format warna hex tidak valid')
    .default('#0F172A'),
  accent: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Format warna hex tidak valid')
    .default('#F59E0B'),
  text: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Format warna hex tidak valid')
    .default('#F8FAFC'),
  fontHeading: z.string().min(1).default('Poppins'),
  fontBody: z.string().min(1).default('Inter'),
});

export const SvgVisualSchema = z.object({
  type: z.literal('svg'),
  code: z.string().min(1, 'Kode SVG tidak boleh kosong'),
});

export const HtmlVisualSchema = z.object({
  type: z.literal('html'),
  code: z.string().min(1, 'Kode HTML tidak boleh kosong'),
});

export const VisualSchema = z.discriminatedUnion('type', [
  SvgVisualSchema,
  HtmlVisualSchema,
]);

export const MotionTypeSchema = z.enum([
  'none',
  'zoom_in',
  'zoom_out',
  'pan_left',
  'pan_right',
]);

export const TransitionTypeSchema = z.enum([
  'none',
  'fade',
  'slide',
]);

export const SceneSchema = z.object({
  id: z.number().int().positive('ID adegan harus bilangan bulat positif'),
  narration: z.string().min(1, 'Teks narasi wajib diisi untuk subtitle'),
  audio: z.string().min(1).nullable().optional(),
  duration: z
    .number()
    .positive('Durasi preview harus lebih dari 0 detik')
    .nullable()
    .optional(),
  visual: VisualSchema,
  on_screen_text: z.string().nullable().optional(),
  motion: MotionTypeSchema.default('zoom_in'),
  transition: TransitionTypeSchema.default('fade'),
});

export const StoryboardSchema = z
  .object({
    title: z.string().min(1, 'Judul video wajib diisi'),
    language: z.string().min(2).max(10).default('id'),
    video: VideoConfigSchema.default({}),
    theme: ThemeSchema.default({}),
    scenes: z
      .array(SceneSchema)
      .min(1, 'Storyboard minimal harus memiliki 1 adegan'),
  })
  .superRefine((data, ctx) => {
    const seenIds = new Set<number>();

    data.scenes.forEach((scene, index) => {
      const expectedId = index + 1;

      if (seenIds.has(scene.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['scenes', index, 'id'],
          message: `ID adegan duplikat: ${scene.id}`,
        });
      }
      seenIds.add(scene.id);

      if (scene.id !== expectedId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['scenes', index, 'id'],
          message: `ID adegan tidak berurutan. Diharapkan ${expectedId}, ditemukan ${scene.id}`,
        });
      }
    });
  });

export type VideoConfig = z.infer<typeof VideoConfigSchema>;
export type ThemeConfig = z.infer<typeof ThemeSchema>;
export type VisualConfig = z.infer<typeof VisualSchema>;
export type MotionType = z.infer<typeof MotionTypeSchema>;
export type TransitionType = z.infer<typeof TransitionTypeSchema>;
export type SceneInput = z.infer<typeof SceneSchema>;
export type StoryboardInput = z.infer<typeof StoryboardSchema>;

export interface ResolvedScene extends Omit<SceneInput, 'audio' | 'duration'> {
  audioSrc: string | null;
  durationInSeconds: number;
  durationInFrames: number;
}

export interface ResolvedProps {
  title: string;
  language: string;
  video: VideoConfig;
  theme: ThemeConfig;
  scenes: ResolvedScene[];
  totalDurationInFrames: number;
  transitionDurationInFrames: number;
  enableSubtitles: boolean;
}
