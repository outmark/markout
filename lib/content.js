import * as markup from '/markup/dist/tokenizer.browser.js';
import * as renderer from './renderer.js';
import * as entities from '../lib/entities.js';
import {declarativeStyling} from '../lib/styling.js';
import {Enum} from './helpers.js';

// export const MarkoutContentFlags = '(markout content flags)';

export const {
	defaults,
	createRenderedFragment,
	normalizeRenderedFragment,
	populateAssetsInFragment,
	normalizeBreaksInFragment,
	normalizeHeadingsInFragment,
	normalizeChecklistsInFragment,
	normalizeParagraphsInFragment,
	flattenTokensInFragment,
	applyDeclarativeStylingInFragment,
	renderSourceTextsInFragment,
} = (() => {
	/** @type {HTMLTemplateElement} */
	let template;

	const defaults = Object.freeze({
		flags: Object.freeze({
			DOM_MUTATIONS: undefined,
			BREAK_NORMALIZATION: undefined,
			HEADING_NORMALIZATION: true,
			PARAGRAPH_NORMALIZATION: true,
			CHECKLIST_NORMALIZATION: true,
			BLOCKQUOTE_NORMALIZATION: true,
			TOKEN_FLATTENING: true,
			DECLARATIVE_STYLING: true,
			SOURCE_TEXT_RENDERING: true,
			ASSET_REMAPPING: true,
			ASSET_INITIALIZATION: true,
		}),
	});

	/** @param {string} sourceText @returns {DocumentFragment}*/
	const createRenderedFragment = sourceText => {
		let fragment, normalizedText, tokens, renderedText;
		template || (template = document.createElement('template'));

		template.innerHTML = renderedText = renderer.render(
			(tokens = renderer.tokenize((normalizedText = renderer.normalize(sourceText)))),
		);

		// console.log({sourceText, normalizedText, innerHTML: template.innerHTML});

		fragment = template.content.cloneNode(true);
		fragment.fragment = fragment;
		fragment.sourceText = sourceText;
		fragment.normalizedText = normalizedText;
		fragment.tokens = tokens;
		fragment.renderedText = renderedText;

		return fragment;
	};

	/** @param {DocumentFragment} fragment @param {Record<string, boolean>} [flags] */
	const normalizeRenderedFragment = (fragment, flags) => {
		flags = {
			DOM_MUTATIONS: fragment.markoutContentFlags.DOM_MUTATIONS = defaults.DOM_MUTATIONS,
			BREAK_NORMALIZATION: fragment.markoutContentFlags.BREAK_NORMALIZATION = defaults.BREAK_NORMALIZATION,
			HEADING_NORMALIZATION: fragment.markoutContentFlags.HEADING_NORMALIZATION = defaults.HEADING_NORMALIZATION,
			PARAGRAPH_NORMALIZATION: fragment.markoutContentFlags.PARAGRAPH_NORMALIZATION = defaults.PARAGRAPH_NORMALIZATION,
			CHECKLIST_NORMALIZATION: fragment.markoutContentFlags.CHECKLIST_NORMALIZATION = defaults.CHECKLIST_NORMALIZATION,
			BLOCKQUOTE_NORMALIZATION: fragment.markoutContentFlags
				.BLOCKQUOTE_NORMALIZATION = defaults.BLOCKQUOTE_NORMALIZATION,
			TOKEN_FLATTENING: fragment.markoutContentFlags.TOKEN_FLATTENING = defaults.TOKEN_FLATTENING,
			DECLARATIVE_STYLING: fragment.markoutContentFlags.DECLARATIVE_STYLING = defaults.DECLARATIVE_STYLING,
			SOURCE_TEXT_RENDERING: fragment.markoutContentFlags.SOURCE_TEXT_RENDERING = defaults.SOURCE_TEXT_RENDERING,
			ASSET_REMAPPING: fragment.markoutContentFlags.ASSET_REMAPPING = defaults.ASSET_REMAPPING,
			ASSET_INITIALIZATION: fragment.markoutContentFlags.ASSET_INITIALIZATION = defaults.ASSET_INITIALIZATION,
		} = {
			...defaults.flags,
			...(fragment.markoutContentFlags || (fragment.markoutContentFlags = {})),
			...flags,
		};

		flags.DOM_MUTATIONS !== false &&
			((flags.BREAK_NORMALIZATION === true || flags.DOM_MUTATIONS === true) && normalizeBreaksInFragment(fragment),
			(flags.HEADING_NORMALIZATION === true || flags.DOM_MUTATIONS === true) && normalizeHeadingsInFragment(fragment),
			(flags.PARAGRAPH_NORMALIZATION === true || flags.DOM_MUTATIONS === true) &&
				normalizeParagraphsInFragment(fragment),
			(flags.BLOCKQUOTE_NORMALIZATION === true || flags.DOM_MUTATIONS === true) &&
				normalizeBlockquotesInFragment(fragment),
			(flags.CHECKLIST_NORMALIZATION === true || flags.DOM_MUTATIONS === true) &&
				normalizeChecklistsInFragment(fragment),
			(flags.DECLARATIVE_STYLING === true || flags.DOM_MUTATIONS === true) &&
				applyDeclarativeStylingInFragment(fragment));

		(flags.TOKEN_FLATTENING === true || (flags.TOKEN_FLATTENING !== false && DOM_MUTATIONS !== false)) &&
			flattenTokensInFragment(fragment);

		renderURLExpansionLinksInFragment(fragment);
	};

	/** Populate remappable elements @param {DocumentFragment} fragment */
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

	/** @param {DocumentFragment} fragment */
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

	/** @param {DocumentFragment} fragment */
	const normalizeHeadingsInFragment = fragment => {
		const {MarkdownIdentity: Identity, MarkdownIdentityPrefixer: Prefixer, MarkdownIdentityJoiner: Joiner} = entities;
		const {headings = (fragment.headings = {}), TEXT_NODE} = fragment;

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

		const HeadingNumber = /^[1-9]\d*\.$|/;

		for (const heading of fragment.querySelectorAll(
			`h1:not([id]):not(:empty),h2:not([id]):not(:empty),h3:not([id]):not(:empty),h4:not([id]):not(:empty),h5:not([id]):not(:empty),h6:not([id]):not(:empty)`,
		)) {
			const level = parseFloat(heading.nodeName[1]);
			const textSpan = heading.querySelector('span[token-type]');
			const textNode =
				(textSpan && textSpan.firstChild && textSpan.firstChild.nodeType === TEXT_NODE && textSpan.firstChild) ||
				undefined;

			const number = textNode && heading.matches('hgroup > *') && parseFloat(HeadingNumber.exec(textSpan.textContent));

			// Assuming all hgroup headings are either intentional or
			//   implied from markout notation, we want to pull out
			//   numbering into a data attribute
			number > 0 && ((heading.dataset.headingNumber = number), textNode.remove());

			// We're limit anchoring from H1 thru H3
			// if (parseFloat(heading.nodeName[1]) > 3) continue;

			const [, identity] = Identity.exec(heading.textContent) || '';
			if (!identity) continue;
			const anchor = document.createElement('a');
			anchor.id = identity
				.replace(Prefixer, '')
				.replace(Joiner, '-')
				.toLowerCase();
			anchor.append(...heading.childNodes);
			// anchor.tabIndex = -1;
			anchor.heading = heading.anchor = {anchor, identity, heading, level, number};
			heading.appendChild(anchor);

			// Unique mappings are prioritized by heading level
			(anchor.id in headings && headings[anchor.id].level > level) || (headings[anchor.id] = heading.anchor);
		}
	};

	/** @param {DocumentFragment} fragment */
	const normalizeBlockquotesInFragment = fragment => {
		/** @type {HTMLQuoteElement} */
		let previousBlockquote, nextBlockquote;
		/** @type {Node | Element} */
		let node, previousNode;
		const {COMMENT_NODE, TEXT_NODE, ELEMENT_NODE} = fragment;
		/** @type {IterableIterator<HTMLQuoteElement>} */
		const matchedBlockquotes = fragment.querySelectorAll(
			// 'blockquote[blockquote-level]+:not(blockquote)[blockquote-level]')
			':not(blockquote)[blockquote-level]+blockquote[blockquote-level]',
		);

		// return;
		for (const lastBlockquote of matchedBlockquotes) {
			nextBlockquote = lastBlockquote;

			previousBlockquote, (previousNode = undefined);

			lastBlockquote.blockquoteLevel = parseFloat(lastBlockquote.getAttribute('blockquote-level'));

			node = lastBlockquote.previousSibling;

			if (
				!(lastBlockquote.blockquoteLevel > 0) ||
				!(
					lastBlockquote.previousElementSibling === node ||
					node.nodeType === COMMENT_NODE ||
					node.textContent.trim() === ''
				)
			) {
				normalizeBlockquotesInFragment.log({node, lastBlockquote, nextBlockquote, previousBlockquote});
				// debugger;
				continue;
			}

			while (node != null && (node.nodeName !== 'BLOCKQUOTE' || !(previousBlockquote = node))) {
				node.blockquoteLevel =
					node.nodeType === ELEMENT_NODE
						? parseFloat(node.getAttribute('blockquote-level'))
						: nextBlockquote.blockquoteLevel;
				previousNode = node.previousSibling;
				if (node.blockquoteLevel === nextBlockquote.blockquoteLevel) {
					// debugger;
				} else if (node.blockquoteLevel > nextBlockquote.blockquoteLevel) {
					previousBlockquote = nextBlockquote;
					nextBlockquote = document.createElement('blockquote');
					nextBlockquote.setAttribute('blockquote-level', (nextBlockquote.blockquoteLevel = node.blockquoteLevel));
					// debugger;
					previousBlockquote.prepend(nextBlockquote);
				} else if (node.blockquoteLevel < nextBlockquote.blockquoteLevel) {
					if (node.blockquoteLevel < lastBlockquote.blockquoteLevel) {
						// TODO: Is it safer to coerce or superseede?!
						// debugger;
						node.blockquoteLevel = lastBlockquote.blockquoteLevel;
					}
					while (
						nextBlockquote.blockquoteLevel >= lastBlockquote.blockquoteLevel &&
						node.blockquoteLevel <
							nextBlockquote.blockquoteLevel(
								nextBlockquote.parentElement.blockquoteLevel < nextBlockquote.blockquoteLevel,
							)
					) {
						nextBlockquote = nextBlockquote.parentElement;
					}
				}
				nextBlockquote.prepend(node);
				node = previousNode;
			}

			if (lastBlockquote.previousSibling === previousNode && previousBlockquote === previousNode) {
				if (
					('blockquoteLevel' in previousBlockquote
						? previousBlockquote.blockquoteLevel
						: (previousBlockquote.blockquoteLevel = parseFloat(previousBlockquote.getAttribute('blockquote-level')))) >
					0
				) {
					if (previousBlockquote.blockquoteLevel < lastBlockquote.blockquoteLevel) {
						// TODO: Is it safer to coerce or superseede?!
						// debugger;
						continue;
					}

					if (previousBlockquote.blockquoteLevel === lastBlockquote.blockquoteLevel) {
						if (
							previousBlockquote.childElementCount === 1 &&
							previousBlockquote.firstElementChild.nodeName === 'DETAILS'
						) {
							previousBlockquote.firstElementChild.append(...lastBlockquote.childNodes);
						} else {
							previousBlockquote.append(...lastBlockquote.childNodes);
						}
						lastBlockquote.remove();
					}
				} else if (!previousBlockquote.hasAttribute('blockquote-level')) {
					previousBlockquote.setAttribute(
						'blockquote-level',
						(previousBlockquote.blockquoteLevel = lastBlockquote.blockquoteLevel),
					);
					// TODO: Figure out if we can merge!
					// debugger;
				}
			}
		}
	};

	/** @param {{node: Node | Element, lastBlockquote: HTMLQuoteElement, nextBlockquote?: HTMLQuoteElement,  previousBlockquote?:HTMLQuoteElement} } nodes */
	normalizeBlockquotesInFragment.log = nodes => {
		const format = [];
		const values = [];
		for (const name of ['node', 'lastBlockquote', 'nextBlockquote', 'previousBlockquote']) {
			const node = nodes[name];
			if (node == null || typeof node !== 'object') continue;
			format.push('%s [%d] — %O');
			values.push(name, node.blockquoteLevel || (node.getAttribute && node.getAttribute('blockquote-level')), node);
		}
		format.length && console.log(format.join('\n'), ...values);
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
		for (const empty of fragment.querySelectorAll('p:empty')) empty.remove();
	};

	const renderURLExpansionLinksInFragment = fragment => {
		for (const span of fragment.querySelectorAll('span[href]')) {
			if (span.closest('a')) continue;
			const anchor = document.createElement('a');
			anchor.href = span.getAttribute('href');
			span.before(anchor);
			anchor.append(...span.childNodes);
			span.remove();
		}
	};

	const flattenTokensInFragment = fragment => {
		for (const token of fragment.querySelectorAll('span[token-type],tt[token-type]')) {
			token.nodeName === 'TT' || token.before(...token.childNodes);
			token.remove();
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
		let element, fragment, sourceType, sourceText, state;

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

		element != null
			? element.removeAttribute(SourceTypeAttribute)
			: ((element = document.createElement('pre')).className = 'markup code');

		state = element['(markup)'] = {element, sourceText, sourceType, fragment: document.createDocumentFragment()};

		// TODO: Implement proper out-of-band handling for js versus es modes
		if (/^(js|javascript|es|ecmascript)$/i.test(sourceType)) {
			(state.parsingGoal = element.matches('[script=module], [module]')
				? 'module'
				: element.matches('[script]')
				? 'script'
				: 'code') === 'module' && (state.sourceType = sourceType = 'es');
		}

		element.setAttribute(MarkupSyntaxAttribute, state.sourceType);
		element.textContent = '';
		element.sourceText = sourceText;
		// await markup.render(sourceText, {sourceType, fragment});
		await markup.render(sourceText, state);
		element.appendChild(state.fragment);

		return element;
	};

	return {
		defaults,
		createRenderedFragment,
		normalizeRenderedFragment,
		populateAssetsInFragment,
		normalizeBreaksInFragment,
		normalizeHeadingsInFragment,
		normalizeChecklistsInFragment,
		normalizeParagraphsInFragment,
		flattenTokensInFragment,
		applyDeclarativeStylingInFragment,
		renderSourceTextsInFragment,
	};
})();

export const SourceTypeAttribute = 'source-type';
export const MarkupModeAttribute = 'markup-mode';
export const MarkupSyntaxAttribute = 'markup-syntax';

export const AssetTypeMap = Enum({
	IMG: 'images',
	VIDEO: 'videos',
	SOURCE: 'sources',
});

export const AssetSelector = ['script', 'style', ...Object.keys(AssetTypeMap)]
	.map(tag => `${tag.toUpperCase()}[src]:not([slot])`)
	.join(',');
