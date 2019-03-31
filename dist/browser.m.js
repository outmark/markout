import { entities, tokenize as tokenize$1, encodeEntities, render as render$1 } from '../../../markup/dist/tokenizer/tokenizer.browser.js';

// @ts-check

/** @type {TaggedTemplate<string, any>} */
const css = (options => {
  const {raw} = String;

  options = {...options};
  const prefixed = [...options.prefixed];
  const prefixes = {'[default]': undefined, ...options.prefixes};
  prefixes['[default]'] = Object.freeze(prefixes['[default]'] || ['-webkit', '-moz']);
  for (const prefix of prefixed) {
    prefixes[prefix] || (prefixes[prefix] = prefixes['[default]']);
  }
  Object.freeze(prefixes);
  const NOTHING = raw`-\/\*\*\/-`;
  const COMMENT = raw`\/\*[^]*?\*\/`;
  const SEGMENT = raw`\s*\b({{property}})\b\s*:\s*([^]+?)\s*;`
    .replace('{{property}}', prefixed.join('|') || NOTHING)
    .replace(/{{.*?}}/g, NOTHING);
  const IGNORED = raw`.*?`;
  const CSS = raw`${COMMENT}|(${SEGMENT})|${IGNORED}`;
  const matcher = new RegExp(CSS, 'g');
  const replacer = (match, segment, property, value) => {
    let head, tail, segments, lhs, rhs;
    if (segment) {
      if (property) {
        const valuePrefixes = prefixes[`${property}:${value}`];
        const propertyPrefixes = prefixes[property];
        if (
          !(valuePrefixes && valuePrefixes.length) &&
          !(propertyPrefixes && propertyPrefixes.length)
        ) {
          return match;
        }
        segment = segment.trim();
        [head, tail] = match.split(segment);
        segments = [match];
        if (valuePrefixes && valuePrefixes.length) {
          [lhs, rhs] = segment.split(/\s*:\s*/);
          for (const prefix of valuePrefixes) {
            segments.push(
              `${head}${(propertyPrefixes && propertyPrefixes.includes(prefix) && `${prefix}-`) ||
                ''}${lhs}: ${prefix}-${rhs}${tail}`,
            );
          }
          // segments.push(match);
        } else if (propertyPrefixes && propertyPrefixes.length) {
          for (const prefix of propertyPrefixes) {
            segments.push(`${head}${prefix}-${segment}${tail}`);
          }
        }
        return segments.join('');
      }
    }
    return match;
  };

  const RAW_INDENT = /(?:\\t|[\t ]+)*$/;
  const RAW_TABS = /\\t/g;
  const TAB = '\t';
  const STRING_INDENT = /^\n?([\t ]*)/;

  /** @type {(rawString: string, value: string) => string} */
  const reindent = (rawString, value) => {
    const [, stringIndent] = (value && STRING_INDENT.exec(value)) || '';
    if (stringIndent) {
      const matcher =
        reindent[stringIndent] ||
        (reindent[stringIndent] = new RegExp(raw`^${stringIndent}`, 'mg'));
      const [rawIndent] = RAW_INDENT.exec(rawString);
      const replacer = rawIndent.replace(RAW_TABS, TAB);
      const newValue = value.replace(matcher, replacer);
      // console.log('%o', {
      //   string: {rawString, rawIndent, matcher},
      //   value: {value, stringIndent, replacer, newValue},
      // });
      return newValue;
    }
    return value;
  };

  const css = (strings, ...values) => {
    const rawStrings = strings.raw;
    for (let i = 0, n = rawStrings.length; n--; i++) {
      const rawString = rawStrings[i];
      const value = values[i];
      if (value && typeof value === 'string') {
        values[i] = reindent(rawString, value);
      }
    }
    const source = Reflect.apply(raw, null, [strings, ...values]);
    const style = source.replace(matcher, replacer);
    return style;
  };

  Object.defineProperty(css, 'prefixes', {value: Object.freeze(prefixes)});
  return css;
})({
  prefixes: {'backdrop-filter': ['-webkit'], position: [], 'position:sticky': ['-webkit']},
  prefixed: ['user-select', 'backdrop-filter', 'position'],
});

/**
 * @template T, V
 * @typedef {import('./templates').TaggedTemplate<T, V>} TaggedTemplate
 */

// @ts-check

/** @typedef {{raw: TemplateStringsArray['raw']}} RawStrings */
/** @typedef {TemplateStringsArray | RawStrings} TemplateStrings */

/**
 * @template T
 * @template V
 * @typedef {(strings: TemplateStrings, ...values: V[]) => T} TaggedTemplate
 */

/**
 * @template T
 * @typedef {TaggedTemplate<T, {toString(): string | void} | {} | void>} StringTaggedTemplate
 */

/** @type {StringTaggedTemplate<string>} */
const raw = String.raw;

/**
 * @template T
 * @typedef {TaggedTemplate<T, {toString(): string | void} | DocumentFragment | HTMLElement | {} | void>} HTMLTaggedTemplate
 */

/** @returns {HTMLTaggedTemplate<HTMLTemplateElement>} */
const template = (template = document.createElement('template')) => (strings, ...values) => {
  let index = 0;
  for (const value of values) {
    typeof value === 'string' ||
      (values[index] = `${value &&
        ('innerHTML' in value
          ? value.innerHTML
          : 'childNodes' in value && value.childNodes.length
          ? ((template.innerHTML = ''),
            template.content.appendChild(value.cloneNode(true)),
            template.innerHTML)
          : value)}`);
    index++;
  }
  template.innerHTML = raw(strings, ...values);
  return template;
};
template.html = template;

const html = (template => {
  /** @type {HTMLTaggedTemplate<DocumentFragment>} */
  return (...args) => {
    const content = document.createDocumentFragment();
    content.appendChild(Reflect.apply(template, null, args).content);
    return content;
  };
})(template());

// /**
//  * @param {TemplateStringsArray | {raw: string[]}} strings
//  * @param {*} values
//  * @returns {string}
//  */
// export function css(strings, ...values) {
//   const source = raw(strings, ...values);
//   const style = source.replace(css.matcher, css.matcher.replacer);
//   console.log({style});
//   return style;
// }

// css.prefix = ['user-select'];

const hasOwnProperty = Function.call.bind(Object.prototype.hasOwnProperty);

const {defineProperty, defineProperties, assign, getOwnPropertyDescriptor, getOwnPropertyNames} = Object;

/**
 * @template {{[name: K]: V}} T
 * @template {string|symbol} K
 * @template V
 * @param {T} target
 * @param {K} property
 * @param {V} value
 */
