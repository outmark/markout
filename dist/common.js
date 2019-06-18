import { sequence as sequence$1, debugging, normalizeString } from '/markout/lib/helpers.js';
import { encodeEntities, entities as entities$1, render as render$1, tokenize as tokenize$1, encodeEntity } from '/markup/dist/tokenizer.browser.js';

// export const MarkupSourceTypeAttribute = 'source-type';
// export const MarkupModeAttribute = 'markup-mode';
// export const MarkupOptionsAttribute = 'markup-options';
// export const MarkupSyntaxAttribute = 'markup-syntax';

class ComposableList extends Array {
	toString(
		listInset = this.listInset || '',
		listType = this.listType || 'ul',
		listStyle = this.listStyle,
		listStart = this.listStart,
	) {
		listStart &&
			typeof listStart !== 'number' &&
			(listStart = `${
				listStyle === 'lower-latin' || listStyle === 'upper-latin'
					? ComposableList.parseLatin(listStart)
					: listStyle === 'lower-roman' || listStyle === 'upper-roman'
					? ComposableList.parseRoman(listStart)
					: parseInt(listStart) || ''
			}`);

		const attributes = `${
			// TODO: Explore using type attribute instead
			(listStyle && `style="list-style: ${listStyle}"`) || ''
		} ${
			// TODO: Check if guard against invalid start is needed
			(listStart && `start="${listStart}"`) || ''
		}`.trim();

		const listRows = [`${listInset}<${listType}${(attributes && ` ${attributes}`) || ''}>`];
		for (const item of this) {
			if (item && typeof item === 'object') {
				if (item instanceof ComposableList) {
					const last = listRows.length - 1;
					const row = listRows[last];
					last > 0
						? (listRows[listRows.length - 1] = `${row.slice(0, -5)}\n${item.toString(
								`${listInset}\t\t`,
						  )}\n${listInset}\t</li>`)
						: listRows.push(`${listInset}\t<li>\n${item.toString(`${listInset}\t\t`)}\n${listInset}\t</li>`);
				} else {
					const insetText = `${item}`;
					let text = insetText;
					for (const character of listInset) {
						if (!text.startsWith(character)) break;
						text = text.slice(1);
					}
					listRows.push(text);
				}
			} else {
				const [, checked, content] = /^\s*(?:\[([-xX]| )\] |)(.+?)\s*$/.exec(item);

				content &&
					listRows.push(
						checked
							? `${listInset}\t<li type=checkbox ${
									checked === ' ' ? '' : checked === '-' ? 'indeterminate' : ' checked'
							  }>${content}</li>`
							: `${listInset}\t<li>${content}</li>`,
					);
			}
		}
		listRows.push(`${listInset}</${listType}>`);
		return `\n${listRows.join('\n')}\n`;
	}
}

ComposableList.CHECKBOX = /^[-] \[[ xX]\](?=\s|$)/;
ComposableList.SQUARE = /^[-](?! \[[ xX]\])(?=\s|$)/;
ComposableList.DISC = /^[*](?=\s|$)/;
ComposableList.DECIMAL = /^0*\d+\./;

LATIN: {
	const parseLatin = latin => parseLatin.mappings[latin] || NaN;

	parseLatin.mappings = {};

	'abcdefghijklmnopqrstuvwxyz'.split('').forEach((latin, index) => {
		parseLatin.mappings[(parseLatin.mappings[latin] = parseLatin.mappings[latin.toUpperCase] = index + 1)] = latin;
	});

	ComposableList.parseLatin = parseLatin;
	ComposableList.LATIN = /^[a-z]+\./i;
}

ROMAN: {
	const parseRoman = roman =>
		/[^ivxlcdm]/i.test((roman = String(roman)))
			? NaN
			: roman
					.toLowerCase()
					.split('')
					.reduce(parseRoman.reducer, 0);
	// prettier-ignore
	parseRoman.mappings = Object.freeze({i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000, 1: 'i', 5: 'v', 10: 'x', 50: 'l', 100: 'c', 500: 'd', 1000: 'm'});

	parseRoman.reducer = (decimal, character, index, characters) =>
		decimal +
		(parseRoman.mappings[character] < parseRoman.mappings[characters[index + 1]]
			? -parseRoman.mappings[character]
			: parseRoman.mappings[character]);

	ComposableList.parseRoman = parseRoman;
	ComposableList.ROMAN = /^[ivxlcdm]+\./i;
}

ComposableList.UNORDERED = /^[-*](?= |$)/i;
ComposableList.ORDERED = /^(?:0+[1-9]\d*|\d+|[ivx]+|[a-z])(?=\. |$)|^[a-z](?=\) |$)/i;
ComposableList.ORDERED_STYLE = /^(?:(0+[1-9]\d*)(?=\. )|(\d+)(?=\. )|([ivx]+)(?=\. )|([a-z])(?=[.)] ))|/i;
ComposableList.ORDERED_STYLE.key = ['decimal-leading-zero', 'decimal', 'roman', 'latin'];

ComposableList.orderedStyleOf = (marker, variant, fallback) => {
	const category =
		ComposableList.ORDERED_STYLE.key[
			ComposableList.ORDERED_STYLE.exec(marker)
				.slice(1)
				.findIndex(Boolean)
		];
	return (
		(category !== undefined &&
			(category === 'latin' || category === 'roman'
				? `${
						variant === 'lower' || (variant !== 'upper' && marker === marker.toLowerCase()) ? 'lower' : 'upper'
				  }-${category}`
				: category === 'decimal'
				? variant !== 'leading-zero'
					? 'decimal'
					: 'decimal-leading-zero'
				: variant !== 'decimal'
				? 'decimal-leading-zero'
				: 'decimal')) ||
		fallback
	);
};

ComposableList.markerIsLike = (marker, expected) =>
	expected in ComposableList.LIKE ? ComposableList.LIKE[expected].test(marker) : undefined;

ComposableList.LIKE = {
	['checkbox']: ComposableList.CHECKBOX,
	['square']: ComposableList.SQUARE,
	['disc']: ComposableList.DISC,
	['decimal']: ComposableList.DECIMAL,
	['decimal-leading-zero']: ComposableList.DECIMAL,
	['roman']: ComposableList.ROMAN,
	['lower-roman']: ComposableList.ROMAN,
	['upper-roman']: ComposableList.ROMAN,
	['latin']: ComposableList.LATIN,
	['lower-latin']: ComposableList.LATIN,
	['upper-latin']: ComposableList.LATIN,
	['ul']: ComposableList.UNORDERED,
	['ol']: ComposableList.ORDERED,
};

//@ts-check
/// <reference path="./types.d.ts" />

// const trace = /** @type {[function, any[]][]} */ [];

