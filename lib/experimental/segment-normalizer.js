import {MarkoutBlockNormalizer} from './block-normalizer.js';
// import {normalizeString, matchAll} from '/markout/lib/helpers.js';
// import {MarkoutSegments} from './markout-segmenter.js';

const {
	// Attempts to overcome **__**
	// 'markout-render-merged-marking': MERGED_MARKING = true,
	// 'markout-segmentation': MARKOUT_SEGMENTATION = true,
} = import.meta;

export class MarkoutSegmentNormalizer extends MarkoutBlockNormalizer {
	/**
	 * @param {string} sourceText
	 * @param {{ aliases?: { [name: string]: alias } }} [state]
	 */
	normalizeSegments(sourceText, state = {}) {
		const {sources = (state.sources = []), aliases = (state.aliases = {})} = state;
		try {
			// TODO: Implement Markout's Matcher-based segment normalization
			// for (const segment of matchAll(sourceText, MarkoutSegments)) {}
			// state.segments = [...matchAll(sourceText, MarkoutSegments)];

			return this.normalizeBlocks(sourceText, state);
		} finally {
			import.meta['debug:markout:segment-normalization'] && console.log('normalizeSegments:', state);
		}
	}
}

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