const updateProperty = (target, property, value) => (
  !target ||
    !property ||
    ((!hasOwnProperty(target, property) ||
      (getOwnPropertyDescriptor(property) || '').configurable !== false) &&
      defineProperty(target, property, {
        get: () => value,
        set: value => updateProperty(target, property, value),
        configurable: true,
      })),
  target
);

/** @typedef {import('./attributes')['Attributes']} Attributes */

class Component extends HTMLElement {
  /** @type {Attributes<string> | undefined} */
  static get attributes() {}

  static set attributes(value) {
    this === Component || updateProperty(this, 'attributes', value);
  }

  /** @type {string[]} */
  static get observedAttributes() {
    return this.attributes;
  }

  static set observedAttributes(value) {
    this === Component || updateProperty(this, 'observedAttributes', value);
  }

  /** @type {{mode: 'open' | 'closed'} | undefined} */
  static get shadowRoot() {}

  static set shadowRoot(value) {
    this === Component || updateProperty(this, 'shadowRoot', value);
  }

  /** @type {DocumentFragment | undefined} */
  static get template() {}

  static set template(value) {
    this === Component || updateProperty(this, 'template', value);
  }

  /** @type {DocumentFragment | undefined} */
  static get styles() {}

  static set styles(value) {
    this === Component || updateProperty(this, 'styles', value);
  }

  constructor() {
    /** @type {this} */
    const host = super();

    const constructor = new.target;
    const {
      prototype,
      attributes,
      template,
      styles,
      shadowRoot,
      initializeRoot = Component.initializeRoot,
    } = constructor;

    const root =
      /** @type {ShadowRoot} */
      (shadowRoot && (shadowRoot === 'closed' && host.attachShadow({mode: 'closed'}))) ||
      ((shadowRoot === true || shadowRoot === 'open') && host.attachShadow({mode: 'open'})) ||
      (typeof shadowRoot === 'object' && 'mode' in shadowRoot && host.attachShadow(shadowRoot)) ||
      host;

    root === host && (host.style.visibility = 'hidden');

    /** @type {HTMLStyleElement} */
    let style;
    /** @type {DocumentFragment} */
    let fragment;

    if (attributes && attributes.length) {
      for (const attribute of attributes) {
        prototype.hasOwnProperty(attribute) ||
          Object.defineProperty(this, attribute, {
            get() {
              return this.hasAttribute(attribute)
                ? this.getAttribute(attribute)
                : attributes[attribute];
            },
            set(value) {
              value === null || value === undefined
                ? this.removeAttribute(attribute)
                : value === this.getAttribute(attribute) || this.setAttribute(attribute, value);
            },
          });
      }
      this.attributes.defaultAttributes = attributes;
      this.attributes.isInitialized = false;
    }

    if (styles) {
      const node = (style = document.createElement('style'));
      node.loaded = new Promise(resolve => {
        const handler = event => {
          node.removeEventListener('load', handler);
          node.removeEventListener('error', handler);
          node.removeEventListener('abort', handler);
          resolve({node, event});
        };
        node.addEventListener('load', handler, {capture: true, passive: false, once: true});
        node.addEventListener('error', handler, {capture: true, passive: false, once: true});
        node.addEventListener('abort', handler, {capture: true, passive: false, once: true});
      });
      style.textContent = styles;
    }

    if (template) {
      /** @type {DocumentFragment} */
      fragment = (template.content || template).cloneNode(true);
      for (const element of fragment.querySelectorAll('[id]')) {
        this[`#${element.id}`] = element;
      }
      for (const element of fragment.querySelectorAll('slot')) {
        const name = `::${element.name || ''}`;
        name in this || (this[name] = element);
      }
    }

    root === host
      ? setTimeout(() => (fragment = style = void initializeRoot(host, fragment, style, root)), 0)
      : (fragment = style = void initializeRoot(host, fragment, style, root));
  }

  connectedCallback() {
    this.attributes.isInitialized === false && this.initializeAttributes();
  }

  attributeChangedCallback(attributeName, previousValue, nextValue) {
    previousValue === nextValue ||
      previousValue == nextValue ||
      (typeof this.updateAttribute === 'function'
        ? this.updateAttribute(attributeName, nextValue, previousValue)
        : attributeName in this && (this[attributeName] = nextValue));
  }

  initializeAttributes() {
    const {defaultAttributes, isInitialized} = this.attributes;
    if (!isInitialized && defaultAttributes) {
      this.attributes.isInitialized = true;
      for (const attribute in defaultAttributes) {
        this.updateAttribute(attribute, this[attribute]);
      }
    }
  }

  trace(detail, context = (detail && detail.target) || this, ...args) {
    const span = typeof context === 'string' ? '%s' : '%O';
    detail &&
      (detail.preventDefault
        ? console.log(`${span}‹%s› %O`, context, detail.type, detail, ...args)
        : console.trace(`${span} %O`, context, detail, ...args));
  }

  static async initializeRoot(host, fragment, style, root) {
    style && root.prepend(style);
    fragment && (style && style.loaded && (await style.loaded), root.prepend(fragment));
    root === host && (host.style.visibility = '');
  }
}

/// PRESETS
/**
 * @extends {ReadonlyArray<string>}
 */
class Presets extends Array {
  matching(object) {
    if (Object.values(this).includes(object)) return object;
    const key = Presets.keyFor(object);
    if (key) return Presets[key];
  }
}

/**
 * @type {{<T extends {}>(type: string, presets: T): Readonly<T> & ReadonlyArray<keyof T & string>}}
 */
Presets.define = (definitions, type) => {
  const names = Object.getOwnPropertyNames(definitions);
  const presets = new Presets();
  for (const name of names) {
    const object = definitions[name];
    const preset = Presets.preset(object);
    if (!preset) continue;
    const key = Presets.key(preset);
    presets[key] = presets[name] = Object.freeze(
      Object.defineProperty(
        Object.defineProperties(
          Reflect.construct(String, [key], Object),
          Object.getOwnPropertyDescriptors(preset),
        ),
        {
          [Symbol.toStringTag]: {value: `${type}.${name}`},
        },
      ),
    );
    presets.push(name);
  }
  return Object.freeze(Object.defineProperty(presets, 'Symbol.toStringTag', {value: `${type}`}));
};

Presets.mappings = new WeakMap();

Presets.keyFor = preset => {
  if (!preset || typeof preset !== 'object' || [Symbol.iterator] in preset) return;

  let key = Presets.mappings.get(preset);

  if (key) return key;

  try {
    return Presets.key(Presets.preset(preset), null, 0);
  } catch (exception) {}
};

Presets.key = preset => JSON.stringify(preset, null, 0);