class Matcher extends RegExp {
	/**
	 * @template T
	 * @param {Matcher.Pattern} pattern
	 * @param {Matcher.Flags} [flags]
	 * @param {Matcher.Entities} [entities]
	 * @param {T} [state]
	 */
	constructor(pattern, flags, entities, state) {
		// trace.push([new.target, [...arguments]]);
		//@ts-ignore
		super(pattern, flags);
		// Object.assign(this, RegExp.prototype, new.target.prototype);
		(pattern &&
			pattern.entities &&
			Symbol.iterator in pattern.entities &&
			((!entities && (entities = pattern.entities)) || entities === pattern.entities)) ||
			Object.freeze((entities = (entities && Symbol.iterator in entities && [...entities]) || []));
		/** @type {MatcherEntities} */
		this.entities = entities;
		/** @type {T} */
		this.state = state;
		this.capture = this.capture;
		this.exec = this.exec;
		// this.test = this.test;
		({
			// LOOKAHEAD: this.LOOKAHEAD = Matcher.LOOKAHEAD,
			// INSET: this.INSET = Matcher.INSET,
			// OUTSET: this.OUTSET = Matcher.OUTSET,
			DELIMITER: this.DELIMITER = Matcher.DELIMITER,
			UNKNOWN: this.UNKNOWN = Matcher.UNKNOWN,
		} = new.target);
	}

	/**
	 * @template {MatcherMatchResult} T
	 * @param {string} text
	 * @param {number} capture
	 * @param {T} match
	 * @returns {T}
	 */
	capture(text, capture, match) {
		if (capture === 0) return void (match.capture = {});
		if (text === undefined) return;
		const index = capture - 1;
		const {
			entities: {[index]: entity},
			state,
		} = this;
		typeof entity === 'function'
			? ((match.entity = index), entity(text, capture, match, state))
			: entity == null || //entity === INSET ||
			  // entity === OUTSET ||
			  // entity === DELIMITER ||
			  // entity === LOOKAHEAD ||
			  // entity === UNKNOWN ||
			  (match.entity !== undefined || ((match.identity = entity), (match.entity = index)),
			  (match.capture[entity] = text));
	}

	/**
	 * @param {string} source
	 * @returns {MatcherMatchResult}
	 */
	exec(source) {
		// const tracing = trace.length;
		// trace.push([this.exec, [...arguments]]);
		/** @type {MatcherMatchArray} */
		const match = super.exec(source);
		// console.log(trace.slice(tracing, trace.length));
		match &&
			(match.forEach(this.capture || Matcher.prototype.capture, (match.matcher = this)),
			match.identity || (match.capture[this.UNKNOWN || Matcher.UNKNOWN] = match[0]));

		// @ts-ignore
		return match;
	}

	/**
	 * @param {Matcher.PatternFactory} factory
	 * @param {Matcher.Flags} [flags]
	 * @param {PropertyDescriptorMap} [properties]
	 */
	static define(factory, flags, properties) {
		/** @type {MatcherEntities} */
		const entities = [];
		entities.flags = '';
		// const pattern = factory(entity => void entities.push(((entity != null || undefined) && entity) || undefined));
		const pattern = factory(entity => {
			if (entity !== null && entity instanceof Matcher) {
				entities.push(...entity.entities);

				!entity.flags || (entities.flags = entities.flags ? Matcher.flags(entities.flags, entity.flags) : entity.flags);

				return entity.source;
			} else {
				entities.push(((entity != null || undefined) && entity) || undefined);
			}
		});
		flags = Matcher.flags('g', flags == null ? pattern.flags : flags, entities.flags);
		const matcher = new ((this && (this.prototype === Matcher.prototype || this.prototype instanceof RegExp) && this) ||
			Matcher)(pattern, flags, entities);

		properties && Object.defineProperties(matcher, properties);

		return matcher;
	}

	static flags(...sources) {
		let flags = '',
			iterative;
		for (const source of sources) {
			if (!source || (typeof source !== 'string' && typeof source.flags !== 'string')) continue;
			for (const flag of source.flags || source)
				(flag === 'g' || flag === 'y' ? iterative || !(iterative = true) : flags.includes(flag)) || (flags += flag);
		}
		// console.log('%o: ', flags, ...sources);
		return flags;
	}

	static get sequence() {
		const {raw} = String;
		const {replace} = Symbol;
		/**
		 * @param {TemplateStringsArray} template
		 * @param  {...any} spans
		 * @returns {string}
		 */
		const sequence = (template, ...spans) =>
			sequence.WHITESPACE[replace](raw(template, ...spans.map(sequence.span)), '');
		/**
		 * @param {any} value
		 * @returns {string}
		 */
		sequence.span = value =>
			(value &&
				// TODO: Don't coerce to string here?
				(typeof value !== 'symbol' && `${value}`)) ||
			'';

		sequence.WHITESPACE = /^\s+|\s*\n\s*|\s+$/g;

		Object.defineProperty(Matcher, 'sequence', {value: Object.freeze(sequence), enumerable: true, writable: false});
		return sequence;
	}

	static get join() {
		const {sequence} = this;

		const join = (...values) =>
			values
				.map(sequence.span)
				.filter(Boolean)
				.join('|');

		Object.defineProperty(Matcher, 'join', {value: Object.freeze(join), enumerable: true, writable: false});

		return join;
	}
}

const {
	// INSET = (Matcher.INSET = /* Symbol.for */ 'INSET'),
	// OUTSET = (Matcher.OUTSET = /* Symbol.for */ 'OUTSET'),
	DELIMITER = (Matcher.DELIMITER = /* Symbol.for */ 'DELIMITER'),
	UNKNOWN = (Matcher.UNKNOWN = /* Symbol.for */ 'UNKNOWN'),
	// LOOKAHEAD = (Matcher.LOOKAHEAD = /* Symbol.for */ 'LOOKAHEAD'),
	escape = (Matcher.escape = /** @type {<T>(source: T) => string} */ ((() => {
		const {replace} = Symbol;
		return source => /[\\^$*+?.()|[\]{}]/g[replace](source, '\\$&');
	})())),
	sequence,
	matchAll = (Matcher.matchAll =
		/**
		 * @template {RegExp} T
		 * @type {(string: Matcher.Text, matcher: T) => Matcher.Iterator<T> }
		 */
		//@ts-ignore
		(() =>
			Function.call.bind(
				// String.prototype.matchAll || // TODO: Uncomment eventually
				{
					/**
					 * @this {string}
					 * @param {RegExp | string} pattern
					 */
					*matchAll() {
						const matcher =
							arguments[0] &&
							(arguments[0] instanceof RegExp
								? Object.setPrototypeOf(RegExp(arguments[0].source, arguments[0].flags || 'g'), arguments[0])
								: RegExp(arguments[0], 'g'));
						const string = String(this);

						if (!(matcher.flags.includes('g') || matcher.flags.includes('y'))) return void (yield matcher.exec(string));

						for (
							let match, lastIndex = -1;
							lastIndex <
							((match = matcher.exec(string)) ? (lastIndex = matcher.lastIndex + (match[0].length === 0)) : lastIndex);
							yield match, matcher.lastIndex = lastIndex
						);
					},
				}.matchAll,
			))()),
} = Matcher;

const sequences = {};
const matchers = {};

