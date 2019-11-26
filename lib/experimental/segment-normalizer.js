import {MarkoutBlockNormalizer} from './block-normalizer.js';
import {MarkdownSegmenter} from '../markdown/markdown-segmenter.js';
import {MATCHES, MATCH} from './helpers.js';

const {
  // Attempts to overcome **__**
  // 'markout-render-merged-marking': MERGED_MARKING = true,
  // 'markout-segmentation': MARKOUT_SEGMENTATION = true,
} =
  //@ts-ignore
  import.meta;

export class MarkoutSegmentNormalizer extends MarkoutBlockNormalizer {
  /**
   * @param {string} sourceText
   * @param {{ sources?: *, aliases?: { [name: string]: * }, segments?: DocumentFragment }} [state]
   */
  normalizeSegments(sourceText, state = {}) {
    const debugging = import.meta['debug:markout:segment-normalization'];
    try {
      state.sources || (state.sources = []);
      state.aliases || (state.aliases = {});
      state[SEGMENTS] || (state[SEGMENTS] = []);

      // TODO: Implement Markout's Matcher-based segment normalization
      // setTimeout(() => this.debugSegments(sourceText), 5000);
      if (debugging) {
        this.normalizeMarkdownSegments(sourceText, state);
        setTimeout(() => console.log(state));
      }

      return this.normalizeBlocks(sourceText, state);
    } finally {
      //@ts-ignore
      import.meta['debug:markout:segment-normalization'] && console.log('normalizeSegments:', state);
    }
  }

  normalizeMarkdownSegments(sourceText, state) {
    const {
      [SEGMENTS]: segments = (state[SEGMENTS] = []),
      [SEGMENTS]: {[MATCHES]: matches = (state[SEGMENTS][MATCHES] = [])},
    } = state;
    for (const match of MarkdownSegmenter.matchAll(sourceText)) {
      const {
        0: text,
        identity,
        capture: {[MarkdownSegmenter.INSET]: inset},
      } = match;
      const segment = {identity, text, inset, [MATCH]: match};
      if (identity === 'table') {
        this.normalizeMarkdownTableSegment(segment);
        if (segment.identity === 'table') {
          (state[TABLES] || (state[TABLES] = [])).push(segment);
        }
      }
      segments.push(segment);
      matches.push(match);
    }
  }

  normalizeMarkdownTableSegment(segment) {
    const {text, inset} = segment;
    segment.lines = `\n${text}`.split(`\n${inset}`).slice(1);
    segment.rows = [];
    for (const text of segment.lines) {
      const cells = text.replace(/^\s*(?:\|\s*)?|(?:\|\s*)?\s*$/g, '').split(/\s*\|\s*/);
      cells.text = text;
      cells.inset = inset;
      if (segment.rows.length === 1 && !/[^-|: \t]/.test(text)) {
        segment.rows.header = segment.rows[0];
        segment.rows.format = cells;
      } else {
        cells.row = segment.rows.push(cells);
      }
    }
  }

  async debugSegments(sourceText, options) {
    MarkdownSegmenter.debug({...options, sourceText});
    // (await import('/markout/lib/markdown/markdown-segmenter.js')).MarkdownSegmenter.debug({sourceText});
  }
}

export const SEGMENTS = 'segments';
export const TABLES = 'tables';

/// Debugging

import {debugging} from '/markout/lib/helpers.js';

debugging('markout', import.meta, [
  // import.meta.url.includes('/markout/lib/') ||
  typeof location === 'object' && /[?&]debug(?=[&#]|=[^&]*\bmarkout|$)\b/.test(location.search),
  'segment-normalization',
  'block-normalization',
  'paragraph-normalization',
  'anchor-normalization',
  'break-normalization',
]);
