import dynamicImport from '/browser/dynamic-import.js';
import {html, css, Component, Assets} from '../lib/components.js';
import * as renderer from '../lib/renderer.js';
import * as entities from '../lib/entities.js';
import {
	SourceTypeAttribute,
	MarkupModeAttribute,
	MarkupOptionsAttribute,
	MarkupSyntaxAttribute,
} from '../lib/constants.js';
import * as markup from '/markup/dist/tokenizer.browser.js';

const {
	'markout-content-dom-mutations': DOM_MUTATIONS = undefined,
	'markout-content-breaks-normalization': BREAKS_NORMALIZATION = undefined,
	'markout-content-headings-normalization': HEADINGS_NORMALIZATION = true,
	'markout-content-paragraph-normalization': PARAGRAPHS_NORMALIZATION = true,
	'markout-content-declarative-styling': DECLARATIVE_STYLING = true,
	'markout-content-source-text-rendering': SOURCE_TEXT_RENDERING = true,
} = import.meta;

const assets = new Assets({base: new URL('../', import.meta.url)}, 'style:styles/markout.css');

const stylesheet = assets['style:styles/markout.css'];

const styles = css`
	@import "${stylesheet}";

	:host {
		padding: 1rem 2rem;
		white-space: normal;
	}

	.hide {
		opacity: 0;
		display: block;
	}

	#wrapper {
		will-change: transition;
		transition: 375ms / 125ms;
	}

	#content {
		will-change: transition;
		transition: opacity 250ms;
	}

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
`;

export class MarkoutContent extends Component {
	constructor() {
		super();

		/** @type {(typeof MarkoutContent)['declarativeStyling']} */
		this.declarativeStyling = new.target.declarativeStyling;

		this.name = `${this.tagName}-${++new.target.instance}`.toLocaleLowerCase();

		/** @type {HTMLSlotElement} */ const slot = this['::'];
		slot && slot.addEventListener('slotchange', event => this.isConnected && this.updateContent(slot), {passive: true});
	}

	connectedCallback() {
		'renderedText' in this || this.renderContent(this.sourceText);
		super.connectedCallback();
	}

	async updateContent(slot = this['::']) {
		const assignedNodes = slot && slot.assignedNodes();
		if (assignedNodes.length) return this.renderContent(this.sourceText || '');
	}

	async renderContent(sourceText) {
		/** @type {this & {'::': HTMLSlotElement, '::content': HTMLSlotElement, '#wrapper': HTMLDivElement, '#links': HTMLDivElement, sourceURL?: string | URL}} */
		const {'::content': content, '::': slot = content, '#wrapper': wrapper, '#links': links, sourceURL} = this;

		arguments.length || (sourceText = this.sourceText);

		if (sourceText === this.renderedText) return;
		if (!sourceText) return void (this.renderedText = content.textContent = '');

		wrapper.style.transition = content.style.transition = '0s';
		content.hidden = wrapper.hidden = true;
		content.classList.add('hide');
		wrapper.classList.add('hide');
		await new Promise(resolve => requestAnimationFrame(resolve));

		wrapper.style.transition = content.style.transition = '';
		wrapper.classList.remove('hide');
		wrapper.hidden = false;

		await this.renderMarkdown(sourceText || this.sourceText, content);

		this.renderedText = sourceText;

		const timeout = new Promise(resolve => setTimeout(resolve, 150));

		if (links) {
			this.innerHTML = '';
			links.innerHTML = `<!-- Links from markout content: ${sourceURL || '‹text›'} -->\n`;
			const stylesheets = [];
			const baseURL = sourceURL || this.baseURI;

			for (const link of content.querySelectorAll(`script[src],style[src],img[src],source[src],video[src]`)) {
				const {nodeName, rel, baseURI, slot, parentElement, previousElementSibling} = link;
				if (slot && slot !== 'links') continue;
				const type = `${link.type || ''}`.trim().toLowerCase();
				const src = link.getAttribute('src');
				const href = link.getAttribute('href');
				const base = link.hasAttribute('base') ? baseURI : baseURL;
				const url = new URL(src || href, base);

				link.setAttribute('link-src', src);
				link.setAttribute('link-base', base);

				switch (nodeName) {
					case 'SCRIPT':
						if (type === 'module') {
							dynamicImport(url);
							link.remove();
							break;
						} else if (!type && parentElement && parentElement.nodeName === 'OUTPUT' && 'evaluateScript' in this) {
							link.src = url;
							this.evaluateScript(link);
							break;
						}
					case 'STYLE':
						if ((src && !type) || type === 'text/css') {
							stylesheets.push(url);
							link.remove();
							break;
						}
					case 'IMG':
					case 'VIDEO':
					case 'SRC':
						link.setAttribute('src', new URL(src, base));
						break;
					default:
						// TODO: Ensure base attribute bahviour holds
						// link.slot = 'links';
						link.setAttribute('base', base);
						links.appendChild(link);
				}

				!stylesheets.length ||
					links.appendChild(
						Object.assign(document.createElement('style'), {
							textContent: stylesheets.map(url => `@import "${url}";`).join('\n'),
						}),
					);
			}
		}

		await Promise.race([stylesheet, timeout]);
		await timeout;

		content.classList.remove('hide');
		content.hidden = false;

		if (this.rewriteAnchors) {
			const anchors = content.querySelectorAll('a[href]');
			anchors && this.rewriteAnchors([...anchors]);
		}
	}