{
	const {sequence, escape, join} = Matcher;

	const FENCE = sequence`${'`'.repeat(3)}|${escape('~').repeat(3)}`;
	const INSET = sequence`[> \t]*`;
	// const LIST = sequence`- ${escape('[')}[ xX]${escape(']')}(?: |$)|[-*] |[1-9]+\d*\. |[a-z]\. |[ivx]+\. `;
	// const LIST = sequence`[-*] (?=${escape('[')}[ xX]${escape(']')} |)|[1-9]+\d*\. |[a-z]\. |[ivx]+\. `;
	const LIST = sequence`[-*](?: |$)|[1-9]+\d*\.(?: |$)|[a-z][.)](?: |$)|[ivx]+\.(?: |$)`;

	sequences.NormalizableBlocks = sequence/* fsharp */ `
    (?:^|\n)(${INSET}(?:${FENCE}))[^]+?(?:(?:\n\1[ \t]*)+\n?|$)
    |([^]+?(?:(?=\n${INSET}(?:${FENCE}))|$))
  `;
	matchers.NormalizableBlocks = new RegExp(sequences.NormalizableBlocks, 'g');

	sequences.NormalizableParagraphs = sequence/* fsharp */ `
    ^
    ((?:[ \t]*\n(${INSET}))+)
    ($|(?:
      (?!(?:${LIST}))
      [^\-#>|~\n].*
      (?:\n${INSET}$)+
    )+)
  `;
	matchers.NormalizableParagraphs = new RegExp(sequences.NormalizableParagraphs, 'gm');

	sequences.RewritableParagraphs = sequence/* fsharp */ `
    ^
    ([ \t]*[^\-\*#>\n].*?)
    (\b.*[^:\n\s>]+|\b)
    [ \t]*\n[ \t>]*
    (?=(
      \b
      |${escape('[')}.*?${escape(']')}[^:\n]?
      |[^#${'`'}${escape('[')}\n]
    ))
  `;

	matchers.RewritableParagraphs = new RegExp(sequences.RewritableParagraphs, 'gm');

	sequences.NormalizableLists = sequence/* fsharp */ `
    (?=(\n${INSET})(?:${LIST}))
    ((?:\1
      (?:${LIST}|   ?)+
      [^\n]+
      (?:\n${INSET})*
      (?=\1|$)
    )+)
  `;
	matchers.NormalizableLists = new RegExp(sequences.NormalizableLists, 'g');

	sequences.NormalizableListItem = sequence/* fsharp */ `
    ^
    (${INSET})
    (${LIST}|)
    ([^\n]+(?:\n\1(?:   ?|\t ?)(?![ \t]|${LIST}).*)*)$
  `;
	matchers.NormalizableListItem = new RegExp(sequences.NormalizableListItem, 'gm');

	sequences.NormalizableReferences = sequence/* fsharp */ `
    \!?
    ${escape('[')}(\S.*?\S)${escape(']')}
    (?:
      ${escape('(')}(\S[^\n${escape('()[]')}]*?\S)${escape(')')}
      |${escape('[')}(\S[^\n${escape('()[]')}]*\S)${escape(']')}
    )
  `;
	matchers.NormalizableReferences = new RegExp(sequences.NormalizableReferences, 'gm');

	sequences.RewritableAliases = sequence/* fsharp */ `
    ^
    (${INSET})
    ${escape('[')}(\S.*?\S)${escape(']')}:\s+
    (\S+)(?:
      \s+${'"'}([^\n]*)${'"'}
      |\s+${"'"}([^\n]*)${"'"}
      |
    )(?=\s*$)
  `;
	matchers.RewritableAliases = new RegExp(sequences.RewritableAliases, 'gm');

	sequences.NormalizableLink = sequence/* fsharp */ `
    \s*(
      (?:\s?[^${`'"`}${escape('()[]')}}\s\n]+)*
    )
    (?:\s+[${`'"`}]([^\n]*)[${`'"`}]|)
  `;
	matchers.NormalizableLink = new RegExp(sequences.NormalizableLink);
}

const {
	/** Attempts to overcome **__** */

	'markout-render-merged-marking': MERGED_MARKING = true,
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

class MarkoutBlockNormalizer {
	/**
	 * @param {string} sourceText
	 * @param {{ aliases?: { [name: string]: alias } }} [state]
	 */
	normalizeBlocks(sourceText, state = {}) {
		const {sources = (state.sources = []), [ALIASES]: aliases = (state[ALIASES] = {})} = state;

		const source = {sourceText, [BLOCKS]: [], [ALIASES]: {}};
		sources.push(source);

		Blocks: {
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
				// debugging && console.log(m, {href, title, text, link, alias, reference, index});
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
					} else if (
						'listStyle' in list &&
						!(like = ComposableList.markerIsLike(matchedMarker, list.listStyle))
						// ((like = ComposableList.markerIsLike(marker, list.listStyle)) === undefined
						// 	? (like = ComposableList.markerIsLike(marker, list.listType))
						// 	: like)
					) {
						const parent = list.parent;
						((list = new ComposableList()).parent = parent) ? parent.push(list) : lists.push((top = list));
					}

					// console.log(text, [matchedMarker, list.listStyle, like]);

					if (!list) break;

					'listInset' in list ||
						((list.listInset = matchedInset),
						(list.listDepth = depth),
						(list.listType =
							matchedMarker[0] === '* ' || matchedMarker[0] === '-'
								? 'ul'
								: ((list.listStart = matchedMarker.replace(/\W/g, '')), 'ol')));

					'listStyle' in list ||
						(list.listStyle =
							(list.listType === 'ul' && ((matchedMarker[0] === '* ' && 'disc') || 'square')) ||
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

// 'listStyle' in list ||
// 	(list.listStyle =
// 		(list.listType === 'ul' && ((marker[0] === '*' && 'disc') || 'square')) ||
// 		(marker[0] === '0' && 'decimal-leading-zero') ||
// 		(marker[0] > 0 && 'decimal') ||
// 		`${marker === marker.toLowerCase() ? 'lower' : 'upper'}-${
// 			/^[ivx]+\. $/i.test(marker) ? 'roman' : 'latin'
// 		}`);

// const {
// 	NormalizableBlocks = /(?:^|\n)([> \t]*(?:\`\`\`|\~\~\~))[^]+?(?:(?:\n\1[ \t]*)+\n?|$)|([^]+?(?:(?=\n[> \t]*(?:\`\`\`|\~\~\~))|$))/g,
// 	NormalizableParagraphs = /^((?:[ \t]*\n([> \t]*))+)((?:(?!(?:\d+\. |[a-z]\. |[ivx]+\. |[-*] ))[^\-#>|~\n].*(?:\n[> \t]*$)+|$)+)/gm,
// 	RewritableParagraphs = /^([ \t]*[^\-\*#>\n].*?)(\b.*[^:\n\s>]+|\b)[ \t]*\n[ \t>]*(?=(\b|\[.*?\][^:\n]?|[^#`\[\n]))/gm,
// 	NormalizableLists = /(?=(\n[> \t]*)(?:[-*] |[1-9]+\d*\. |[a-z]\. |[ivx]+\. ))((?:\1(?:[-*] |[1-9]+\d*\. |[a-z]\. |[ivx]+\. |   ?)+[^\n]+(?:\n[> \t]*)*(?=\1|$))+)/g,
// 	NormalizableListItem = /^([> \t]*)([-*] |[1-9]+\d*\. |[a-z]\. |[ivx]+\. |)([^\n]+(?:\n\1(?:   ?|\t ?)(?![ \t]|[-*] |\d+\. |[a-z]\. |[ivx]+\. ).*)*)$/gm,
// 	NormalizableReferences = /\!?\[(\S.+?\S)\](?:\((\S[^\n()\[\]]*?\S)\)|\[(\S[^\n()\[\]]*\S)\])/g,
// 	RewritableAliases = /^([> \t]*)\[(\S.+?\S)\]:\s+(\S+)(?:\s+"([^\n]*)"|\s+'([^\n]*)'|)(?=\s*$)/gm,
// 	NormalizableLink = /\s*((?:\s?[^'"\(\)\]\[\s\n]+)*)(?:\s+["']([^\n]*)["']|)/,
// } = matchers;

// const NormalizableBlocks = /(?:^|\n)([> \t]*(?:\`\`\`|\~\~\~))[^]+?(?:(?:\n\1[ \t]*)+\n?|$)|([^]+?(?:(?=\n[> \t]*(?:\`\`\`|\~\~\~))|$))/g;
// const NormalizableParagraphs = /^((?:[ \t]*\n([> \t]*))+)((?:(?!(?:\d+\. |[a-z]\. |[ivx]+\. |[-*] ))[^\-#>|~\n].*(?:\n[> \t]*$)+|$)+)/gm;
// const RewritableParagraphs = /^([ \t]*[^\-\*#>\n].*?)(\b.*[^:\n\s>]+|\b)[ \t]*\n[ \t>]*(?=(\b|\[.*?\][^:\n]?|[^#`\[\n]))/gm;
// const NormalizableLists = /(?=(\n[> \t]*)(?:[-*] |[1-9]+\d*\. |[a-z]\. |[ivx]+\. ))((?:\1(?:[-*] |[1-9]+\d*\. |[a-z]\. |[ivx]+\. |   ?)+[^\n]+(?:\n[> \t]*)*(?=\1|$))+)/g;
// const NormalizableListItem = /^([> \t]*)([-*] |[1-9]+\d*\. |[a-z]\. |[ivx]+\. |)([^\n]+(?:\n\1(?:   ?|\t ?)(?![ \t]|[-*] |\d+\. |[a-z]\. |[ivx]+\. ).*)*)$/gm;
// const NormalizableReferences = /\!?\[(\S.+?\S)\](?:\((\S[^\n()\[\]]*?\S)\)|\[(\S[^\n()\[\]]*\S)\])/g;
// const RewritableAliases = /^([> \t]*)\[(\S.+?\S)\]:\s+(\S+)(?:\s+"([^\n]*)"|\s+'([^\n]*)'|)(?=\s*$)/gm;
// const NormalizableLink = /\s*((?:\s?[^'"\(\)\]\[\s\n]+)*)(?:\s+["']([^\n]*)["']|)/;

class Segmenter extends RegExp {
	/**
	 * @param {string | RegExp} pattern
	 * @param {string} [flags]
	 * @param {(string|undefined)[]} [types]
	 */
	constructor(pattern, flags, types) {
		(pattern &&
			pattern.types &&
			Symbol.iterator in pattern.types &&
			((!types && (types = pattern.types)) || types === pattern.types)) ||
			Object.freeze((types = (types && Symbol.iterator in types && [...types]) || []));
		const {LOOKAHEAD = Segmenter.LOOKAHEAD, INSET = Segmenter.INSET, UNKNOWN = Segmenter.UNKNOWN} = new.target;
		Object.defineProperties(super(pattern, flags), {
			types: {value: types, enumerable: true},
			LOOKAHEAD: {value: LOOKAHEAD},
			INSET: {value: INSET},
			UNKNOWN: {value: UNKNOWN},
			// lookaheads: {value: (typeof LOOKAHEAD === 'symbol' && types.indexOf(LOOKAHEAD) + 1) || false},
			// insets: {value: (typeof insets === 'symbol' && types.indexOf(INSET) + 1) || false},
		});
	}

	/**
	 * @param {RegExpExecArray} match
	 */
	matchType(text, index) {
		return index > 0 && text !== undefined && match.types[index - 1] != null;
	}

	capture(text, index, match) {
		// let typeOf;
		if (index === 0 || text === undefined) return;

		const typeIndex = index - 1;
		const type = this.types[typeIndex];

		if (type === INSET) {
			match.inset = text;
			return;
		} else if (type === LOOKAHEAD) {
			match.lookahead = text;
			return;
		} else if (type !== UNKNOWN$1) {
			switch (typeof type) {
				case 'string':
					if (match.typeIndex > -1) return;
					match.type = type;
					match.typeIndex = typeIndex;
				case 'symbol':
					match[type] = text;
					return;
				case 'function':
					type(text, index, match);
					return;
			}
		}
	}

	/**
	 * @param {RegExpExecArray} match
	 * @returns {typeof match & {slot: number, type: string}}
	 */
	exec(source) {
		const match = super.exec(source);
		match &&
			((match.typeIndex = -1),
			match.forEach(this.capture || Segmenter.prototype.capture, this),
			match.typeIndex > -1 || ((match.type = 'unknown'), (match.typeIndex = -1)),
			null);

		return match;
  }

	static define(factory, flags) {
		const types = [];
		const RegExp = (this && (this.prototype === Segmenter || this.prototype instanceof Segmenter) && this) || Segmenter;
    const pattern = factory(type => (types.push((type != null || undefined) && type), ''));

    flags = `${(flags == null ? pattern && pattern.flags : flags) || ''}`;

		return new RegExp(pattern, flags, types);
	}
}

const {INSET, UNKNOWN: UNKNOWN$1, LOOKAHEAD} = Object.defineProperties(Segmenter, {
	INSET: {value: Symbol.for('INSET'), enumerable: true},
	UNKNOWN: {value: Symbol.for('UNKNOWN'), enumerable: true},
	LOOKAHEAD: {value: Symbol.for('LOOKAHEAD'), enumerable: true},
});

// import dynamicImport from '/browser/dynamic-import.js';

// console.log(import.meta.url);

globalThis.$mo = async function debug(specifier = '/markout/examples/markdown-testsuite.md') {
	// const {MarkoutSegments} = await import(`/markout/lib/experimental/markout-segmenter.js${timestamp}`);
	const url = new URL(specifier, location);
	const response = await fetch(url);
	if (!response.ok) console.warn(Error(`Failed to fetch ${url}`));
	const sourceText = await response.text();
	// console.log(dynamicImport);
	// const {debugSegmenter} = await dynamicImport('/modules/segmenter/segmenter.debug.js');
	const {debugSegmenter} = await (0, eval)('specifier => import(specifier)')('/modules/segmenter/segmenter.debug.js');
	debugSegmenter(MarkoutSegments, sourceText);
};

const MarkoutSegments = (() => {
	const MarkoutLists = sequence$1`[-*]|[1-9]+\d*\.|[ivx]+\.|[a-z]\.`;
	const MarkoutMatter = sequence$1`---(?=\n.+)(?:\n.*)+?\n---`;
	const MarkoutStub = sequence$1`<!--[^]*?-->|<!.*?>|<\?.*?\?>|<%.*?%>|<(?:\b|\/).*(?:\b|\/)>.*`;
	const MarkoutStart = sequence$1`(?!(?:${MarkoutLists}) )(?:[^#${'`'}~<>|\n\s]|${'`'}{1,2}(?!${'`'})|~{1, 2}(?!~))`;
	const MarkoutLine = sequence$1`(?:${MarkoutStart})(?:${MarkoutStub}|.*)*$`;
	// const MarkoutDivider = sequence`-(?:[ \t]*-)+|=(?:=[ \t]*)+`;
	const MarkoutDivider = sequence$1`-{2,}|={2,}|\*{2,}|(?:- ){2,}-|(?:= ){2,}=|(?:\* ){2,}\*`;
	const MarkoutATXHeading = sequence$1`#{1,6}(?= +${MarkoutLine})`;
	const MarkoutTextHeading = sequence$1`${MarkoutStart}.*\n(?=\2\={3,}\n|\2\-{3,}\n)`;

	const MarkoutSegments = Segmenter.define(
		type =>
			sequence$1`^
		  (?:
		    ${type(UNKNOWN$1)}(${MarkoutMatter}$|[ \t]*(?:${MarkoutStub})[ \t]*$)|
		    (?:
		      ${type(INSET)}((?:  |\t)*?(?:> ?)*?(?:> ?| *))
		      (?:
		        ${type('fence')}(?:(${'```'}|~~~)(?=.*\n)[^]*?\n\2\3.*$)|
		        ${type('table')}(?:([|](?=[ :-]).+[|]$)(?:\n\2[|].+[|]$)+)|
		        ${type('heading')}(?:(${MarkoutATXHeading}|${MarkoutTextHeading}).*$)|
		        ${type('list')}(?:(${MarkoutLists}) +${MarkoutLine}(?:\n\2 {2,4}${MarkoutLine})*$)|
		        ${type('alias')}(?:(\[.+?\]: .+)$)|
		        ${type('divider')}(?:(${MarkoutDivider})$)|
		        ${type('feed')}(?:([ \t]*(?:\n\2[ \t])*)$)|
		        ${type('paragraph')}(?:(${MarkoutLine}(?:\n\2 {0,2}${MarkoutLine})*)$)
		      )|
		      ${type(UNKNOWN$1)}(.+?$)
		    )
		  )(?=${type(LOOKAHEAD)}(\n?^.*$)?)
		`,
		'gmi',
	);
	return MarkoutSegments;
})();

const ALIASES$1 = 'aliases';

class MarkoutSegmentNormalizer extends MarkoutBlockNormalizer {
	/**
	 * @param {string} sourceText
	 * @param {{ aliases?: { [name: string]: alias } }} [state]
	 */
	normalizeSegments(sourceText, state = {}) {
		const {sources = (state.sources = []), [ALIASES$1]: aliases = (state[ALIASES$1] = {})} = state;
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

debugging('markout', import.meta, [
	// import.meta.url.includes('/markout/lib/') ||
	typeof location === 'object' && /[?&]debug(?=[&#]|=[^&]*\bmarkout|$)\b/.test(location.search),
	'segment-normalization',
	'block-normalization',
	'paragraph-normalization',
	'anchor-normalization',
	'break-normalization',
]);

class MarkoutNormalizer extends MarkoutSegmentNormalizer {
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

const {
	UnicodeIdentifier,
	MarkdownIdentityPrefixer,
	MarkdownIdentityJoiner,
	MarkdownIdentityWord,
	MarkdownIdentity,
} = (({
	raw = String.raw,
	IdentifierStart,
	IdentifierPart,
	UnicodeIdentifierStart = IdentifierStart.slice(2),
	UnicodeIdentifierPart = IdentifierPart.slice(2),
	UnicodeIdentifier = raw`[${UnicodeIdentifierStart}][${UnicodeIdentifierPart}]*`,
	MarkdownWordPrefixes = raw`$@`,
	MarkdownWordPrefix = raw`[${MarkdownWordPrefixes}]?`,
	MarkdownWord = raw`${MarkdownWordPrefix}${UnicodeIdentifier}`,
	MarkdownWordJoiners = raw` \\\/:_\-\xA0\u2000-\u200B\u202F\u2060`,
	MarkdownWordJoiner = raw`[${MarkdownWordJoiners}]+`,
	// MarkdownIdentity = raw`(?:\s|\n|^)(${MarkdownWord}(?:${MarkdownWordJoiner}${MarkdownWord})*(?=\b[\s\n]|$))`,
	MarkdownIdentity = raw`(?:\s|\n|^)(${MarkdownWord}(?:${MarkdownWordJoiner}${MarkdownWord})*)`,
}) => ({
	UnicodeIdentifier: new RegExp(UnicodeIdentifier, 'u'),
	MarkdownIdentityPrefixer: new RegExp(raw`^[${MarkdownWordPrefixes}]?`, 'u'),
	MarkdownIdentityJoiner: new RegExp(raw`[${MarkdownWordJoiners}]+`, 'ug'),
	MarkdownIdentityWord: new RegExp(MarkdownWord, 'u'),
	MarkdownIdentity: new RegExp(MarkdownIdentity, 'u'),
	// MarkdownIdentitySeparators: new RegExp(raw`[${MarkdownWordPrefixes}${MarkdownWordJoiners}]+`, 'ug')
}))(entities$1.es);

const entities = /*#__PURE__*/Object.freeze({
	UnicodeIdentifier: UnicodeIdentifier,
	MarkdownIdentityPrefixer: MarkdownIdentityPrefixer,
	MarkdownIdentityJoiner: MarkdownIdentityJoiner,
	MarkdownIdentityWord: MarkdownIdentityWord,
	MarkdownIdentity: MarkdownIdentity
});

const declarativeStyling = (declarativeStyling => {
	const {getOwnPropertyNames, setPrototypeOf, getPrototypeOf, freeze, keys} = Object;
	const {lookup} = declarativeStyling;
	const Filter = /^(?!webkit[A-Z])(?!moz[A-Z])[a-zA-Z]{2,}$/;
	const Boundary = /[a-z](?=[A-Z])/g;
	const selectors = [];
	const style = document.createElement('span').style;

	for (const property of new Set(
		[
			// Webkit/Blink
			...getOwnPropertyNames(style),
			// Firefox
			...getOwnPropertyNames(getPrototypeOf(style)),
		].filter(property => style[property] === '' && Filter.test(property)),
	)) {
		const attribute = `${property.replace(Boundary, '$&-').toLowerCase()}:`;
		lookup[attribute] = property;
		selectors.push(`[${CSS.escape(attribute)}]`);
	}

	declarativeStyling.selector = selectors.join(',');
	freeze(setPrototypeOf(declarativeStyling.lookup, null));
	freeze(declarativeStyling.apply);

	Prefixes: {
		const autoprefix = value => {
			const prefixed = value.replace(autoprefix.matcher, autoprefix.replacer);
			// console.log(value, prefixed);
			return prefixed;
		};
		autoprefix.mappings = {};
		autoprefix.prefix = CSS.supports('-moz-appearance', 'initial')
			? '-moz-'
			: CSS.supports('-webkit-appearance', 'initial')
			? '-webkit-'
			: '';

		if (autoprefix.prefix) {
			const {mappings, prefix} = autoprefix;
			const map = (property, value, mapping = `${prefix}${value}`) =>
				CSS.supports(property, value) || (mappings[value] = mapping);

			if (prefix === '-webkit-') {
				map('width', 'fill-available');
			} else if (prefix === '-moz-') {
				map('width', 'fill-available', '-moz-available');
			}

			const mapped = keys(mappings);

			if (mapped.length > 0) {
				autoprefix.matcher = new RegExp(String.raw`\b-?(?:${mapped.join('|')})\b`, 'gi');
				freeze((autoprefix.replacer = value => mappings[value] || value));
				freeze(autoprefix.mappings);
				freeze((declarativeStyling.autoprefix = autoprefix));
			}
			// console.log(autoprefix, {...autoprefix});
		}
	}

	freeze(declarativeStyling);
	return declarativeStyling;
})({
	/** @type {{[name: string] : string}} */
	lookup: {},
	selector: '',
	apply: element => {
		const style = element.style;
		const {lookup, autoprefix} = declarativeStyling;
		if (autoprefix) {
			for (const attribute of element.getAttributeNames())
				attribute in lookup &&
					((style[lookup[attribute]] = autoprefix(element.getAttribute(attribute))),
					element.removeAttribute(attribute));
		} else {
			for (const attribute of element.getAttributeNames())
				attribute in lookup &&
					((style[lookup[attribute]] = element.getAttribute(attribute)), element.removeAttribute(attribute));
		}
	},
	/** @type {(value: string) => string} */
	autoprefix: undefined,
});

const {
	createRenderedFragment,
	populateAssetsInFragment,
	normalizeBreaksInFragment,
	normalizeHeadingsInFragment,
	normalizeChecklistsInFragment,
	normalizeParagraphsInFragment,
	applyDeclarativeStylingInFragment,
	renderSourceTextsInFragment,
} = (() => {
	/** @type {HTMLTemplateElement} */
	let template;

	/** @param {string} sourceText @returns {DocumentFragment}*/
	const createRenderedFragment = sourceText => {
		let fragment, normalizedText, tokens;
		template || (template = document.createElement('template'));

		template.innerHTML = render(
			(tokens = tokenize((normalizedText = normalize(sourceText)))),
		);

		fragment = template.content.cloneNode(true);
		fragment.fragment = fragment;
		fragment.sourceText = sourceText;
		fragment.normalizedText = normalizedText;
		fragment.tokens = tokens;

		return fragment;
	};

	/** Populate remappable elements  */
	const populateAssetsInFragment = fragment => {
		if (!fragment || fragment.assets) return;
		fragment.assets = [];

		for (const link of fragment.querySelectorAll(AssetSelector)) {
			if (link.nodeName === 'SCRIPT') {
				if (link.type === 'module') {
					(fragment.assets.modules || (fragment.assets.modules = [])).push(link);
				} else if (!link.type || link.type.trim().toLowerCase() === 'text/javascript') {
					(fragment.assets.scripts || (fragment.assets.scripts = [])).push(link);
				}
			} else if (link.nodeName === 'STYLE') {
				if (!link.type || link.type.trim().toLowerCase() === 'text/css') {
					(fragment.assets.stylesheets || (fragment.assets.stylesheets = [])).push(link);
				}
			} else {
				(fragment.assets[AssetTypeMap[link.nodeName]] || (fragment.assets[AssetTypeMap[link.nodeName]] = [])).push(
					link,
				);
			}
			fragment.assets.push(link);
		}

		return fragment;
	};

	const normalizeBreaksInFragment = fragment => {
		for (const br of fragment.querySelectorAll('br')) {
			const {previousSibling, nextSibling, parentElement} = br;
			(!previousSibling ||
				previousSibling.nodeName !== 'SPAN' ||
				!nextSibling ||
				nextSibling.nodeName !== 'SPAN' ||
				(parentElement && !/^(?:CODE|PRE|LI)$/.test(parentElement.nodeName))) &&
				br.remove();
		}
	};

	const normalizeHeadingsInFragment = fragment => {
		const {MarkdownIdentity: Identity, MarkdownIdentityPrefixer: Prefixer, MarkdownIdentityJoiner: Joiner} = entities;
		const {headings = (fragment.headings = {})} = fragment;

		for (const subheading of fragment.querySelectorAll(`h1+h2, h2+h3, h3+h4, h4+h5, h5+h6`)) {
			const previousElementSibling = subheading.previousElementSibling;
			const previousSibling = subheading.previousSibling;
			if (!previousElementSibling || previousSibling !== previousElementSibling) continue;
			// console.log({subheading, previousElementSibling, previousSibling});
			if (previousElementSibling && previousElementSibling.nodeName === 'HGROUP') {
				previousElementSibling.appendChild(subheading);
			} else if (previousElementSibling) {
				const hgroup = document.createElement('hgroup');
				previousElementSibling.before(hgroup);
				hgroup.appendChild(previousElementSibling);
				hgroup.appendChild(subheading);
			}
		}

		for (const heading of fragment.querySelectorAll(
			`h1:not([id]):not(:empty),h2:not([id]):not(:empty),h3:not([id]):not(:empty)`,
		)) {
			const [, identity] = Identity.exec(heading.textContent) || '';
			if (!identity) continue;
			const anchor = document.createElement('a');
			anchor.id = identity
				.replace(Prefixer, '')
				.replace(Joiner, '-')
				.toLowerCase();
			heading.before(anchor);
			anchor.append(heading);
			headings[anchor.id] = {anchor, identity, heading};
		}
	};

	const normalizeChecklistsInFragment = fragment => {
		for (const checklist of fragment.querySelectorAll(
			'li[type=checkbox]:not([checked]):not([indeterminate]) li[type=checkbox]:not([checked])',
		)) {
			let parentChecklist = checklist;
			// console.log({checklist, parentChecklist});
			while ((parentChecklist = parentChecklist.parentElement.closest('li[type=checkbox]'))) {
				if (parentChecklist.hasAttribute('checked') || parentChecklist.hasAttribute('indeterminate')) break;
				parentChecklist.setAttribute('indeterminate', '');
			}
		}
	};

	const normalizeParagraphsInFragment = fragment => {
		let empty, span;
		if ((empty = fragment.querySelectorAll('p:empty')).length) {
			(span = document.createElement('span')).append(...empty);
			// console.log({empty, content: span.innerHTML});
		}
	};

	const applyDeclarativeStylingInFragment = fragment => {
		if (
			typeof declarativeStyling.apply === 'function' &&
			typeof declarativeStyling.selector === 'string' &&
			declarativeStyling.selector !== ''
		)
			for (const element of fragment.querySelectorAll(declarativeStyling.selector)) declarativeStyling.apply(element);
	};

	const renderSourceTextsInFragment = fragment => {
		const promises = [];

		for (const element of fragment.querySelectorAll(`[${SourceTypeAttribute}]:not(:empty)`))
			promises.push(
				renderSourceText({
					element,
					sourceType: element.getAttribute(MarkupModeAttribute) || element.getAttribute(SourceTypeAttribute),
					sourceText: element.textContent,
				}),
			);

		return promises.length ? Promise.all(promises) : Promise.resolve();
	};

	/**
	 * @param {Partial<{element: HTMLElement, sourceType: string, sourceText: String}>} options
	 * @returns {Promise<HTMLElement>}
	 */
	const renderSourceText = async options => {
		let element, fragment, sourceType, sourceText;

		if (
			!options ||
			typeof options !== 'object' ||
			(({element, sourceType, sourceText, ...options} = options),
			!(element
				? !element.hasAttribute(MarkupSyntaxAttribute) &&
				  (sourceType ||
						(sourceType = element.getAttribute(MarkupModeAttribute) || element.getAttribute(SourceTypeAttribute)),
				  sourceText || (sourceText = element.textContent || ''))
				: sourceText))
		)
			return void console.warn('Aborted: renderSourceText(%o => %o)', arguments[0], {element, sourceType, sourceText});

		element || ((element = document.createElement('pre')).className = 'markup code');
		element.removeAttribute(SourceTypeAttribute);
		element.setAttribute(MarkupSyntaxAttribute, sourceType);
		fragment = document.createDocumentFragment();
		element.textContent = '';
		element.sourceText = sourceText;
		await render$1(sourceText, {sourceType, fragment});
		element.appendChild(fragment);

		return element;
	};

	return {
		createRenderedFragment,
		populateAssetsInFragment,
		normalizeBreaksInFragment,
		normalizeHeadingsInFragment,
		normalizeChecklistsInFragment,
		normalizeParagraphsInFragment,
		applyDeclarativeStylingInFragment,
		renderSourceTextsInFragment,
	};
})();

const SourceTypeAttribute = 'source-type';
const MarkupModeAttribute = 'markup-mode';
const MarkupSyntaxAttribute = 'markup-syntax';

const AssetTypeMap = Object.freeze(
	Object.setPrototypeOf(
		{
			IMG: 'images',
			VIDEO: 'videos',
			SOURCE: 'sources',
		},
		null,
	),
);

const AssetSelector = ['script', 'style', ...Object.keys(AssetTypeMap)]
	.map(tag => `${tag.toUpperCase()}[src]:not([slot])`)
	.join(',');

const {
	// Attempts to overcome **__**
	'markout-render-span-restacking': SPAN_RESTACKING = true,
	'markout-render-newline-consolidation': NEWLINE_CONSOLIDATION = false,
} = import.meta;

const normalize = sourceText => {
	const {normalizer = (normalize.normalizer = new MarkoutNormalizer())} = normalize;
	return normalizer.normalizeSourceText(sourceText);
};

const render = tokens => {
	const {
		punctuators = (render.punctuators = createPunctuators()),
		renderer = (render.renderer = new MarkoutRenderer({punctuators})),
	} = render;
	return renderer.renderTokens(tokens);
};

const tokenize = sourceText => tokenize$1(`${sourceText.trim()}\n}`, {sourceType: 'markdown'});

const encodeEscapedEntities = ((Escapes, replace) => text => text.replace(Escapes, replace))(
	/\\([*^-`])/g,
	(m, e) => encodeEntity(e),
);

