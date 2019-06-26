//@ts-check

export const {Playground, Fragments} = (() => {
	class Playground {
		/** @param {MarkoutPlayground} container */
		/** @param {BrowserPlaygroundTarget} [target] */
		static createBrowserPlayground(container, target) {
			target || (target = container.ownerDocument.createElement('iframe'));
			target.hidden = true;
			const placeholder = container.querySelector(':scope > output[here]');

			placeholder ? placeholder.parentElement.replaceChild(target, placeholder) : container.appendChild(target);
			// container.style['-webkit-overflow-scrolling'] = 'touch';
			return new Playground({container, target});
		}

		/** @param {Partial<Playground>} param0 */
		constructor({container, target, document, frame}) {
			/** @type {PlaygroundContainer} */
			this.container = container || undefined;

			// /** @type {{[name:string]: unknown}} */
			// this.meta = {};

			/** @type {{[name: string]: Fragments}} */
			this.fragments = {};

			if (target != null) {
				if (!Target.isTarget(target)) throw InvalidTarget('constructor', target);
				if (document != null && document !== target.contentDocument)
					throw MismatchedTargets('constructor', 'document', 'target');
				if (frame != null && frame !== target.contentWindow) throw MismatchedTargets('constructor', 'frame', 'target');
				document = target.contentDocument;
				frame = target.contentWindow;
			} else {
				target = {contentDocument: document, contentWindow: frame};
				if (!Target.isTarget(target)) throw MismatchedTargets('constructor', 'frame', 'document');
			}

			/** @type {PlaygroundTarget} */
			this.target = target || undefined;
		}

		/** @type {PlaygroundFrame} */
		get frame() {
			return (this.target && this.target.contentWindow) || undefined;
		}

		/** @type {PlaygroundDocument} */
		get document() {
			return (this.target && this.target.contentDocument) || undefined;
		}

		connect() {
			console.log('Connected — %O', this);
		}

		disconnect() {
			console.log('Disconnected — %O', this);
		}
	}

	class Fragments extends Array {
		/** @param {Document} [ownerDocument] */
		createFragment(ownerDocument) {
			return Fragments.createFragmentFromHTML(this.join('\n'), ownerDocument);
		}

		/** @param {HTMLScriptElement|HTMLStyleElement|HTMLTemplateElement} node @param {Document} [ownerDocument] */
		static cloneMetadataNode(node, ownerDocument) {
			const clone = (ownerDocument || document).createElement(node.nodeName);
			clone.textContent = node.textContent;
			//@ts-ignore
			for (const {name, value} of node.attributes) {
				clone.setAttribute(name, value);
			}
			return clone;
		}

		/** @param {string} html @param {Document} [ownerDocument] @returns {DocumentFragment} */
		static createFragmentFromHTML(html, ownerDocument) {
			/** @type {HTMLTemplateElement & {placeholder?: Comment | HTMLElement}} */
			let template;

			ownerDocument != null && ownerDocument !== document && typeof ownerDocument === 'object'
				? (template = Fragments.templates.get(ownerDocument)) !== undefined ||
				  Fragments.templates.set(ownerDocument, (template = ownerDocument.createElement('template')))
				: (template =
						Fragments.template || (Fragments.template = (ownerDocument = document).createElement('template')));

			template.innerHTML = html = html == null ? '' : `${html}`;

			template.placeholder || (template.placeholder = ownerDocument.createElement('slot'));

			//@ts-ignore
			for (const node of template.content.querySelectorAll('script,style')) {
				node.after(Fragments.cloneMetadataNode(node, ownerDocument));
				node.remove();
			}

			template.placeholder.remove();

			//@ts-ignore
			return template.content.cloneNode(true);
		}
	}

	/** @type {HTMLTemplateElement} */
	Fragments.template = undefined;

	/** @type {WeakMap<DocumentFragment, HTMLTemplateElement>} */
	Fragments.templates = new WeakMap();

	const Target = {};

	/** @param {string} message */
	Target.Error = function TargetError(message) {
		return Reflect.construct(TypeError, [...arguments], new.target || TargetError);
	};

	/** @template T @param {T} target @returns {T is PlaygroundTarget} */
	Target.isTarget = target =>
		target != null &&
		typeof target === 'object' &&
		//@ts-ignore
		(target.nodeName === 'IFRAME' ||
			//@ts-ignore
			(typeof target.contentDocument === 'object' &&
				(!('contentWindow' in target) ||
					//@ts-ignore
					(typeof target.contentWindow === 'object' && target.contentDocument.defaultView === target.contentWindow))));

	/** @param {string} method @param {PlaygroundTarget} target @param {string} [issue] */
	const InvalidTarget = (method, target, issue) =>
		Target.Error(
			`Playground ${method} invoked with an invalid target — ${issue ||
				`‹${
					target == null
						? target
						: typeof target === 'object'
						? Object.prototype.toString.call(target).replace(/^\s*\[?(?:object\s*|\s*)(.+?)\s*\]?\s*$/, '$1')
						: typeof target
				}› is not a valid target`}`,
		);

	/** @param {string} method @param {string} reference */
	const MismatchedTargets = (method, reference, target = 'iframe') =>
		Target.Error(
			`Playground ${method} invoked with mismatched ${reference} and ${target} — make sure they are all references of the same context or consider only passing the ${target} argument.`,
		);

	/** @param {string} method @param {string} [consideration] */
	const MissingTargets = (method, consideration) =>
		Target.Error(
			`Playground ${method} invoked without valid targets — ${consideration ||
				`make sure you are passing references to the targeted document and/or frame`}.`,
		);

	Playground.Fragments = Fragments;

	return {Fragments, Playground};
})();

/** @typedef {import('../elements/markout-playground.js').MarkoutPlayground} MarkoutPlayground */
/** @typedef {MarkoutPlayground} PlaygroundContainer */
/** @typedef {{hidden?: boolean, contentDocument: HTMLFrameElement['contentDocument'], contentWindow?: HTMLFrameElement['contentWindow']} | HTMLIFrameElement} PlaygroundTarget */
/** @typedef {PlaygroundTarget & HTMLIFrameElement} BrowserPlaygroundTarget */
/** @typedef {PlaygroundTarget['contentWindow']} PlaygroundFrame */
/** @typedef {PlaygroundTarget['contentDocument']} PlaygroundDocument */

/* */
// // METHOD 1 — Re-emplacement
// contentNode.before(template.placeholder);
// contentNode.remove();
// contentNode.textContent = contentNode.textContent;
// template.placeholder.before(contentNode);