Presets.preset = object => {
  if (!object || typeof object !== 'object' || [Symbol.iterator] in object) return;
  const preset = {};
  for (const key of Object.getOwnPropertyNames(object).sort()) {
    object[key] === undefined || (preset[key] = object[key]);
  }
  return preset;
};

/// <reference path="./types.d.ts" />

/// EventListener

/**
 * @template {EventTarget} T
 * @template {string} U
 * @template {EventListenerOptions} V
 * @extends {Function}
 */
class EventListener {
  remove() {
    /** @type {{target: T, type: U, options: V}} */
    const {type, target, options} = this;
    return target.removeEventListener(type, this, options);
  }
}

EventListener.Options = Presets.define('EventListener.Options', {
  None: {},
  Active: {capture: false, once: false, passive: true},
  Capture: {capture: true, once: false, passive: false},
  Passive: {capture: false, once: false, passive: true},
  CapturePassive: {capture: true, once: false, passive: true},
  Once: {capture: false, once: true, passive: false},
  CaptureOnce: {capture: true, once: true, passive: false},
  OncePassive: {capture: false, once: true, passive: true},
  CaptureOncePassive: {capture: true, once: true, passive: true},
});

EventListener.Unknown = EventListener.Options.None;
EventListener.Active = EventListener.Options.Active;
EventListener.Capture = EventListener.Options.Capture;
EventListener.Passive = EventListener.Options.Passive;
EventListener.CapturePassive = EventListener.Options.CapturePassive;
EventListener.Once = EventListener.Options.Once;
EventListener.CaptureOnce = EventListener.Options.CaptureOnce;
EventListener.OncePassive = EventListener.Options.OncePassive;
EventListener.CaptureOncePassive = EventListener.Options.CaptureOncePassive;

/** @type {<T extends EventTarget, U extends string, V extends EventListenerOptions = {}>(target: T, type: U, handler: Function, options?: V) => EventListener<T, U, V>} */
EventListener.create = (target, ...args) => {
  let attached, options;
  try {
    const handler = args[1]; // .bind(target);
    (handler.target = target).addEventListener(
      (handler.type = args[0]),
      handler,
      (options = args[2]) || EventListener.Unknown,
    );
    return (attached = handler);
  } finally {
    if (attached) {
      attached.options =
        (options && EventListener.Options.matching(options)) || EventListener.Options.None;
      Object.setPrototypeOf(attached, EventListener.prototype);
    }
    // attached && (
    //   attached.remove = () =>
    // )
  }
};

/**
 * @template T
 * @param {T} value
 * @returns {attribute.toggle<T>}
 */

/**
 * @template {string} K
 * @extends {Array<K>}
 */
class Attributes extends Array {
  /**
   * @param {{[index: number]:K} | {[name: K]}} attributes
   */
  constructor(attributes) {
    const names =
      (attributes &&
        ((Symbol.iterator in attributes && attributes) || getOwnPropertyNames(attributes))) ||
      '';
    super(...names);
    !attributes || names === attributes || assign(this, attributes);
  }

  *entries() {
    for (const key of super[Symbol.iterator]()) {
      yield [key, this[key]];
    }
  }

  /**
   * @template {string} K
   * @template {{[name: K]}} T
   * @param {...T} definitions
   * @returns {Attributes<K> | T}
   */
  static from(...definitions) {
    const attributes = {};

    for (const object of definitions) {
      for (const name of Symbol.iterator in object ? object : getOwnPropertyNames(object)) {
        typeof name !== 'string' ||
          (name in attributes
            ? // Assign to undefined default
              attributes[name] === undefined || (attributes[name] = object[name])
            : // Add name to the set of names and initialize default
              (attributes[name] = object[name]));
      }
    }

    // return assign(new this(...names), defaults);
    return new this(attributes);
  }
}

defineProperties(Attributes.prototype, {
  [Symbol.toStringTag]: {value: 'Attributes'},
  [Symbol.isConcatSpreadable]: {value: false},
});

/**
 * @typedef {*} attribute.value
 * @typedef {''} attribute.empty
 * @typedef {undefined | null | symbol} attribute.undefined
 * @typedef {true | 1 | 'true' | 'on' | 'yes'} attribute.true
 * @typedef {false | 0 | 'false' | 'off' | 'no'} attribute.false
 */

/**
 * @template T
 * @typedef {T extends attribute.true ? true : T extends attribute.false ? false : T extends attribute.empty ? '' : undefined} attribute.toggle
 */

//@ts-check

/**
 * @template T
 * @typedef {import('./types').iterable<T>} iterable<T>
 */

/**
 * @template T
 * @typedef {import('./types').iterates<T>} iterates<T>
 */

/// <reference path="./types.d.ts" />
/// <reference types="node" />

// @ts-check

const globals = {};

const currentGlobal = (globals.global =
  typeof global === 'object' && global && global.global === global && global);

const currentProcess = (globals.process =
  currentGlobal && typeof currentGlobal.process === 'object' && currentGlobal.process);

const currentSelf = (globals.self = typeof self === 'object' && self && self.self === self && self);

const currentWindow = (globals.window =
  typeof window === 'object' && window.window === window && window);

const currentDocument = (globals.document = typeof document === 'object' && document);

/** @type {FunctionConstructor} */
// @ts-ignore
globals.Function = function() {}.constructor;
/** @type {ObjectConstructor} */
// @ts-ignore
globals.Object = {}.constructor;

/// Functions

const bind = globals.Function.bind.bind(globals.Function.call);
const call = globals.Function.call.bind(globals.Function.call);

/// Objects
/** @type {ObjectConstructor} */
// @ts-ignore
const {
  assign: assign$1,
  defineProperty: defineProperty$1,
  defineProperties: defineProperties$1,
  create,
  freeze,
  seal,
  preventExtensions,
  getOwnPropertyDescriptor: getOwnPropertyDescriptor$1,
  getOwnPropertyDescriptors,
  getOwnPropertyNames: getOwnPropertyNames$1,
  getOwnPropertySymbols,
  getPrototypeOf,
  setPrototypeOf,
  entries,
  keys,
  values,
  // prototype: {isPrototypeOf: ObjectIsPrototypeOf, hasOwnProperty: ObjectHasOwnProperty},
} = globals.Object.constructor;

/**
 * @type {<T>(prototype: T, object) => object is T}
 */
const isPrototypeOf = globals.Function.call.bind(globals.Object.prototype.isPrototypeOf);

/**
 * @type {<U extends string|symbol|number>(object: {}, property: U) => boolean}
 */
const hasOwn = globals.Function.call.bind(globals.Object.prototype.hasOwnProperty);

/** @package {components} */

const noop = () => {};
const resolvedPromise = Promise.resolve();

const resolve = (specifier, referrer) => {
	try {
		return `${referrer === undefined ? new URL(specifier) : new URL(specifier, referrer)}`;
	} catch (exception) {}
};

