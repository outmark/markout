export class Playground {
	/** @param {MarkoutPlayground} container */
	/** @param {Playground.Target} [target] */
	static createBrowserPlayground(container, target) {
		target || (target = container.ownerDocument.createElement('iframe'));
		target.hidden = true;
		container.appendChild(target);
		// target.srcdoc = '<html><head></head><body></body></html>';
		return new Playground({container, target});
	}

	/** @param {Partial<Playground>} param0 */
	constructor({container, target, document, frame}) {
		/** @type {Playground.Container} */
		this.container = container || undefined;

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

		/** @type {Playground.Target} */
		this.target = target || undefined;
	}

	/** @type {Playground.Frame} */
	get frame() {
		return (this.target && this.target.contentWindow) || undefined;
	}

	/** @type {Playground.Document} */
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

const Target = {};

/** @param {string} message */
Target.Error = function TargetError(message) {
	return Reflect.construct(TypeError, [...arguments], new.target || TargetError);
};

/** @template T @param {T} target @returns {T is Playground.Target} */
Target.isTarget = target =>
	target != null &&
	typeof target === 'object' &&
	(target.nodeName === 'IFRAME' ||
		(typeof target.contentDocument === 'object' &&
			(!('contentWindow' in target) ||
				(typeof target.contentWindow === 'object' && target.contentDocument.defaultView === target.contentWindow))));

/** @param {string} method @param {Playground.Target} target */
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

const MissingTargets = (method, consideration) =>
	Target.Error(
		`Playground ${method} invoked without valid targets — ${consideration ||
			`make sure you are passing references to the targeted document and/or frame`}.`,
	);

/** @typedef {MarkoutPlayground} Playground.Container */
/** @typedef {{contentDocument: HTMLFrameElement['contentDocument'], contentWindow?: HTMLFrameElement['contentWindow']}} Playground.Target */
/** @typedef {Playground.Target['contentWindow']} Playground.Frame */
/** @typedef {Playground.Target['contentDocument']} Playground.Document */

/** @typedef {import('../elements/markout-playground.js').MarkoutPlayground} MarkoutPlayground */
