import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThemeConfig } from '../schema/storyboard';

interface SubtitleProps {
  narration: string;
  theme: ThemeConfig;
}

interface PhraseChunk {
  text: string;
  startFrame: number;
  endFrame: number;
}

/**
 * Memecah teks narasi menjadi frasa pendek (maksimal 8 kata)
 * lalu mengalokasikan rentang frame secara proporsional berdasarkan jumlah karakter.
 */
function splitNarrationIntoChunks(
  narration: string,
  totalFrames: number,
  maxWordsPerChunk = 8
): PhraseChunk[] {
  const words = narration.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const phrases: string[] = [];
  let currentWords: string[] = [];

  for (const word of words) {
    currentWords.push(word);
    const endsWithPunctuation = /[.,!?;:]$/.test(word);

    if (
      currentWords.length >= maxWordsPerChunk ||
      (endsWithPunctuation && currentWords.length >= 4)
    ) {
      phrases.push(currentWords.join(' '));
      currentWords = [];
    }
  }

  if (currentWords.length > 0) {
    phrases.push(currentWords.join(' '));
  }

  const totalChars = phrases.reduce((sum, p) => sum + p.length, 0);
  let accumulatedFrames = 0;

  return phrases.map((phrase, idx) => {
    const weight = totalChars > 0 ? phrase.length / totalChars : 1 / phrases.length;
    const chunkFrames =
      idx === phrases.length - 1
        ? totalFrames - accumulatedFrames
        : Math.max(1, Math.round(weight * totalFrames));

    const chunk: PhraseChunk = {
      text: phrase,
      startFrame: accumulatedFrames,
      endFrame: accumulatedFrames + chunkFrames,
    };

    accumulatedFrames += chunkFrames;
    return chunk;
  });
}

export const Subtitle: React.FC<SubtitleProps> = ({ narration, theme }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, fps } = useVideoConfig();

  // Sisakan sedikit waktu di akhir (jeda hening) agar subtitle hilang bersamaan dengan selesainya suara
  const activeAudioFrames = Math.max(1, durationInFrames - Math.round(0.4 * fps));

  const chunks = useMemo(
    () => splitNarrationIntoChunks(narration, activeAudioFrames, 8),
    [narration, activeAudioFrames]
  );

  const activeChunk = chunks.find(
    (c) => frame >= c.startFrame && frame < c.endFrame
  );

  if (!activeChunk) {
    return null;
  }

  const fontSize = Math.round(width * 0.022); // ~42px pada 1920px

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: '5%',
        paddingLeft: '8%',
        paddingRight: '8%',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          padding: '14px 32px',
          borderRadius: '12px',
          maxWidth: '82%',
          textAlign: 'center',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(248, 250, 252, 0.12)',
        }}
      >
        <span
          style={{
            fontFamily: `'${theme.fontBody}', sans-serif`,
            fontSize: `${fontSize}px`,
            fontWeight: 600,
            color: theme.text,
            lineHeight: 1.35,
          }}
        >
          {activeChunk.text}
        </span>
      </div>
    </AbsoluteFill>
  );
};
