import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { ResolvedProps } from '../schema/storyboard';
import { SceneView } from './Scene';
import { Subtitle } from './Subtitle';

export const VideoComposition: React.FC<ResolvedProps> = ({
  scenes, theme, audioSrc, subtitles, enableSubtitles, transitionDurationInFrames,
}) => {
  const cssVariables = {
    '--bg': theme.background, '--accent': theme.accent, '--text': theme.text,
    '--font-heading': `'${theme.fontHeading}', sans-serif`,
    '--font-body': `'${theme.fontBody}', sans-serif`,
    backgroundColor: theme.background, color: theme.text,
    fontFamily: `'${theme.fontBody}', sans-serif`,
  } as React.CSSProperties;
  return (
    <AbsoluteFill style={cssVariables}>
      <Audio src={staticFile(audioSrc)} />
      {scenes.map((scene) => (
        <Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.endFrame - scene.startFrame} name={`Scene ${scene.id}`}>
          <SceneView scene={scene} theme={theme} transitionDurationInFrames={transitionDurationInFrames} />
        </Sequence>
      ))}
      {enableSubtitles && <Subtitle cues={subtitles} theme={theme} />}
    </AbsoluteFill>
  );
};
