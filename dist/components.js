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

// @ts-check
/// <reference path="./types/global.d.ts" />

const DefaultAttributes = 'defaultAttributes';
const IsInitialized = 'isInitialized';
const COMPONENT_LOADING_VISIBILITY = 'hidden !important';

const Component = (() => {
  class Component extends HTMLElement {
    constructor() {
      /** @type {ComponentStyleElement} */
      let style;
      /** @type {DocumentFragment} */
      let fragment;
      /** @type {this | ShadowRoot} */
      let root;

      super();

      root = new.target.shadowRoot ? this.attachShadow(new.target.shadowRoot) : this;

      //@ts-ignore
      fragment = new.target.template
        ? new.target.template.cloneNode(true)
        : root !== this || document.createDocumentFragment();

      if (new.target.styles) {
        root === this && (this.style.visibility = COMPONENT_LOADING_VISIBILITY);
        // this.style.visibility = COMPONENT_LOADING_VISIBILITY;
        (fragment || root).prepend((style = initializeComponentStyles(this, new.target)));
      }

      if (new.target.attributes && new.target.attributes.length) {
        this.attributes[DefaultAttributes] = initializeComponentAttributes(this, new.target);
        this.attributes[IsInitialized] = false;
      }

      if (new.target.template) {
        for (const element of fragment.querySelectorAll('[id]')) this[`#${element.id}`] = element;
        for (const element of fragment.querySelectorAll('slot'))
          `::${element.name || ''}` in this || (this[`::${element.name || ''}`] = element);
      }

      new.target.initializeRoot(this, fragment, style, root);
    }

    connectedCallback() {
      this.attributes[IsInitialized] === false && this.initializeAttributes();
    }

    attributeChangedCallback(attributeName, previousValue, nextValue) {
      previousValue === nextValue ||
        previousValue == nextValue ||
        (typeof this.updateAttribute === 'function'
          ? this.updateAttribute(attributeName, nextValue, previousValue)
          : attributeName in this && (this[attributeName] = nextValue));
    }

    initializeAttributes() {
      const attributes = this.attributes;
      if (!attributes[IsInitialized] && attributes[DefaultAttributes]) {
        attributes[IsInitialized] = true;
        for (const attribute in attributes[DefaultAttributes])
          this.updateAttribute(attribute, this[attribute]);
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
      //@ts-ignore
      style && root === host && (await new Promise(setTimeout));
      // if (root === host) return setTimeout(() => Component.initializeRoot(host, fragment, style));
      fragment && root.append(fragment);
      //@ts-ignore
      if (style) {
        await style.loaded;
        // await new Promise(requestAnimationFrame);
      }
      host.style.visibility === COMPONENT_LOADING_VISIBILITY && (host.style.visibility = '');
    }
  }

  const {defineProperty} = Object;

  /**
   * @template {typeof Component} C
   * @param {InstanceType<C>} component
   * @param {C} constructor
   */
  const initializeComponentAttributes = (component, constructor) => {
    const {prototype, attributes: componentAttributes} = constructor;
    for (const attribute of componentAttributes) {
      prototype.hasOwnProperty(attribute) ||
        defineProperty(this, attribute, {
          get() {
            return this.hasAttribute(attribute)
              ? this.getAttribute(attribute)
              : componentAttributes[attribute];
          },
          set(value) {
            value === null || value === undefined
              ? this.removeAttribute(attribute)
              : value === this.getAttribute(attribute) || this.setAttribute(attribute, value);
          },
        });
    }
    return componentAttributes;
  };

  const StyleElement = Symbol('styles.element');

  /**
   * @template {typeof Component} C
   * @param {InstanceType<C>} component
   * @param {C} constructor
   */
  const initializeComponentStyles = (component, constructor) => {
    /** @type {ComponentStyleElement} */
    const componentStyleElement =
      constructor[StyleElement] ||
      (constructor.styles &&
        (constructor[StyleElement] = createComponentStyleElement(constructor.styles)));

    if (componentStyleElement) return componentStyleElement.cloneStyleSheet();
  };

  /** @param {string} textContent */
  const createComponentStyleElement = textContent => {
    /** @type {ComponentStyleElement} */
    const style = document.createElement('style');

    style.loaded = new Promise(resolve => {
      const handler = event => {
        style.removeEventListener('load', handler);
        style.removeEventListener('error', handler);
        style.removeEventListener('abort', handler);
        resolve();
      };
      style.addEventListener('load', handler, {capture: true, passive: false, once: true});
      style.addEventListener('error', handler, {capture: true, passive: false, once: true});
      style.addEventListener('abort', handler, {capture: true, passive: false, once: true});
    });

    style.cloneStyleSheet = () => {
      /** @type {any} */
      const clone = style.cloneNode(true);
      clone.loaded = style.loaded;
      return clone;
    };

    style.textContent = textContent;

    return style;
  };

  {
    const hasOwnProperty = Function.call.bind(Object.prototype.hasOwnProperty);

    const {defineProperty, defineProperties, getOwnPropertyDescriptor} = Object;

    /**
     * @template {string|symbol} K
     * @template V
     * @param {{}} target
     * @param {K} property
     * @param {V} value
     */
    const updateProperty = (target, property, value) => (
      !target ||
        !property ||
        ((!hasOwnProperty(target, property) ||
          getOwnPropertyDescriptor(target, property).configurable !== false) &&
          defineProperty(target, property, {
            get: () => value,
            set: value => updateProperty(target, property, value),
            configurable: true,
          })),
      target
    );

    const descriptor = {get: () => undefined, enumerable: true, configurable: true};

    defineProperties(Component, {
      attributes: {
        set(value) {
          updateProperty(this, 'attributes', value);
        },
        ...descriptor,
      },
      observedAttributes: {
        set(value) {
          updateProperty(this, 'observedAttributes', value);
        },
        ...descriptor,
      },
      shadowRoot: {
        set(value) {
          updateProperty(this, 'shadowRoot', value);
        },
        ...descriptor,
      },
      template: {
        set(value) {
          updateProperty(this, 'template', value);
        },
        ...descriptor,
      },
      styles: {
        set(value) {
          updateProperty(this, 'styles', value);
        },
        ...descriptor,
      },
    });
  }

  return Component;

  AMBIENT: {
    /** @type {import('./attributes').Attributes<string> | undefined} */
    Component.attributes = undefined;

    /** @type {string[]} */
    Component.observedAttributes = undefined;

    /** @type {ShadowRootInit} */
    Component.shadowRoot = undefined;

    /** @type {DocumentFragment} */
    Component.template = undefined;

    /** @type {string} */
    Component.styles = undefined;

    /** @type {<T, R, U>(attributeName: string, nextValue?: T, previousValue?: T | R) => U} */
    Component.prototype.updateAttribute = undefined;
  }
})();

/** @typedef {import('./attributes')['Attributes']} Attributes */
/** @typedef {HTMLStyleElement & Partial<{cloneStyleSheet(): ComponentStyleElement, loaded?: Promise<void>}>} ComponentStyleElement */

const {Toggle, Attributes} = (() => {
  const {assign, defineProperties, getOwnPropertyNames} = Object;

  /**
   * @template T
   * @param {T} value
   * @returns {attribute.toggle<T>}
   */
  const Toggle = (matcher => value =>
    ((value !== null && value !== undefined && typeof value !== 'symbol') || undefined) &&
    (value === true ||
      value == true ||
      ((value !== '' || '') &&
        ((value !== false && value != false) || false) &&
        (value = matcher.exec(value) || undefined) &&
        (value[1] ? true : value[2] ? false : undefined))))(
    /\b(?:(true|on|yes)|(false|off|no))\b/i,
  );

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
      return new this(attributes);
    }
  }

  defineProperties(Attributes.prototype, {
    [Symbol.toStringTag]: {value: 'Attributes'},
    [Symbol.isConcatSpreadable]: {value: false},
  });

  return {Attributes, Toggle};
})();

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

