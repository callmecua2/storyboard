import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { ThemeConfig } from '../schema/storyboard';

interface OnScreenTextProps {
  text: string;
  theme: ThemeConfig;
}

export const OnScreenText: React.FC<OnScreenTextProps> = ({ text, theme }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width } = useVideoConfig();

  // Animasi masuk di 15 frame pertama, animasi keluar 15 frame sebelum adegan selesai
  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 120 },
  });

  const exitOpacity = interpolate(
    frame,
    [Math.max(0, durationInFrames - 18), Math.max(1, durationInFrames - 5)],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const translateY = interpolate(enterProgress, [0, 1], [24, 0]);
  const fontSize = Math.round(width * 0.026); // ~50px pada 1920px

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        padding: '5%',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          opacity: enterProgress * exitOpacity,
          transform: `translateY(${translateY}px)`,
          backgroundColor: 'rgba(15, 23, 42, 0.78)',
          borderLeft: `6px solid ${theme.accent}`,
          padding: '16px 28px',
          borderRadius: '10px',
          maxWidth: '75%',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
        }}
      >
        <span
          style={{
            fontFamily: `'${theme.fontHeading}', sans-serif`,
            fontSize: `${fontSize}px`,
            fontWeight: 700,
            color: theme.text,
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
          }}
        >
          {text}
        </span>
      </div>
    </AbsoluteFill>
  );
};
