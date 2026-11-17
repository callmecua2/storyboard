import React from 'react';
import { AbsoluteFill } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { ResolvedProps } from '../schema/storyboard';
import { SceneView } from './Scene';

export const VideoComposition: React.FC<ResolvedProps> = ({
  scenes,
  theme,
  transitionDurationInFrames,
  enableSubtitles,
}) => {
  // Ekspos palet warna & font global sebagai CSS Variables sesuai Bagian 6.3 PRD
  const cssVariables = {
    '--bg': theme.background,
    '--accent': theme.accent,
    '--text': theme.text,
    '--font-heading': `'${theme.fontHeading}', sans-serif`,
    '--font-body': `'${theme.fontBody}', sans-serif`,
    backgroundColor: theme.background,
    color: theme.text,
    fontFamily: `'${theme.fontBody}', sans-serif`,
  } as React.CSSProperties;

  return (
    <AbsoluteFill style={cssVariables}>
      <TransitionSeries>
        {scenes.map((scene, index) => {
          const elements: React.ReactNode[] = [];

          // Tambahkan transisi masuk sebelum adegan (kecuali adegan pertama atau transition === 'none')
          if (index > 0 && scene.transition !== 'none') {
            const presentation =
              scene.transition === 'slide'
                ? slide({ direction: 'from-right' })
                : fade();

            elements.push(
              <TransitionSeries.Transition
                key={`transition-${scene.id}`}
                presentation={presentation}
                timing={linearTiming({
                  durationInFrames: transitionDurationInFrames,
                })}
              />
            );
          }

          elements.push(
            <TransitionSeries.Sequence
              key={`scene-${scene.id}`}
              durationInFrames={scene.durationInFrames}
            >
              <SceneView
                scene={scene}
                theme={theme}
                enableSubtitles={enableSubtitles}
              />
            </TransitionSeries.Sequence>
          );

          return elements;
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
