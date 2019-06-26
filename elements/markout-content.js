import dynamicImport from '/browser/dynamic-import.js';
import * as content from '../lib/content.js';
import {Component} from '../lib/components.js';

const {
	'markout-content-dom-mutations': DOM_MUTATIONS = undefined,
	'markout-content-break-normalization': BREAK_NORMALIZATION = undefined,
	'markout-content-heading-normalization': HEADING_NORMALIZATION = true,
	'markout-content-paragraph-normalization': PARAGRAPH_NORMALIZATION = true,
	'markout-content-checklist-normalization': CHECKLIST_NORMALIZATION = true,
	'markout-content-token-flattening': TOKEN_FLATTENING = true,
	'markout-content-declarative-styling': DECLARATIVE_STYLING = true,
	'markout-content-source-text-rendering': SOURCE_TEXT_RENDERING = true,
	'markout-content-asset-remapping': ASSET_REMAPPING = true,
	'markout-content-asset-initialization': ASSET_INITIALIZATION = true,
} = import.meta;

// console.log({...components}, {...components.Component});

export class MarkoutContent extends Component {
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

		(ASSET_INITIALIZATION === true || (ASSET_INITIALIZATION !== false && DOM_MUTATIONS !== false)) &&
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
		DOM_MUTATIONS === false || this.normalizeMarkoutFragment(fragment);

		contentSlot.appendChild(
			await (fragment.instantiated || (fragment.instantiated = this.instantiateMarkoutFragment(fragment))),
		);

		return {slot: contentSlot, sourceText, fragment, ...fragment};
	}

	/** @param {DocumentFragment} fragment */
	normalizeMarkoutFragment(fragment) {
		DOM_MUTATIONS !== false &&
			((BREAK_NORMALIZATION === true || DOM_MUTATIONS === true) && content.normalizeBreaksInFragment(fragment),
			(HEADING_NORMALIZATION === true || DOM_MUTATIONS === true) && content.normalizeHeadingsInFragment(fragment),
			(PARAGRAPH_NORMALIZATION === true || DOM_MUTATIONS === true) && content.normalizeParagraphsInFragment(fragment),
			(CHECKLIST_NORMALIZATION === true || DOM_MUTATIONS === true) && content.normalizeChecklistsInFragment(fragment),
			(DECLARATIVE_STYLING === true || DOM_MUTATIONS === true) && content.applyDeclarativeStylingInFragment(fragment));

		(TOKEN_FLATTENING === true || (TOKEN_FLATTENING !== false && DOM_MUTATIONS !== false)) &&
			content.flattenTokensInFragment(fragment);

		return fragment;
	}

	async instantiateMarkoutFragment(fragment) {
		if (fragment.instantiated) return fragment.instantiated;

		const promises = [];

		(SOURCE_TEXT_RENDERING === true || (SOURCE_TEXT_RENDERING !== false && DOM_MUTATIONS !== false)) &&
			promises.push(content.renderSourceTextsInFragment(fragment));

		(ASSET_REMAPPING === true || (ASSET_REMAPPING !== false && DOM_MUTATIONS !== false)) &&
			promises.push(this.linkMarkoutFragment(fragment));

		promises.length && (await Promise.all(promises));

		return fragment;
	}

	async linkMarkoutFragment(fragment) {
		if (fragment.instantiated) return fragment.instantiated;

		if (ASSET_REMAPPING) {
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
		(1, eval)(`${sourceText}\ndelete document['--currentScript--']`);
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
		return super.set('MARKUP_SYNTAX_ATTRIBUTE', content.MarkupSyntaxAttribute);
	}
	static get SOURCE_TYPE_ATTRIBUTE() {
		return super.set('SOURCE_TYPE_ATTRIBUTE', content.SourceTypeAttribute);
	}
	static get MARKUP_MODE_ATTRIBUTE() {
		return super.set('MARKUP_MODE_ATTRIBUTE', content.MarkupModeAttribute);
	}
}

try {
	customElements.define('markout-content', MarkoutContent);
} catch (exception) {
	console.warn(exception);
}