const FencedBlockHeader = /^(?:(\w+)(?:\s+(.*?)\s*|)$|)/m;

class MarkoutRenderingContext {
	constructor(renderer) {
		({punctuators: this.punctuators} = this.renderer = renderer);

		[
			this.passthru,
			this.block,
			this.fenced,
			this.header,
			this.indent,
			this.newlines,
			this.comment,
		] = this.renderedText = '';

		SPAN_RESTACKING && createSpanStack(this);
	}
}

class MarkoutRenderer {
	constructor({punctuators = createPunctuators()} = {}) {
		this.punctuators = punctuators;
	}
	renderTokens(tokens, context = new MarkoutRenderingContext(this)) {
		let text, type, punctuator, lineBreaks, hint, previous, body, tag, classes, before, after, details;
		context.tokens = tokens;

		const {punctuators} = context;
		const {renderClasses} = this;

		for (const token of context.tokens) {
			if (!token || !(body = token.text)) continue;
			({text, type = 'text', punctuator, lineBreaks, hint = 'text', previous} = token);
			tag = classes = before = after = details = undefined;

			if (context.passthru || context.fenced) {
				if (context.fenced) {
					if (context.fenced === context.passthru) {
						context.header += text;
						lineBreaks && ((context.header = context.header.trimRight()), (context.passthru = ''));
					} else if (punctuator === 'closer' && text === '```') {
						let sourceType, sourceAttributes;
						if (context.header) {
							[, sourceType = 'markup', sourceAttributes] = FencedBlockHeader.exec(context.header);
							import.meta['debug:fenced-block-header-rendering'] &&
								console.log('fenced-block-header', {
									fenced: context.fenced,
									header: context.header,
									passthru: context.passthru,
									sourceType,
									sourceAttributes,
									context,
								});
						}
						// passthru rendered code
						context.renderedText += `<${context.block} class="markup code" ${SourceTypeAttribute}="${sourceType ||
							'markup'}"${
							// sourceParameters ? ` ${SourceParameters}="${sourceParameters}"` : ''
							(sourceAttributes && ` ${sourceAttributes}`) || ''
						}>${encodeEntities(context.passthru)}</${context.block}>`;
						context.header = context.indent = context.fenced = context.passthru = '';
					} else {
						// passthru code
						context.passthru += body.replace(context.indent, '');
					}
					// continue;
				} else {
					// passthru body
					context.passthru += body;
					if (punctuator === 'closer' || (context.comment && punctuator === 'comment')) {
						// passthru body rendered
						context.renderedText += context.passthru;
						context.passthru = '';
					}
				}
				continue;
			}

			tag = 'span';
			classes = hint.split(/\s+/);

			if (hint === 'markdown' || hint.startsWith('markdown ') || hint.includes('in-markdown')) {
				(type === 'text' && lineBreaks) ||
					(!text.trim() && (type = 'whitespace')) ||
					(text in punctuators.entities && (body = punctuators.entities[text]));

				if (punctuator) {
					context.passthru =
						(((context.comment = punctuator === 'comment' && text) || punctuators.tags.has(text)) && text) || '';
					if (context.passthru) continue;
					// SPAN_RESTACKING && punctuator === 'opener' && context.stack[text] >= 0 && (punctuator = 'closer');
					if (punctuator === 'opener') {
						if ((context.fenced = text === '```' && text)) {
							context.block = 'pre';
							context.passthru = context.fenced;
							[context.indent = ''] = /^[ \t]*/gm.exec(previous.text);
							context.indent && (context.indent = new RegExp(String.raw`^${context.indent}`, 'mg'));
							context.header = '';
							// punctuator opener fence
							continue;
						} else if (text in punctuators.spans) {
							if (SPAN_RESTACKING && (before = context.stack.open(text, body, classes)) === undefined) continue;
							before || ((before = `<${punctuators.spans[text]}${renderClasses(classes)}>`), classes.push('opener'));
						} else if (text === '<!' || text === '<%') {
							// Likely <!doctype …> || Processing instruction
							let next;
							while (
								(next = context.tokens.next().value) &&
								(body += next.text) &&
								!(
									(next.punctuator === 'opener' && /^</.test(next.text)) ||
									(next.punctuator === 'closer' && />$/.test(next.text))
								)
							);
							context.passthru = body;
							continue;
						}
					} else if (punctuator === 'closer') {
						if (text === '```') {
							context.block = punctuators.blocks['```'] || 'pre';
						} else if (text in punctuators.spans) {
							if (SPAN_RESTACKING && (after = context.stack.close(text, body, classes)) === undefined) continue;
							after || ((after = `</${punctuators.spans[text]}>`), classes.push('closer'));
						}
					}
					(before || after) && (tag = 'tt');
					classes.push(`${punctuator}-token`);
				} else {
					if (lineBreaks) {
						(!context.block && (tag = 'br')) || ((after = `</${context.block}>`) && (context.block = body = ''));
					} else if (type === 'sequence') {
						if (text[0] === '`') {
							tag = 'code';
							body = text.replace(/(``?)(.*)\1/, '$2');
							let fence = '`'.repeat((text.length - body.length) / 2);
							body = encodeEntities(body.replace(/&nbsp;/g, '\u202F'));
							fence in punctuators.entities && (fence = punctuators.entities[fence]);
							classes.push('fenced-code');
							classes.push('code');
						} else if (text.startsWith('---') && !/[^\-]/.test(text)) {
							tag = 'hr';
						} else if (!context.block && (context.block = punctuators.blocks[text])) {
							let previous = token;
							let inset = '';
							while ((previous = previous.previous)) {
								if (previous.lineBreaks) break;
								inset = `${previous.text}${inset}`;
							}
							if (!/[^> \t]/.test(inset)) {
								before = `<${context.block}${renderClasses(classes)}>`;
								tag = 'tt';
								classes.push('opener', `${type}-token`);
							} else {
								body = text;
							}
						} else {
							// sequence
							body = text;
						}
					} else if (type === 'whitespace') {
						// if (span === 'code') body.replace(/\xA0/g, '&nbsp;');
						tag = '';
					} else {
						// debug(`${type}:token`)(type, token);
						classes.push(`${type}-token`);
						body = text;
					}
				}
			}

			details =
				tag &&
				[
					punctuator && `punctuator="${punctuator}"`,
					type && `token-type="${type}"`,
					hint && `token-hint="${hint}"`,
					lineBreaks && `line-breaks="${lineBreaks}"`,
				].join(' ');

			tag === 'span' && (body = encodeEscapedEntities(body));

			before && (context.renderedText += before);
			tag === 'br' || (context.newlines = 0)
				? (!NEWLINE_CONSOLIDATION && (context.renderedText += '\n')) ||
				  (context.newlines++ && (context.renderedText += '\n')) ||
				  (context.renderedText += '<br/>')
				: tag === 'hr'
				? (context.renderedText += '<hr/>')
				: body &&
				  (tag
						? (context.renderedText += `<${tag} ${details}${renderClasses(classes)}>${body}</${tag}>`)
						: (context.renderedText += body));
			after && (context.renderedText += after);
		}

		return context.renderedText;
		// return (context.output = new MarkoutOutput(context));
	}

