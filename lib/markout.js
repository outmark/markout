export * from './entities.js';

import {MarkoutNormalizer} from './normalizer.js';

const {
	// Attempts to overcome **__**
	'markout-render-span-restacking': SPAN_RESTACKING = true,
	'markout-render-newline-consolidation': NEWLINE_CONSOLIDATION = false,
} = import.meta;

// import {tokenize as tokenizeMarkup, encodeEntities} from '../../../markup/dist/tokenizer/tokenizer.browser.js';
import {tokenize as tokenizeMarkup, encodeEntities} from './markup.js';

export const SourceType = 'source-type';
export const SourceParameters = 'source-parameters';
export const MarkupSyntax = 'markup-syntax';

export const normalize = sourceText => {
	const {normalizer = (normalize.normalizer = new MarkoutNormalizer())} = normalize;
	return normalizer.normalizeSourceText(sourceText);
};

export const render = tokens => {
	const {
		punctuators = (render.punctuators = createPunctuators()),
		renderer = (render.renderer = new MarkoutRenderer({punctuators})),
	} = render;
	return renderer.renderTokens(tokens);
};

export const tokenize = sourceText => tokenizeMarkup(`${sourceText.trim()}\n}`, {sourceType: 'markdown'});

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
		context.tokens = tokens;

		const {punctuators} = context;
		const {renderClasses} = this;

		for (const token of context.tokens) {
			if (!token || !token.text) continue;
			let {text, type = 'text', punctuator, breaks, hint, previous} = token;
			let body = text;

			if (context.passthru || context.fenced) {
				if (context.fenced) {
					if (context.fenced === context.passthru) {
						context.header += text;
						breaks && ((context.header = context.header.trimRight()), (context.passthru = ''));
					} else if (punctuator === 'closer' && text === '```') {
						let sourceType, sourceParameters;
						if (context.header) {
							[, sourceType = 'markup', sourceParameters] = FencedBlockHeader.exec(context.header);
							import.meta['debug:fenced-block-header-rendering'] &&
								console.log('fenced-block-header', {
									fenced: context.fenced,
									header: context.header,
									passthru: context.passthru,
									sourceType,
									sourceParameters,
								});
						}
						// passthru rendered code
						context.renderedText += `<${context.block} class="markup code" ${SourceType}="${sourceType || 'markup'}"${
							// sourceParameters ? ` ${SourceParameters}="${sourceParameters}"` : ''
							(sourceParameters && ` ${sourceParameters}`) || ''
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

			let tag = 'span';
			const classes = hint.split(/\s+/);
			let before, after;

			if (hint === 'markdown' || hint.startsWith('markdown ') || hint.includes('in-markdown')) {
				(type === 'text' && breaks) ||
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
					if (breaks) {
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
							let skip;
							let previous = token;
							let inset = '';
							while ((previous = previous.previous)) {
								if (previous.breaks) break;
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

			const details =
				tag &&
				[
					punctuator && `punctuator="${punctuator}"`,
					type && `token-type="${type}"`,
					breaks && `token-breaks="${breaks}"`,
					hint && `token-hint="${hint}"`,
				].join(' ');

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

class MarkoutOutput extends String {
	constructor(context) {
		super(context.renderedText).context = context;
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

/** @typedef {{text?: string, indent?: string, index: number}} match */
/** @typedef {{href: string, title: string}} alias */

/////

// import {sequence} from '../../../../markup/packages/tokenizer/examples/browser/helpers.js';
// import {matchAll, sequence} from '/markout/lib/helpers.js';
// import {MarkoutBlocks} from './experimental/normalizer.js';

/// Debugging

import {debugging} from '/markout/lib/helpers.js';

debugging('markout', import.meta, [
	// import.meta.url.includes('/markout/lib/') ||
	typeof location === 'object' && /[?&]debug(?=[&#]|=[^&]*\bmarkout|$)\b/.test(location.search),
	'block-normalization',
	'paragraph-normalization',
	'anchor-normalization',
	'break-normalization',
	'fenced-block-header-rendering',
]);
