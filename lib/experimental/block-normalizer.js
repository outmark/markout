import {encodeEntities} from '../markup.js';
import {ComposableList} from './composable-list.js';
import {matchers} from './expressions.js';

const {
	/** Attempts to overcome **__** */
	'markout-render-merged-marking': MERGED_MARKING = false,
	'markout-render-comment-stashing': COMMENT_STASHING = false,
	'markout-render-paragraph-trimming': PARAGRAPH_TRIMMING = true,
} = import.meta;

const MATCHES = Symbol('matches');
const ALIASES = 'aliases';
const BLOCKS = 'blocks';

const {
	NormalizableBlocks,
	NormalizableParagraphs,
	RewritableParagraphs,
	NormalizableLists,
	NormalizableListItem,
	NormalizableReferences,
	RewritableAliases,
	NormalizableLink,
} = matchers;

const decomment = body => {
	const comments = [];
	body = body.replace(/<!--[^]+-->/g, comment => `<!--${comments.push(comment)}!-->`);
	return {body, comments};
};

const recomment = (body, comments) => {
	return body.replace(
		new RegExp(`<!--(${comments.map((comment, i) => comments.length - i).join('|')})!-->`, 'g'),
		(comment, index) => comments[index] || '<!---->',
	);
};

const isNotBlank = text => typeof text === 'string' && !(text === '' || text.trim() === '');

export class MarkoutBlockNormalizer {
	/**
	 * @param {string} sourceText
	 * @param {{ aliases?: { [name: string]: alias } }} [state]
	 */
	normalizeBlocks(sourceText, state = {}) {
		const {sources = (state.sources = []), [ALIASES]: aliases = (state[ALIASES] = {})} = state;

		const source = {sourceText, [BLOCKS]: [], [ALIASES]: {}};
		sources.push(source);

		// ({body: sourceText, comments: state.comments} = decomment(sourceText));

		Blocks: {
			const body = [];
			const {
				sourceText,
				[BLOCKS]: sourceBlocks,
				[BLOCKS]: {
					[MATCHES]: matchedBlocks = (sourceBlocks[MATCHES] = []),
					[MATCHES]: {
						fenced: fenced = (matchedBlocks.fenced = []),
						embedded: embedded = (matchedBlocks.embedded = []),
						unfenced: unfenced = (matchedBlocks.unfenced = []),
					},
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
				matchedBlocks.push(([match.text, match.fence, match.inset, match.unfenced] = match));
				if (match.fence) {
					fenced.push(match);
				} else if (match.inset !== undefined) {
					embedded.push(match);
				} else {
					unfenced.push(match);
					match.text = match.text.replace(RewritableAliases, replaceAlias);
				}
			}

			// console.log(matchedBlocks);
		}

		Normalization: {
			const {[BLOCKS]: sourceBlocks} = source;
			for (const {text, fence, inset, unfenced} of sourceBlocks[MATCHES]) {
				sourceBlocks.push(
					fence || inset !== undefined
						? text
						: this.normalizeParagraphs(
								this.normalizeBreaks(this.normalizeLists(this.normalizeReferences(text, state))),
						  ),
				);
			}
			source.normalizedText = sourceBlocks.join('\n');
			import.meta['debug:markout:block-normalization'] && console.log('normalizeSourceText:', state);
		}

		// source.normalizedText = recomment(source.normalizedText, state.comments);

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
				let href, title, tag;
				// debugging && console.log(m, {text, link, alias, reference, index});
				if (link) {
					[, href, title] = NormalizableLink.exec(link);
				} else if (alias && alias in aliases) {
					({href, title} = aliases[alias]);
				}

				if (m[0] === '!') {
					return ` <img${href ? ` src="${encodeURI(href)}"` : ''}${
						text || title ? ` title="${text || title}"` : ''
					} />`;
				} else {
					text = text || encodeEntities(href);
					return ` <a${href ? ` href="${href}"` : ''}${title ? ` title="${title}"` : ''}>${text || reference}</a>`;
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
			let top = new ComposableList();
			let list = top;
			const lists = [top];
			NormalizableListItem.lastIndex = 0;
			while ((match = NormalizableListItem.exec(m))) {
				let [text, matchedInset, matchedMarker, matchedLine] = match;
				let like;
				if (!matchedLine.trim()) continue;

				// console.log(text, {matchedInset, matchedMarker, matchedLine});

				if (matchedMarker) {
					let depth = matchedInset.length;
					if (depth > list.listDepth) {
						const parent = list;
						list.push((list = new ComposableList()));
						list.parent = parent;
					} else if (depth < list.listDepth) {
						while ((list = list.parent) && depth < list.listDepth);
					} else if ('listStyle' in list && !(like = ComposableList.markerIsLike(matchedMarker, list.listStyle))) {
						const parent = list.parent;
						((list = new ComposableList()).parent = parent) ? parent.push(list) : lists.push((top = list));
					}

					// console.log(text, [matchedMarker, list.listStyle, like]);

					if (!list) break;

					'listInset' in list ||
						((list.listInset = matchedInset),
						(list.listDepth = depth),
						(list.listType =
							matchedMarker[0] === '*' || matchedMarker[0] === '-'
								? 'ul'
								: ((list.listStart = matchedMarker.replace(/\W/g, '')), 'ol')));

					'listStyle' in list ||
						(list.listStyle =
							(list.listType === 'ul' && ((matchedMarker[0] === '*' && 'disc') || 'square')) ||
							ComposableList.orderedStyleOf(matchedMarker));

					matchedLine = matchedLine.replace(/[ \t]*\n[> \t]*/g, ' ');
					list.push(matchedMarker[2] === '[' ? `${matchedMarker.slice(2)}${matchedLine}` : matchedLine);
				} else {
					if (list.length) {
						const index = list.length - 1;
						list[index] += `<p>${matchedLine}</p>`;
					} else {
						list.push(new String(m));
					}
				}
			}

			return lists.map(list => list.toString(indent)).join('\n');
		});
	}

	/**
	 * @param {string} sourceText
	 */
	normalizeParagraphs(sourceText) {
		sourceText = sourceText.replace(NormalizableParagraphs, (m, feed, inset, body) => {
			let paragraphs, comments;

			COMMENT_STASHING && ({body, comments} = decomment(body));

			paragraphs = body
				.trim()
				.split(/^(?:[> \t]*\n)+[> \t]*/m)
				.filter(isNotBlank);

			import.meta['debug:markout:paragraph-normalization'] &&
				console.log('normalizeParagraphs:', {m, feed, inset, body, paragraphs});

			body = `${feed}<p>${paragraphs.join(`</p>\n${inset}<p>`)}</p>\n`;

			COMMENT_STASHING && (body = recomment(body, comments));

			return body;
		});

		PARAGRAPH_TRIMMING && (sourceText = sourceText.replace(/<p>[\s\n]*<\/p>/g, ''));

		return sourceText;
	}

	normalizeBreaks(sourceText) {
		return sourceText.replace(RewritableParagraphs, (m, a, b, c, index, sourceText) => {
			import.meta['debug:markout:break-normalization'] &&
				console.log('normalizeBreaks:\n\t%o%o\u23CE%o [%o]', a, b, c, index);
			return `${a}${b}${MERGED_MARKING ? '<tt class="normalized-break"> \u{035C}</tt>' : ' '}`;
		});
	}
}