	renderClasses(classes) {
		return ((classes = [...classes].filter(Boolean).join(' ')) && ` class="${classes}"`) || '';
	}
}

// render.classes = classes => ((classes = classes.filter(Boolean).join(' ')) && ` class="${classes}"`) || '';

/// Features

const createPunctuators = (
	repeats = {['*']: 2, ['`']: 3, ['#']: 6},
	entities = {['*']: '&#x2217;', ['`']: '&#x0300;'},
	aliases = {'*': ['_'], '**': ['__'], '`': ['``']},
	blocks = {['-']: 'li', ['>']: 'blockquote', ['#']: 'h*', ['```']: 'pre'},
	spans = {['*']: 'i', ['**']: 'b', ['~~']: 's', ['`']: 'code'},
	tags = ['<', '>', '<!--', '-->', '<%', '%>', '</', '/>'],
) => {
	const symbols = new Set([...Object.keys(repeats), ...Object.keys(entities)]);
	for (const symbol of symbols) {
		let n = repeats[symbol] || 1;
		const entity = entities[symbol];
		let block = blocks[symbol];
		let span = spans[symbol];
		const tag = block || span;
		const map = (block && blocks) || (span && spans);
		for (let i = 1; n--; i++) {
			const k = symbol.repeat(i);
			const b = blocks[k];
			const s = spans[k];
			const m = (b && blocks) || (s && spans) || map;
			const t = (b || s || m[k] || tag).replace('*', i);
			const e = entities[k] || (entity && entity.repeat(i));
			m[k] = t;
			e && (entities[k] = e);
			if (k in aliases) for (const a of aliases[k]) (m[a] = t), e && (entities[a] = e);
		}
	}
	for (let h = 1, c = 2080, n = 6; n--; entities['#'.repeat(h)] = `#<sup>&#x${c + h++};</sup>`);

	const escapes = {};

	for (const symbol of '* _ ~ `'.split(' ')) {
		escapes[`\\${symbol}`] = `&#x${symbol.charAt(0).toString(16)};`;
	}

	return {entities, blocks, spans, tags: new Set(tags)};
};