// import {log, warn} from './debug.js';

const preloading = (!currentDocument && {}) || currentDocument.links['[[preload]]'] || (currentDocument.links['[[preload]]'] = {});

const preload = (src => {
	const preload = (href, as) => {
		let promise = preloading[href];
		if (!promise) {
			const {types, extensions, base} = preload;
			try {
				const url = new URL(href, preload.base);
				if (!as) {
					let [, extension] = /\.([^/.]+)$|/.exec(url.pathname.toLowerCase());
					if (!(extension in extensions))
						return Promise.reject(
							new TypeError(
								`Cannot preload "${url}"${
									extension ? ` - extension $"{extension}" is not supported` : ' - cannot infer type'
								}.`,
							),
						);
					as = preload.extensions[as];
				} else if (!types[(as = `${as}`.toLowerCase())]) {
					return Promise.reject(new TypeError(`Cannot preload "${url}" - type "${as}" is not supported.`));
				}
				promise = preloading[url] || (promise = preloading[href] = preloading[url] = createPreloadPromise({href, as}));
			} catch (exception) {
				return Promise.reject(exception);
			}
		}
		return promise;
	};

	const createPreloadPromise = ({
		href,
		url = href,
		as,
		document: ownerDocument = currentDocument,
		initiator = import.meta.url,
	}) => {
		if (!ownerDocument) {
			currentDocument ||
				preload.promise.warned ||
				(preload.promise.warned = !console.warn('[preload]: Preload is not supported.'));
			return resolvedPromise;
		}
		const {head = currentDocument.head} = ownerDocument;

		const type = types[as] || types[`${as}`.toLowerCase()] || as;

		const preloads = head.querySelectorAll(`link[rel=preload][as="${type}"]`);

		if (preloads && preloads.length) {
			url.pathname && (url.pathname = url.pathname.replace(/\/+/g, '/'));
			const href = `${url}`;
			for (const link of preloads) {
				if (link.href === href) return resolved;
				// console.log({href, url, 'link.href': link.href});
			}
		}

		let link = ownerDocument.createElement('link');
		const promise = Object.defineProperties(
			new Promise((resolve, reject) => {
				let done = event =>
					void (link.removeEventListener('abort', done),
					link.removeEventListener('error', done),
					link.removeEventListener('load', done),
					(done = resolve()),
					(promise.loaded = event.type === 'load') ||
						((event.error && (promise.error = event.error)) || (promise[event.type] = true)));
				link.addEventListener('abort', done, {once: true});
				link.addEventListener('error', done, {once: true});
				link.addEventListener('load', done, {once: true});
			}).finally(() => {
				Object.defineProperty(promise, 'link', {value: (link = link.remove())});
			}),
			{link: {value: link, configurable: true}, initiator: {value: initiator}},
		);

		link.href = url;
		link.rel = 'preload';
		link.as = type;
		// as && (link.as = types[as] || types[`${as}`.toLowerCase()] || as);
		head.appendChild(link);
		return promise;
	};

	const base = (preload.base = `${(typeof location === 'object' && typeof location.href === 'string' && location) ||
		new URL(src.replace(/\/lib\/.*?$/i, ''))}`);
	const types = (preload.types = {});
	const extensions = (preload.extensions = {});

	types.fetch = 'fetch';
	extensions.js = types.script = types.module = 'script';
	extensions.css = types.stylesheet = types.style = 'style';
	extensions.html = types.document = 'document';

	return preload;
})(import.meta.url);

async function dynamicImport(specifier, referrer) {
	dynamicImport.base || (dynamicImport.base = `${new URL('./', document.baseURI)}`);
	const src = `${new URL(specifier, referrer || dynamicImport.base)}`;
	if (!('import' in dynamicImport)) {
		try {
			dynamicImport.import = null;
			dynamicImport.import = (0, eval)(`specifier => import(specifier)`);
		} catch (exception) {
			const promises = new Map();
			dynamicImport.import = (specifier, referrer = dynamicImport.base) => {
				let script, promise;
				(promise = promises.get(src)) ||
					promises.set(
						src,
						(promise = new Promise((onload, onerror) => {
							document.body.append(
								Object.assign((script = document.createElement('script')), {src, type: 'module', onload, onerror}),
							);
						})),
					);
				promise.finally(() => script && script.remove());
				return promise;
			};
		}
	}
	return dynamicImport.import(src);
}

/// <reference path="./common/global.d.ts" />

const root =
	(currentDocument && currentDocument.baseURI && new URL('./', currentDocument.baseURI)) ||
	(currentWindow && currentWindow.location && new URL('./', currentWindow.location)) ||
	(currentProcess && currentProcess.cwd && new URL(`file://${currentProcess.cwd()}`)) ||
	new URL('../', import.meta.url);

const BASE = '[[base]]';
const SCRIPTS = '[[scripts]]';
const STYLES = '[[styles]]';
const PRELOAD = '[[preload]]';

class Asset extends URL {
	constructor(href, type) {
		super(href);
		this.type = type;
		Object.defineProperties(this, Object.getOwnPropertyDescriptors(Object.freeze({...this})));
	}

	get [PRELOAD]() {
		const value = preload(this, this.type);
		Object.defineProperty(this, PRELOAD, {value});
		return value;
	}

	then(ƒ) {
		return this[PRELOAD].then(ƒ);
	}

	catch(ƒ) {
		return this[PRELOAD].catch(ƒ);
	}

	finally(ƒ) {
		return this[PRELOAD].finally(ƒ);
	}
}

class Assets {
	/** @typedef {{base: string}} Options */
	/** @typedef {string} specifier */
	/** @param {Options} [options] */
	/** @param {... specifier} [specifiers] */
	constructor(options, ...specifiers) {
		const assets = {script: {}, style: {}};

		const {base = `${root}`} = {
			...(((!arguments.length || typeof options === 'object') && options) ||
				(options = void ([...specifiers] = arguments))),
		};

		const descriptors = {
			[BASE]: {value: base},

			[SCRIPTS]: {
				get: () => {
					const promise = Promise.all(Object.values(assets.script)).then(noop);
					Object.defineProperty(this, SCRIPTS, {value: promise});
					return promise;
				},
				configurable: true,
			},

			[STYLES]: {
				get: () => {
					const promise = Promise.all(Object.values(assets.style)).then(noop);
					Object.defineProperty(this, STYLES, {value: promise});
					return promise;
				},
				configurable: true,
			},
		};

		for (const specifier of specifiers) {
			let [, type, href] = /^(?:(style|script|fetch):|)(.*)$/.exec(specifier);
			// const preloading = as && preload(specifier, as);

			if (!type || !(type in assets || (type = `${type}`.toLowerCase()) in assets)) {
				console.log({specifier, type, href});
				continue;
			}

			const url = resolve(href, base);
			url.startsWith(base) && (href = url.replace(base, ''));
			const id = `${type}:${href}`;

			Object.defineProperty(assets[type], href, (descriptors[id] = {value: new Asset(url, type), enumerable: true}));

			id !== specifier && (descriptors[specifier] = {get: () => this[id]});
		}

		Object.defineProperties(this, descriptors);
	}

