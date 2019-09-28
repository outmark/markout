//@ts-check
/// <reference path="./types.d.ts" />

import {Enum} from '../helpers.js';
import {content} from './content.js';
import * as markup from '../markup.js';

export const MarkupAttributeMap = Enum({
	SourceType: 'source-type',
	MarkupMode: 'markup-mode',
	MarkupSyntax: 'markup-syntax',
});

/**
 * @param {Partial<{element: HTMLElement, sourceType: string, sourceText: String}>} options
 * @returns {Promise<HTMLElement>}
 */
export const renderSourceText = async options => {
	let element, sourceType, sourceText, state;

	if (
		!options ||
		typeof options !== 'object' ||
		(({element, sourceType, sourceText, ...options} = options),
		!(element
			? !element.hasAttribute(content.MarkupAttributeMap.MarkupSyntax) &&
			  (sourceType ||
					(sourceType =
						element.getAttribute(content.MarkupAttributeMap.MarkupMode) ||
						element.getAttribute(content.MarkupAttributeMap.SourceType)),
			  sourceText || (sourceText = element.textContent || ''))
			: sourceText))
	)
		return void console.warn('Aborted: renderSourceText(%o => %o)', options, {element, sourceType, sourceText});

	element != null
		? element.removeAttribute(content.MarkupAttributeMap.SourceType)
		: ((element = document.createElement('pre')).className = 'markup code');

	state = element['(markup)'] = {
		element,
		sourceText,
		sourceType,
		fragment: document.createDocumentFragment(),
		parsingGoal:
			(/^(js|javascript|es|ecmascript)$/i.test(sourceType) &&
				(element.matches('[script=module], [module]') ? 'module' : element.matches('[script]') ? 'script' : 'code')) ||
			undefined,
	};

	// TODO: Implement proper out-of-band handling for js versus es modes
	state.parsingGoal === 'module' && (state.sourceType = sourceType = 'es');

	element.setAttribute(content.MarkupAttributeMap.MarkupSyntax, state.sourceType);
	element.textContent = '';
	element.sourceText = sourceText;
	await markup.render(sourceText, state);
	element.appendChild(state.fragment);

	return element;
};

content.MarkupAttributeMap = MarkupAttributeMap;
content.renderSourceText = renderSourceText;