const createSpanStack = context => {
	const {
		punctuators: {spans},
		renderer,
	} = context;
	const stack = [];
	stack.open = (text, body, classes) => {
		const {[text]: lastIndex, length: index} = stack;
		if (lastIndex < 0) return (stack[text] = undefined); // ie continue
		if (lastIndex >= 0) return stack.close(text, body, classes);
		const span = spans[text];
		const before = `<${span}${renderer.renderClasses(classes)}>`;
		stack[text] = index;
		stack.push({text, body, span, index});
		return classes.push('opener'), before;
	};
	stack.close = (text, body, classes) => {
		const span = spans[text];
		const {[text]: index, length} = stack;
		if (index === length - 1) {
			index >= 0 && (stack.pop(), (stack[text] = undefined));
			const after = `</${span}>`;
			return classes.push('closer'), after;
		} else if (index >= 0) {
			classes.push('closer', `closer-token`);
			const details = `token-type="auto"${renderer.renderClasses(classes)}`;
			const closing = stack.splice(index, length).reverse();
			for (const {span, text, body} of closing) {
				context.renderedText += `<tt punctuator="closer" ${details}>${body}</tt></${span}>`;
				stack[text] < index || (stack[text] = -1);
			}
		} else {
			context.renderedText += text;
		}
	};
	context.stack = stack;
};

debugging('markout', import.meta, [
	// import.meta.url.includes('/markout/lib/') ||
	typeof location === 'object' && /[?&]debug(?=[&#]|=[^&]*\bmarkout|$)\b/.test(location.search),
	'block-normalization',
	'paragraph-normalization',
	'anchor-normalization',
	'break-normalization',
	'fenced-block-header-rendering',
]);

export { normalizeBreaksInFragment as a, normalizeHeadingsInFragment as b, createRenderedFragment as c, normalizeParagraphsInFragment as d, normalizeChecklistsInFragment as e, applyDeclarativeStylingInFragment as f, renderSourceTextsInFragment as g, normalize as n, populateAssetsInFragment as p, render as r, tokenize as t };
//# sourceMappingURL=common.js.map
