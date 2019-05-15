import dynamicImport from '../../../../../../browser/dynamicImport.js';
import { entities, encodeEntities, tokenize as tokenize$1, render as render$1 } from '../../../markup/dist/tokenizer.browser.js';
import { sequence, debugging, matchAll, normalizeString } from '../../../../../../markout/lib/helpers.js';

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

/// <reference path="./common/global.d.ts" />
// export {dynamicImport} from '../../pholio/lib/import.js';

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
/** @package components */
// export {dynamicImport} from '../../pholio/lib/import.js';

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

class ComposableList extends Array {
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
				if (item instanceof ComposableList) {
					const last = rows.length - 1;
					const row = rows[last];
					last > 0
						? (rows[rows.length - 1] = `${row.slice(0, -5)}\n${item.toString(`${inset}\t\t`)}\n${inset}\t</li>`)
						: rows.push(`${inset}\t<li>\n${item.toString(`${inset}\t\t`)}\n${inset}\t</li>`);
				} else {
					const insetText = `${item}`;
					let text = insetText;
					for (const character of inset) {
						if (!text.startsWith(character)) break;
						text = text.slice(1);
					}
					rows.push(text);
				}
			} else {
				rows.push(`${inset}\t<li>${`${item}`.trim()}</li>`);
			}
		}
		rows.push(`${inset}</${type}>`);
		return `\n${rows.join('\n')}\n`;
	}
}

const {
	/** Attempts to overcome **__** */

	'markout-render-merged-marking': MERGED_MARKING = true,
} = import.meta;

const MATCHES = Symbol('matches');
const ALIASES = 'aliases';
const BLOCKS = 'blocks';

