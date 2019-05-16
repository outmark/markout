import dynamicImport from '/browser/dynamicImport.js';
import {html, css, Component, Assets} from '../lib/components.js';
import * as renderer from '../lib/renderer.js';
import * as entities from '../lib/entities.js';
import * as markup from '/markup/dist/tokenizer.browser.js';

const {
	'markout-content-normalization': CONTENT_NORMALIZATION = undefined,
	'markout-content-breaks-normalization': BREAKS_NORMALIZATION = undefined,
	'markout-content-headings-normalization': HEADINGS_NORMALIZATION = true,
	'markout-content-paragraph_normalization': PARAGRAPHS_NORMALIZATION = true,
	'markout-content-source-text-rendering': SOURCE_TEXT_RENDERING = true,
} = import.meta;

const assets = new Assets({base: new URL('../', import.meta.url)}, 'style:styles/markout.css');

const {SourceType, MarkupSyntax} = renderer;

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

		this.name = `${this.tagName}-${++new.target.instance}`.toLocaleLowerCase();

		/** @type {SLOT} */ const slot = this['::'];
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
		/** @type {this & {'::': SLOT, '::content': SLOT, '#wrapper': DIV, '#links': DIV, sourceURL?: string | URL}} */
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

			for (const link of content.querySelectorAll(`script[src],style[src]`)) {
				const {nodeName, rel, baseURI, slot, parentElement, previousElementSibling} = link;
				if (slot && slot !== 'links') continue;
				const type = `${link.type || ''}`.trim().toLowerCase();
				const src = link.getAttribute('src');
				const href = link.getAttribute('href');
				const base = link.hasAttribute('base') ? baseURI : baseURL;
				const url = new URL(src || href, base);
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

	scrollToAnchor(anchor) {
		/** @type {HTMLAnchorElement} */
		let target;
		const {'::content': content} = this;
		anchor && (target = content.querySelector(`a[id="${anchor}"]`))
			? target.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'nearest'})
			: console.warn('scrollIntoView: %o', {anchor, target});
	}

	async evaluateScript(script) {
		const {src} = script;
		const sourceText = await (await fetch(src)).text();
		await new Promise(requestAnimationFrame);
		document['--currentScript--'] = script;
		(1, eval)(`${sourceText}\ndelete document['--currentScript--']`);
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

	renderSourceTextsInFragment(fragment) {
		const promises = [];

		for (const node of fragment.querySelectorAll(`[${SourceType}]:not(:empty)`))
			promises.push(this.renderSourceText({element: node, sourceType: node.getAttribute(SourceType)}));

		return promises.length ? Promise.all(promises) : Promise.resolve();
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

	async renderMarkdown(sourceText = this.sourceText, slot = this['::content']) {
		const {fragment} = this.createRenderedMarkdownFragment(sourceText);

		slot.innerHTML = '';

		CONTENT_NORMALIZATION !== false &&
			((BREAKS_NORMALIZATION || CONTENT_NORMALIZATION === true) && this.normalizeBreaksInFragment(fragment),
			(HEADINGS_NORMALIZATION || CONTENT_NORMALIZATION === true) && this.normalizeHeadingsInFragment(fragment),
			(PARAGRAPHS_NORMALIZATION || CONTENT_NORMALIZATION === true) && this.normalizeParagraphsInFragment(fragment));

		SOURCE_TEXT_RENDERING && (await this.renderSourceTextsInFragment(fragment));

		slot.appendChild(fragment);
		this['(content)'] = {slot, sourceText, fragment, ...fragment};
	}

	/**
	 * @param {HTMLElement} element
	 * @param {string} [sourceType]
	 * @param {string} [sourceText]
	 */
	async renderSourceText({element, sourceType, sourceText}) {
		let fragment, lastChild;

		if (
			!element ||
			!(sourceType || (sourceType = element.getAttribute(SourceType))) ||
			!(sourceText || (sourceText = (!element.hasAttribute(MarkupSyntax) && element.textContent) || ''))
		)
			return;

		element.removeAttribute(SourceType);
		element.setAttribute(MarkupSyntax, sourceType);
		fragment = document.createDocumentFragment();
		element.textContent = '';
		// sourceText = sourceText.replace(/^\t+/gm, indent => '  '.repeat(indent.length));
		element.sourceText = sourceText;
		// await markup.render(`${sourceText}\0\n`, {sourceType, fragment});
		await markup.render(sourceText, {sourceType, fragment});
		// fragment.normalize();
		// lastChild = fragment;
		// while (lastChild) {
		// 	lastChild.normalize();
		// 	if (lastChild.nodeType === fragment.TEXT_NODE) {
		// 		let {textContent} = lastChild;
		// 		(textContent = textContent.slice(0, textContent.lastIndexOf('\0\n')))
		// 			? (lastChild.textContent = textContent)
		// 			: lastChild.remove();
		// 		break;
		// 	} else {
		// 		lastChild = lastChild.lastChild;
		// 	}
		// }
		element.appendChild(fragment);
		// !element ||
		// 	!(sourceType || (sourceType = element.getAttribute(SourceType))) ||
		// 	!(sourceText || (sourceText = (!element.hasAttribute(MarkupSyntax) && element.textContent) || '')) ||
		// 	void element.removeAttribute(SourceType) ||
		// 	void element.setAttribute(MarkupSyntax, sourceType) ||
		// 	(element.textContent = '') ||
		// 	(fragment = await markup.render((element.sourceText = sourceText), {
		// 		sourceType,
		// 		fragment: document.createDocumentFragment(),
		// 	})).normalize() ||
		// 	element.appendChild(fragment);
		// return;
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

	customElements.define('markout-content', MarkoutContent);
} catch (exception) {
	console.warn(exception);
}

const START_OF_TEXT = '\x02';
const CARRIAGE_RETURN = '\x0D';
const LINE_FEED = '\x0A';
const START_OF_CONTENT = START_OF_TEXT;

/** @typedef {HTMLSlotElement} SLOT */
/** @typedef {HTMLDivElement} DIV */
