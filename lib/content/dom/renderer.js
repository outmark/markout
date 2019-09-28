//@ts-check
/// <reference path="../types.d.ts" />

import * as renderer from '../../renderer.js';

import '../markup.js';
import {content} from '../content.js';

/** @param {string} sourceText @returns {Fragment}*/
export const createRenderedFragment = sourceText => {
	/** @type {Fragment} */
	let fragment, normalizedText, tokens, renderedText;

	content.createRenderedFragment.template ||
		(content.createRenderedFragment.template = document.createElement('template'));

	content.createRenderedFragment.template.innerHTML = renderedText = renderer.render(
		(tokens = renderer.tokenize((normalizedText = renderer.normalize(sourceText)))),
	);

	//@ts-ignore
	fragment = content.createRenderedFragment.template.content.cloneNode(true);
	fragment.fragment = fragment;
	fragment.sourceText = sourceText;
	fragment.normalizedText = normalizedText;
	fragment.tokens = tokens;
	fragment.renderedText = renderedText;

	return fragment;
};

/** @type {HTMLTemplateElement} */
createRenderedFragment.template = undefined;

/** @param {Fragment} fragment */
export const renderURLExpansionLinksInFragment = fragment => {
	for (const span of fragment.querySelectorAll('span[href]')) {
		if (span.closest('a')) continue;
		const anchor = document.createElement('a');
		anchor.href = span.getAttribute('href');
		span.before(anchor);
		anchor.append(...span.childNodes);
		span.remove();
	}
};

/** @param {Fragment} fragment */
export const renderSourceTextsInFragment = fragment => {
	const promises = [];

	for (const element of fragment.querySelectorAll(`[${content.MarkupAttributeMap.SourceType}]:not(:empty)`))
		promises.push(
			content.renderSourceText({
				element,
				sourceType:
					element.getAttribute(content.MarkupAttributeMap.MarkupMode) ||
					element.getAttribute(content.MarkupAttributeMap.SourceType),
				sourceText: element.textContent,
			}),
		);

	return promises.length ? Promise.all(promises) : Promise.resolve();
};

content.createRenderedFragment = createRenderedFragment;
content.renderURLExpansionLinksInFragment = renderURLExpansionLinksInFragment;
content.renderSourceTextsInFragment = renderSourceTextsInFragment;

/** @typedef {import('../types').Fragment} Fragment */