	resolve(specifier, referrer = this[BASE]) {
		return resolve(specifier, referrer);
	}

	static resolve(specifier, referrer = root) {
		return resolve(specifier, referrer);
	}
}

/** @package components */

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
	UnicodeIdentifier = raw`[${UnicodeIdentifierStart}][${UnicodeIdentifierPart}]*`,
	MarkdownWordPrefixes = raw`$@`,
	MarkdownWordPrefix = raw`[${MarkdownWordPrefixes}]?`,
	MarkdownWord = raw`${MarkdownWordPrefix}${UnicodeIdentifier}`,
	MarkdownWordJoiners = raw` \\\/:_\-\xA0\u2000-\u200B\u202F\u2060`,
	MarkdownWordJoiner = raw`[${MarkdownWordJoiners}]+`,
	MarkdownIdentity = raw`(?:\s|\n|^)(${MarkdownWord}(?:${MarkdownWordJoiner}${MarkdownWord})*(?=\b[\s\n]|$))`,
}) => ({
	UnicodeIdentifier: new RegExp(UnicodeIdentifier, 'u'),
	MarkdownIdentityPrefixer: new RegExp(raw`^[${MarkdownWordPrefixes}]?`, 'u'),
	MarkdownIdentityJoiner: new RegExp(raw`[${MarkdownWordJoiners}]+`, 'ug'),
	MarkdownIdentityWord: new RegExp(MarkdownWord, 'u'),
	MarkdownIdentity: new RegExp(MarkdownIdentity, 'u'),
	// MarkdownIdentitySeparators: new RegExp(raw`[${MarkdownWordPrefixes}${MarkdownWordJoiners}]+`, 'ug')
}))(entities.es);

/**
 * @param {string} context
 * @param {object} meta
 * @param {(string | boolean)[]} [flags]
 */
const debugging = (context, meta, flags) =>
	!(meta && context && flags) ||
	typeof meta.url !== 'string' ||
	typeof context !== 'string' ||
	typeof flags !== 'object' ||
	(Array.isArray(flags) && flags.includes(false)) ||
	Object.entries(flags).reduce(
		Array.isArray(flags)
			? (meta, [, flag]) => (typeof flag === 'string' && (meta[`debug:${context}:${flag}`] = true), meta)
			: (meta, [flag, value = meta[flag]]) => (
					typeof flag === 'string' && (meta[`debug:${context}:${flag}`] = value), meta
			  ),
		meta,
		// meta[`debug:${context}`] || (meta[`debug:${context}`] = {}),
	);

const SourceType = 'source-type';
const SourceParameters = 'source-parameters';
const MarkupSyntax = 'markup-syntax';

const punctuators = ((
	repeats = {['*']: 2, ['`']: 3, ['#']: 6},
	entities = {['*']: '&#x2217;', ['`']: '&#x0300;'},
	aliases = {'*': ['_'], '**': ['__'], '`': ['``']},
	blocks = {['-']: 'li', ['>']: 'blockquote', ['#']: 'h*', ['```']: 'pre'},
	spans = {['*']: 'i', ['**']: 'b', ['~~']: 's', ['`']: 'code'},
	tags = ['<', '>', '<!--', '-->', '<%', '%>', '</', '/>'],
) => {
	const symbols = new Set([...Object.keys(repeats), ...Object.keys(entities)]);
	for (const symbol of symbols) {
		let n = repeats[symbol] || 1;
		const entity = entities[symbol];
		let block = blocks[symbol];
		let span = spans[symbol];
		const tag = block || span;
		const map = (block && blocks) || (span && spans);
		for (let i = 1; n--; i++) {
			const k = symbol.repeat(i);
			const b = blocks[k];
			const s = spans[k];
			const m = (b && blocks) || (s && spans) || map;
			const t = (b || s || m[k] || tag).replace('*', i);
			const e = entities[k] || (entity && entity.repeat(i));
			m[k] = t;
			e && (entities[k] = e);
			if (k in aliases) for (const a of aliases[k]) (m[a] = t), e && (entities[a] = e);
		}
	}
	for (let h = 1, c = 2080, n = 6; n--; entities['#'.repeat(h)] = `#<sup>&#x${c + h++};</sup>`);

	return {entities, blocks, spans, tags: new Set(tags)};
})();

