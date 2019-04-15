import {encodeEntities} from '../markup.js';
import {ComposableList} from './composable-list.js';

const {
	/** Attempts to overcome **__** */

	'markout-render-merged-marking': MERGED_MARKING = true,
} = import.meta;

const MATCHES = Symbol('matches');
const ALIASES = 'aliases';
const BLOCKS = 'blocks';

const NormalizableBlocks = /(?:^|\n)([> \t]*(?:\`\`\`|\~\~\~))[^]+?(?:(?:\n\1[ \t]*)+\n?|$)|([^]+?(?:(?=\n[> \t]*(?:\`\`\`|\~\~\~))|$))/g;
const NormalizableParagraphs = /^((?:[ \t]*\n([> \t]*))+)((?:(?!(?:\d+\. |[a-z]\. |[ivx]+\. |[-*] ))[^\-#>|~\n].*(?:\n[> \t]*$)+|$)+)/gm;
const RewritableParagraphs = /^([ \t]*[^\-\*#>\n].*?)(\b.*[^:\n\s>]+|\b)[ \t]*\n[ \t>]*(?=(\b|\[.*?\][^:\n]?|[^#`\[\n]))/gm;
const NormalizableLists = /(?=(\n[> \t]*)(?:[-*] |[1-9]+\d*\. |[a-z]\. |[ivx]+\. ))((?:\1(?:[-*] |[1-9]+\d*\. |[a-z]\. |[ivx]+\. |   ?)+[^\n]+(?:\n[> \t]*)*(?=\1|$))+)/g;
const NormalizableListItem = /^([> \t]*)([-*] |[1-9]+\d*\. |[a-z]\. |[ivx]+\. |)([^\n]+(?:\n\1(?:   ?|\t ?)(?![ \t]|[-*] |\d+\. |[a-z]\. |[ivx]+\. ).*)*)$/gm;
const NormalizableReferences = /\!?\[(\S.+?\S)\](?:\((\S[^\n()\[\]]*?\S)\)|\[(\S[^\n()\[\]]*\S)\])/g;
const RewritableAliases = /^([> \t]*)\[(\S.+?\S)\]:\s+(\S+)(?:\s+"([^\n]*)"|\s+'([^\n]*)'|)(?=\s*$)/gm;
const NormalizableLink = /\s*((?:\s?[^'"\(\)\]\[\s\n]+)*)(?:\s+["']([^\n]*)["']|)/;

export class MarkoutBlockNormalizer {
	/**
	 * @param {string} sourceText
	 * @param {{ aliases?: { [name: string]: alias } }} [state]
	 */
	normalizeBlocks(sourceText, state = {}) {
		const {sources = (state.sources = []), [ALIASES]: aliases = (state[ALIASES] = {})} = state;

		const source = {sourceText, [BLOCKS]: [], [ALIASES]: {}};
		sources.push(source);

		Blocks: {
			const body = [];
			const {
				sourceText,
				[BLOCKS]: sourceBlocks,
				[BLOCKS]: {
					[MATCHES]: matchedBlocks = (sourceBlocks[MATCHES] = []),
					[MATCHES]: {fenced: fenced = (matchedBlocks.fenced = []), unfenced: unfenced = (matchedBlocks.unfenced = [])},
				},
				[ALIASES]: sourceAliases,
				[ALIASES]: {
					[MATCHES]: matchedAliases = (sourceAliases[MATCHES] = []),
					[MATCHES]: {aliased = (matchedAliases.aliased = []), unaliased = (matchedAliases.unaliased = [])},
				},
			} = source;
			let match = (NormalizableBlocks.lastIndex = null);

			const replaceAlias = (text, indent, alias, href, title, index) => {
				const match = {text, indent, alias, href, title, index};

				// TODO: Figure out anchors: https://www.w3.org/TR/2017/REC-html52-20171214/links.html
				return alias && alias.trim()
					? (aliased.push((sourceAliases[alias] = aliases[alias] = match)),
					  `<a hidden rel="alias" name="${alias}" href="${href}">${title || ''}</a>`)
					: (unaliased.push(match), text);
			};

			while ((match = NormalizableBlocks.exec(sourceText))) {
				matchedBlocks.push(([match.text, match.fence, match.unfenced] = match));
				if (match.fence) {
					fenced.push(match);
				} else {
					unfenced.push(match);
					match.text = match.text.replace(RewritableAliases, replaceAlias);
				}
			}
		}

		Normalization: {
			const {[BLOCKS]: sourceBlocks} = source;
			for (const {text, fence, unfenced} of sourceBlocks[MATCHES]) {
				sourceBlocks.push(
					fence
						? text
						: this.normalizeParagraphs(
								this.normalizeBreaks(this.normalizeLists(this.normalizeReferences(text, state))),
						  ),
				);
			}
			source.normalizedText = sourceBlocks.join('\n');
			import.meta['debug:markout:block-normalization'] && console.log('normalizeSourceText:', state);
		}

		return source.normalizedText;
	}

	/**
	 * @param {string} sourceText
	 * @param {{ aliases?: { [name: string]: alias } }} [state]
	 */
	normalizeReferences(sourceText, state = {}) {
		const debugging = import.meta['debug:markout:anchor-normalization'];
		const {aliases = (state.aliases = {})} = state;

		return sourceText.replace(NormalizableReferences, (m, text, link, alias, index) => {
			const reference = (alias && (alias = alias.trim())) || (link && (link = link.trim()));

			if (reference) {
				let href, title;
				// debugging && console.log(m, {text, link, alias, reference, index});
				if (link) {
					[, href = '#', title] = NormalizableLink.exec(link);
				} else if (alias && alias in aliases) {
					({href = '#', title} = aliases[alias]);
				}
				debugging && console.log(m, {href, title, text, link, alias, reference, index});
				if (m[0] === '!') {
					return ` <img src="${href}"${text || title ? ` title="${text || title}"` : ''} /> `;
				} else {
					text = text || encodeEntities(href);
					return ` <a href="${href}"${title ? ` title="${title}"` : ''}>${text || reference}</a>`;
				}
			}
			return m;
		});
	}

	normalizeBlockquotes(sourceText) {
		// TODO: Normalize block quotes
		return sourceText;
	}

	/**
	 * @param {string} sourceText
	 */
	normalizeLists(sourceText) {
		return sourceText.replace(NormalizableLists, (m, feed, body) => {
			let match, indent;
			indent = feed.slice(1);
			const top = new ComposableList();
			let list = top;
			NormalizableListItem.lastIndex = 0;
			while ((match = NormalizableListItem.exec(m))) {
				let [, inset, marker, line] = match;
				if (!line.trim()) continue;

				if (marker) {
					let depth = inset.length;
					if (depth > list.depth) {
						const parent = list;
						list.push((list = new ComposableList()));
						list.parent = parent;
					} else if (depth < list.depth) {
						while ((list = list.parent) && depth < list.depth);
					}

					if (!list) break;

					'inset' in list ||
						((list.inset = inset),
						(list.depth = depth),
						(list.type = marker === '* ' || marker === '- ' ? 'ul' : 'ol') === 'ol' &&
							(list.start = marker.replace(/\W/g, '')));

					'style' in list ||
						(list.style =
							(list.type === 'ul' && ((marker[0] === '*' && 'disc') || 'square')) ||
							(marker[0] === '0' && 'decimal-leading-zero') ||
							(marker[0] > 0 && 'decimal') ||
							`${marker === marker.toLowerCase() ? 'lower' : 'upper'}-${
								/^[ivx]+\. $/i.test(marker) ? 'roman' : 'latin'
							}`);

					line = line.replace(/[ \t]*\n[> \t]*/g, ' ');
					list.push(line);
				} else {
					if (list.length) {
						const index = list.length - 1;
						list[index] += `<p>${line}</p>`;
					} else {
						list.push(new String(m));
					}
				}
			}

			return top.toString(indent);
		});
	}

	/**
	 * @param {string} sourceText
	 */
	normalizeParagraphs(sourceText) {
		return (
			sourceText
				// .replace(MalformedParagraphs, (m, a, b, c, index, sourceText) => {
				// 	// console.log('normalizeParagraphs:\n\t%o%o\u23CE%o [%o]', a, b, c, index);
				// 	return `${a}${b}${(MERGED_MARKING && '\u{23CE}') || ''} `;
				// })
				.replace(NormalizableParagraphs, (m, feed, inset, body) => {
					const paragraphs = body
						.trim()
						.split(/^(?:[> \t]*\n)+[> \t]*/m)
						.filter(Boolean);
					import.meta['debug:markout:paragraph-normalization'] &&
						console.log('normalizeParagraphs:', {m, feed, inset, body, paragraphs});

					// return `${feed}<p>${paragraphs.join(`</p>${feed}<p>${feed}`)}</p>`;
					return `${feed}<p>${paragraphs.join(`</p>\n${inset}<p>`)}</p>\n`;
				})
		);
	}

	normalizeBreaks(sourceText) {
		return sourceText.replace(RewritableParagraphs, (m, a, b, c, index, sourceText) => {
			import.meta['debug:markout:break-normalization'] &&
				console.log('normalizeBreaks:\n\t%o%o\u23CE%o [%o]', a, b, c, index);
			return `${a}${b}${MERGED_MARKING ? '<tt class="normalized-break"> \u{035C}</tt>' : ' '}`;
		});
	}
}
