import {MarkoutSegmentNormalizer} from './experimental/segment-normalizer.js';
import {normalizeString} from '/markout/lib/helpers.js';

const {
  // 'markout-render-merged-marking': MERGED_MARKING = true,
} = import.meta;

export class MarkoutNormalizer extends MarkoutSegmentNormalizer {
  normalizeSourceText(sourceText) {
    const {normalized = (this.normalized = new Map())} = this;
    let normalizedText = normalized.get(sourceText);
    normalizedText !== undefined ||
      normalized.set(
        sourceText,
        (normalizedText = normalizeString(this.normalizeSegments(normalizeString(sourceText)))),
      );
    return normalizedText;
  }
}