const Blocks = /(?:^|\n)([> \t]*(?:\`\`\`|\~\~\~))[^]+?(?:\n+\1\n?|$)|([^]+?(?:(?=\n[> \t]*(?:\`\`\`|\~\~\~))|$))/g;

const FencedBlockHeader = /^(?:(\w+)(?:\s+(.*?)\s*|)$|)/m;

const Paragraphs = /(?=(\n[> \t]*)\b)((?:\1(?!(?:\d+|[a-z]|[ivx]+)\. )[^#<>|\-~\s\n][^\n]*?(?:\n[> \t]*(?=\n|$))+)+)/g;

const Lists = /(?=(\n[> \t]*)(?:[-*] |[1-9]+\d*\. |[a-z]\. |[ivx]+\. ))((?:\1(?:[-*] |[1-9]+\d*\. |[a-z]\. |[ivx]+\. |   ?)+[^\n]+(?:\n[> \t]*)*(?=\1|$))+)/g;

// CHANGE: Added (…|) to marker capture
const Item = /^([> \t]*)([-*] |[1-9]+\d*\. |[a-z]\. |[ivx]+\. |)([^\n]+(?:\n\1(?:   ?|\t ?)(?![ \t]|[-*] |\d+\. |[a-z]\. |[ivx]+\. ).*)*)$/gm;

const References = /\!?\[(\S.+?\S)\](?:\((\S[^\n()\[\]]*?\S)\)|\[(\S[^\n()\[\]]*\S)\])/g;
const Aliases = /^([> \t]*)\[(\S.+?\S)\]:\s+(\S+)(?:\s+"([^\n]*)"|\s+'([^\n]*)'|)(?=\s*$)/gm;

const Link = /\s*(\S+)(?:\s+["']([^\n]*)["'])?/;

const MATCHES = Symbol('matches');
const ALIASES = 'aliases';
const BLOCKS = 'blocks';

/**
 * @param {string} sourceText
 * @param {{ aliases?: { [name: string]: alias } }} [state]
 */
const normalizeReferences = (sourceText, state = {}) => {
	const debugging = import.meta['debug:markout:anchor-normalization'];
	const {aliases = (state.aliases = {})} = state;

	return sourceText.replace(References, (m, text, link, alias, index) => {
		const reference = (alias && (alias = alias.trim())) || (link && (link = link.trim()));

		if (reference) {
			let href, title;
			// debugging && console.log(m, {text, link, alias, reference, index});
			if (link) {
				[, href = '#', title] = Link.exec(link);
			} else if (alias && alias in aliases) {
				({href = '#', title} = aliases[alias]);
			}
			debugging && console.log(m, {href, title, text, link, alias, reference, index});
			if (m[0] === '!') {
				return `<img src="${href}"${text || title ? ` title="${text || title}"` : ''} />`;
			} else {
				text = text || encodeEntities(href);
				return `<a href="${href}"${title ? ` title="${title}"` : ''}>${text || reference}</a>`;
			}
		}
		return m;
	});
};

class List extends Array {
	toString(inset = this.inset || '', type = this.type || 'ul', style = this.style, start = this.start) {
		const attributes = `${
			// TODO: Explore using type attribute instead
			(style && `style="list-style: ${style}"`) || ''
		} ${
			// TODO: Check if guard against invalid start is needed
			(start && `start="${start}"`) || ''
		}`.trim();

		const rows = [`${inset}<${type}${(attributes && ` ${attributes}`) || ''}>`];
		for (const item of this) {
			if (item && typeof item === 'object') {
				if (item instanceof List) {
					const last = rows.length - 1;
					const row = rows[last];
					if (last > 0) {
						rows[rows.length - 1] = `${row.slice(0, -5)}\n${item.toString(`${inset}\t\t`)}\n${inset}\t</li>`;
					} else {
						rows.push(`${inset}\t<li>\n${item.toString(`${inset}\t\t`)}\n${inset}\t</li>`);
					}
				} else {
					const insetText = `${item}`;
					let text = insetText;
					for (const character of inset) {
						if (!text.startsWith(character)) break;
						text = text.slice(1);
					}
					// console.log({insetText, text, inset});
					rows.push(text);
				}
			} else {
				rows.push(`${inset}\t<li>${`${item}`.trim()}</li>`);
			}
		}
		rows.push(`${inset}</${type}>`);
		return rows.join('\n');
	}
}

const normalizeLists = sourceText =>
	sourceText.replace(Lists, (m, feed, body) => {
		let match, indent;
		indent = feed.slice(1);
		const top = new List();
		let list = top;
		Item.lastIndex = 0;
		while ((match = Item.exec(m))) {
			let [, inset, marker, line] = match;
			if (!line.trim()) continue;

			if (marker) {
				let depth = inset.length;
				if (depth > list.depth) {
					const parent = list;
					list.push((list = new List()));
					list.parent = parent;
				} else if (depth < list.depth) {
					while ((list = list.parent) && depth < list.depth);
				}

				if (!list) break;

				'inset' in list ||
					((list.inset = inset),
					(list.depth = depth),
					(list.type = marker === '* ' || marker === '- ' ? 'ul' : 'ol') === 'ol' &&
						(list.start = marker.replace(/\W/g, '')));

				'style' in list ||
					(list.style =
						(list.type === 'ul' && ((marker[0] === '*' && 'disc') || 'square')) ||
						(marker[0] === '0' && 'decimal-leading-zero') ||
						(marker[0] > 0 && 'decimal') ||
						`${marker === marker.toLowerCase() ? 'lower' : 'upper'}-${
							/^[ivx]+\. $/i.test(marker) ? 'roman' : 'latin'
						}`);

				line = line.replace(/[ \t]*\n[> \t]*/g, ' ');
				list.push(line);
			} else {
				if (list.length) {
					const index = list.length - 1;
					list[index] += `<p>${line}</p>`;
				} else {
					list.push(new String(m));
				}
			}
		}

		return top.toString(indent);
	});

const normalizeParagraphs = sourceText =>
	sourceText.replace(Paragraphs, (m, feed, body) => {
		const paragraphs = body
			.trim()
			.split(/^(?:[> \t]*\n)+[> \t]*/m)
			.filter(Boolean);

		return `${feed}<p>${paragraphs.join(`</p>${feed}<p>${feed}`)}</p>`;
	});

const normalizeBlocks = (sourceText, state = {}) => {
	const {sources = (state.sources = []), [ALIASES]: aliases = (state[ALIASES] = {})} = state;

	const source = {sourceText, [BLOCKS]: [], [ALIASES]: {}};
	sources.push(source);

	Blocks: {
		const {
			sourceText,
			[BLOCKS]: sourceBlocks,
			[BLOCKS]: {
				[MATCHES]: matchedBlocks = (sourceBlocks[MATCHES] = []),
				[MATCHES]: {fenced: fenced = (matchedBlocks.fenced = []), unfenced: unfenced = (matchedBlocks.unfenced = [])},
			},
			[ALIASES]: sourceAliases,
			[ALIASES]: {
				[MATCHES]: matchedAliases = (sourceAliases[MATCHES] = []),
				[MATCHES]: {aliased = (matchedAliases.aliased = []), unaliased = (matchedAliases.unaliased = [])},
			},
		} = source;
		let match = (Blocks.lastIndex = null);

		const replaceAlias = (text, indent, alias, href, title, index) => {
			const match = {text, indent, alias, href, title, index};

			// TODO: Figure out anchors: https://www.w3.org/TR/2017/REC-html52-20171214/links.html
			return alias && alias.trim()
				? (aliased.push((sourceAliases[alias] = aliases[alias] = match)),
				  `<a hidden rel="alias" name="${alias}" href="${href}">${title || ''}</a>`)
				: (unaliased.push(match), text);
		};

		while ((match = Blocks.exec(sourceText))) {
			matchedBlocks.push(([match.text, match.fence, match.unfenced] = match));
			if (match.fence) {
				fenced.push(match);
			} else {
				unfenced.push(match);
				match.text = match.text.replace(Aliases, replaceAlias);
			}
		}
	}

	Normalization: {
		const {[BLOCKS]: sourceBlocks} = source;
		for (const {text, fence, unfenced} of sourceBlocks[MATCHES]) {
			sourceBlocks.push(fence ? text : normalizeParagraphs(normalizeLists(normalizeReferences(text, state))));
		}
		source.normalizedText = sourceBlocks.join('\n');
		import.meta['debug:markout:block-normalization'] && console.log(state);
	}

	return source.normalizedText;
};

const normalized = new Map();

const normalizeString = string => Object.keys({[string]: true})[0];

const normalize = sourceText => {
	let normalizedText = normalized.get(sourceText);
	normalizedText !== undefined ||
		normalized.set(sourceText, (normalizedText = normalizeString(normalizeBlocks(normalizeString(sourceText)))));
	return normalizedText;
};

const tokenize = sourceText => tokenize$1(`${sourceText.trim()}\n}`, {sourceType: 'markdown'});

const render = (tokens, renderedHTML = '') => {
	let passthru, block, fenced, header, indent, newlines, comment;

	const {blocks, spans, entities, tags} = punctuators;

	const {raw} = String;

	for (const token of tokens) {
		if (token && token.text) {
			let {text, type = 'text', punctuator, breaks, hint, previous} = token;
			let body = text;

			if (passthru || fenced) {
				if (fenced) {
					if (fenced === passthru) {
						fenced += text;
						header = text;
						// passthru = `<${block} class="markup code" ${text ? ` ${SourceType}="${text}"` : ''}><code>`;
						passthru = ''; // `<${block}><code>`;
					} else if (punctuator === 'closer' && text === '```') {
						let sourceType, sourceParameters;
						if (header) {
							[sourceType = 'markup', sourceParameters] = FencedBlockHeader.exec(header);
							import.meta['debug:fenced-block-header-rendering'] &&
								console.log('fenced-block-header', {fenced, header, passthru, sourceType, sourceParameters});
						}
						// passthru rendered code
						renderedHTML += `<${block} class="markup code" ${SourceType}="${sourceType || 'markup'}"${
							sourceParameters ? ` ${SourceParameters}="${sourceParameters}"` : ''
						}>${encodeEntities(passthru)}</${block}>`;
						header = indent = fenced = passthru = '';
					} else {
						// passthru code
						passthru += body.replace(indent, '');
					}
					// continue;
				} else {
					// passthru body
					passthru += body;
					if (punctuator === 'closer' || (comment && punctuator === 'comment')) {
						// passthru body rendered
						renderedHTML += passthru;
						passthru = '';
					}
				}
				continue;
			}

			let tag = 'span';
			const classes = hint.split(/\s+/);
			let before, after;

			if (hint === 'markdown' || hint.startsWith('markdown ') || hint.includes('in-markdown')) {
				(type === 'text' && breaks) ||
					(!text.trim() && (type = 'whitespace')) ||
					(text in entities && (body = entities[text]));

				if (punctuator) {
					passthru = (((comment = punctuator === 'comment' && text) || tags.has(text)) && text) || '';
					if (passthru) continue;
					if (punctuator === 'opener') {
						if ((fenced = text === '```' && text)) {
							block = 'pre';
							passthru = fenced;
							[indent = ''] = /^[ \t]*/gm.exec(previous.text);
							indent && (indent = new RegExp(raw`^${indent}`, 'mg'));
							// punctuator opener fence
							continue;
						} else if (text in spans) {
							before = `<${spans[text]}${render.classes(classes)}>`;
							classes.push('opener');
						} else if (text === '<!' || text === '<%') {
							// Likely <!doctype …> || Processing instruction
							let next;
							while (
								(next = tokens.next().value) &&
								(body += next.text) &&
								!(
									(next.punctuator === 'opener' && /^</.test(next.text)) ||
									(next.punctuator === 'closer' && />$/.test(next.text))
								)
							);
							passthru = body;
							continue;
						}
					} else if (punctuator === 'closer') {
						if (text === '```') {
							block = blocks['```'] || 'pre';
						} else if (text in spans) {
							after = `</${spans[text]}>`;
							classes.push('closer');
						}
					}
					(before || after) && (tag = 'tt');
					classes.push(`${punctuator}-token`);
				} else {
					if (breaks) {
						(!block && (tag = 'br')) || ((after = `</${block}>`) && (block = body = ''));
					} else if (type === 'sequence') {
						if (text[0] === '`') {
							tag = 'code';
							body = text.replace(/(``?)(.*)\1/, '$2');
							let fence = '`'.repeat((text.length - body.length) / 2);
							body = encodeEntities(body.replace(/&nbsp;/g, '\u202F'));
							fence in entities && (fence = entities[fence]);
							classes.push('fenced-code');
							classes.push('code');
						} else if (text.startsWith('---') && !/[^-]/.test(text)) {
							tag = 'hr';
						} else if (!block && (block = blocks[text])) {
							let previous = token;
							let inset = '';
							while ((previous = previous.previous)) {
								if (previous.breaks) break;
								inset = `${previous.text}${inset}`;
							}
							if (!/[^> \t]/.test(inset)) {
								before = `<${block}${render.classes(classes)}>`;
								tag = 'tt';
								classes.push('opener', `${type}-token`);
							} else {
								body = text;
							}
						} else {
							// sequence
							body = text;
						}
					} else if (type === 'whitespace') {
						// if (span === 'code') body.replace(/\xA0/g, '&nbsp;');
						tag = '';
					} else {
						// debug(`${type}:token`)(type, token);
						classes.push(`${type}-token`);
						body = text;
					}
				}
			}

			before && (renderedHTML += before);
			tag === 'br' || (newlines = 0)
				? (newlines++ && (renderedHTML += '\n')) || (renderedHTML += '<br/>')
				: tag === 'hr'
				? (renderedHTML += '<hr/>')
				: body &&
				  (tag ? (renderedHTML += `<${tag}${render.classes(classes)}>${body}</${tag}>`) : (renderedHTML += body));
			after && (renderedHTML += after);
		}
	}

	return renderedHTML;
};

