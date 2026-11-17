import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { SubtitleCue, ThemeConfig } from '../schema/storyboard';
interface SubtitleProps { cues: SubtitleCue[]; theme: ThemeConfig; }
export const Subtitle: React.FC<SubtitleProps> = ({ cues, theme }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const cue = cues.find((item) => frame >= item.startFrame && frame < item.endFrame);
  if (!cue) return null;
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: '5%', paddingLeft: '8%', paddingRight: '8%', pointerEvents: 'none' }}>
      <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', padding: '14px 32px', borderRadius: 12, maxWidth: '82%', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,.45)', border: '1px solid rgba(248,250,252,.12)' }}>
        <span style={{ fontFamily: `'${theme.fontBody}', sans-serif`, fontSize: Math.round(width * 0.022), fontWeight: 600, color: theme.text, lineHeight: 1.35 }}>{cue.text}</span>
      </div>
    </AbsoluteFill>
  );
};
