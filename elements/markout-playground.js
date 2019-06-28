//@ts-check

import {Playground} from '../lib/playground.js';
import {encodeEntities} from '../lib/markup.js';

/** @type {any} */
const {
	// Attempts to overcome **__**
	'markout-playground-inject-bootstrap-link': INJECT_BOOTSTRAP_LINK = true,
	'markout-playground-inject-css-reset-link': INJECT_CSS_RESET_LINK = false,
	'markout-playground-inline-css-reset': INLINE_CSS_RESET = false,
} = import.meta;

export const MarkoutPlayground = (() => {
	/** @type {typeof MarkoutPlayground} */
	let component;

	if (globalThis.customElements && (component = customElements.get('markout-playground'))) return component;

	const PlaygroundInitialized = Symbol('playground.initialized');

	/** @type {import('./markout-content.js')['MarkoutContent']} */
	const MarkoutContent = customElements.get('markout-content');
	/** @type {import('../lib/components.js')['Component']} */
	const Component = Object.getPrototypeOf(MarkoutContent);

	const {MARKUP_SYNTAX_ATTRIBUTE} = MarkoutContent;

	// Event Handlers
	const {focus: focusElement} = {
		focus() {
			this.focus();
		},
	};

	class MarkoutPlayground extends Component {
		constructor() {
			super();
			/** @type {string | URL} */
			this.baseURL = undefined;
			/** @type {Playground} */
			this.playground = undefined;
			/** @type {HTMLTemplateElement} */
			this.template = undefined;

			// Hover when tapped on iOS
			this.onclick = focusElement;
		}

		async connectedCallback() {
			await (this[PlaygroundInitialized] || this.initializeMarkoutPlayground());
			this.isConnected && this.playground.connect();
		}

		disconnectedCallback() {
			this.playground && this.playground.disconnect();
		}

		initializeMarkoutPlayground() {
			const playground = (this.playground = Playground.createBrowserPlayground(this));

			//@ts-ignore
			playground.target.width = '100%';
			//@ts-ignore
			playground.target.height = '100%';

			const {
				head = (playground.fragments.head = new Playground.Fragments()),
				body = (playground.fragments.body = new Playground.Fragments()),
			} = playground.fragments;

			head.push(`<base href="${this.baseURL || this.baseURI}" />`);

			/** @type {IterableIterator<PlaygroundBlock>} */
			//@ts-ignore
			const blocks = this.querySelectorAll(
				`pre[markup-syntax][fragment], pre[markup-syntax][script], pre[markup-syntax][style]`,
			);

			//@ts-ignore
			for (const block of blocks) {
				const {
					fragment: fragmentAttribute,
					script: scriptAttribute,
					style: styleAttribute,
					[MARKUP_SYNTAX_ATTRIBUTE]: syntaxAttribute,
				} = block.attributes;
				if (fragmentAttribute == null && scriptAttribute == null && styleAttribute == null) continue;
				const node = {};

				if (fragmentAttribute) {
					//@ts-ignore
					node.body = 'sourceText' in block ? block.sourceText : block.textContent;
					node.tag = '#document-fragment';
					node.type = syntaxAttribute.value.toLowerCase();
					switch (node.type) {
						case 'md':
							node.type = 'markdown';
						case 'markdown':
						case 'markout':
							node.opener = '<markout-content>';
							node.closer = '</markout-content>';
							node.type = `text/${node.type}`;
							node.body = `<markout-content style="margin:0!important;padding:0!important;"><template>${node.body}</template></markout-content>`;
							// node.attributes = `type="${node.type}`;
							break;
						case 'html':
							node.type = 'text/html';
							// TODO: Fix character before </script> or </style> being dropped
							// node.body.replace(/(?=<\/(?:script|style)>)/g, '\u200B');
							break;
						default:
							node.tag = 'object';
							node.attributes = `${fragmentAttribute.value ? `type="${(node.type = fragmentAttribute.value)}" ` : ''}`;
							node.textContent = node.body;
							// Escaping the body here lends to more
							//   predictable fragments but will require
							//   unescaping later on.
							// TODO: Where can we safely unescape this?
							block.hasAttribute('preserve-entities') ||
								/\bhtml?\b|\bsvg\b/i.test(node.type) ||
								(node.body = encodeEntities(node.body));
					}
				} else if (scriptAttribute) {
					node.body = block.textContent;
					node.tag = 'script';
					node.type = scriptAttribute.value || (syntaxAttribute.value === 'js' && 'text/javascript') || 'text/plain';
					node.attributes = `type="${node.type}"${block.hasAttribute('async') ? ' async' : ''}${
						block.hasAttribute('defer') ? ' defer' : ''
					}`;
				} else if (styleAttribute) {
					node.body = block.textContent;
					node.tag = 'style';
					node.attributes = `type="${(node.type =
						styleAttribute.value || (syntaxAttribute.value === 'css' && 'text/css') || 'text/plain')}"`;
				}

				block['(playground-node)'] = node;

				if (node.tag && node.body) {
					const opener = `<${node.tag}${node.attributes ? ` ${node.attributes}` : ''}>`;
					const closer = `</${node.tag}>`;
					body.push((node.html = node.tag[0] === '#' ? node.body : `${opener}\n${node.body}\n${closer}`));

					block.setAttribute('line-numbers', '');
					block.setAttribute('line-wrap', '');
					block.setAttribute('data-markout-open-tag', node.opener || opener);
					block.setAttribute('data-markout-close-tag', node.closer || closer);
				}
			}

			return (playground[PlaygroundInitialized] = this[
				PlaygroundInitialized
			] = MarkoutPlayground.initializeMarkoutPlayground(playground));
		}

		/** @param {Playground} playground */
		static async initializeMarkoutPlayground(playground) {
			playground.target.hidden = true;

			// We wait at least one frame (more for Firefox particularly)
			//   But really UX wise it's best to request idle here!
			//@ts-ignore
			await new Promise(typeof requestIdleCallback === 'function' ? requestIdleCallback : requestAnimationFrame);

			// We might need to coerce styles which may be:
			INJECT_CSS_RESET_LINK
				? // 1. using a `reset.css`:
				  playground.fragments.head.push(
						`<link rel=stylesheet href="${`${MarkoutContent.assets['style:styles/markout.css']}`.replace(
							/[^/]+\.css/,
							'playground.css',
						)}"/>`,
				  )
				: INLINE_CSS_RESET &&
				  // 2. directly setting properties:
				  ((playground.document.documentElement.style.background = 'transparent'),
				  (playground.document.body.style.margin = '0'));

			// Injecting works better than playground.frame.eval(`import(…)`);
			INJECT_BOOTSTRAP_LINK &&
				playground.fragments.head.push(
					`<script type=module src="/markout/playground.js${
						/\?.*?\bdev\b/i.test(location.href) ? '?dev' : ''
					}"></script>`,
				);

			'head' in playground.fragments &&
				playground.fragments.head.length > 0 &&
				playground.document.head.appendChild(playground.fragments.head.createFragment(playground.document));

			'body' in playground.fragments &&
				playground.fragments.body.length > 0 &&
				playground.document.body.appendChild(playground.fragments.body.createFragment(playground.document));

			// We really need just the one frame here
			await new Promise(requestAnimationFrame);
			playground.target.hidden = false;

			return playground;
		}
	}

	globalThis.customElements && customElements.define('markout-playground', (component = MarkoutPlayground));

	return component;
})();

