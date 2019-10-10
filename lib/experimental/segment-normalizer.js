import {MarkoutBlockNormalizer} from './block-normalizer.js';
// import * as helpers from '/markout/lib/helpers.js';
// import {MarkoutSegments} from './markout-segmenter.js';

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
	 * @param {{ sources?: *, aliases?: { [name: string]: * } }} [state]
	 */
	normalizeSegments(sourceText, state = {}) {
		try {
			state.sources || (state.sources = []);
			state.aliases || (state.aliases = {});
			// TODO: Implement Markout's Matcher-based segment normalization
			// setTimeout(() => this.debugSegments(sourceText), 5000);
			return this.normalizeBlocks(sourceText, state);
		} finally {
			//@ts-ignore
			import.meta['debug:markout:segment-normalization'] && console.log('normalizeSegments:', state);
		}
	}

	async debugSegments(sourceText) {
		(await import('/markout/lib/experimental/markout-segmenter.js')).MarkoutSegments.debug({sourceText});
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
