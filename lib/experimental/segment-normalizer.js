import {normalizeString, matchAll} from '/markout/lib/helpers.js';
import {MarkoutBlockNormalizer} from './block-normalizer.js';
import {MarkoutSegments} from './markout-segmenter.js';

const {
	// Attempts to overcome **__**
	// 'markout-render-merged-marking': MERGED_MARKING = true,
	'markout-segmentation': MARKOUT_SEGMENTATION = true,
} = import.meta;

const MATCHES = Symbol('matches');
const ALIASES = 'aliases';
const BLOCKS = 'blocks';

export class MarkoutSegmentNormalizer extends MarkoutBlockNormalizer {
	/**
	 * @param {string} sourceText
	 * @param {{ aliases?: { [name: string]: alias } }} [state]
	 */
	normalizeSegments(sourceText, state = {}) {
		const {sources = (state.sources = []), [ALIASES]: aliases = (state[ALIASES] = {})} = state;

		// for (const segment of matchAll(sourceText, MarkoutSegments)) {}

		try {
			state.segments = [...matchAll(sourceText, MarkoutSegments)];

			return this.normalizeBlocks(sourceText, state);
		} finally {
			import.meta['debug:markout:segment-normalization'] && console.log('normalizeSegments:', state);
		}

		// const source = {sourceText, [BLOCKS]: [], [ALIASES]: {}};
		// sources.push(source);

		// MarkoutBlocks.debug(sourceText);

		Blocks: {
			// const body = [];
			// const {
			// 	sourceText,
			// 	[BLOCKS]: sourceBlocks,
			// 	[BLOCKS]: {
			// 		[MATCHES]: matchedBlocks = (sourceBlocks[MATCHES] = []),
			// 		[MATCHES]: {fenced: fenced = (matchedBlocks.fenced = []), unfenced: unfenced = (matchedBlocks.unfenced = [])},
			// 	},
			// 	[ALIASES]: sourceAliases,
			// 	[ALIASES]: {
			// 		[MATCHES]: matchedAliases = (sourceAliases[MATCHES] = []),
			// 		[MATCHES]: {aliased = (matchedAliases.aliased = []), unaliased = (matchedAliases.unaliased = [])},
			// 	},
			// } = source;
			// let match = (NormalizableBlocks.lastIndex = null);
			// const replaceAlias = (text, indent, alias, href, title, index) => {
			// 	const match = {text, indent, alias, href, title, index};
			// 	// TODO: Figure out anchors: https://www.w3.org/TR/2017/REC-html52-20171214/links.html
			// 	return alias && alias.trim()
			// 		? (aliased.push((sourceAliases[alias] = aliases[alias] = match)),
			// 		  `<a hidden rel="alias" name="${alias}" href="${href}">${title || ''}</a>`)
			// 		: (unaliased.push(match), text);
			// };
			// while ((match = NormalizableBlocks.exec(sourceText))) {
			// 	matchedBlocks.push(([match.text, match.fence, match.unfenced] = match));
			// 	if (match.fence) {
			// 		fenced.push(match);
			// 	} else {
			// 		unfenced.push(match);
			// 		match.text = match.text.replace(RewritableAliases, replaceAlias);
			// 	}
			// }
		}

		Normalization: {
			// const {[BLOCKS]: sourceBlocks} = source;
			// for (const {text, fence, unfenced} of sourceBlocks[MATCHES]) {
			// 	sourceBlocks.push(
			// 		fence
			// 			? text
			// 			: this.normalizeParagraphs(
			// 					this.normalizeBreaks(this.normalizeLists(this.normalizeReferences(text, state))),
			// 			  ),
			// 	);
			// }
			// source.normalizedText = sourceBlocks.join('\n');
			import.meta['debug:markout:block-normalization'] && console.log('normalizeSourceText:', state);
		}

		// return source.normalizedText;
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
