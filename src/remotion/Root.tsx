import React from 'react';
import { Composition } from 'remotion';
import { VideoComposition } from './VideoComposition';
import { ResolvedProps } from '../schema/storyboard';

const defaultProps: ResolvedProps = {
  title: 'Preview Video',
  language: 'id',
  video: { width: 1920, height: 1080, fps: 30 },
  theme: {
    background: '#0F172A', accent: '#F59E0B', text: '#F8FAFC',
    fontHeading: 'Poppins', fontBody: 'Inter',
  },
  audioSrc: 'audio/narration.mp3',
  subtitles: [],
  scenes: [{
    id: 1, start: 0, end: 4,
    visual: {
      type: 'svg',
      code: "<svg viewBox='0 0 1920 1080' xmlns='http://www.w3.org/2000/svg'><rect width='1920' height='1080' fill='var(--bg)'/><circle cx='960' cy='540' r='220' fill='var(--accent)' opacity='.2'/><text x='960' y='555' font-size='64' fill='var(--text)' text-anchor='middle'>Storyboard Preview</text></svg>",
    },
    on_screen_text: 'Preview Mode',
    motion: 'zoom_in',
    transition: 'fade',
    startFrame: 0,
    endFrame: 120,
  }],
  totalDurationInFrames: 120,
  transitionDurationInFrames: 15,
  enableSubtitles: true,
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="MainVideo"
    component={VideoComposition}
    durationInFrames={defaultProps.totalDurationInFrames}
    fps={defaultProps.video.fps}
    width={defaultProps.video.width}
    height={defaultProps.video.height}
    defaultProps={defaultProps}
    calculateMetadata={({ props }) => ({
      durationInFrames: props.totalDurationInFrames,
      fps: props.video.fps,
      width: props.video.width,
      height: props.video.height,
    })}
  />
);