// @ts-check
/// <reference path="./types/global.d.ts" />
/// <reference types="node" />

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
  assign,
  defineProperty,
  defineProperties,
  create,
  freeze,
  seal,
  preventExtensions,
  getOwnPropertyDescriptor,
  getOwnPropertyDescriptors,
  getOwnPropertyNames,
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

//@ts-check
const awaitAll = async (...values) => void (await Promise.all(values.flat()));

const resolvedPromise = Promise.resolve();

/**
 * @template T
 * @typedef {import('./types/async').iterable<T>} iterable<T>
 */

/**
 * @template T
 * @typedef {import('./types/async').iterates<T>} iterates<T>
 */

const resolve = (specifier, referrer) => {
  try {
    return `${referrer === undefined ? new URL(specifier) : new URL(specifier, referrer)}`;
  } catch (exception) {}
};

const preloading =
  (!currentDocument && {}) || currentDocument.links['[[preload]]'] || (currentDocument.links['[[preload]]'] = {});

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
                  extension
                    ? ` - extension $"{extension}" is not supported`
                    : ' - cannot infer type'
                }.`,
              ),
            );
          as = preload.extensions[as];
        } else if (!types[(as = `${as}`.toLowerCase())]) {
          return Promise.reject(
            new TypeError(`Cannot preload "${url}" - type "${as}" is not supported.`),
          );
        }
        promise =
          preloading[url] ||
          (promise = preloading[href] = preloading[url] = createPreloadPromise({href, as}));
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

    if (
      type === 'style' &&
      Array.prototype.find.call(ownerDocument.styleSheets, ({href}) => href === href)
    ) {
      return resolvedPromise;
    } else if (
      type === 'script' &&
      Array.prototype.find.call(ownerDocument.scripts, ({src}) => src === href)
    ) {
      return resolvedPromise;
    } else if (preloads && preloads.length) {
      url.pathname && (url.pathname = url.pathname.replace(/\/+/g, '/'));
      const href = `${url}`;
      for (const link of preloads) {
        if (link.href === href) return resolvedPromise;
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

  const base = (preload.base = `${(typeof location === 'object' &&
    typeof location.href === 'string' &&
    location) ||
    new URL(src.replace(/\/lib\/.*?$/i, ''))}`);
  const types = (preload.types = {});
  const extensions = (preload.extensions = {});

  types.fetch = 'fetch';
  extensions.js = types.script = types.module = 'script';
  extensions.css = types.stylesheet = types.style = 'style';
  extensions.html = types.document = 'document';

  return preload;
})(import.meta.url);

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
  constructor(href, type, id) {
    let link, selector;
    if (id) {
      // console.log({href, type, id});
      if (type === 'style') {
        selector = `link#${CSS.escape(id)}`;
        link = currentDocument.querySelector(
          `${selector}[rel=stylesheet][href], ${selector}[rel=preload][as=style][href]`,
        );
      }
    }
    if (link && link.href) {
      super(link.href);
      Object.defineProperty(this, PRELOAD, {value: resolvedPromise});
    } else {
      super(href);
    }
    this.id = id;
    this.type = type;
    // Object.defineProperties(this, Object.getOwnPropertyDescriptors(Object.freeze({...this})));
  }

  get [PRELOAD]() {
    const value = preload(this, this.type);
    // const value =
    //   this.type === 'style' &&
    //   Array.prototype.find.call(document.styleSheets, ({href}) => (href = this.href))
    //     ? resolvedPromise
    //     : preload(this, this.type);
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
          const promise = awaitAll(Object.values(assets.script));
          Object.defineProperty(this, SCRIPTS, {value: promise});
          return promise;
        },
        configurable: true,
      },

      [STYLES]: {
        get: () => {
          const promise = awaitAll(Object.values(assets.style));
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

      Object.defineProperty(
        assets[type],
        href,
        (descriptors[id] = {value: new Asset(url, type, id), enumerable: true}),
      );

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

export { Assets, Attributes, Component, Toggle, css, html, raw };
//# sourceMappingURL=components.js.map
