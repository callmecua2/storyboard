import React from 'react';
import { AbsoluteFill } from 'remotion';

interface HtmlVisualProps {
  code: string;
}

export const HtmlVisual: React.FC<HtmlVisualProps> = ({ code }) => {
  return (
    <AbsoluteFill
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
        dangerouslySetInnerHTML={{ __html: code }}
      />
    </AbsoluteFill>
  );
};