const NormalizableBlocks = /(?:^|\n)([> \t]*(?:\`\`\`|\~\~\~))[^]+?(?:(?:\n\1[ \t]*)+\n?|$)|([^]+?(?:(?=\n[> \t]*(?:\`\`\`|\~\~\~))|$))/g;
const NormalizableParagraphs = /^((?:[ \t]*\n([> \t]*))+)((?:(?!(?:\d+\. |[a-z]\. |[ivx]+\. |[-*] ))[^\-#>|~\n].*(?:\n[> \t]*$)+|$)+)/gm;
const RewritableParagraphs = /^([ \t]*[^\-\*#>\n].*?)(\b.*[^:\n\s>]+|\b)[ \t]*\n[ \t>]*(?=(\b|\[.*?\][^:\n]?|[^#`\[\n]))/gm;
const NormalizableLists = /(?=(\n[> \t]*)(?:[-*] |[1-9]+\d*\. |[a-z]\. |[ivx]+\. ))((?:\1(?:[-*] |[1-9]+\d*\. |[a-z]\. |[ivx]+\. |   ?)+[^\n]+(?:\n[> \t]*)*(?=\1|$))+)/g;
const NormalizableListItem = /^([> \t]*)([-*] |[1-9]+\d*\. |[a-z]\. |[ivx]+\. |)([^\n]+(?:\n\1(?:   ?|\t ?)(?![ \t]|[-*] |\d+\. |[a-z]\. |[ivx]+\. ).*)*)$/gm;
const NormalizableReferences = /\!?\[(\S.+?\S)\](?:\((\S[^\n()\[\]]*?\S)\)|\[(\S[^\n()\[\]]*\S)\])/g;
const RewritableAliases = /^([> \t]*)\[(\S.+?\S)\]:\s+(\S+)(?:\s+"([^\n]*)"|\s+'([^\n]*)'|)(?=\s*$)/gm;
const NormalizableLink = /\s*((?:\s?[^'"\(\)\]\[\s\n]+)*)(?:\s+["']([^\n]*)["']|)/;

class MarkoutBlockNormalizer {
	/**
	 * @param {string} sourceText
	 * @param {{ aliases?: { [name: string]: alias } }} [state]
	 */
	normalizeBlocks(sourceText, state = {}) {
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
			let match = (NormalizableBlocks.lastIndex = null);

			const replaceAlias = (text, indent, alias, href, title, index) => {
				const match = {text, indent, alias, href, title, index};

				// TODO: Figure out anchors: https://www.w3.org/TR/2017/REC-html52-20171214/links.html
				return alias && alias.trim()
					? (aliased.push((sourceAliases[alias] = aliases[alias] = match)),
					  `<a hidden rel="alias" name="${alias}" href="${href}">${title || ''}</a>`)
					: (unaliased.push(match), text);
			};

			while ((match = NormalizableBlocks.exec(sourceText))) {
				matchedBlocks.push(([match.text, match.fence, match.unfenced] = match));
				if (match.fence) {
					fenced.push(match);
				} else {
					unfenced.push(match);
					match.text = match.text.replace(RewritableAliases, replaceAlias);
				}
			}
		}

		Normalization: {
			const {[BLOCKS]: sourceBlocks} = source;
			for (const {text, fence, unfenced} of sourceBlocks[MATCHES]) {
				sourceBlocks.push(
					fence
						? text
						: this.normalizeParagraphs(
								this.normalizeBreaks(this.normalizeLists(this.normalizeReferences(text, state))),
						  ),
				);
			}
			source.normalizedText = sourceBlocks.join('\n');
			import.meta['debug:markout:block-normalization'] && console.log('normalizeSourceText:', state);
		}

		return source.normalizedText;
	}

	/**
	 * @param {string} sourceText
	 * @param {{ aliases?: { [name: string]: alias } }} [state]
	 */
	normalizeReferences(sourceText, state = {}) {
		const debugging = import.meta['debug:markout:anchor-normalization'];
		const {aliases = (state.aliases = {})} = state;

		return sourceText.replace(NormalizableReferences, (m, text, link, alias, index) => {
			const reference = (alias && (alias = alias.trim())) || (link && (link = link.trim()));

			if (reference) {
				let href, title;
				// debugging && console.log(m, {text, link, alias, reference, index});
				if (link) {
					[, href = '#', title] = NormalizableLink.exec(link);
				} else if (alias && alias in aliases) {
					({href = '#', title} = aliases[alias]);
				}
				debugging && console.log(m, {href, title, text, link, alias, reference, index});
				if (m[0] === '!') {
					return ` <img src="${href}"${text || title ? ` title="${text || title}"` : ''} /> `;
				} else {
					text = text || encodeEntities(href);
					return ` <a href="${href}"${title ? ` title="${title}"` : ''}>${text || reference}</a>`;
				}
			}
			return m;
		});
	}

	normalizeBlockquotes(sourceText) {
		// TODO: Normalize block quotes
		return sourceText;
	}

	/**
	 * @param {string} sourceText
	 */
	normalizeLists(sourceText) {
		return sourceText.replace(NormalizableLists, (m, feed, body) => {
			let match, indent;
			indent = feed.slice(1);
			const top = new ComposableList();
			let list = top;
			NormalizableListItem.lastIndex = 0;
			while ((match = NormalizableListItem.exec(m))) {
				let [, inset, marker, line] = match;
				if (!line.trim()) continue;

				if (marker) {
					let depth = inset.length;
					if (depth > list.depth) {
						const parent = list;
						list.push((list = new ComposableList()));
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
	}

	/**
	 * @param {string} sourceText
	 */
	normalizeParagraphs(sourceText) {
		return (
			sourceText
				// .replace(MalformedParagraphs, (m, a, b, c, index, sourceText) => {
				// 	// console.log('normalizeParagraphs:\n\t%o%o\u23CE%o [%o]', a, b, c, index);
				// 	return `${a}${b}${(MERGED_MARKING && '\u{23CE}') || ''} `;
				// })
				.replace(NormalizableParagraphs, (m, feed, inset, body) => {
					const paragraphs = body
						.trim()
						.split(/^(?:[> \t]*\n)+[> \t]*/m)
						.filter(Boolean);
					import.meta['debug:markout:paragraph-normalization'] &&
						console.log('normalizeParagraphs:', {m, feed, inset, body, paragraphs});

					// return `${feed}<p>${paragraphs.join(`</p>${feed}<p>${feed}`)}</p>`;
					return `${feed}<p>${paragraphs.join(`</p>\n${inset}<p>`)}</p>\n`;
				})
		);
	}

	normalizeBreaks(sourceText) {
		return sourceText.replace(RewritableParagraphs, (m, a, b, c, index, sourceText) => {
			import.meta['debug:markout:break-normalization'] &&
				console.log('normalizeBreaks:\n\t%o%o\u23CE%o [%o]', a, b, c, index);
			return `${a}${b}${MERGED_MARKING ? '<tt class="normalized-break"> \u{035C}</tt>' : ' '}`;
		});
	}
}

class Segmenter extends RegExp {
	/**
	 * @param {string | RegExp} pattern
	 * @param {string} [flags]
	 * @param {(string|undefined)[]} [types]
	 */
	constructor(pattern, flags, types) {
		(pattern &&
			pattern.types &&
			Symbol.iterator in pattern.types &&
			((!types && (types = pattern.types)) || types === pattern.types)) ||
			Object.freeze((types = (types && Symbol.iterator in types && [...types]) || []));
		const {LOOKAHEAD = Segmenter.LOOKAHEAD, INSET = Segmenter.INSET, UNKNOWN = Segmenter.UNKNOWN} = new.target;
		Object.defineProperties(super(pattern, flags), {
			types: {value: types, enumerable: true},
			LOOKAHEAD: {value: LOOKAHEAD},
			INSET: {value: INSET},
			UNKNOWN: {value: UNKNOWN},
			// lookaheads: {value: (typeof LOOKAHEAD === 'symbol' && types.indexOf(LOOKAHEAD) + 1) || false},
			// insets: {value: (typeof insets === 'symbol' && types.indexOf(INSET) + 1) || false},
		});
	}

	/**
	 * @param {RegExpExecArray} match
	 */
	matchType(text, index) {
		return index > 0 && text !== undefined && match.types[index - 1] != null;
	}

	capture(text, index, match) {
		// let typeOf;
		if (index === 0 || text === undefined) return;

		const typeIndex = index - 1;
		const type = this.types[typeIndex];

		if (type === INSET) {
			match.inset = text;
			return;
		} else if (type === LOOKAHEAD) {
			match.lookahead = text;
			return;
		} else if (type !== UNKNOWN) {
			switch (typeof type) {
				case 'string':
					if (match.typeIndex > -1) return;
					match.type = type;
					match.typeIndex = typeIndex;
				case 'symbol':
					match[type] = text;
					return;
				case 'function':
					type(text, index, match);
					return;
			}
		}
	}

	/**
	 * @param {RegExpExecArray} match
	 * @returns {typeof match & {slot: number, type: string}}
	 */
	exec(source) {
		const match = super.exec(source);
		match &&
			((match.typeIndex = -1),
			match.forEach(this.capture || Segmenter.prototype.capture, this),
			match.typeIndex > -1 || ((match.type = 'unknown'), (match.typeIndex = -1)),
			null);

		return match;
  }

	static define(factory, flags) {
		const types = [];
		const RegExp = (this && (this.prototype === Segmenter || this.prototype instanceof Segmenter) && this) || Segmenter;
    const pattern = factory(type => (types.push((type != null || undefined) && type), ''));

    flags = `${(flags == null ? pattern && pattern.flags : flags) || ''}`;

		return new RegExp(pattern, flags, types);
	}
}

const {INSET, UNKNOWN, LOOKAHEAD} = Object.defineProperties(Segmenter, {
	INSET: {value: Symbol.for('INSET'), enumerable: true},
	UNKNOWN: {value: Symbol.for('UNKNOWN'), enumerable: true},
	LOOKAHEAD: {value: Symbol.for('LOOKAHEAD'), enumerable: true},
});

// import dynamicImport from '/browser/dynamicImport.js';

// console.log(import.meta.url);

globalThis.$mo = async function debug(specifier = '/markout/examples/markdown-testsuite.md') {
	// const {MarkoutSegments} = await import(`/markout/lib/experimental/markout-segmenter.js${timestamp}`);
	const url = new URL(specifier, location);
	const response = await fetch(url);
	if (!response.ok) console.warn(Error(`Failed to fetch ${url}`));
	const sourceText = await response.text();
	// console.log(dynamicImport);
	// const {debugSegmenter} = await dynamicImport('/modules/segmenter/segmenter.debug.js');
	const {debugSegmenter} = await (0, eval)('specifier => import(specifier)')('/modules/segmenter/segmenter.debug.js');
	debugSegmenter(MarkoutSegments, sourceText);
};

const MarkoutSegments = (() => {
	const MarkoutLists = sequence`[-*]|[1-9]+\d*\.|[ivx]+\.|[a-z]\.`;
	const MarkoutMatter = sequence`---(?=\n.+)(?:\n.*)+?\n---`;
	const MarkoutStub = sequence`<!--[^]*?-->|<!.*?>|<\?.*?\?>|<%.*?%>|<(?:\b|\/).*(?:\b|\/)>.*`;
	const MarkoutStart = sequence`(?!(?:${MarkoutLists}) )(?:[^#${'`'}~<>|\n\s]|${'`'}{1,2}(?!${'`'})|~{1, 2}(?!~))`;
	const MarkoutLine = sequence`(?:${MarkoutStart})(?:${MarkoutStub}|.*)*$`;
	// const MarkoutDivider = sequence`-(?:[ \t]*-)+|=(?:=[ \t]*)+`;
	const MarkoutDivider = sequence`-{2,}|={2,}|\*{2,}|(?:- ){2,}-|(?:= ){2,}=|(?:\* ){2,}\*`;
	const MarkoutATXHeading = sequence`#{1,6}(?= +${MarkoutLine})`;
	const MarkoutTextHeading = sequence`${MarkoutStart}.*\n(?=\2\={3,}\n|\2\-{3,}\n)`;

	const MarkoutSegments = Segmenter.define(
		type =>
			sequence`^
		  (?:
		    ${type(UNKNOWN)}(${MarkoutMatter}$|[ \t]*(?:${MarkoutStub})[ \t]*$)|
		    (?:
		      ${type(INSET)}((?:  |\t)*?(?:> ?)*?(?:> ?| *))
		      (?:
		        ${type('fence')}(?:(${'```'}|~~~)(?=.*\n)[^]*?\n\2\3.*$)|
		        ${type('table')}(?:([|](?=[ :-]).+[|]$)(?:\n\2[|].+[|]$)+)|
		        ${type('heading')}(?:(${MarkoutATXHeading}|${MarkoutTextHeading}).*$)|
		        ${type('list')}(?:(${MarkoutLists}) +${MarkoutLine}(?:\n\2 {2,4}${MarkoutLine})*$)|
		        ${type('alias')}(?:(\[.+?\]: .+)$)|
		        ${type('divider')}(?:(${MarkoutDivider})$)|
		        ${type('feed')}(?:([ \t]*(?:\n\2[ \t])*)$)|
		        ${type('paragraph')}(?:(${MarkoutLine}(?:\n\2 {0,2}${MarkoutLine})*)$)
		      )|
		      ${type(UNKNOWN)}(.+?$)
		    )
		  )(?=${type(LOOKAHEAD)}(\n?^.*$)?)
		`,
		'gmi',
	);
	return MarkoutSegments;
})();

const ALIASES$1 = 'aliases';

class MarkoutSegmentNormalizer extends MarkoutBlockNormalizer {
	/**
	 * @param {string} sourceText
	 * @param {{ aliases?: { [name: string]: alias } }} [state]
	 */
	normalizeSegments(sourceText, state = {}) {
		const {sources = (state.sources = []), [ALIASES$1]: aliases = (state[ALIASES$1] = {})} = state;

		// for (const segment of matchAll(sourceText, MarkoutSegments)) {}

		try {
			state.segments = [...matchAll(sourceText, MarkoutSegments)];

			return this.normalizeBlocks(sourceText, state);
		} finally {
			import.meta['debug:markout:segment-normalization'] && console.log('normalizeSegments:', state);
		}

		Normalization: {
			// const {[BLOCKS]: sourceBlocks} = source;
			// for (const {text, fence, unfenced} of sourceBlocks[MATCHES]) {
			// 	sourceBlocks.push(
			// 		fence
			// 			? text
			// 			: this.normalizeParagraphs(
			// 					this.normalizeBreaks(this.normalizeLists(this.normalizeReferences(text, state))),
			// 			  ),
			// 	);
			// }
			// source.normalizedText = sourceBlocks.join('\n');
			import.meta['debug:markout:block-normalization'] && console.log('normalizeSourceText:', state);
		}

		// return source.normalizedText;
	}
}

debugging('markout', import.meta, [
	// import.meta.url.includes('/markout/lib/') ||
	typeof location === 'object' && /[?&]debug(?=[&#]|=[^&]*\bmarkout|$)\b/.test(location.search),
	'segment-normalization',
	'block-normalization',
	'paragraph-normalization',
	'anchor-normalization',
	'break-normalization',
]);

class MarkoutNormalizer extends MarkoutSegmentNormalizer {
	normalizeSourceText(sourceText) {
		const {normalized = (this.normalized = new Map())} = this;
		let normalizedText = normalized.get(sourceText);
		normalizedText !== undefined ||
			normalized.set(
				sourceText,
				(normalizedText = normalizeString(this.normalizeSegments(normalizeString(sourceText)))),
			);
		return normalizedText;
	}
}

const {
	// Attempts to overcome **__**
	'markout-render-span-restacking': SPAN_RESTACKING = true,
	'markout-render-newline-consolidation': NEWLINE_CONSOLIDATION = false,
} = import.meta;

const SourceType = 'source-type';
const SourceParameters = 'source-parameters';
const MarkupSyntax = 'markup-syntax';

const normalize = sourceText => {
	const {normalizer = (normalize.normalizer = new MarkoutNormalizer())} = normalize;
	return normalizer.normalizeSourceText(sourceText);
};

const render = tokens => {
	const {
		punctuators = (render.punctuators = createPunctuators()),
		renderer = (render.renderer = new MarkoutRenderer({punctuators})),
	} = render;
	return renderer.renderTokens(tokens);
};

const tokenize = sourceText => tokenize$1(`${sourceText.trim()}\n}`, {sourceType: 'markdown'});

const FencedBlockHeader = /^(?:(\w+)(?:\s+(.*?)\s*|)$|)/m;

class MarkoutRenderingContext {
	constructor(renderer) {
		({punctuators: this.punctuators} = this.renderer = renderer);

		[
			this.passthru,
			this.block,
			this.fenced,
			this.header,
			this.indent,
			this.newlines,
			this.comment,
		] = this.renderedText = '';

		SPAN_RESTACKING && createSpanStack(this);
	}
}

class MarkoutRenderer {
	constructor({punctuators = createPunctuators()} = {}) {
		this.punctuators = punctuators;
	}
	renderTokens(tokens, context = new MarkoutRenderingContext(this)) {
		context.tokens = tokens;

		const {punctuators} = context;
		const {renderClasses} = this;

		for (const token of context.tokens) {
			if (!token || !token.text) continue;
			let {text, type = 'text', punctuator, breaks, hint, previous} = token;
			let body = text;

			if (context.passthru || context.fenced) {
				if (context.fenced) {
					if (context.fenced === context.passthru) {
						context.header += text;
						breaks && ((context.header = context.header.trimRight()), (context.passthru = ''));
					} else if (punctuator === 'closer' && text === '```') {
						let sourceType, sourceParameters;
						if (context.header) {
							[, sourceType = 'markup', sourceParameters] = FencedBlockHeader.exec(context.header);
							import.meta['debug:fenced-block-header-rendering'] &&
								console.log('fenced-block-header', {
									fenced: context.fenced,
									header: context.header,
									passthru: context.passthru,
									sourceType,
									sourceParameters,
								});
						}
						// passthru rendered code
						context.renderedText += `<${context.block} class="markup code" ${SourceType}="${sourceType || 'markup'}"${
							// sourceParameters ? ` ${SourceParameters}="${sourceParameters}"` : ''
							(sourceParameters && ` ${sourceParameters}`) || ''
						}>${encodeEntities(context.passthru)}</${context.block}>`;
						context.header = context.indent = context.fenced = context.passthru = '';
					} else {
						// passthru code
						context.passthru += body.replace(context.indent, '');
					}
					// continue;
				} else {
					// passthru body
					context.passthru += body;
					if (punctuator === 'closer' || (context.comment && punctuator === 'comment')) {
						// passthru body rendered
						context.renderedText += context.passthru;
						context.passthru = '';
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
					(text in punctuators.entities && (body = punctuators.entities[text]));

				if (punctuator) {
					context.passthru =
						(((context.comment = punctuator === 'comment' && text) || punctuators.tags.has(text)) && text) || '';
					if (context.passthru) continue;
					// SPAN_RESTACKING && punctuator === 'opener' && context.stack[text] >= 0 && (punctuator = 'closer');
					if (punctuator === 'opener') {
						if ((context.fenced = text === '```' && text)) {
							context.block = 'pre';
							context.passthru = context.fenced;
							[context.indent = ''] = /^[ \t]*/gm.exec(previous.text);
							context.indent && (context.indent = new RegExp(String.raw`^${context.indent}`, 'mg'));
							context.header = '';
							// punctuator opener fence
							continue;
						} else if (text in punctuators.spans) {
							if (SPAN_RESTACKING && (before = context.stack.open(text, body, classes)) === undefined) continue;
							before || ((before = `<${punctuators.spans[text]}${renderClasses(classes)}>`), classes.push('opener'));
						} else if (text === '<!' || text === '<%') {
							// Likely <!doctype …> || Processing instruction
							let next;
							while (
								(next = context.tokens.next().value) &&
								(body += next.text) &&
								!(
									(next.punctuator === 'opener' && /^</.test(next.text)) ||
									(next.punctuator === 'closer' && />$/.test(next.text))
								)
							);
							context.passthru = body;
							continue;
						}
					} else if (punctuator === 'closer') {
						if (text === '```') {
							context.block = punctuators.blocks['```'] || 'pre';
						} else if (text in punctuators.spans) {
							if (SPAN_RESTACKING && (after = context.stack.close(text, body, classes)) === undefined) continue;
							after || ((after = `</${punctuators.spans[text]}>`), classes.push('closer'));
						}
					}
					(before || after) && (tag = 'tt');
					classes.push(`${punctuator}-token`);
				} else {
					if (breaks) {
						(!context.block && (tag = 'br')) || ((after = `</${context.block}>`) && (context.block = body = ''));
					} else if (type === 'sequence') {
						if (text[0] === '`') {
							tag = 'code';
							body = text.replace(/(``?)(.*)\1/, '$2');
							let fence = '`'.repeat((text.length - body.length) / 2);
							body = encodeEntities(body.replace(/&nbsp;/g, '\u202F'));
							fence in punctuators.entities && (fence = punctuators.entities[fence]);
							classes.push('fenced-code');
							classes.push('code');
						} else if (text.startsWith('---') && !/[^\-]/.test(text)) {
							tag = 'hr';
						} else if (!context.block && (context.block = punctuators.blocks[text])) {
							let previous = token;
							let inset = '';
							while ((previous = previous.previous)) {
								if (previous.breaks) break;
								inset = `${previous.text}${inset}`;
							}
							if (!/[^> \t]/.test(inset)) {
								before = `<${context.block}${renderClasses(classes)}>`;
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

			const details =
				tag &&
				[
					punctuator && `punctuator="${punctuator}"`,
					type && `token-type="${type}"`,
					breaks && `token-breaks="${breaks}"`,
					hint && `token-hint="${hint}"`,
				].join(' ');

			before && (context.renderedText += before);
			tag === 'br' || (context.newlines = 0)
				? (!NEWLINE_CONSOLIDATION && (context.renderedText += '\n')) ||
				  (context.newlines++ && (context.renderedText += '\n')) ||
				  (context.renderedText += '<br/>')
				: tag === 'hr'
				? (context.renderedText += '<hr/>')
				: body &&
				  (tag
						? (context.renderedText += `<${tag} ${details}${renderClasses(classes)}>${body}</${tag}>`)
						: (context.renderedText += body));
			after && (context.renderedText += after);
		}

		return context.renderedText;
		// return (context.output = new MarkoutOutput(context));
	}

	renderClasses(classes) {
		return ((classes = [...classes].filter(Boolean).join(' ')) && ` class="${classes}"`) || '';
	}
}

// render.classes = classes => ((classes = classes.filter(Boolean).join(' ')) && ` class="${classes}"`) || '';

/// Features

const createPunctuators = (
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
};

const createSpanStack = context => {
	const {
		punctuators: {spans},
		renderer,
	} = context;
	const stack = [];
	stack.open = (text, body, classes) => {
		const {[text]: lastIndex, length: index} = stack;
		if (lastIndex < 0) return (stack[text] = undefined); // ie continue
		if (lastIndex >= 0) return stack.close(text, body, classes);
		const span = spans[text];
		const before = `<${span}${renderer.renderClasses(classes)}>`;
		stack[text] = index;
		stack.push({text, body, span, index});
		return classes.push('opener'), before;
	};
	stack.close = (text, body, classes) => {
		const span = spans[text];
		const {[text]: index, length} = stack;
		if (index === length - 1) {
			index >= 0 && (stack.pop(), (stack[text] = undefined));
			const after = `</${span}>`;
			return classes.push('closer'), after;
		} else if (index >= 0) {
			classes.push('closer', `closer-token`);
			const details = `token-type="auto"${renderer.renderClasses(classes)}`;
			const closing = stack.splice(index, length).reverse();
			for (const {span, text, body} of closing) {
				context.renderedText += `<tt punctuator="closer" ${details}>${body}</tt></${span}>`;
				stack[text] < index || (stack[text] = -1);
			}
		} else {
			context.renderedText += text;
		}
	};
	context.stack = stack;
};

debugging('markout', import.meta, [
	// import.meta.url.includes('/markout/lib/') ||
	typeof location === 'object' && /[?&]debug(?=[&#]|=[^&]*\bmarkout|$)\b/.test(location.search),
	'block-normalization',
	'paragraph-normalization',
	'anchor-normalization',
	'break-normalization',
	'fenced-block-header-rendering',
]);

const markout = /*#__PURE__*/Object.freeze({
  SourceType: SourceType,
  SourceParameters: SourceParameters,
  MarkupSyntax: MarkupSyntax,
  normalize: normalize,
  render: render,
  tokenize: tokenize,
  UnicodeIdentifier: UnicodeIdentifier,
  MarkdownIdentityPrefixer: MarkdownIdentityPrefixer,
  MarkdownIdentityJoiner: MarkdownIdentityJoiner,
  MarkdownIdentityWord: MarkdownIdentityWord,
  MarkdownIdentity: MarkdownIdentity
});

const {
	'markout-content-normalization': CONTENT_NORMALIZATION = undefined,
	'markout-content-breaks-normalization': BREAKS_NORMALIZATION = undefined,
	'markout-content-headings-normalization': HEADINGS_NORMALIZATION = true,
	'markout-content-paragraph_normalization': PARAGRAPHS_NORMALIZATION = true,
	'markout-content-source-text-rendering': SOURCE_TEXT_RENDERING = true,
} = import.meta;

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
		(0, eval)(`${sourceText}\ndelete document['--currentScript--']`);
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
		const {MarkdownIdentity: Identity, MarkdownIdentityPrefixer: Prefixer, MarkdownIdentityJoiner: Joiner} = markout;
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
		}
	}

	normalizeParagraphsInFragment(fragment) {
		for (const paragraph of fragment.querySelectorAll(':not(code) p'))
			(paragraph.textContent && paragraph.textContent.trim()) || paragraph.remove();
	}

	renderSourceTextsInFragment(fragment) {
		const promises = [];

		for (const node of fragment.querySelectorAll(`[${SourceType$1}]:not(:empty)`))
			promises.push(this.renderSourceText({element: node, sourceType: node.getAttribute(SourceType$1)}));

		return promises.length ? Promise.all(promises) : Promise.resolve();
	}

	createRenderedMarkdownFragment(sourceText) {
		let fragment, normalizedText, tokens;
		const {template = (this.template = document.createElement('template'))} = this;
		template.innerHTML = render((tokens = tokenize((normalizedText = normalize(sourceText)))));
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
	}

	/**
	 * @param {HTMLElement} element
	 * @param {string} [sourceType]
	 * @param {string} [sourceText]
	 */
	async renderSourceText({element, sourceType, sourceText}) {
		!element ||
			!(sourceType || (sourceType = element.getAttribute(SourceType$1))) ||
			!(sourceText || (sourceText = (!element.hasAttribute(MarkupSyntax$1) && element.textContent) || '')) ||
			void element.removeAttribute(SourceType$1) ||
			void element.setAttribute(MarkupSyntax$1, sourceType) ||
			(element.textContent = '') ||
			element
				.appendChild(
					await render$1((element.sourceText = sourceText), {
						sourceType,
						fragment: document.createDocumentFragment(),
					}),
				)
				.normalize();
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

/** @typedef {HTMLSlotElement} SLOT */
/** @typedef {HTMLDivElement} DIV */

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
			// const previous = this.sourceURL;
			// try {
			// const loading = loadTextFrom(url);
			const response = await fetch(url);
			if (!response.ok) throw Error(`Failed to fetch ${url}`);
			const text = await response.text();
			this.sourceURL = url;
			this.sourceText = text || '';
			// return;
			// (error = loading.error) || ((this.sourceURL = url), (this.sourceText = text));
			// }
			// catch (exception) {
			// 	error = (exception.stack, exception);
			// }
			// if (error) {
			// 	// if (previous) this.sourceURL = previous;
			// 	throw error;
			// }
			// return;
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
//# sourceMappingURL=browser.m.js.map
