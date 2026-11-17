import React from 'react';
import { AbsoluteFill } from 'remotion';

interface SvgVisualProps {
  code: string;
}

export const SvgVisual: React.FC<SvgVisualProps> = ({ code }) => {
  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
        }}
        dangerouslySetInnerHTML={{ __html: code }}
      />
    </AbsoluteFill>
  );
};
