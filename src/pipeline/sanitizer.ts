import DOMPurify from 'isomorphic-dompurify';
import { StoryboardInput } from '../schema/storyboard';


export interface SanitizeResult {
  storyboard: StoryboardInput;
  warnings: string[];
}

export function sanitizeVisualCode(
  code: string,
  type: 'svg' | 'html',
  sceneId: number,
  expectedWidth: number,
  expectedHeight: number
): { cleanCode: string; warnings: string[] } {
  const warnings: string[] = [];

  // Cek elemen berbahaya sebelum sanitasi untuk logging peringatan
  if (/<script[\s>]/i.test(code)) {
    warnings.push(`Adegan ${sceneId}: Tag <script> dihapus dari visual.`);
  }
  if (/\son[a-z]+\s*=/i.test(code)) {
    warnings.push(`Adegan ${sceneId}: Atribut event handler (on*) dihapus dari visual.`);
  }
  if (/https?:\/\//i.test(code)) {
    warnings.push(
      `Adegan ${sceneId}: Referensi URL eksternal (http/https) ditemukan dan akan dibersihkan.`
    );
  }

  // Konfigurasi DOMPurify agar mempertahankan elemen grafis SVG & styling inline
  const cleanCode = DOMPurify.sanitize(code, {
    USE_PROFILES: { svg: true, svgFilters: true, html: true },
    ADD_TAGS: ['defs', 'linearGradient', 'radialGradient', 'stop', 'filter', 'feGaussianBlur', 'feDropShadow', 'clipPath', 'mask', 'pattern', 'style'],
    ADD_ATTR: ['viewBox', 'preserveAspectRatio', 'xmlns', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'opacity', 'transform', 'gradientUnits', 'offset', 'stop-color', 'stop-opacity', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'width', 'height', 'd', 'points', 'font-family', 'font-size', 'font-weight', 'text-anchor', 'dominant-baseline', 'style', 'class'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'meta', 'audio', 'video', 'img'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'href', 'xlink:href'],
  });

  // Hapus URL eksternal yang mungkin tersisa di dalam atribut style=""
  const strippedExternalUrls = cleanCode.replace(/url\(\s*['"]?https?:\/\/[^)'"]+['"]?\s*\)/gi, 'none');

  // Validasi dimensi/viewBox sesuai FR-3
  if (type === 'svg') {
    const viewBoxMatch = strippedExternalUrls.match(/viewBox\s*=\s*['"]([^'"]+)['"]/i);
    const expectedViewBox = `0 0 ${expectedWidth} ${expectedHeight}`;
    if (!viewBoxMatch) {
      warnings.push(
        `Adegan ${sceneId}: SVG tidak memiliki atribut viewBox (disarankan viewBox='${expectedViewBox}').`
      );
    } else if (viewBoxMatch[1].trim() !== expectedViewBox) {
      warnings.push(
        `Adegan ${sceneId}: viewBox SVG '${viewBoxMatch[1]}' berbeda dari resolusi kanvas '${expectedViewBox}'.`
      );
    }
  }

  return {
    cleanCode: strippedExternalUrls,
    warnings,
  };
}

export function sanitizeStoryboard(storyboard: StoryboardInput): SanitizeResult {
  const allWarnings: string[] = [];

  const sanitizedScenes = storyboard.scenes.map((scene) => {
    const { cleanCode, warnings } = sanitizeVisualCode(
      scene.visual.code,
      scene.visual.type,
      scene.id,
      storyboard.video.width,
      storyboard.video.height
    );
    allWarnings.push(...warnings);

    return {
      ...scene,
      visual: {
        ...scene.visual,
        code: cleanCode,
      },
    };
  });

  return {
    storyboard: {
      ...storyboard,
      scenes: sanitizedScenes,
    },
    warnings: allWarnings,
  };
}
