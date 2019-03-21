export * from './entities.js';

// import * as markup from './markup.js';
import {tokenize as tokenizeMarkup, encodeEntities} from '../../../markup/dist/tokenizer/tokenizer.browser.mjs';

export const SourceType = 'source-type';
export const MarkupSyntax = 'markup-syntax';

const punctuators = ((
	repeats = {['*']: 2, ['`']: 3, ['#']: 6},
	entities = {['*']: '&#x2217;', ['`']: '&#x0300;'},
	aliases = {'*': ['_'], '**': ['__'], '`': ['``']},
	blocks = {['-']: 'li', ['>']: 'blockquote', ['#']: 'h*', ['```']: 'pre'},
	spans = {['*']: 'i', ['**']: 'b', ['~~']: 's', ['`']: 'code'},
	tags = ['<', '>', '<!--', '-->', '<%', '%>', '</', '/>'],
) => {
	const {keys} = Object;
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

	return {entities, blocks, spans, tags: new Set(tags)};
})();

const Blocks = /(?:^|\n)([> \t]*(?:\`\`\`|\~\~\~))[^]+?(?:\n+\1\n?|$)|([^]+?(?:(?=\n[> \t]*(?:\`\`\`|\~\~\~))|$))/g;

const Paragraphs = /(?=(\n[> \t]*)\b)((?:\1(?!(?:\d+|[a-z]|[ivx]+)\. )[^#<>|\-~\s\n][^\n]*?(?:\n[> \t]*(?=\n|$))+)+)/g;

const Lists = /(?=(\n[> \t]*)(?:[-*] |[1-9]+\d*\. |[a-z]\. |[ivx]+\. ))((?:\1(?:[-*] |[1-9]+\d*\. |[a-z]\. |[ivx]+\. |   ?)+[^\n]+(?:\n[> \t]*)*(?=\1|$))+)/g;

// CHANGE: Added (…|) to marker capture
const Item = /^([> \t]*)([-*] |[1-9]+\d*\. |[a-z]\. |[ivx]+\. |)([^\n]+(?:\n\1(?:   ?|\t ?)(?![ \t]|[-*] |\d+\. |[a-z]\. |[ivx]+\. ).*)*)$/gm;

const References = /\!?\[(\S.+?\S)\](?:\((\S[^\n()\[\]]*?\S)\)|\[(\S[^\n()\[\]]*\S)\])/g;
const Aliases = /^([> \t]*)\[(\S.+?\S)\]:\s+(\S+)(?:\s+"([^\n]*)")(?=\s*$)/gm;

const Link = /\s*(\S+)(?:\s+"([^\n]*)")?/;

export const normalizeReferences = sourceText => {
	const aliases = {};

	let match;

	Aliases.lastIndex = -1;

	while ((match = Aliases.exec(sourceText))) {
		const {0: text, 1: alias, 2: href = '', 3: title, index} = match;
		alias && alias.trim() && (aliases[alias] = {alias, href, title, text, index});
	}

	return sourceText.replace(References, (m, text, link, alias, index) => {
		const reference = (alias && (alias = alias.trim())) || (link && (link = link.trim()));
		if (reference) {
			let href, title;
			// console.log(m, {text, link, alias, reference, index});
			if (link) {
				[, href = '#', title] = Link.exec(link);
			} else if (alias && alias in aliases) {
				[, href = '#', title] = aliases[alias];
			}
			// console.log(m, {href, title, text, link, alias, reference, index});
			if (m[0] === '!') {
				return `<img src="${href}"${text || title ? ` title="${text || title}"` : ''} />`;
			} else {
				// text = text ? text.replace(/^[#]/, encodeEntity) : encodeEntities(href);
				text = text || encodeEntities(href);
				return `<a href="${href}"${title ? ` title="${title}"` : ''}>${text || reference}</a>`;
			}
		}
		return m;
	});
};

class List extends Array {
	toString(inset = this.inset || '', type = this.type || 'ul', style = this.style, start = this.start) {
		const attributes = `${
			// TODO: Explore using type attribute instead
			(style && `style="list-style: ${style}"`) || ''
		} ${
			// TODO: Check if guard against invalid start is needed
			(start && `start="${start}"`) || ''
		}`.trim();

		const rows = [`${inset}<${type}${(attributes && ` ${attributes}`) || ''}>`];
		for (const item of this) {
			if (item && typeof item === 'object') {
				if (item instanceof List) {
					const last = rows.length - 1;
					const row = rows[last];
					if (last > 0) {
						rows[rows.length - 1] = `${row.slice(0, -5)}\n${item.toString(`${inset}\t\t`)}\n${inset}\t</li>`;
					} else {
						rows.push(`${inset}\t<li>\n${item.toString(`${inset}\t\t`)}\n${inset}\t</li>`);
					}
				} else {
					const insetText = `${item}`;
					let text = insetText;
					for (const character of inset) {
						if (!text.startsWith(character)) break;
						text = text.slice(1);
					}
					console.log({insetText, text, inset});
					rows.push(text);
				}
			} else {
				rows.push(`${inset}\t<li>${`${item}`.trim()}</li>`);
			}
		}
		rows.push(`${inset}</${type}>`);
		return rows.join('\n');
	}
}

export const normalizeLists = sourceText =>
	sourceText.replace(Lists, (m, feed, body) => {
		let match, indent;
		indent = feed.slice(1);
		const top = new List();
		let list = top;
		Item.lastIndex = 0;
		while ((match = Item.exec(m))) {
			let [, inset, marker, line] = match;
			if (!line.trim()) continue;

			if (marker) {
				let depth = inset.length;
				if (depth > list.depth) {
					const parent = list;
					list = new List();
					list.inset = inset;
					list.depth = depth;
					(list.type = marker === '* ' || marker === '- ' ? 'ul' : 'ol') === 'ol' &&
						(list.start = marker.replace(/\W/g, ''));
					(list.parent = parent).push(list);
				} else if (depth < list.depth) {
					while ((list = list.parent) && depth < list.depth);
				} else if (!(inset in list)) {
					// TODO: Figure out if this was just for top!!!
					list.inset = inset;
					list.depth = depth;
					(list.type = marker === '* ' || marker === '- ' ? 'ul' : 'ol') === 'ol' &&
						(list.start = marker.replace(/\W/g, ''));
				} else {
					// console.log(match);
				}

				if (!list) break;

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

export const normalizeParagraphs = sourceText =>
	sourceText.replace(Paragraphs, (m, feed, body) => {
		const paragraphs = body
			.trim()
			.split(/^(?:[> \t]*\n)+[> \t]*/m)
			.filter(Boolean);

		return `${feed}<p>${paragraphs.join(`</p>${feed}<p>${feed}`)}</p>`;
	});

export const normalizeBlocks = sourceText =>
	sourceText.replace(Blocks, (m, fence, paragraphs) =>
		fence ? m : normalizeReferences(normalizeParagraphs(normalizeLists(paragraphs))),
	);

const normalized = new Map();

export const normalizeString = string => Object.keys({[string]: true})[0];

export const normalize = sourceText => {
	let normalizedText = normalized.get(sourceText);
	normalizedText !== undefined ||
		normalized.set(sourceText, (normalizedText = normalizeString(normalizeBlocks(normalizeString(sourceText)))));
	return normalizedText;
};

export const tokenize = sourceText => tokenizeMarkup(`${sourceText.trim()}\n}`, {sourceType: 'markdown'});

export const render = (tokens, renderedHTML = '') => {
	let passthru, block, span, fenced, indent, newlines, comment;

	const {blocks, spans, entities, tags} = punctuators;

	// tokens = [...tokens];
	const {raw} = String;

	for (const token of tokens) {
		if (token && token.text) {
			let {text, type = 'text', punctuator, breaks, hint, previous} = token;
			let body = text;

			// text.includes('>') && debug('tag:close')(punctuator || type, text, token);

			if (passthru) {
				if (fenced) {
					if (fenced === passthru) {
						fenced += text;
						passthru = `<${block} class="markup code" ${text ? ` ${SourceType}="${text}"` : ''}>`;
					} else if (punctuator === 'closer' && text === '```') {
						// debug('passthru:rendered:code')({passthru});
						renderedHTML += `${passthru}</${block}>`;
						indent = fenced = passthru = '';
					} else {
						passthru += body.replace(indent, '');
						// debug('passthru:code')({passthru, breaks, indent});
					}
					continue;
				} else {
					passthru += body;
					if (punctuator === 'closer' || (comment && punctuator === 'comment')) {
						// debug('passthru:rendered:body')({passthru});
						renderedHTML += passthru;
						passthru = '';
					} else {
						// debug('passthru:body')({passthru});
					}
				}
				continue;
			}

			let tag = 'span';
			const classes = hint.split(/\s+/);
			let before, after;

			if (hint === 'markdown' || hint.startsWith('markdown ') || hint.includes('in-markdown')) {
				(type === 'text' && breaks) ||
					(!text.trim() && (type = 'whitespace')) ||
					(text in entities && (body = entities[text]));

				if (punctuator) {
					if ((passthru = ((comment = punctuator === 'comment' && text) || tags.has(text)) && text)) continue;
					if (punctuator === 'opener') {
						if ((fenced = text === '```' && text)) {
							block = 'pre';
							passthru = fenced;
							[indent = ''] = /^[ \t]*/gm.exec(previous.text);
							indent && (indent = new RegExp(raw`^${indent}`, 'mg'));
							// debug('punctuator:opener:fence:token')(punctuator, token);
							continue;
						} else if (text in spans) {
							before = `<${spans[text]}${render.classes(classes)}>`;
							classes.push('opener');
						}
					} else if (punctuator === 'closer') {
						if (text === '```') {
							block = blocks['```'] || 'pre';
						} else if (text in spans) {
							after = `</${spans[text]}>`;
							classes.push('closer');
						}
					}
					(before || after) && (tag = 'tt');
					// || debug(`punctuator:${punctuator}:token`)(punctuator, token);
					classes.push(`${punctuator}-token`);
				} else {
					if (breaks) {
						(!block && (tag = 'br')) || ((after = `</${block}>`) && (block = body = ''));
					} else if (type === 'sequence') {
						if (text[0] === '`') {
							tag = 'code';
							body = text.replace(/(``?)(.*)\1/, '$2');
							let fence = '`'.repeat((text.length - body.length) / 2);
							body = encodeEntities(body.replace(/&nbsp;/g, '\u202F'));
							fence in entities && (fence = entities[fence]);
							classes.push('fenced-code');
							classes.push('code');
						} else if (text.startsWith('---') && !/[^-]/.test(text)) {
							tag = 'hr';
						} else if (!block && (block = blocks[text])) {
							// && (!token.next || token.next.text.startsWith(' '))
							let skip;
							let previous = token;
							let inset = '';
							while ((previous = previous.previous)) {
								if (previous.breaks) break;
								inset = `${previous.text}${inset}`;
							}
							if (!/[^> \t]/.test(inset)) {
								before = `<${block}${render.classes(classes)}>`;
								tag = 'tt';
								classes.push('opener', `${type}-token`);
							} else {
								body = text;
							}
						} else {
							body = text;
							// debug(`sequence:token`)(type, token);
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

			before && (renderedHTML += before);
			tag === 'br' || (newlines = 0)
				? (newlines++ && (renderedHTML += '\n')) || (renderedHTML += '<br/>')
				: tag === 'hr'
				? (renderedHTML += '<hr/>')
				: body &&
				  (tag ? (renderedHTML += `<${tag}${render.classes(classes)}>${body}</${tag}>`) : (renderedHTML += body));
			after && (renderedHTML += after);
		}
	}

	return renderedHTML;
};

render.classes = classes => ((classes = classes.filter(Boolean).join(' ')) && ` class="${classes}"`) || '';

// export const encodeEntity = entity => `&#${entity.charCodeAt(0)};`;
// export const encodeEntities = string => string.replace(/[\u00A0-\u9999<>\&]/gim, encodeEntity);
