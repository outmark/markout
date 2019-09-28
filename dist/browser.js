import { debugging } from '/markout/lib/helpers.js';
import { entities as entities$1 } from '/markup/dist/tokenizer.browser.js';
import { c as content, r as render, t as tokenize, n as normalize, E as Enum } from './common.js';
import { styling, Component } from './components.js';

async function dynamicImport(specifier, referrer) {
	if (!('resolve' in dynamicImport)) {
		const {assign, create, defineProperties, freeze, getOwnPropertyDescriptors, setPrototypeOf} = Object;
		let base;
		const resolve = freeze((specifier, referrer) => `${new URL(specifier, referrer || base || location)}`);
		const properties = {resolve};
		try {
			properties.import = freeze((1, eval)(`url => import(url)`));
			properties.export = freeze(() => {
				throw Error(`Invalid invokation of dynamicImport.exports()`);
			});
		} catch (exception) {
			const reflect = freeze(getOwnPropertyDescriptors.bind(null));
			const createElement = document.createElement.bind(document);
			const insertElement = document.appendChild.bind(document.head);
			const records = {};
			const resolvers = {};
			const binders = new WeakMap();
			const proxy = new Proxy(freeze(create(null)), {
				get: (target, property, receiver) => {
					const binder = binders.get(receiver);
					if (binder && binders.delete(setPrototypeOf(receiver, null)))
						return freeze(defineProperties(receiver, {...binder(reflect), ...reflect(receiver)}))[property];
				},
			});
			const Import = class Import {
				constructor(url) {
					const {wrap = Import.wrap, inject = Import.inject} = new.target;
					this.url = url;
					this.namespace = create(proxy, {
						[Symbol.toStringTag]: {value: `Module‹${url}›`},
					});
					this.source = wrap(url, (this.binder = `reflect => reflect(namespace)`), (this.loader = import.meta.url));
					this.promise = inject(this);
					freeze(this);
				}
				static wrap(url, binder, loader) {
					return `import * as namespace from "${url}";\nimport loader from "${loader}";\nloader.export("${url}", ${binder});`;
				}
				static inject({url, source: textContent, namespace, crossOrigin = 'anonymous', type = 'module'}) {
					let timeout;
					const script = assign(createElement('script'), {type: 'module', crossOrigin, textContent});
					const promise = new Promise(
						resolve => (timeout = setTimeout((script.onerror = resolvers[url] = resolve), 5000, {type: 'timeout'})),
					).then(event => {
						resolvers[url] = script.onerror = void clearTimeout(timeout);
						if (!event || event.type === 'load') return namespace;
						throw Error(`Failed to load "${url}"`);
					});
					insertElement(script).remove();
					return promise;
				}
			};

			freeze(freeze(Import.prototype).constructor);

			properties.import = freeze(url => {
				const {[url]: record = (records[url] = new Import(resolve(url)))} = records;
				return record.promise;
			});

			properties.export = freeze((url, binder) => {
				const {[url]: record} = records;
				if (!record || typeof binder !== 'function' || `${binder}` !== record.binder || binders.has(record.namesapce))
					throw Error(`Invalid invokation of dynamicImport.exports()`);
				binders.set(record.namespace, binder);
				resolvers[url] && resolvers[url]();
			});
		}

		defineProperties(dynamicImport, {
			...getOwnPropertyDescriptors(freeze(properties)),
			base: {get: () => base, set: value => (base = `${new URL(value)}`)},
		});
	}
	return dynamicImport.import(dynamicImport.resolve(specifier, referrer));
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
	UnicodeIdentifier = raw`[\d${UnicodeIdentifierStart}][\d${UnicodeIdentifierPart}]*`,
	MarkdownWordPrefixes = raw`$@`,
	MarkdownWordPrefix = raw`[${MarkdownWordPrefixes}]?`,
	MarkdownWord = raw`${MarkdownWordPrefix}${UnicodeIdentifier}`,
	MarkdownWordJoiners = raw` \\\/:_\-\xA0\u2000-\u200B\u202F\u2060`,
	MarkdownWordJoiner = raw`[${MarkdownWordJoiners}]+`,
	// MarkdownIdentity = raw`(?:\s|\n|^)(${MarkdownWord}(?:${MarkdownWordJoiner}${MarkdownWord})*(?=\b[\s\n]|$))`,
	MarkdownIdentity = raw`(?:\s|\n|^)(?:The (?=\w)|)(${MarkdownWord}(?:${MarkdownWordJoiner}${MarkdownWord})*)`,
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

//@ts-check

/** @param {Fragment} fragment @param {Record<string, boolean>} [flags] */
const normalizeRenderedFragment = (fragment, flags) => {
	flags = {
		DOM_MUTATIONS: fragment.markoutContentFlags.DOM_MUTATIONS = content.defaults.DOM_MUTATIONS,
		BREAK_NORMALIZATION: fragment.markoutContentFlags.BREAK_NORMALIZATION = content.defaults.BREAK_NORMALIZATION,
		HEADING_NORMALIZATION: fragment.markoutContentFlags.HEADING_NORMALIZATION = content.defaults.HEADING_NORMALIZATION,
		PARAGRAPH_NORMALIZATION: fragment.markoutContentFlags.PARAGRAPH_NORMALIZATION = content.defaults
			.PARAGRAPH_NORMALIZATION,
		BLOCK_PARAGRAPH_NORMALIZATION: fragment.markoutContentFlags.BLOCK_PARAGRAPH_NORMALIZATION = content.defaults
			.BLOCK_PARAGRAPH_NORMALIZATION,
		CHECKLIST_NORMALIZATION: fragment.markoutContentFlags.CHECKLIST_NORMALIZATION = content.defaults
			.CHECKLIST_NORMALIZATION,
		BLOCKQUOTE_NORMALIZATION: fragment.markoutContentFlags.BLOCKQUOTE_NORMALIZATION = content.defaults
			.BLOCKQUOTE_NORMALIZATION,
		BLOCKQUOTE_HEADING_NORMALIZATION: fragment.markoutContentFlags.BLOCKQUOTE_HEADING_NORMALIZATION = content.defaults
			.BLOCKQUOTE_HEADING_NORMALIZATION,
		TOKEN_FLATTENING: fragment.markoutContentFlags.TOKEN_FLATTENING = content.defaults.TOKEN_FLATTENING,
		DECLARATIVE_STYLING: fragment.markoutContentFlags.DECLARATIVE_STYLING = content.defaults.DECLARATIVE_STYLING,
		SOURCE_TEXT_RENDERING: fragment.markoutContentFlags.SOURCE_TEXT_RENDERING = content.defaults.SOURCE_TEXT_RENDERING,
		ASSET_REMAPPING: fragment.markoutContentFlags.ASSET_REMAPPING = content.defaults.ASSET_REMAPPING,
		ASSET_INITIALIZATION: fragment.markoutContentFlags.ASSET_INITIALIZATION = content.defaults.ASSET_INITIALIZATION,
	} = {
		...content.defaults.flags,
		...(fragment.markoutContentFlags || (fragment.markoutContentFlags = {})),
		...flags,
	};

	flags.DOM_MUTATIONS !== false &&
		((flags.BREAK_NORMALIZATION === true || flags.DOM_MUTATIONS === true) &&
			content.normalizeBreaksInFragment(fragment),
		(flags.HEADING_NORMALIZATION === true || flags.DOM_MUTATIONS === true) &&
			content.normalizeHeadingsInFragment(fragment),
		(flags.PARAGRAPH_NORMALIZATION === true || flags.DOM_MUTATIONS === true) &&
			content.normalizeParagraphsInFragment(fragment),
		(flags.BLOCKQUOTE_NORMALIZATION === true || flags.DOM_MUTATIONS === true) &&
			content.normalizeBlockquotesInFragment(fragment),
		(flags.CHECKLIST_NORMALIZATION === true || flags.DOM_MUTATIONS === true) &&
			content.normalizeChecklistsInFragment(fragment),
		(flags.DECLARATIVE_STYLING === true || flags.DOM_MUTATIONS === true) &&
			content.normalizeDeclarativeStylingInFragment(fragment));

	(flags.TOKEN_FLATTENING === true || (flags.TOKEN_FLATTENING !== false && flags.DOM_MUTATIONS !== false)) &&
		content.flattenTokensInFragment(fragment);

	content.renderURLExpansionLinksInFragment(fragment);
};

/** @param {Fragment} fragment */
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

content.matchers.HeadingNumber = /^[1-9]\d*\.$|/;

/** @param {Fragment} fragment */
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

	for (const heading of fragment.querySelectorAll(
		`h1:not([id]):not(:empty),h2:not([id]):not(:empty),h3:not([id]):not(:empty),h4:not([id]):not(:empty),h5:not([id]):not(:empty),h6:not([id]):not(:empty)`,
	)) {
		const level = parseFloat(heading.nodeName[1]);
		const textSpan = heading.querySelector('span[token-type]');
		const textNode =
			(textSpan && textSpan.firstChild && textSpan.firstChild.nodeType === TEXT_NODE && textSpan.firstChild) ||
			undefined;

		const number =
			textNode &&
			heading.matches('hgroup > *') &&
			parseFloat(content.matchers.HeadingNumber.exec(textSpan.textContent));

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

		const nav = anchor.querySelector('nav:last-child');
		nav && heading.appendChild(nav);

		// Unique mappings are prioritized by heading level
		(anchor.id in headings && headings[anchor.id].level > level) || (headings[anchor.id] = heading.anchor);
	}
};

