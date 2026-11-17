import React from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { ResolvedScene, ThemeConfig } from '../schema/storyboard';
import { SvgVisual } from './visuals/SvgVisual';
import { HtmlVisual } from './visuals/HtmlVisual';
import { OnScreenText } from './OnScreenText';
import { Subtitle } from './Subtitle';

interface SceneViewProps {
  scene: ResolvedScene;
  theme: ThemeConfig;
  enableSubtitles: boolean;
}

export const SceneView: React.FC<SceneViewProps> = ({
  scene,
  theme,
  enableSubtitles,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Hitung efek Ken Burns (motion) secara halus sepanjang durasi adegan
  let transform = 'none';
  const progress = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  switch (scene.motion) {
    case 'zoom_in': {
      const scale = interpolate(progress, [0, 1], [1.0, 1.08]);
      transform = `scale(${scale})`;
      break;
    }
    case 'zoom_out': {
      const scale = interpolate(progress, [0, 1], [1.08, 1.0]);
      transform = `scale(${scale})`;
      break;
    }
    case 'pan_left': {
      const translateX = interpolate(progress, [0, 1], [2, -2]);
      transform = `scale(1.06) translateX(${translateX}%)`;
      break;
    }
    case 'pan_right': {
      const translateX = interpolate(progress, [0, 1], [-2, 2]);
      transform = `scale(1.06) translateX(${translateX}%)`;
      break;
    }
    case 'none':
    default:
      transform = 'none';
      break;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, overflow: 'hidden' }}>
      {/* Layer 1: Visual Utama (SVG atau HTML) dengan Motion */}
      <AbsoluteFill
        style={{
          transform,
          transformOrigin: 'center center',
        }}
      >
        {scene.visual.type === 'svg' && <SvgVisual code={scene.visual.code} />}
        {scene.visual.type === 'html' && <HtmlVisual code={scene.visual.code} />}
      </AbsoluteFill>

      {/* Layer 2: On-Screen Text (Hook / Poin Penting) */}
      {scene.on_screen_text && (
        <OnScreenText text={scene.on_screen_text} theme={theme} />
      )}

      {/* Layer 3: Subtitle Berbasis Frasa Proporsional */}
      {enableSubtitles && (
        <Subtitle narration={scene.narration} theme={theme} />
      )}

      {/* Audio Narasi Adegan */}
      {scene.audioSrc && <Audio src={staticFile(scene.audioSrc)} />}
    </AbsoluteFill>
  );
};
