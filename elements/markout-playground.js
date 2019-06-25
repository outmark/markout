//@ts-check

// import {html, css, Component, Assets} from '../lib/components.js';
import {Playground} from '../lib/playground.js';

/** @type {import('./markout-content.js')['MarkoutContent']} */
const MarkoutContent = customElements.get('markout-content');
/** @type {import('../lib/components.js')['Component']} */
const Component = Object.getPrototypeOf(MarkoutContent);

export const MarkoutPlayground = (() => {
	/** @type {typeof MarkoutPlayground} */
	let component;

	if (globalThis.customElements && (component = customElements.get('markout-playground'))) return component;

	const PlaygroundInitialized = Symbol('playground.initialized');

	class MarkoutPlayground extends Component {
		constructor() {
			super();
			/** @type {Playground} */
			this.playground = undefined;
		}

		async connectedCallback() {
			//@ts-ignore
			await (this[PlaygroundInitialized] || (this[PlaygroundInitialized] = this.initializeMarkoutPlayground()));
			this.isConnected && this.playground.connect();
		}

		disconnectedCallback() {
			this.playground && this.playground.disconnect();
		}

		async initializeMarkoutPlayground() {
			// if (this.playground !== undefined && arguments[0] === this.playground) {
			// 	//@ts-ignore
			// 	if (this[PlaygroundInitialized]) return this[PlaygroundInitialized];
			// } else if (
			// 	this.playground === undefined &&
			// 	arguments[0] === undefined &&
			// 	//@ts-ignore
			// 	this[PlaygroundInitialized] === undefined
			// ) {
			// 	this.playground = Playground.createBrowserPlayground(this);
			// 	//@ts-ignore
			// 	return (this[PlaygroundInitialized] = this.initializeMarkoutPlayground(this.playground));
			// }

			// const playground = this.playground;

			const playground = (this.playground = Playground.createBrowserPlayground(this));

			//@ts-ignore
			playground[PlaygroundInitialized] = this[PlaygroundInitialized];

			const content = document.createDocumentFragment();

			const fragments = [];

			for (const element of this.querySelectorAll('pre[fragment], pre[script], pre[style]')) {
				const {
					fragment: fragmentAttribute,
					script: scriptAttribute,
					style: styleAttribute,
					'markup-syntax': syntaxAttribute,
				} = element.attributes;
				const node = {};
				if (fragmentAttribute) {
					node.tag = '#document-fragment';
					node.type =
						(syntaxAttribute.value === 'html' && 'text/html') || (syntaxAttribute.value === 'md' && 'text/markdown');
					// node.attributes = `type="${node.type}"`;
					node.body =
						syntaxAttribute.value === 'html'
							? element.textContent
							: `<markout-content>${element.textContent}</markout-content>`;
				} else if (scriptAttribute) {
					node.tag = 'script';
					node.type = scriptAttribute.value || (syntaxAttribute.value === 'js' && 'text/javascript') || 'text/plain';
					node.attributes = `type="${node.type}"${element.hasAttribute('async') ? ' async' : ''}${
						element.hasAttribute('defer') ? ' defer' : ''
					}`;
					node.body = element.textContent;
				} else if (styleAttribute) {
					node.tag = 'style';
					node.attributes = `type="${(node.type =
						styleAttribute.value || (syntaxAttribute.value === 'css' && 'text/css') || 'text/plain')}"`;
					node.body = element.textContent;
				}

				element['(playground-node)'] = node;

				if (node.tag && node.body) {
					const opener = `<${node.tag}${node.attributes ? ` ${node.attributes}` : ''}>`;
					const closer = `</${node.tag}>`;
					fragments.push((node.html = node.tag[0] === '#' ? node.body : `${opener}\n${node.body}\n${closer}`));
					element.setAttribute('data-markout-open-tag', opener);
					element.setAttribute('data-markout-close-tag', closer);
				}
			}

			// fragments.length && (content.textContent = fragments.join('\n'));

			await new Promise(requestAnimationFrame);
			await new Promise(requestAnimationFrame);

			{
				const {document, frame, target} = playground;

				const markoutContentModuleURL = import.meta.url.replace('/markout-playground.js', '/markout-content.js');
				const markoutContentStyleID = 'style:styles/markout.css';
				const markoutContentStyleURL = MarkoutContent.assets[markoutContentStyleID];

				// target.setAttribute(
				// 	'style',
				// 	`border: none; background: transparent; width: 100%; height: 100%; box-sizing: border-box; padding: 1em;`,
				// );

				document.head.append(
					Object.assign(document.createElement('base'), {
						href: this.ownerDocument.baseURI,
					}),
					Object.assign(document.createElement('link'), {
						id: markoutContentStyleID,
						rel: 'preload',
						as: 'style',
						href: markoutContentStyleURL,
					}),
					Object.assign(document.createElement('script'), {
						type: 'module',
						src: markoutContentModuleURL,
					}),
					Object.assign(document.createElement('link'), {
						rel: 'stylesheet',
						href: `${markoutContentStyleURL}`.replace('/markout.css', '/styles.css'),
					}),
				);

				// document.body.style.padding = '1em';
				document.documentElement.style.background = 'transparent';
				document.body.innerHTML = fragments.join('\n');

				// Import <markout-content>
				// frame.eval(`import("${import.meta.url.replace('/markout-playground.js', '/markout-content.js')}")`);

				await new Promise(requestAnimationFrame);
				await new Promise(requestAnimationFrame);
				target.hidden = false;
			}

			return playground;
		}
	}

	globalThis.customElements && customElements.define('markout-playground', (component = MarkoutPlayground));

	return component;
})();

// try {
// 	customElements.define('markout-playground', MarkoutPlayground);
// } catch (exception) {
// 	console.warn(exception);
// }
