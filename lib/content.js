import * as markup from '/markup/dist/tokenizer.browser.js';
import * as renderer from './renderer.js';
import * as entities from '../lib/entities.js';
import {declarativeStyling} from '../lib/styling.js';
import {Enum} from './helpers.js';

export const {
	createRenderedFragment,
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
		createRenderedFragment,
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
