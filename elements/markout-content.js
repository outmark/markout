//@ts-check
import dynamicImport from '/browser/dynamic-import.js';
import '../lib/content/dom.js';
import {content} from '../lib/content.js';
import {Component} from '../lib/components.js';

export class MarkoutContent extends Component {
	/** @type {{[name: string]: boolean | undefined}} */
	static get flags() {
		//@ts-ignore
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
		return super.set('shadowRoot', /** @type {ShadowRootInit} */ ({mode: 'closed'}));
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
		//@ts-ignore
		this.name = `${this.tagName}-${++new.target.instance}`.toLocaleLowerCase();

		this.renderedText = /** @type {string} */ (undefined);

		/** @type {HTMLSlotElement} */ const slot = this['::'];
		slot &&
			slot.addEventListener(
				'slotchange',
				/** @param {Event} event */ event => this.isConnected && this.updateMarkoutContent(slot),
				{
					passive: true,
				},
			);
	}

	connectedCallback() {
		if (this === undefined) this.rendered = this.renderMarkoutContent(this.sourceText);
		super.connectedCallback();
	}

	disconnectedCallback() {
		if (super.disconnectedCallback) super.disconnectedCallback();
		if (this.untilDisclosed.resolver) this.untilDisclosed.resolver();
	}

	scrollToAnchor(anchor) {
		/** @type {HTMLAnchorElement} */
		let target;
		//@ts-ignore
		const {'::content': contentSlot} = this;
		if (typeof anchor === 'string' && (anchor = anchor.trim()) !== '') {
			anchor = anchor.toLocaleLowerCase().replace(/^the-/, '');
			(target = contentSlot.querySelector(`a[id="${anchor}"]`))
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

		//@ts-ignore
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

		this['(markout source)'] = sourceText;

		await this.untilVisible();
		if (!this.isDisclosed) {
			this.renderedText = '';
			return;
		}

		import.meta['debug:markout-content:rendered-counter'] && console.count('rendered');

		const fragment = (this['(markout fragment)'] = await this.appendMarkoutContent(sourceText, contentSlot, sourceURL));

		// this['(markout source)'] = sourceText;

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

		//@ts-ignore
		if (this.rewriteAnchors) {
			const anchors = contentSlot.querySelectorAll('a[href]');
			//@ts-ignore
			anchors && this.rewriteAnchors([...anchors]);
		}

		for (const details of contentSlot.querySelectorAll(
			`${
				//@ts-ignore
				/\?.*?\bdetails(?:=open|)\b/.test(location) ? 'details:not([markout-details=normal]):not([open]),' : ''
			} details:not(open)[markout-details=open]`,
		)) {
			//@ts-ignore
			details.open = true;
		}
	}

	async untilVisible() {
		return this.untilDisclosed();
	}

	async untilDisclosed() {
		let promise, closure, node;
		if (!this.hasOwnProperty('untilDisclosed')) {
			Object.defineProperties(this, {
				untilDisclosed: {value: this.untilDisclosed.bind(this), writable: false},
			});
			Object.defineProperties(this.untilDisclosed, {
				awaiter: {
					value: (resolver, rejecter) =>
						void ((this.untilDisclosed.resolver = resolver), (this.untilDisclosed.rejecter = rejecter)),
					writable: false,
					configurable: false,
				},
				rejecter: {value: undefined, writable: true, configurable: false},
				resolver: {value: undefined, writable: true, configurable: false},
				promise: {value: undefined, writable: true, configurable: false},
			});
		}
		node = this;
		if (this.isConnected) {
			while (!!node && node !== this.ownerDocument && !(closure = node.closest('details:not([open])'))) {
				node = node.getRootNode();
				node.host && (node = node.host);
			}
		}
		promise = this.untilDisclosed.promise;
		this.isDisclosed = this.isConnected && !closure;
		if (closure) {
			if (!promise) {
				closure.addEventListener('toggle', this.untilDisclosed, {once: true});
				await (promise = this.untilDisclosed.promise = new Promise(this.untilDisclosed.awaiter));
				if (this.untilDisclosed.promise === promise) {
					this.untilDisclosed.resolver = this.untilDisclosed.rejecter = this.untilDisclosed.promise = undefined;
				}
			} else {
				await promise;
			}
		} else if (promise) {
			this.untilDisclosed.resolver();
			// this.untilDisclosed.resolver = this.untilDisclosed.rejecter = this.untilDisclosed.promise = undefined;
		}
		// await promise;
		return this;
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
				const {base: baseAttribute, [link.nodeName === 'SOURCE' ? 'srcset' : 'src']: srcAttribute} = link.attributes;
				const base = baseAttribute ? baseAttribute.value : baseURL;
				baseAttribute && link.removeAttribute('base');
				link.setAttribute('link-base', base);
				if (srcAttribute) {
					const attribute = srcAttribute.name;
					const [href] = srcAttribute.value.split(/\s/, 1);
					link.setAttribute(`link-${attribute}`, href);
					link.setAttribute(attribute, (link[attribute] = new URL(href, base)));
				}
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
		//@ts-ignore
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

/// Debugging
import {debugging} from '/markout/lib/helpers.js';

debugging('markout-content', import.meta, [
	typeof location === 'object' && /[?&]debug(?=[&#]|=[^&]*\bmarkout-content|$)\b/.test(location.search),
	'rendered-counter',
]);
