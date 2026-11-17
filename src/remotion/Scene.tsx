import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { ResolvedScene, ThemeConfig } from '../schema/storyboard';
import { SvgVisual } from './visuals/SvgVisual';
import { HtmlVisual } from './visuals/HtmlVisual';
import { OnScreenText } from './OnScreenText';

interface SceneViewProps {
  scene: ResolvedScene;
  theme: ThemeConfig;
  transitionDurationInFrames: number;
}
export const SceneView: React.FC<SceneViewProps> = ({ scene, theme, transitionDurationInFrames }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  let transform = 'none';
  switch (scene.motion) {
    case 'zoom_in': transform = `scale(${interpolate(progress, [0,1], [1,1.08])})`; break;
    case 'zoom_out': transform = `scale(${interpolate(progress, [0,1], [1.08,1])})`; break;
    case 'pan_left': transform = `scale(1.06) translateX(${interpolate(progress, [0,1], [2,-2])}%)`; break;
    case 'pan_right': transform = `scale(1.06) translateX(${interpolate(progress, [0,1], [-2,2])}%)`; break;
    default: transform = 'none';
  }
  const transitionFrames = Math.min(transitionDurationInFrames, Math.floor(durationInFrames / 2));
  const fadeIn = scene.transition === 'fade' ? interpolate(frame, [0, Math.max(1, transitionFrames)], [0,1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1;
  const slideX = scene.transition === 'slide' ? interpolate(frame, [0, Math.max(1, transitionFrames)], [100,0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, overflow: 'hidden', opacity: fadeIn, transform: slideX ? `translateX(${slideX}%)` : undefined }}>
      <AbsoluteFill style={{ transform, transformOrigin: 'center center' }}>
        {scene.visual.type === 'svg' && <SvgVisual code={scene.visual.code} />}
        {scene.visual.type === 'html' && <HtmlVisual code={scene.visual.code} />}
      </AbsoluteFill>
      {scene.on_screen_text && <OnScreenText text={scene.on_screen_text} theme={theme} />}
    </AbsoluteFill>
  );
};
