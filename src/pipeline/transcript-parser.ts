import fs from 'fs';

export interface TranscriptCueSeconds { text: string; start: number; end: number; }
function parseTimestamp(value: string): number {
  const match = value.trim().match(/^(\d{2,}):(\d{2}):(\d{2})[,.](\d{3})$/);
  if (!match) throw new Error(`Timestamp SRT tidak valid: ${value}`);
  const [, h, m, s, ms] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms) / 1000;
}
export function parseSrtFile(filePath: string): TranscriptCueSeconds[] {
  if (!fs.existsSync(filePath)) throw new Error(`File transkrip tidak ditemukan: ${filePath}`);
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '').replace(/\r/g, '');
  const blocks = raw.trim().split(/\n\s*\n/);
  const cues: TranscriptCueSeconds[] = [];
  for (const block of blocks) {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    const timeIndex = lines.findIndex((line) => line.includes('-->'));
    if (timeIndex < 0) continue;
    const [startText, endText] = lines[timeIndex].split('-->').map((part) => part.trim().split(/\s+/)[0]);
    const start = parseTimestamp(startText);
    const end = parseTimestamp(endText);
    const text = lines.slice(timeIndex + 1).join(' ').trim();
    if (!text) throw new Error('Cue SRT tidak boleh kosong.');
    if (end <= start) throw new Error(`Rentang waktu SRT tidak valid: ${startText} --> ${endText}`);
    if (cues.length && start < cues[cues.length - 1].end) throw new Error('Cue SRT tidak boleh tumpang tindih dan harus berurutan.');
    cues.push({ text, start, end });
  }
  if (!cues.length) throw new Error('Tidak ada cue valid di file SRT.');
  return cues;
}