	async renderMarkdown(sourceText = this.sourceText, slot = this['::content']) {
		const {fragment} = this.createRenderedMarkdownFragment(sourceText);

		slot.innerHTML = '';

		DOM_MUTATIONS !== false &&
			((BREAKS_NORMALIZATION === true || DOM_MUTATIONS === true) && this.normalizeBreaksInFragment(fragment),
			(HEADINGS_NORMALIZATION === true || DOM_MUTATIONS === true) && this.normalizeHeadingsInFragment(fragment),
			(PARAGRAPHS_NORMALIZATION === true || DOM_MUTATIONS === true) && this.normalizeParagraphsInFragment(fragment),
			(DECLARATIVE_STYLING === true || DOM_MUTATIONS === true) && this.applyDeclarativeStylingInFragment(fragment));

		SOURCE_TEXT_RENDERING && (await this.renderSourceTextsInFragment(fragment));

		slot.appendChild(fragment);
		this['(content)'] = {slot, sourceText, fragment, ...fragment};
	}

	createRenderedMarkdownFragment(sourceText) {
		let fragment, normalizedText, tokens;
		const {template = (this.template = document.createElement('template'))} = this;
		template.innerHTML = renderer.render(
			(tokens = renderer.tokenize((normalizedText = renderer.normalize(sourceText)))),
		);
		fragment = template.content.cloneNode(true);
		fragment.fragment = fragment;
		fragment.sourceText = sourceText;
		fragment.normalizedText = normalizedText;
		fragment.tokens = tokens;
		return fragment;
	}

	normalizeBreaksInFragment(fragment) {
		for (const br of fragment.querySelectorAll('br')) {
			const {previousSibling, nextSibling, parentElement} = br;
			(!previousSibling ||
				previousSibling.nodeName !== 'SPAN' ||
				!nextSibling ||
				nextSibling.nodeName !== 'SPAN' ||
				(parentElement && !/^(?:CODE|PRE|LI)$/.test(parentElement.nodeName))) &&
				br.remove();
		}
	}

	normalizeHeadingsInFragment(fragment) {
		const {MarkdownIdentity: Identity, MarkdownIdentityPrefixer: Prefixer, MarkdownIdentityJoiner: Joiner} = entities;
		const {headings = (fragment.headings = {})} = fragment;
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
	}

	normalizeParagraphsInFragment(fragment) {
		let empty, span;
		if ((empty = fragment.querySelectorAll('p:empty')).length) {
			(span = document.createElement('span')).append(...empty);
			// console.log({empty, content: span.innerHTML});
		}
	}

	applyDeclarativeStylingInFragment(fragment) {
		const {declarativeStyling: {apply, selector} = {}} = this;
		if (typeof apply !== 'function' || typeof selector !== 'string' || selector === '') return;
		for (const element of fragment.querySelectorAll(selector)) apply(element);
	}

	renderSourceTextsInFragment(fragment) {
		const promises = [];

		for (const element of fragment.querySelectorAll(`[${SourceTypeAttribute}]:not(:empty)`))
			promises.push(
				this.renderSourceText({
					element,
					sourceType: element.getAttribute(MarkupModeAttribute) || element.getAttribute(SourceTypeAttribute),
					sourceText: element.textContent,
				}),
			);

		return promises.length ? Promise.all(promises) : Promise.resolve();
	}

	/**
	 * @param {Partial<{element: HTMLElement, sourceType: string, sourceText: String}>} options
	 * @returns {Promise<HTMLElement>}
	 */
	async renderSourceText(options) {
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
		await markup.render(sourceText, {sourceType, fragment});
		element.appendChild(fragment);

		return element;
	}

	async evaluateScript(script) {
		const {src} = script;
		const sourceText = await (await fetch(src)).text();
		await new Promise(requestAnimationFrame);
		document['--currentScript--'] = script;
		(1, eval)(`${sourceText}\ndelete document['--currentScript--']`);
	}

	scrollToAnchor(anchor) {
		/** @type {HTMLAnchorElement} */
		let target;
		const {'::content': content} = this;
		if (anchor)
			(target = content.querySelector(`a[id="${anchor}"]`))
				? target.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'nearest'})
				: console.warn('scrollIntoView: %o', {anchor, target});
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
		this.renderContent(sourceText);
	}
}

try {
	MarkoutContent.shadowRoot = {mode: 'closed'};

	MarkoutContent.styles = styles;

	MarkoutContent.template = html`
		<slot inert hidden style="display:none;"></slot>
		<slot id="styles" name="styles"></slot>
		<div id="links"></div>
		<div id="wrapper">
			<slot id="content" class="markout-content" name="content"></slot>
		</div>
	`;

	MarkoutContent.declarativeStyling = (() => {
		const declarativeStyling = {
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
		};

		Initialization: {
			const {getOwnPropertyNames, setPrototypeOf, getPrototypeOf, freeze, keys} = Object;
			const {lookup} = declarativeStyling;
			const Filter = /^(?!webkit[A-Z])(?!moz[A-Z])[a-zA-Z]{2,}$/;
			const Boundary = /[a-z](?=[A-Z])/g;
			const selectors = [];
			const style = (MarkoutContent.template.firstElementChild || document.createElement('span')).style;

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
		}

		return declarativeStyling;
	})();

	// console.log({...MarkoutContent});

	customElements.define('markout-content', MarkoutContent);
} catch (exception) {
	console.warn(exception);
}

const START_OF_TEXT = '\x02';
// const CARRIAGE_RETURN = '\x0D';
// const LINE_FEED = '\x0A';
// const START_OF_CONTENT = START_OF_TEXT;
