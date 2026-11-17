import React from 'react';
import { Composition } from 'remotion';
import { VideoComposition } from './VideoComposition';
import { ResolvedProps } from '../schema/storyboard';

// Fallback props default untuk Remotion Studio jika props.json belum di-load via CLI
const defaultProps: ResolvedProps = {
  title: 'Preview Video',
  language: 'id',
  video: { width: 1920, height: 1080, fps: 30 },
  theme: {
    background: '#0F172A',
    accent: '#F59E0B',
    text: '#F8FAFC',
    fontHeading: 'Poppins',
    fontBody: 'Inter',
  },
  scenes: [
    {
      id: 1,
      narration: 'Ini adalah contoh tampilan pratinjau adegan pertama.',
      visual: {
        type: 'svg',
        code: `<svg viewBox='0 0 1920 1080' xmlns='http://www.w3.org/2000/svg'><rect width='1920' height='1080' fill='var(--bg)'/><circle cx='960' cy='540' r='220' fill='var(--accent)' opacity='0.2'/><text x='960' y='555' font-size='64' fill='var(--text)' text-anchor='middle' font-family='sans-serif'>Storyboard Preview</text></svg>`,
      },
      on_screen_text: 'Preview Mode',
      motion: 'zoom_in',
      transition: 'fade',
      audioSrc: null,
      durationInSeconds: 4,
      durationInFrames: 120,
    },
  ],
  totalDurationInFrames: 120,
  transitionDurationInFrames: 15,
  enableSubtitles: true,
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MainVideo"
      component={VideoComposition}
      durationInFrames={defaultProps.totalDurationInFrames}
      fps={defaultProps.video.fps}
      width={defaultProps.video.width}
      height={defaultProps.video.height}
      defaultProps={defaultProps}
      calculateMetadata={({ props }) => {
        return {
          durationInFrames: props.totalDurationInFrames,
          fps: props.video.fps,
          width: props.video.width,
          height: props.video.height,
        };
      }}
    />
  );
};