render.classes = classes => ((classes = classes.filter(Boolean).join(' ')) && ` class="${classes}"`) || '';

debugging('markout', import.meta, [
	// import.meta.url.includes('/markout/lib/') ||
	typeof location === 'object' && /[?&]debug(?=[&#]|=[^&]*\bmarkout|$)\b/.test(location.search),
	'block-normalization',
	'anchor-normalization',
	'fenced-block-header-rendering',
]);

const markout = /*#__PURE__*/Object.freeze({
  SourceType: SourceType,
  SourceParameters: SourceParameters,
  MarkupSyntax: MarkupSyntax,
  normalizeReferences: normalizeReferences,
  normalizeLists: normalizeLists,
  normalizeParagraphs: normalizeParagraphs,
  normalizeBlocks: normalizeBlocks,
  normalizeString: normalizeString,
  normalize: normalize,
  tokenize: tokenize,
  render: render,
  UnicodeIdentifier: UnicodeIdentifier,
  MarkdownIdentityPrefixer: MarkdownIdentityPrefixer,
  MarkdownIdentityJoiner: MarkdownIdentityJoiner,
  MarkdownIdentityWord: MarkdownIdentityWord,
  MarkdownIdentity: MarkdownIdentity
});

const assets = new Assets({base: new URL('../', import.meta.url)}, 'style:styles/markout.css');

const {SourceType: SourceType$1, MarkupSyntax: MarkupSyntax$1} = markout;

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

class MarkoutContent extends Component {
	constructor() {
		super();
		const {instance = (new.target.instance = 0)} = new.target;

		this.name = `${this.tagName}-${++new.target.instance}`.toLocaleLowerCase();

		/** @type {SLOT} */ const slot = this['::'];
		/** @type {SLOT} */ const styles = this['::styles'];
		/** @type {SLOT} */ const content = this['::content'];

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
			for (const link of content.querySelectorAll(`script[src],style[src]`) || '') {
				const {nodeName, type, rel, baseURI, slot} = link;
				if (slot && slot !== 'links') continue;
				const src = link.getAttribute('src');
				const href = link.getAttribute('href');
				const base = link.hasAttribute('base') ? baseURI : baseURL;
				const url = new URL(src || href, base);
				link.slot = 'links';
				switch (nodeName) {
					case 'SCRIPT':
						if (`${type}`.toLowerCase() === 'module') {
							dynamicImport(url);
							link.remove();
							break;
						}
					case 'STYLE':
						if ((src && !type) || `${type}`.toLowerCase() === 'text/css') {
							stylesheets.push(url);
							link.remove();
							break;
						}
					default:
						// TODO: Ensure base attribute bahviour holds
						link.setAttribute('base', base);
						links.appendChild(link);
				}
			}

			if (stylesheets.length) {
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

	renderMarkdown(sourceText = this.sourceText, slot = this['::content']) {
		slot.innerHTML = '';
		const tokens = tokenize(normalize(sourceText));
		const template = document.createElement('template');
		template.innerHTML = render(tokens);

		const fragment = template.content;

		const promises = [];

		for (const br of fragment.querySelectorAll('br') || '') {
			const {previousSibling, nextSibling, parentElement} = br;
			(!previousSibling ||
				previousSibling.nodeName !== 'SPAN' ||
				// /^(?:H[1-6]|)$/.test(previousSibling.nodeName) ||
				!nextSibling ||
				nextSibling.nodeName !== 'SPAN' ||
				(parentElement && !/^(?:CODE|PRE|LI)$/.test(parentElement.nodeName))) &&
				br.remove();
		}

		for (const code of fragment.querySelectorAll(`[${SourceType$1}]:not(:empty)`) || '') {
			const sourceType = code.getAttribute(SourceType$1);
			!sourceType ||
				code.removeAttribute(SourceType$1) ||
				promises.push(this.renderSourceText({element: code, sourceType}));
		}

		for (const heading of fragment.querySelectorAll(`h1,h2`) || '') {
			const {id, textContent} = heading;
			if (!id && textContent) {
				const match = MarkdownIdentity.exec(textContent);
				const identity = match && match[1];
				if (identity) {
					const identifier = identity
						.replace(MarkdownIdentityPrefixer, '')
						.replace(MarkdownIdentityJoiner, '-')
						.toLowerCase();
					const anchor = document.createElement('a');
					anchor.id = identifier;
					heading.before(anchor);
					anchor.append(heading);
				}
			}
		}

		for (const paragraph of fragment.querySelectorAll(':not(code) p') || '')
			(paragraph.textContent && paragraph.textContent.trim()) || paragraph.remove();

		slot.appendChild(fragment);

		return promises.length ? (async () => void (await Promise.all(promises)))() : Promise.resolve();
	}

	async renderSourceText({
		element,
		sourceType = element && element.getAttribute(SourceType$1),
		sourceText = !element || element.hasAttribute(MarkupSyntax$1) ? '' : element.textContent,
	}) {
		if (element && sourceType && sourceText) {
			element.removeAttribute(SourceType$1);
			element.setAttribute(MarkupSyntax$1, sourceType);
			const fragment = document.createDocumentFragment();
			element.textContent = '';
			// sourceText = sourceText.replace(/^\t+/gm, indent => '  '.repeat(indent.length));
			element.sourceText = sourceText;
			await render$1(`${sourceText}\0\n`, {sourceType, fragment});
			fragment.normalize();
			let lastChild = fragment;
			while (lastChild) {
				lastChild.normalize();
				if (lastChild.nodeType === fragment.TEXT_NODE) {
					let {textContent} = lastChild;
					(textContent = textContent.slice(0, textContent.lastIndexOf('\0\n')))
						? (lastChild.textContent = textContent)
						: lastChild.remove();
					break;
				} else {
					lastChild = lastChild.lastChild;
				}
			}
			element.appendChild(fragment);
		}
	}

	/// Properties
	get sourceText() {
		const {childNodes, childElementCount, firstElementChild, renderedText} = this;
		if (renderedText || renderedText === '') {
			return renderedText;
		} else if (firstElementChild && firstElementChild.nodeName === 'TEMPLATE') {
			return firstElementChild.innerHTML.trim() || '';
		} else if (childNodes.length) {
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

/** @typedef {HTMLSlotElement} SLOT */
/** @typedef {HTMLDivElement} DIV */

/** @type {(src: string | URL, options?: RequestInit) => Promise<string>} */
const loadTextFrom = (src, options) => {
  const url = `${new URL(src, location)}`;
  const request = fetch(url, options);
  const text = request
    .catch(error => {
      text.error = error;
    })
    .then(response => (text.response = response).text());
  text.url = url;
  text.request = request;
  return text;
};

/** @type {(src: string | URL, options?: RequestInit) => Promise<string>} */
const loadSourceTextFrom = async (src, options) => {
  try {
    return loadTextFrom(src, options);
  } catch (exception) {
    // console.warn(exception);
    return '';
  }
};

const RewritableURL = /^(\.*(?=\/)[^?#\n]*\/)(?:([^/?#\n]+?)(?:(\.[a-z]+)|)|)(\?[^#]+|)(#.*|)$|/i;

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

	/**
	 * @typedef {HTMLAnchorElement} Anchor
	 */
	class MarkoutContent {
		async load(src) {
			arguments.length || (src = this.getAttribute('src'));
			if (!src) return;
			const url = new URL(src, this.baseURI);
			this.sourceURL = url;
			this.sourceText = (await loadSourceTextFrom(url)) || '';
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
	}

	const sections = document.body.querySelectorAll('markout-content[src]');
	if (sections) {
		const {load, rewriteAnchors} = MarkoutContent.prototype;
		for (const section of sections) {
			section.load || ((section.load = load), section.rewriteAnchors || (section.rewriteAnchors = rewriteAnchors)),
				section.load();
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
//# sourceMappingURL=browser.m.js.map