// const content.matchers.BlockParts = /^(?:(\w+(?: \w+)*)(:| - | — |)|)(.*)$/u;
content.matchers.BlockParts = /^[*_]*?(?:(\*{1,2}|_{1,2}|)(\w+(?: \w+)*)\1(: | - | — |)|)(.*)$|/u;

content.matchers.BlockHeadingSelectors = ['i:first-child > b', 'b:first-child > i', 'b', 'i'].flatMap(selector => [
	`:scope > ${(selector = `${selector}:first-child:not(:empty)`)}`,
	`p:first-child > ${selector}`,
]);

content.matchers.BlockHeadingSelector = content.matchers.BlockHeadingSelectors.join(',');

/** @param {Fragment} fragment */
content.normalizeBlockquotesInFragment = fragment => {
	/** @type {HTMLQuoteElement} */
	let previousBlockquote, nextBlockquote;
	/** @type {Node | Element} */
	let node, previousNode;
	/** @type {Range} */
	let range;
	let heading, delimiter, headingSeparator, body;
	const {COMMENT_NODE, TEXT_NODE, ELEMENT_NODE} = fragment;

	/** @type {IterableIterator<HTMLQuoteElement>} */
	const matchedBlocks = fragment.querySelectorAll('blockquote:not(:empty)');

	for (const blockquote of matchedBlocks) {
		node = blockquote.querySelector(content.matchers.BlockHeadingSelector);

		node == null ||
			(body = blockquote.textContent.trim()) === '' ||
			([, delimiter = '', heading = '', headingSeparator = '', body = ''] = content.matchers.BlockParts.exec(body));

		// console.log(`%o — ${delimiter}%s${delimiter}${headingSeparator}${body}`, {blockquote, node}, node.textContent);

		body === '' || (blockquote.blockBody = body);

		if (node != null && heading) {
			blockquote.blockHeadingNode = node;
			blockquote.dataset.blockHeading = blockquote.blockHeading = heading;
			blockquote.dataset.blockHeadingSeparator = blockquote.blockHeadingSeparator = headingSeparator;
			if ((fragment.markoutContentFlags || content.defaults).BLOCKQUOTE_HEADING_NORMALIZATION === true) {
				node.slot = 'block-heading';
				range = document.createRange();
				range.setStartAfter(node);
				previousNode = node;

				do {
					range.setEndAfter((node = node.nextSibling));
				} while (!(range.text = range.toString()).startsWith(headingSeparator));

				if (range.text !== headingSeparator) {
					console.log(
						`%o — [%s][%s][${body}]`,
						{blockquote, range, contents: range.contents},
						previousNode.textContent,
						range.toString(),
					);
				} else {
					node = document.createElement('span');
					node.textContent = headingSeparator;
					node.slot = 'block-heading-separator';
					range.deleteContents();
					previousNode.after(node);
					previousNode.parentElement.attachShadow({
						mode: 'open',
					}).innerHTML =
						//
						/* html */ `
							<style>:host {padding: 0.5em;}</style>
							<div style="display: grid; grid-template-columns: min-content auto; grid-gap: 1em;">
								<div>
									<slot name="block-heading"></slot>
									<slot name="block-heading-separator" hidden></slot>
								</div>
								<div><slot></slot></div>
							</div>`;
				}

				// range.setEnd(blockquote, range.startOffset + headingSeparator.length);
				// range.extractContents();
				// blockquote.attachShadow({mode: open})
			}
		}
	}

	/** @type {IterableIterator<HTMLQuoteElement>} */
	const matchedTails = fragment.querySelectorAll(
		// 'blockquote[blockquote-level]+:not(blockquote)[blockquote-level]')
		':not(blockquote)[blockquote-level]+blockquote[blockquote-level]',
	);

	// return;
	for (const lastBlockquote of matchedTails) {
		nextBlockquote = lastBlockquote;

		(previousNode = undefined);

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
			content.normalizeBlockquotesInFragment.log({node, lastBlockquote, nextBlockquote, previousBlockquote});
			// debugger;
			continue;
		}

		while (node != null && (node.nodeName !== 'BLOCKQUOTE' || !(previousBlockquote = node))) {
			node.blockquoteLevel =
				node.nodeType === ELEMENT_NODE
					? parseFloat(node.getAttribute('blockquote-level'))
					: nextBlockquote.blockquoteLevel;
			previousNode = node.previousSibling;
			if (node.blockquoteLevel === nextBlockquote.blockquoteLevel) ; else if (node.blockquoteLevel > nextBlockquote.blockquoteLevel) {
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
					: (previousBlockquote.blockquoteLevel = parseFloat(previousBlockquote.getAttribute('blockquote-level')))) > 0
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
content.normalizeBlockquotesInFragment.log = nodes => {
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

content.symbols.NormalizedChecklists = Symbol('NormalizedChecklists');

/** @param {Fragment} fragment */
const normalizeChecklistsInFragment = fragment => {
	const seen =
		fragment[content.symbols.NormalizedChecklists] || (fragment[content.symbols.NormalizedChecklists] = new WeakSet());

	for (const checklist of fragment.querySelectorAll(
		'li[type=checkbox]:not([checked]):not([indeterminate]) li[type=checkbox]:not([checked])',
	)) {
		let parentChecklist = checklist;
		// console.log({checklist, parentChecklist});
		while ((parentChecklist = parentChecklist.parentElement.closest('li[type=checkbox]'))) {
			seen.has(parentChecklist) ||
				(seen.add(parentChecklist),
				parentChecklist.querySelector(':scope li[type=checkbox]:not([checked]):not([indeterminate])')
					? parentChecklist.querySelector(':scope  li[type=checkbox][checked]')
						? (parentChecklist.removeAttribute('checked'), parentChecklist.setAttribute('indeterminate', ''))
						: (parentChecklist.removeAttribute('checked'), parentChecklist.removeAttribute('indeterminate', ''))
					: !parentChecklist.querySelector(':scope li[type=checkbox][checked]') ||
					  (parentChecklist.removeAttribute('indeterminate'), parentChecklist.setAttribute('checked', '')));

			// if (parentChecklist.hasAttribute('checked') || parentChecklist.hasAttribute('indeterminate')) break;
			// parentChecklist.setAttribute('indeterminate', '');
		}
	}
};

content.normalizeParagraphsInBlock = block => {
	let element, node, nodes, paragraph, text;
	node = block.firstChild;
	if (node == null) return;
	element = block.firstElementChild;
	// while (element != null && element.matches('span,code,kbd,tt,small,em,strong,b,i,a,q,wbr,br,slot')) {
	while (element != null && !element.matches('hr,pre,p,blockquote,table,div')) {
		element = element.nextElementSibling;
	}
	while (node !== element) {
		(nodes || (nodes = [])).push(node);
		node = node.nextSibling;
	}
	if (nodes) {
		paragraph = document.createElement('p');
		paragraph.append(...nodes);
		text = paragraph.textContent;
		// console.log({element, node, nodes, paragraph, text});
		text && text.trim() && block.prepend(paragraph);
	}
};

/** @param {Fragment} fragment */
const normalizeParagraphsInFragment = fragment => {
	if ((fragment.markoutContentFlags || content.defaults).BLOCK_PARAGRAPH_NORMALIZATION)
		for (const block of fragment.querySelectorAll('li:not(:empty), blockquote:not(:empty)'))
			content.normalizeParagraphsInBlock(block);
	for (const empty of fragment.querySelectorAll('p:empty')) empty.remove();
};

/** @param {Fragment} fragment */
const normalizeDeclarativeStylingInFragment = fragment => {
	styling.apply.toFragment(fragment);
};

content.normalizeRenderedFragment = normalizeRenderedFragment;
content.normalizeBreaksInFragment = normalizeBreaksInFragment;
content.normalizeHeadingsInFragment = normalizeHeadingsInFragment;
content.normalizeChecklistsInFragment = normalizeChecklistsInFragment;
content.normalizeParagraphsInFragment = normalizeParagraphsInFragment;
content.normalizeDeclarativeStylingInFragment = normalizeDeclarativeStylingInFragment;

/** @typedef {import('../types').Fragment} Fragment */

//@ts-check

/** @param {string} sourceText @returns {Fragment}*/
const createRenderedFragment = sourceText => {
	/** @type {Fragment} */
	let fragment, normalizedText, tokens, renderedText;

	content.createRenderedFragment.template ||
		(content.createRenderedFragment.template = document.createElement('template'));

	content.createRenderedFragment.template.innerHTML = renderedText = render(
		(tokens = tokenize((normalizedText = normalize(sourceText)))),
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

/** @param {Fragment} fragment */
const renderSourceTextsInFragment = fragment => {
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

//@ts-check

/** @param {Fragment} fragment */
const populateAssetsInFragment = fragment => {
	if (!fragment || fragment.assets) return;
	fragment.assets = [];

	for (const link of /** @type {Iterable<Link>} */ (fragment.querySelectorAll(content.AssetNodeSelector))) {
		if (link.nodeName === 'SCRIPT') {
			if (link.type === 'module') {
				(fragment.assets.modules || (fragment.assets.modules = [])).push(/** @type {HTMLScriptElement} */ (link));
			} else if (!link.type || link.type.trim().toLowerCase() === 'text/javascript') {
				(fragment.assets.scripts || (fragment.assets.scripts = [])).push(/** @type {HTMLScriptElement} */ (link));
			}
		} else if (link.nodeName === 'STYLE') {
			if (!link.type || link.type.trim().toLowerCase() === 'text/css') {
				(fragment.assets.stylesheets || (fragment.assets.stylesheets = [])).push(
					/** @type {HTMLStyleElement} */ (link),
				);
			}
		} else {
			/** @type {Links} */ (
				fragment.assets[content.AssetNodeMap[link.nodeName]] ||
				//@ts-ignore
				(fragment.assets[content.AssetNodeMap[link.nodeName]] = [])
			).push(link);
		}
		fragment.assets.push(link);
	}

	return fragment;
};

/** @param {Fragment} fragment */
const flattenTokensInFragment = fragment => {
	for (const token of fragment.querySelectorAll('span[token-type],tt[token-type]')) {
		token.nodeName === 'TT' || token.before(...token.childNodes);
		token.remove();
	}
};

const AssetNodeMap = Enum({
	IMG: 'images',
	SOURCE: 'sources',
	VIDEO: 'videos',
});

const AssetNodeSelector = ['script', 'style', ...Object.keys(AssetNodeMap)]
	.map(tag => `${tag.toUpperCase()}[src]:not([slot])`)
	.join(',');

content.AssetNodeSelector = AssetNodeSelector;
content.AssetNodeMap = AssetNodeMap;
content.populateAssetsInFragment = populateAssetsInFragment;
content.flattenTokensInFragment = flattenTokensInFragment;

/** @typedef {import('./types').Fragment} Fragment */
/** @typedef {import('./types').Fragment.Link} Link */
/** @typedef {import('./types').Fragment.Links} Links */

class MarkoutContent extends Component {
	/** @type {{[name: string]: boolean | undefined}} */
	static get flags() {
		const flags = Object.create(super.flags || null);

		for (const flag in content.defaults.flags) {
			const value = import.meta[`markout-content-${flag.replace(/-/g, '_').toLowerCase}`];
			value === undefined || (flags[flag] = value);
		}

		return super.set('flags', Object.freeze(flags));
	}

	static get template() {
		return super.set(
			'template',
			this.html/* html */ `
				<slot inert hidden style="display:none;"></slot>
				<slot id="styles" name="styles"></slot>
				<div id="links"></div>
				<div id="wrapper">
					<slot id="content" class="markout-content" name="content"></slot>
				</div>
			`,
		);
	}

	static get shadowRoot() {
		return super.set('shadowRoot', {mode: 'closed'});
	}

	static get assets() {
		return super.set('assets', new this.Assets({base: new URL('../', import.meta.url)}, 'style:styles/markout.css'));
	}

	static get styles() {
		return super.set(
			'styles',
			this.css/* css */ `
				@import "${MarkoutContent.assets['style:styles/markout.css']}";

				:host {
					padding: 1rem 2rem;
					white-space: normal;
				}

				.hide {
					opacity: 0;
					display: block;
				}

				#wrapper {
					/* will-change: transition;
					transition: 0 / 125ms, opacity 250ms / 250ms; */
				}

				#wrapper.hide {
					will-change: transition;
					transition: 0 / 125ms, opacity 250ms / 250ms;
				}

				/* #content:not(.hide) { */
					/* will-change: transition; */
					/* transition: opacity 250ms / 250ms; */
				/* } */

				#content tt.opener:first-child,
				#content tt.closer:last-child {
					display: none !important;
				}

				#content .markout-content {
					border: 0.075rem solid #9992;
					border-radius: 3px;
					position: relative;
					padding: 1em 2em;
					padding-inline-start: 2em;
					display: block;
					contain: style;
				}

				@media only screen and (max-width: 45rem) {
					:host {
						font-size: 85%;
					}
				}
			`,
		);
	}

	constructor() {
		super();

		this.flags = new.target.flags;
		this.name = `${this.tagName}-${++new.target.instance}`.toLocaleLowerCase();

		/** @type {HTMLSlotElement} */ const slot = this['::'];
		slot &&
			slot.addEventListener('slotchange', event => this.isConnected && this.updateMarkoutContent(slot), {
				passive: true,
			});
	}

	connectedCallback() {
		'renderedText' in this || (this.rendered = this.renderMarkoutContent(this.sourceText));
		super.connectedCallback();
	}

	scrollToAnchor(anchor) {
		/** @type {HTMLAnchorElement} */
		let target;
		const {'::content': content} = this;
		if (typeof anchor === 'string' && (anchor = anchor.trim()) !== '') {
			anchor = anchor.toLocaleLowerCase().replace(/^the-/, '');
			(target = content.querySelector(`a[id="${anchor}"]`))
				? target.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'nearest'})
				: console.warn('scrollIntoView: %o', {anchor, target});
		}
	}

	async updateMarkoutContent(slot = this['::']) {
		const assignedNodes = slot && slot.assignedNodes();
		if (assignedNodes.length) {
			return (this.rendered = this.renderMarkoutContent(this.sourceText || ''));
		}
	}

	/** @param {string} [sourceText] */
	async renderMarkoutContent(sourceText) {
		/** @type {HTMLSlotElement} */
		let contentSlot;
		/** @type {HTMLSlotElement} */
		let wrapperSlot;
		/** @type {string} */
		let sourceURL;

		({'::content': contentSlot, '#wrapper': wrapperSlot, sourceURL} = this);

		arguments.length || (sourceText = this.sourceText);

		if (sourceText === this['(markout source)']) return;
		this['(markout fragment)'] = undefined;
		if (!sourceText) return void (this['(markout source)'] = contentSlot.textContent = '');

		wrapperSlot.style.transition = contentSlot.style.transition = '0s';
		contentSlot.hidden = wrapperSlot.hidden = true;
		contentSlot.classList.add('hide');
		wrapperSlot.classList.add('hide');

		await new Promise(resolve => requestAnimationFrame(resolve));

		wrapperSlot.style.transition = contentSlot.style.transition = '';
		wrapperSlot.classList.remove('hide');
		wrapperSlot.hidden = false;

		contentSlot.textContent = '';
		const fragment = (this['(markout fragment)'] = await this.appendMarkoutContent(sourceText, contentSlot, sourceURL));

		this['(markout source)'] = sourceText;

		const timeout = new Promise(resolve => setTimeout(resolve, 150));

		fragment.assets !== null &&
			typeof fragment.assets === 'object' &&
			(fragment.markoutContentFlags.ASSET_INITIALIZATION === true ||
				(fragment.markoutContentFlags.ASSET_INITIALIZATION !== false &&
					fragment.markoutContentFlags.DOM_MUTATIONS !== false)) &&
			(fragment.assets.modules && fragment.assets.modules.forEach(this.instantiateLinkedModule, this),
			fragment.assets.scripts && fragment.assets.scripts.forEach(this.instantiateLinkedScript, this));

		await Promise.race([MarkoutContent.assets['style:styles/markout.css'], timeout]);

		await timeout;

		contentSlot.classList.remove('hide');
		contentSlot.hidden = false;

		if (this.rewriteAnchors) {
			const anchors = contentSlot.querySelectorAll('a[href]');
			anchors && this.rewriteAnchors([...anchors]);
		}
	}

	/** @param {string} sourceText @param {HTMLSlotElement} contentSlot @param {string} baseURL */
	async appendMarkoutContent(sourceText = this.sourceText, contentSlot = this['::content'], baseURL = this.baseURI) {
		const {fragment} = content.createRenderedFragment(sourceText);

		fragment.baseURL = baseURL;

		content.normalizeRenderedFragment(fragment, MarkoutContent.flags);

		contentSlot.appendChild(
			await (fragment.instantiated || (fragment.instantiated = this.instantiateMarkoutFragment(fragment))),
		);

		return {slot: contentSlot, sourceText, fragment, ...fragment};
	}

	async instantiateMarkoutFragment(fragment) {
		if (fragment.instantiated) return fragment.instantiated;

		const promises = [];

		(fragment.markoutContentFlags.SOURCE_TEXT_RENDERING === true ||
			(fragment.markoutContentFlags.SOURCE_TEXT_RENDERING !== false &&
				fragment.markoutContentFlags.DOM_MUTATIONS !== false)) &&
			promises.push(content.renderSourceTextsInFragment(fragment));

		(fragment.markoutContentFlags.ASSET_REMAPPING === true ||
			(fragment.markoutContentFlags.ASSET_REMAPPING !== false &&
				fragment.markoutContentFlags.DOM_MUTATIONS !== false)) &&
			promises.push(this.linkMarkoutFragment(fragment));

		promises.length && (await Promise.all(promises));

		return fragment;
	}

	async linkMarkoutFragment(fragment) {
		if (fragment.instantiated) return fragment.instantiated;

		if (fragment.markoutContentFlags.ASSET_REMAPPING) {
			content.populateAssetsInFragment(fragment);

			const baseURL = fragment.baseURL || fragment.baseURI;

			for (const link of fragment.assets) {
				const {base: baseAttribute, src: srcAttribute} = link.attributes;
				const src = srcAttribute.value;
				const base = baseAttribute ? baseAttribute.value : baseURL;
				baseAttribute && link.removeAttribute('base');
				link.setAttribute('link-base', base);
				link.setAttribute('link-src', src);
				link.setAttribute('src', (link.src = new URL(src, base)));
			}

			fragment.assets.stylesheets &&
				fragment.assets.stylesheets.length &&
				fragment.prepend(
					Object.assign(document.createElement('style'), {
						textContent: fragment.assets.stylesheets
							.map(stylesheet => (stylesheet.remove(), `@import "${stylesheet.src}";`))
							.join('\n'),
					}),
				);
		}

		return fragment;
	}

	/** @param {HTMLScriptElement} module */
	instantiateLinkedModule(module) {
		if (module['(markout host)'] === this || !module.isConnected) return;
		module['(markout host)'] = this;
		module.before(document.createComment(module.outerHTML.trim()));
		module.remove();
		module.src.startsWith(location.origin) &&
			/\?.*?\bdev\b/i.test(location.href) &&
			(module.src = module.src.replace(
				/(\?[^#]*|)(#.*|)$/,
				(m, query, hash) => `${query ? `${query}&` : '?'}dev${hash}`,
			));
		// console.log(module, module.src);
		dynamicImport(module.src);
	}

	/** @param {HTMLScriptElement} script */
	instantiateLinkedScript(script) {
		if (script['(markout host)'] === this || !script.isConnected) return;
		if (script.parentElement.nodeName === 'OUTPUT') {
			script['(markout host)'] = this;
			this.evaluateMarkoutScript(script);
		}
	}

	async evaluateMarkoutScript(script) {
		const {src} = script;
		const sourceText = await (await fetch(src)).text();
		await new Promise(requestAnimationFrame);
		document['--currentScript--'] = script;
		(0, eval)(`${sourceText}\ndelete document['--currentScript--']`);
	}

	/// Properties
	get sourceText() {
		const {childNodes, firstElementChild, renderedText} = this;
		if (renderedText || renderedText === '') return renderedText;

		if (firstElementChild && firstElementChild.nodeName === 'TEMPLATE') return firstElementChild.innerHTML.trim() || '';

		if (childNodes.length) {
			const innerHTML = this.innerHTML;
			const [, indent] = /^\n?([ \t*]*|)/.exec(innerHTML);
			return indent ? innerHTML.replace(new RegExp(`^${indent}`, 'mg'), '') : innerHTML.trim() || '';
		}
	}

	set sourceText(sourceText) {
		this.rendered = this.renderMarkoutContent(sourceText);
	}

	/// Constants

	static get MARKUP_SYNTAX_ATTRIBUTE() {
		return super.set('MARKUP_SYNTAX_ATTRIBUTE', content.MarkupAttributeMap.MarkupSyntax);
	}
	static get SOURCE_TYPE_ATTRIBUTE() {
		return super.set('SOURCE_TYPE_ATTRIBUTE', content.MarkupAttributeMap.SourceType);
	}
	static get MARKUP_MODE_ATTRIBUTE() {
		return super.set('MARKUP_MODE_ATTRIBUTE', content.MarkupAttributeMap.MarkupMode);
	}
}

try {
	customElements.define('markout-content', MarkoutContent);
} catch (exception) {
	console.warn(exception);
}

// const RewritableURL = /^(\.*(?=\/)[^?#\n]*\/)(?:([^/?#\n]+?)(?:(\.[a-z]+)|)|)(\?[^#]+|)(#.*|)$|/i;
const RewritableURL = /^(\.*(?=\/)[^?#\n]*\/|)(?:(?:([^/?#\n]+?)(?:(\.[a-z]+)|)|)|)(\?[^#]+|)(#.*|)$|/i;

const {dir, dirxml, group, groupCollapsed, groupEnd, log} = console;

const rewriteAnchors = (
	anchors,
	{sourceURL, baseURL, search, rootNode = document, debugging = import.meta['debug:hashout:anchor-rewrite']},
) => {
	debugging && groupCollapsed('%O ‹anchors› ', rootNode);

	for (const anchor of anchors) {
		const [matched, parent, name, extension = '.md', query = '', hash = ''] = RewritableURL.exec(
			anchor.getAttribute('href'),
		);

		debugging && log({matched, parent, name, extension, query, hash});

		if (parent) {
			const pathname = `${parent}${name ? `${name}${extension}` : ''}`;

			const href =
				name && extension.toLowerCase() === '.md'
					? `${baseURL}${search}#${new URL(pathname, sourceURL).pathname}${hash}`
					: new URL(`${pathname}${query || ((!hash && search) || '')}${hash}`, sourceURL);
			anchor.href = href;
		} else if (hash) {
			anchor.href = `${location}${matched}`;
		} else {
			anchor.target || (anchor.target = '_blank');
		}

		if (debugging && hash) debugger;
		debugging && dirxml(anchor);
	}

	debugging && groupEnd();
};

debugging('hashout', import.meta, [
	// import.meta.url.includes('/markout/lib/') ||
	typeof location === 'object' && /[?&]debug(?=[&#]|=[^&]*\bhashout|$)\b/.test(location.search),
	'anchor-rewrite',
]);

(async () => {
	await customElements.whenDefined('markout-content');

	/** @type {import('../elements/markout-content.js')['MarkoutContent']} */
	const MarkoutContent = customElements.get('markout-content');

	/**
	 * @typedef {HTMLAnchorElement} Anchor
	 */
	const ExtendedMarkoutContent = class extends MarkoutContent {
		async load(src) {
			arguments.length || (src = this.getAttribute('src'));
			if (!src) return;
			const url = new URL(src, this.baseURI);
			const response = await fetch(url);
			if (!response.ok) throw Error(`Failed to fetch ${url}`);
			const text = await response.text();
			this.sourceURL = url;
			this.sourceText = text || '';
		}

		/**
		 * @typedef {Array<Anchor>} Anchors
		 * @param {Anchors} anchors
		 */
		rewriteAnchors(...anchors) {
			const debugging = import.meta['debug:markout:anchor-rewrite'];
			const rootNode = this;
			const {sourceURL, baseURL = `/markout/`} = rootNode;
			const search = location.search || '';
			rewriteAnchors(anchors.flat(), {debugging, sourceURL, baseURL, search, rootNode});
		}
	};

	const sections = document.body.querySelectorAll('markout-content[src]');
	if (sections) {
		const {load, rewriteAnchors} = ExtendedMarkoutContent.prototype;
		for (const section of sections) {
			section.load || ((section.load = load), section.rewriteAnchors || (section.rewriteAnchors = rewriteAnchors)),
				section.load().catch(exception => (section.sourceText = `<pre>${exception}</pre>`));
		}
	}
})();

// console.log(import.meta.url, /[?&]debug\b/.test(import.meta.url));

debugging('markout', import.meta, [
	// import.meta.url.includes('/markout/lib/') ||
	// /[?](?:.*[&]|)debug\b/.test(import.meta.url) ||
	// (typeof location === 'object' && /[?&]debug(?=[&#]|=[^&]*\bmarkout|$)\b/.test(location.search)),
	/[?&]debug\b/.test(import.meta.url) || /[?&]debug\b/.test(location.search),
	'anchor-rewrite',
]);
//# sourceMappingURL=browser.js.map
