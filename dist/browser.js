import { debugging } from '/markout/lib/helpers.js';
import '/markup/dist/tokenizer.browser.js';
import { d as defaults, c as createRenderedFragment, a as normalizeRenderedFragment, b as renderSourceTextsInFragment, p as populateAssetsInFragment, M as MarkupSyntaxAttribute, S as SourceTypeAttribute, e as MarkupModeAttribute } from './common.js';
import { Component } from './components.js';

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

// const defaults = import.meta['markout-content-defaults'] || (import.meta['markout-content-normalization'] = {});

// console.log({...components}, {...components.Component});

class MarkoutContent extends Component {
	/** @type {{[name: string]: boolean | undefined}} */
	static get flags() {
		const flags = Object.create(super.flags || null);

		for (const flag in defaults.flags) {
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
		const {fragment} = createRenderedFragment(sourceText);

		// fragment.markoutContentFlags = {...MarkoutContent.flags};
		fragment.baseURL = baseURL;

		// fragment.markoutContentFlags.DOM_MUTATIONS === false ||
		normalizeRenderedFragment(fragment, MarkoutContent.flags);
		// DOM_MUTATIONS === false || this.normalizeMarkoutFragment(fragment);

		contentSlot.appendChild(
			await (fragment.instantiated || (fragment.instantiated = this.instantiateMarkoutFragment(fragment))),
		);

		return {slot: contentSlot, sourceText, fragment, ...fragment};
	}

	// /** @param {DocumentFragment} fragment */
	// normalizeMarkoutFragment(fragment) {
	// 	// fragment.markoutContentFlags || (fragment.markoutContentFlags = {...MarkoutContent.flags});

	// 	content.normalizeMarkoutFragment(fragment);
	// 	// DOM_MUTATIONS !== false &&
	// 	// 	((BREAK_NORMALIZATION === true || DOM_MUTATIONS === true) && content.normalizeBreaksInFragment(fragment),
	// 	// 	(HEADING_NORMALIZATION === true || DOM_MUTATIONS === true) && content.normalizeHeadingsInFragment(fragment),
	// 	// 	(PARAGRAPH_NORMALIZATION === true || DOM_MUTATIONS === true) && content.normalizeParagraphsInFragment(fragment),
	// 	// 	(CHECKLIST_NORMALIZATION === true || DOM_MUTATIONS === true) && content.normalizeChecklistsInFragment(fragment),
	// 	// 	(DECLARATIVE_STYLING === true || DOM_MUTATIONS === true) && content.applyDeclarativeStylingInFragment(fragment));

	// 	// (TOKEN_FLATTENING === true || (TOKEN_FLATTENING !== false && DOM_MUTATIONS !== false)) &&
	// 	// 	content.flattenTokensInFragment(fragment);

	// 	return fragment;
	// }

	async instantiateMarkoutFragment(fragment) {
		if (fragment.instantiated) return fragment.instantiated;

		const promises = [];

		(fragment.markoutContentFlags.SOURCE_TEXT_RENDERING === true ||
			(fragment.markoutContentFlags.SOURCE_TEXT_RENDERING !== false &&
				fragment.markoutContentFlags.DOM_MUTATIONS !== false)) &&
			promises.push(renderSourceTextsInFragment(fragment));

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
			populateAssetsInFragment(fragment);

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
		return super.set('MARKUP_SYNTAX_ATTRIBUTE', MarkupSyntaxAttribute);
	}
	static get SOURCE_TYPE_ATTRIBUTE() {
		return super.set('SOURCE_TYPE_ATTRIBUTE', SourceTypeAttribute);
	}
	static get MARKUP_MODE_ATTRIBUTE() {
		return super.set('MARKUP_MODE_ATTRIBUTE', MarkupModeAttribute);
	}
}

try {
	customElements.define('markout-content', MarkoutContent);
} catch (exception) {
	console.warn(exception);
}

// 'DOM_MUTATIONS'
// 'BREAK_NORMALIZATION'
// 'HEADING_NORMALIZATION'
// 'PARAGRAPH_NORMALIZATION'
// 'CHECKLIST_NORMALIZATION'
// 'BLOCKQUOTE_NORMALIZATION'
// 'TOKEN_FLATTENING'
// 'DECLARATIVE_STYLING'
// 'SOURCE_TEXT_RENDERING'
// 'ASSET_REMAPPING'
// 'ASSET_INITIALIZATION'

// 	import.meta['markout-content-flags'] ||
// 	(import.meta['markout-content-flags'] = {
// 		DOM_MUTATIONS: import.meta['markout-content-dom-mutations'],
// 		BREAK_NORMALIZATION: import.meta['markout-content-break-normalization'],
// 		HEADING_NORMALIZATION: import.meta['markout-content-heading-normalization'],
// 		PARAGRAPH_NORMALIZATION: import.meta['markout-content-paragraph-normalization'],
// 		CHECKLIST_NORMALIZATION: import.meta['markout-content-checklist-normalization'],
// 		BLOCKQUOTE_NORMALIZATION: import.meta['markout-content-blockquote-normalization'],
// 		TOKEN_FLATTENING: import.meta['markout-content-token-flattening'],
// 		DECLARATIVE_STYLING: import.meta['markout-content-declarative-styling'],
// 		SOURCE_TEXT_RENDERING: import.meta['markout-content-source-text-rendering'],
// 		ASSET_REMAPPING: import.meta['markout-content-asset-remapping'],
// 		ASSET_INITIALIZATION: import.meta['markout-content-asset-initialization'],
// 	});

// ({
// 	DOM_MUTATIONS: flags.DOM_MUTATIONS = undefined,
// 	BREAK_NORMALIZATION: flags.BREAK_NORMALIZATION = undefined,
// 	HEADING_NORMALIZATION: flags.HEADING_NORMALIZATION = true,
// 	PARAGRAPH_NORMALIZATION: flags.PARAGRAPH_NORMALIZATION = true,
// 	CHECKLIST_NORMALIZATION: flags.CHECKLIST_NORMALIZATION = true,
// 	BLOCKQUOTE_NORMALIZATION: flags.BLOCKQUOTE_NORMALIZATION = true,
// 	TOKEN_FLATTENING: flags.TOKEN_FLATTENING = true,
// 	DECLARATIVE_STYLING: flags.DECLARATIVE_STYLING = true,
// 	SOURCE_TEXT_RENDERING: flags.SOURCE_TEXT_RENDERING = true,
// 	ASSET_REMAPPING: flags.ASSET_REMAPPING = true,
// 	ASSET_INITIALIZATION: flags.ASSET_INITIALIZATION = true,
// } = flags);

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
					? `${baseURL}${search}#${new URL(pathname, sourceURL).pathname}`
					: new URL(`${pathname}${query || ((!hash && search) || '')}${hash}`, sourceURL);
			anchor.href = href;
		} else if (hash) {
			anchor.href = `${location}${matched}`;
		} else {
			anchor.target || (anchor.target = '_blank');
		}

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