/** @typedef {HTMLElement['attributes']} HTMLElementAttributes */
/** @typedef {HTMLElementAttributes & Record<'fragment'|'script'|'style'|import('./markout-content.js')['MarkoutContent']['MARKUP_SYNTAX_ATTRIBUTE'], Attr>} PlaygroundBlockAttributes */
/** @typedef {HTMLPreElement & {attributes: PlaygroundBlockAttributes}} PlaygroundBlock */

// const markoutContentModuleURL = import.meta.url.replace('/markout-playground.js', '/markout-content.js');
// const markoutContentStyleID = 'style:styles/markout.css';
// const markoutContentStyleURL = MarkoutContent.assets[markoutContentStyleID];

// document.head.append(
// 	Object.assign(document.createElement('base'), {
// 		href: baseURI,
// 	}),
// 	// Object.assign(document.createElement('link'), {
// 	// 	id: markoutContentStyleID,
// 	// 	rel: 'preload',
// 	// 	as: 'style',
// 	// 	href: markoutContentStyleURL,
// 	// }),
// 	// Object.assign(document.createElement('script'), {
// 	// 	type: 'module',
// 	// 	src: markoutContentModuleURL,
// 	// }),
// 	// Object.assign(document.createElement('link'), {
// 	// 	rel: 'stylesheet',
// 	// 	href: `${markoutContentStyleURL}`.replace('/markout.css', '/styles.css'),
// 	// }),
// );
