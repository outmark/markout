import { b as entities$1 } from './tokenizer.browser.es.extended.js';
import { c as content, d as defaults, D as DOM_MUTATIONS, B as BREAK_NORMALIZATION, H as HEADING_NORMALIZATION, P as PARAGRAPH_NORMALIZATION, a as BLOCK_PARAGRAPH_NORMALIZATION, L as LIST_PARAGRAPH_NORMALIZATION, C as CHECKLIST_NORMALIZATION, b as BLOCKQUOTE_NORMALIZATION, e as BLOCKQUOTE_HEADING_NORMALIZATION, T as TOKEN_FLATTENING, f as DECLARATIVE_STYLING, S as SOURCE_TEXT_RENDERING, A as ASSET_REMAPPING, g as ASSET_INITIALIZATION, h as flags, r as render, t as tokenize, n as normalize, M as MarkupAttributeMap, i as renderSourceText, E as Enum, j as debugging } from './renderer.js';

//@ts-check
const IsInitialized = 'isInitialized';

const Component = (() => {
  const {HTMLElement = (() => /** @type {HTMLElementConstructor} */ (class HTMLElement {}))()} = globalThis;

  class Component extends HTMLElement {
    constructor() {
      /** @type {ComponentStyleElement} */ let style;
      /** @type {DocumentFragment}      */ let fragment;
      /** @type {(this | ShadowRoot)}   */ let root;

      super();

      root = new.target.shadowRoot ? this.attachShadow(new.target.shadowRoot) : this;

      fragment = new.target.template
        ? /** @type {DocumentFragment} */ (new.target.template.cloneNode(true))
        : root === this && this.ownerDocument.createDocumentFragment();

      if (new.target.styles) {
        root === this && ComponentStyle.setLoadingVisibility(this, false);
        (fragment || root).prepend((style = ComponentStyle.for(this, new.target)));
      }

      if (new.target.attributes && new.target.attributes.length)
        ComponentAttributes.initializeComponent(this, new.target);

      if (new.target.template) {
        for (const element of fragment.querySelectorAll('[id]')) this[`#${element.id}`] = element;
        for (const element of fragment.querySelectorAll('slot'))
          `::${element.name || ''}` in this || (this[`::${element.name || ''}`] = element);
      }

      new.target.initializeRoot(this, fragment, style, root);

      fragment = style = root = null;
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
      ComponentAttributes.initializeAttributes(this);
    }

    trace(detail, context = (detail && detail.target) || this, ...args) {
      const span = typeof context === 'string' ? '%s' : '%O';
      detail &&
        (detail.preventDefault
          ? console.log(`${span}‹%s› %O`, context, detail.type, detail, ...args)
          : console.trace(`${span} %O`, context, detail, ...args));
    }

    static async initializeRoot(host, fragment, style, root) {
      // Upgrade shadow root prototype from ‹this Component›.Root
      //  TODO: Chaining Component.Root inheritance via setter
      'Root' in this &&
        root !== host &&
        typeof this.Root === 'function' &&
        this.Root.prototype instanceof ShadowRoot &&
        Object.setPrototypeOf(root, this.Root.prototype);

      //@ts-ignore
      style && root === host && (await new Promise(setTimeout));
      fragment && root.append(fragment);

      // Attach host['(on…)'] listeners against the shadow root
      //  TODO: Attaching host['(on…)'] listeners without shadow root.
      if (typeof root['(onevent)'] === 'function') {
        const options = {passive: false};
        for (const property in host.constructor.prototype) {
          if (
            typeof property === 'string' &&
            typeof host[`(${property})`] === 'function' &&
            property.startsWith('on')
          ) {
            root[`(${property})`] = host[`(${property})`];
            root.addEventListener(property.slice(2), root['(onevent)'], options);
          }
        }
      }

      style && style.loaded && (await style.loaded);
      ComponentStyle.setLoadingVisibility(host, true);
    }
  }

  const {defineProperty} = Object;

  /**
   * TODO: Define behaviours for ComponentStyles instances
   *  SEE: https://wicg.github.io/construct-stylesheets/
   */
  class ComponentAttributes {
    /**
     * @template {typeof Component} C
     * @param {InstanceType<C>} component
     * @param {C} constructor
     */
    static initializeComponent(component, constructor) {
      const {prototype, attributes: componentAttributes} = constructor;
      for (const attribute of componentAttributes) {
        prototype.hasOwnProperty(attribute) ||
          defineProperty(this, attribute, {
            get() {
              return this.hasAttribute(attribute) ? this.getAttribute(attribute) : componentAttributes[attribute];
            },
            set(value) {
              value === null || value === undefined
                ? this.removeAttribute(attribute)
                : value === this.getAttribute(attribute) || this.setAttribute(attribute, value);
            },
          });
      }

      component[ComponentAttributes.DEFAULTS] = componentAttributes;
      component[ComponentAttributes.INITIALIZED] = false;
    }

    static initializeAttributes(component) {
      if (component && !component[ComponentAttributes.INITIALIZED] && component[ComponentAttributes.DEFAULTS]) {
        component[ComponentAttributes.INITIALIZED] = true;
        if (typeof component.updateAttribute === 'function') {
          for (const attribute in component[ComponentAttributes.DEFAULTS])
            component.updateAttribute(attribute, this[attribute]);
        } else {
          console.warn('ComponentAttributes invoked on an unsupported component: %O', component);
        }
      }
    }
  }

  ComponentAttributes.DEFAULTS = Symbol('attributes.defaults');
  ComponentAttributes.INITIALIZED = Symbol('attributes.initialized');

  /**
   * TODO: Define behaviours for ComponentStyles instances
   *  SEE: https://wicg.github.io/construct-stylesheets/
   */
  class ComponentStyle {
    /**
     * @param {Component} component
     * @param {boolean} [visibility] - Defaults relative to having --component-loading-visiblity--
     */
    static setLoadingVisibility(component, visibility) {
      if (visibility == null) visibility = !!component.style.getPropertyValue('--component-loading-visiblity--');
      if (visibility == false) {
        component.style.setProperty('--component-loading-visiblity--', 'hidden');
        component.style.visibility = `var(--component-loading-visiblity--${
          component.style.visibility ? `, ${component.style.visibility}` : ''
        }) !important`;
      } else if (visibility == true) {
        component.style.removeProperty('--component-loading-visiblity--');
        if (component.style.visibility.includes('--component-loading-visiblity--'))
          component.style.visibility = /^\s*var\s*\(\s*--component-loading-visiblity--\s*(?:,\s*)?(.*)\).*?$/[
            Symbol.replace
          ](component.style.visibility, '$1');
      } else {
        console.warn(`ComponentStyle.setLoadingVisibility invoked invalid visibility: %O`, visibility);
      }
    }

    /**
     * @template {typeof Component} C
     * @param {InstanceType<C>} component
     * @param {C} constructor
     */
    static for(component, constructor) {
      /** @type {ComponentStyleElement} */
      const componentStyleElement =
        constructor[ComponentStyle.ELEMENT] ||
        (constructor.styles &&
          (constructor[ComponentStyle.ELEMENT] =
            // /** @type {typeof ComponentStyle} */ (
            // (this !== undefined && ComponentStyle.isPrototypeOf(this) && this) ||
            // ComponentStyle
            // )

            ComponentStyle.createStyleElement(constructor.styles, component.ownerDocument)));

      if (componentStyleElement) return componentStyleElement.cloneStyleSheet();
    }

    /**
     * @param {string} textContent
     * @param {Document} [ownerDocument = document]
     * @param {boolean} [strict]
     * @throws - Where `!!strict` when `style.ownerDocument !== ownerDocument`
     * @throws - Where `!!strict` when `style.nodeName !== "STYLE"`
     */
    static createStyleElement(textContent, ownerDocument, strict) {
      let nodeName, nodeOwnerDocument;

      if (ownerDocument == null) ownerDocument = document;

      /** @type {ComponentStyleElement} */
      const style = ownerDocument.createElement('style');

      ({nodeName, ownerDocument: nodeOwnerDocument} = style);

      if (ownerDocument !== nodeOwnerDocument || nodeName !== 'STYLE') {
        const details = {
          style,
          ...(nodeOwnerDocument !== ownerDocument && {
            '{ownerDocument} actual': nodeOwnerDocument,
            '{ownerDocument} expected': ownerDocument,
          }),
          ...(nodeName !== 'STYLE' && {
            '{nodeName} actual': nodeName,
            '{nodeName} expected': 'STYLE',
          }),
        };

        if (!strict) {
          console.warn('Potentially unsafe <style> creation: %O', details);
        } else {
          throw Object.assign(
            Error(
              [
                'Unsafe <style> element creation',
                ownerDocument !== nodeOwnerDocument && 'mismatching ownerDocument and <style>.ownerDocument.',
                nodeName !== 'STYLE' && '<style>.nodeName !== "STYLE".',
              ]
                .filter(Boolean)
                .join(' - '),
            ),
            {details},
          );
        }
      }

      style.loaded = new Promise(resolve => {
        const handler = event => {
          for (const event of ['load', 'error', 'abort']) style.removeEventListener(event, handler);
          resolve();
        };
        handler.options = {capture: true, passive: false, once: true};
        for (const event of ['load', 'error', 'abort']) style.addEventListener(event, handler, handler.options);
      });

      style.cloneStyleSheet = () => {
        /** @type {any} */
        const clone = style.cloneNode(true);
        clone.loaded = style.loaded;
        return clone;
      };

      style.textContent = textContent;

      return style;
    }
  }

  ComponentStyle.ELEMENT = Symbol('style.element');

  {
    // const {
    //   ShadowRoot: Root = (() => /** @type {typeof ShadowRoot} */ (class ShadowRoot {}))(), // Polyfill as needed
    // } = globalThis;

    Component.Root = class Root extends ShadowRoot {
      ['(onevent)'](event) {
        return `(on${event.type})` in this ? this[`(on${event.type})`].call(this.host || this, event) : undefined;
      }
    };

    /**
     * @template {PropertyKey} K
     * @template V
     * @param {{}} target
     * @param {K} property
     * @param {V} value
     */
    const updateProperty = (target, property, value) => (
      !target ||
        !property ||
        ((!Object.prototype.hasOwnProperty.call(target, property) ||
          Object.getOwnPropertyDescriptor(target, property).configurable !== false) &&
          Object.defineProperty(target, property, {
            get: () => value,
            set: value => updateProperty(target, property, value),
            configurable: true,
          })),
      target
    );

    const descriptor = {get: () => undefined, enumerable: true, configurable: true};

    Object.defineProperties(Component, {
      set: {
        value: {
          /** @template T @param {PropertyKey} property @param {T} value */
          set(property, value) {
            updateProperty(this, property, value);
            return value;
          },
        }.set,
      },
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
      html: {
        set(value) {
          this === Component || updateProperty(this, 'html', value);
        },
        get() {
          return components.html;
        },
      },
      css: {
        set(value) {
          this === Component || updateProperty(this, 'css', value);
        },
        get() {
          return components.css;
        },
      },
      styling: {
        set(value) {
          this === Component || updateProperty(this, 'styling', value);
        },
        get() {
          return components.styling;
        },
      },
      Attributes: {
        set(value) {
          this === Component || updateProperty(this, 'Attributes', value);
        },
        get() {
          return components.Attributes;
        },
      },
      Assets: {
        set(value) {
          this === Component || updateProperty(this, 'Assets', value);
        },
        get() {
          return components.Assets;
        },
      },
    });
  }

  if (void Component) {
    /** @type {<T>(property:PropertyKey, value: T) => T} */
    Component.set = undefined;

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

    // Those properties are meant for bundling
    /** @type {import('./templates.js')['css']} */
    Component.css = components.css;
    /** @type {import('./templates.js')['html']} */
    //@ts-ignore
    Component.html = components.html;
    /** @type {import('./styling.js')['styling']} */
    Component.styling = components.styling;
    /** @type {import('./assets.js')['Assets']} */
    Component.Assets = components.Assets;
    /** @type {import('./attributes.js')['Attributes']} */
    Component.Attributes = components.Attributes;

    /** @type {<T, R, U>(attributeName: string, nextValue?: T, previousValue?: T | R) => U} */
    Component.prototype.updateAttribute = undefined;

    /** @type {{(): void}} */
    Component.prototype.disconnectedCallback = undefined;
  }

  return Component;
})();

/** @typedef {typeof HTMLElement} HTMLElementConstructor */
/** @typedef {import('./attributes')['Attributes']} Attributes */
/** @typedef {HTMLStyleElement & Partial<{cloneStyleSheet(): ComponentStyleElement, loaded?: Promise<void>}>} ComponentStyleElement */

// @ts-check

const components = {};

/** @type {(typeof Component)['html']} */
components.html = import.meta['components.html'];
/** @type {(typeof Component)['css']} */
components.css = import.meta['components.css'];
/** @type {(typeof Component)['styling']} */
components.styling = import.meta['components.styling'];
/** @type {(typeof Component)['Assets']} */
components.Assets = import.meta['components.Assets'];
/** @type {(typeof Component)['Attributes']} */
components.Attributes = import.meta['components.Attributes'];

components.Component = import.meta['components.Component'] = Component;

//@ts-check

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

  import.meta['components.css'] = components.css = css;

  return css;
})({
  prefixes: {'backdrop-filter': ['-webkit'], position: [], 'position:sticky': ['-webkit']},
  prefixed: ['user-select', 'backdrop-filter', 'position'],
});

/**
 * @template T, V
 * @typedef {import('./templates').TaggedTemplate<T, V>} TaggedTemplate
 */

//@ts-check

/** @type {StringTaggedTemplate<string>} */
const raw = String.raw;

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
  return (import.meta['components.template'] = components.template = template);
};
template.html = template;

const html = (template => {
  /** @type {HTMLTaggedTemplate<DocumentFragment>} */
  return (import.meta['components.html'] = components.html = (...args) => {
    //@ts-ignore
    (args.content = document.createDocumentFragment()).appendChild(
      Reflect.apply(template, null, args).content,
    );
    //@ts-ignore
    return args.content;
  });
})(template());

/** @typedef {{raw: TemplateStringsArray['raw']}} RawStrings */
/** @typedef {TemplateStringsArray | RawStrings} TemplateStrings */

/** @template T, V @typedef {(strings: TemplateStrings, ...values: V[]) => T} TaggedTemplate */

/** @template T @typedef {TaggedTemplate<T, {toString(): string | void} | {} | void>} StringTaggedTemplate */
/** @template T @typedef {TaggedTemplate<T, {toString(): string | void} | DocumentFragment | HTMLElement | {} | void>} HTMLTaggedTemplate */

//@ts-check

const {Toggle, Attributes} = (() => {
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
        (value[1] ? true : value[2] ? false : undefined))))(/\b(?:(true|on|yes)|(false|off|no))\b/i);

  /**
   * @template {string} K
   * @extends {Array<K>}
   */
  class Attributes extends Array {
    //@ts-ignore
    /** @param {{[index: number]:K} | {[name: K]}} attributes */
    constructor(attributes) {
      const names =
        (attributes && ((Symbol.iterator in attributes && attributes) || Object.getOwnPropertyNames(attributes))) || '';
      //@ts-ignore
      super(...names);
      !attributes || names === attributes || Object.assign(this, attributes);
    }

    //@ts-ignore
    *entries() {
      for (const key of super[Symbol.iterator]()) {
        //@ts-ignore
        yield [key, this[key]];
      }
    }

    /**
     * @template {string} K
     //@ts-ignore
     * @template {{[name: K]}} T
     * @param {...T} definitions
     * @returns {Attributes<K> | T}
     */
    static from(...definitions) {
      const attributes = {};

      for (const object of definitions) {
        //@ts-ignore
        for (const name of Symbol.iterator in object ? object : Object.getOwnPropertyNames(object)) {
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

  Attributes.Toggle = Toggle;

  Object.defineProperties(Attributes.prototype, {
    [Symbol.toStringTag]: {value: 'Attributes'},
    [Symbol.isConcatSpreadable]: {value: false},
  });

  import.meta['components.Attributes'] = components.Attributes = Attributes;

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
 //@ts-ignore
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

  // const URLParts = /(?:^[^?#\n]*|[?#][^\n\s]*$|$)/;

  const createPreloadPromise = ({
    href,
    url = href,
    as,
    document: ownerDocument = currentDocument,
    initiator = import.meta.url,
  }) => {
    if (!ownerDocument) {
      if (currentDocument && !preload.promise.warned) {
        console.warn('[preload]: Preload is not supported.');
        preload.promise.warned = true;
      }
      return resolvedPromise;
    }
    const {head = currentDocument.head} = ownerDocument;

    const type = types[as] || types[`${as}`.toLowerCase()] || as;

    if (
      (type === 'style' && Array.prototype.find.call(ownerDocument.styleSheets, ({href}) => href === href)) ||
      (type === 'script' && Array.prototype.find.call(ownerDocument.scripts, ({src}) => src === href))
    ) {
      return resolvedPromise;
    }

    /** @type {HTMLLinkElement} */ let link;
    /** @type {NodeListOf<HTMLLinkElement>} */ const matchedLinks = head.querySelectorAll(
      `link[rel=preload][as="${type}"],link[id^="style:"][prefetch]`,
    );

    if (matchedLinks && matchedLinks.length) {
      url.pathname && (url.pathname = url.pathname.replace(/\/+/g, '/'));
      const [head] = url.href.split(/[?#]/, 2);
      for (const matchedLink of matchedLinks) {
        if (
          // preloadLink.href.startsWith(head) ||
          matchedLink.href === url.href
        ) {
          if (matchedLink.rel === 'preload') {
            link = matchedLink;
            break;
          } else if (type === 'style' && matchedLink.rel === 'prefetch' && matchedLink.id.startsWith('style:')) {
            break;
          }
        }
      }
    }

    if (!link) {
      link = ownerDocument.createElement('link');
      link.href = url;
      link.rel = 'preload';
      link.as = type;
    }

    const promise = Object.defineProperties(
      new Promise((resolve, reject) => {
        let done = event =>
          void (link.removeEventListener('abort', done),
          link.removeEventListener('error', done),
          link.removeEventListener('load', done),
          (done = resolve()),
          (promise.loaded = event.type === 'load') ||
            (event.error && (promise.error = event.error)) ||
            (promise[event.type] = true));
        link.addEventListener('abort', done, {once: true});
        link.addEventListener('error', done, {once: true});
        link.addEventListener('load', done, {once: true});
      }).finally(() => {
        Object.defineProperty(promise, 'link', {value: (link = link.remove())});
      }),
      {link: {value: link, configurable: true}, initiator: {value: initiator}},
    );

    // link.href = url;
    // link.rel = 'preload';
    // link.as = type;
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

// console.table(Object.fromEntries([... /((?:\b[a-z]+\:\/*)?(?:\b[a-z](?: ?[^?#\0-\x1f\\\x7f-\xA0]+||\\.)*)+)([?#]\S*)?/ig[Symbol.matchAll]([` http://a-b.com/c!sd=v\\ /dsv/sv/?q#h\n`.repeat(2)].join('\n'))].map(({0: k, 1:a, 2: b, length, index}) => [`${k} (${index})`, {a, b, u: (u => { try { return new URL(u, 'file:///').href } catch (e) { return e }})(`${a||''}${b||''}`), index, length}])))

//@ts-check

const {Assets, Asset} = (() => {
  const root =
    (currentDocument && currentDocument.baseURI && new URL('./', currentDocument.baseURI)) ||
    (currentWindow && currentWindow.location && new URL('./', String(currentWindow.location))) ||
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
    /** @typedef {{base: string, Asset?: typeof Asset}} Options */
    /** @typedef {string} specifier */
    /** @param {Options} [options] */
    /** @param {... specifier} [specifiers] */
    constructor(options, ...specifiers) {
      const assets = {script: {}, style: {}};

      const {base = `${root}`, Asset = new.target.Asset || Assets.Asset} = {
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
          (descriptors[id] = {
            value: new Asset(url, type, id),
            enumerable: true,
          }),
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

  import.meta['components.Assets'] = components.Assets = Assets;

  Assets.Asset = Asset;

  return {Assets, Asset};
})();

//@ts-check

const styling = (() => {
  /** @typedef {string} styling.Value */
  /** @typedef {string} styling.Property */
  /** @typedef {string} styling.Style */
  /** @typedef {HTMLElement} styling.Element */
  /** @typedef {Iterable<styling.Element>} styling.Elements */
  /** @typedef {DocumentFragment} styling.Fragment */
  /** @typedef {Iterable<styling.Fragment>} styling.Fragments */
  /** @typedef {styling.Element|styling.Fragment} styling.Node */
  /** @typedef {Record<string, any>} styling.Options */
  /** @typedef {Record<string, string>} styling.Lookup */

  const styling = {};

  const {ELEMENT_NODE = 1, ATTRIBUTE_NODE = 2, DOCUMENT_FRAGMENT_NODE = 11} =
    (globalThis.Node && globalThis.Node.prototype) || {};

  /**
   * @param {styling.Value} value
   * @param {styling.Options} [options]
   */
  styling.autoprefix = (value, options) => value.replace(styling.autoprefix.matcher, styling.autoprefix.replacer);

  {
    styling.autoprefix.mappings = {};
    styling.autoprefix.prefix = CSS.supports('-moz-appearance', 'initial')
      ? '-moz-'
      : CSS.supports('-webkit-appearance', 'initial')
      ? '-webkit-'
      : '';
    if (styling.autoprefix.prefix) {
      const {mappings, prefix} = styling.autoprefix;
      const map = (property, value, mapping = `${prefix}${value}`) =>
        CSS.supports(property, value) || (mappings[value] = mapping);

      if (prefix === '-webkit-') {
        map('width', 'fill-available');
      } else if (prefix === '-moz-') {
        map('width', 'fill-available', '-moz-available');
      }

      const mapped = Object.keys(mappings);

      if (mapped.length > 0) {
        styling.autoprefix.matcher = new RegExp(String.raw`\b-?(?:${mapped.join('|')})\b`, 'gi');
        Object.freeze((styling.autoprefix.replacer = value => mappings[value] || value));
        Object.freeze(styling.autoprefix.mappings);
        Object.freeze(styling.autoprefix);
      }
    }
  }

  /**
   * @param {styling.Value} value
   * @param {styling.Property} property
   * @param {styling.Options} [options]
   */
  styling.normalize = (value, property, options) => {
    if (!value || !(value = value.trim())) return '';
    value.startsWith('--') && !value.includes(' ') && (value = `var(${value}--${property}--)`);
    return value;
  };

  /**
   * @param {styling.Element} element
   * @param {styling.Style} style
   * @param {styling.Options} [options]
   */
  styling.mixin = (element, style, options) => {
    // TODO: Explore computedStyle mixins
    element.style.border = `var(--${style}--border--, unset)`;
    element.style.background = `var(--${style}--background--, unset)`;
    element.style.color = `var(--${style}--color--, unset)`;
    element.style.font = `var(--${style}--font--, unset)`;
    element.style.opacity = `var(--${style}--opacity--, unset)`;
  };

  /**
   * @param {styling.Node} node
   * @param {styling.Options} [options]
   */
  styling.apply = (node, options) => {
    node == null ||
      typeof node !== 'object' ||
      (node.nodeType - DOCUMENT_FRAGMENT_NODE === 0
        ? // TODO: consider pseudom fragments
          styling.apply.toFragment(/** @type {DocumentFragment} */ (node))
        : // (node.nodeType - ELEMENT_NODE) === 0 &&
          styling.apply.toElement(/** @type {HTMLElement} */ (node)));
  };

  /**
   * @param {styling.Element} element
   * @param {styling.Options} [options]
   */
  styling.apply.toElement = (element, options) => {
    // const {lookup, autoprefix, normalize} = styling;

    for (const attribute of element.getAttributeNames()) {
      if (attribute in styling.lookup) {
        attribute === 'style:'
          ? styling.mixin(element, element.getAttribute(attribute))
          : styling.autoprefix === undefined
          ? (element.style[styling.lookup[attribute]] = styling.normalize(
              element.getAttribute(attribute),
              attribute.slice(0, -1),
            ))
          : (element.style[styling.lookup[attribute]] = styling.autoprefix(
              styling.normalize(element.getAttribute(attribute), attribute.slice(0, -1)),
            ));
        element.removeAttribute(attribute);
      } else if (options && options.attributes && typeof options.attributes[attribute] === 'function') {
        options.attributes[attribute](
          element,
          attribute,
          styling.normalize(element.getAttribute(attribute), attribute.slice(0, -1)),
          options,
        );
      }
    }
  };

  /**
   * @param {styling.Fragment} fragment
   * @param {styling.Options} [options]
   */
  styling.apply.toFragment = (fragment, options) => {
    // if (typeof styling.selector === 'string' && styling.selector !== '') return;
    for (const element of /** @type {Iterable<styling.Element>} */ (fragment.querySelectorAll(styling.selector)))
      styling.apply.toElement(element, options);
  };

  /** @type {styling.Lookup} */
  styling.lookup = {};

  {
    const selectors = [];
    const style = document.createElement('span').style;
    const Prefix = /^-?webkit-|-?moz-/;
    const Boundary = /[a-z](?=[A-Z])/g;

    for (const property of new Set([
      // Markout style properties
      'style', // mixin styling
      // CSS style properties
      ...Object.getOwnPropertyNames(
        Object.getOwnPropertyDescriptor(style, 'backgroundColor')
          ? // Webkit/Blink  et al
            style
          : // Firefox et al
            Object.getPrototypeOf(style),
      ).filter(property => style[property] === ''),
    ])) {
      const attribute = `${property.replace(Boundary, '$&-').toLowerCase()}:`.replace(Prefix, '');
      styling.lookup[attribute] = property;
      selectors.push(`[${CSS.escape(attribute)}]`);
    }

    styling.selector = selectors.join(',');
  }

  Object.freeze(Object.setPrototypeOf(styling.lookup, null));
  Object.freeze(styling.apply.toElement);
  Object.freeze(styling.apply.toFragment);
  Object.freeze(styling.apply);

  Object.freeze(styling);

  import.meta['components.styling'] = components.styling = styling;

  return styling;
})();

// import {entities} from '/markup/dist/tokenizer.browser.js';

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
  UnicodeIdentifier = raw`[\d${UnicodeIdentifierStart}][\d${UnicodeIdentifierPart}]*`,
  MarkdownWordPrefixes = raw`$@`,
  MarkdownWordPrefix = raw`[${MarkdownWordPrefixes}]?`,
  MarkdownWord = raw`${MarkdownWordPrefix}${UnicodeIdentifier}`,
  MarkdownWordJoiners = raw` \\\/:_\-\xA0\u2000-\u200B\u202F\u2060`,
  MarkdownWordJoiner = raw`[${MarkdownWordJoiners}]+`,
  // MarkdownIdentity = raw`(?:\s|\n|^)(${MarkdownWord}(?:${MarkdownWordJoiner}${MarkdownWord})*(?=\b[\s\n]|$))`,
  MarkdownIdentity = raw`(?:\s|\n|^)(?:The (?=\w)|)(${MarkdownWord}(?:${MarkdownWordJoiner}${MarkdownWord})*)`,
}) => ({
  UnicodeIdentifier: new RegExp(UnicodeIdentifier, 'u'),
  MarkdownIdentityPrefixer: new RegExp(raw`^[${MarkdownWordPrefixes}]?`, 'u'),
  MarkdownIdentityJoiner: new RegExp(raw`[${MarkdownWordJoiners}]+`, 'ug'),
  MarkdownIdentityWord: new RegExp(MarkdownWord, 'u'),
  MarkdownIdentity: new RegExp(MarkdownIdentity, 'u'),
  // MarkdownIdentitySeparators: new RegExp(raw`[${MarkdownWordPrefixes}${MarkdownWordJoiners}]+`, 'ug')
}))(entities$1.es);

var entities = /*#__PURE__*/Object.freeze({
  __proto__: null,
  UnicodeIdentifier: UnicodeIdentifier,
  MarkdownIdentityPrefixer: MarkdownIdentityPrefixer,
  MarkdownIdentityJoiner: MarkdownIdentityJoiner,
  MarkdownIdentityWord: MarkdownIdentityWord,
  MarkdownIdentity: MarkdownIdentity
});

// @ts-check

/** @template {selector} T @extends Array<T> */
// @ts-ignore
class Selectors extends Array {
  // /**
  //  * @template {T} U
  //  * @template This
  //  * @param {(value: T, index: number, array: T[]) => selector|selectors} callbackFunction
  //  * @param {This} [thisArgument]
  //  * @returns {Selectors<T>}
  //  */
  // @ts-ignore
  get flatMap() {
    Object.defineProperty(
      Selectors.prototype,
      'flatMap',
      Object.getOwnPropertyDescriptor(Array.prototype, 'flatMap') ||
        Object.getOwnPropertyDescriptor(
          class extends Array {
            flatMap(callbackFunction, thisArgument) {
              return this.concat(...this.map(callbackFunction, thisArgument));
            }
          }.prototype,
          'flatMap',
        ),
    );

    return this.flatMap;
    // return this.concat(...super.map(callbackFunction, thisArgument));
  }

  toString() {
    return this.join(',');
  }
  static get [Symbol.species]() {
    return this;
  }
}

/** @typedef {string} selector */
/** @typedef {Selectors|selector[]} selectors */

// @ts-check

/** @param {Fragment} fragment @param {Record<string, boolean>} [flags] */
const normalizeRenderedFragment = (fragment, flags$1) => {
  flags$1 = {
    DOM_MUTATIONS: fragment.markoutContentFlags.DOM_MUTATIONS = DOM_MUTATIONS,
    BREAK_NORMALIZATION: fragment.markoutContentFlags.BREAK_NORMALIZATION = BREAK_NORMALIZATION,
    HEADING_NORMALIZATION: fragment.markoutContentFlags.HEADING_NORMALIZATION = HEADING_NORMALIZATION,
    PARAGRAPH_NORMALIZATION: fragment.markoutContentFlags.PARAGRAPH_NORMALIZATION = PARAGRAPH_NORMALIZATION,
    BLOCK_PARAGRAPH_NORMALIZATION: fragment.markoutContentFlags.BLOCK_PARAGRAPH_NORMALIZATION = BLOCK_PARAGRAPH_NORMALIZATION,
    LIST_PARAGRAPH_NORMALIZATION: fragment.markoutContentFlags.LIST_PARAGRAPH_NORMALIZATION = LIST_PARAGRAPH_NORMALIZATION,
    CHECKLIST_NORMALIZATION: fragment.markoutContentFlags.CHECKLIST_NORMALIZATION = CHECKLIST_NORMALIZATION,
    BLOCKQUOTE_NORMALIZATION: fragment.markoutContentFlags.BLOCKQUOTE_NORMALIZATION = BLOCKQUOTE_NORMALIZATION,
    BLOCKQUOTE_HEADING_NORMALIZATION: fragment.markoutContentFlags.BLOCKQUOTE_HEADING_NORMALIZATION = BLOCKQUOTE_HEADING_NORMALIZATION,
    TOKEN_FLATTENING: fragment.markoutContentFlags.TOKEN_FLATTENING = TOKEN_FLATTENING,
    DECLARATIVE_STYLING: fragment.markoutContentFlags.DECLARATIVE_STYLING = DECLARATIVE_STYLING,
    SOURCE_TEXT_RENDERING: fragment.markoutContentFlags.SOURCE_TEXT_RENDERING = SOURCE_TEXT_RENDERING,
    ASSET_REMAPPING: fragment.markoutContentFlags.ASSET_REMAPPING = ASSET_REMAPPING,
    ASSET_INITIALIZATION: fragment.markoutContentFlags.ASSET_INITIALIZATION = ASSET_INITIALIZATION,
  } = {
    ...flags,
    ...(fragment.markoutContentFlags || (fragment.markoutContentFlags = {})),
    ...flags$1,
  };

  flags$1.DOM_MUTATIONS !== false &&
    ((flags$1.BREAK_NORMALIZATION === true || flags$1.DOM_MUTATIONS === true) &&
      content.normalizeBreaksInFragment(fragment),
    (flags$1.HEADING_NORMALIZATION === true || flags$1.DOM_MUTATIONS === true) &&
      content.normalizeHeadingsInFragment(fragment),
    (flags$1.PARAGRAPH_NORMALIZATION === true || flags$1.DOM_MUTATIONS === true) &&
      content.normalizeParagraphsInFragment(fragment),
    (flags$1.BLOCKQUOTE_NORMALIZATION === true || flags$1.DOM_MUTATIONS === true) &&
      content.normalizeBlockquotesInFragment(fragment),
    (flags$1.CHECKLIST_NORMALIZATION === true || flags$1.DOM_MUTATIONS === true) &&
      content.normalizeChecklistsInFragment(fragment),
    (flags$1.DECLARATIVE_STYLING === true || flags$1.DOM_MUTATIONS === true) &&
      content.normalizeDeclarativeStylingInFragment(fragment));

  (flags$1.TOKEN_FLATTENING === true || (flags$1.TOKEN_FLATTENING !== false && flags$1.DOM_MUTATIONS !== false)) &&
    // @ts-ignore
    content.flattenTokensInFragment(fragment);

  // @ts-ignore
  content.renderURLExpansionLinksInFragment(fragment);
};

/** @param {Fragment} fragment */
const normalizeBreaksInFragment = fragment => {
  for (const br of fragment.querySelectorAll('br')) {
    const {previousSibling, nextSibling, parentElement} = br;
    (!previousSibling ||
      previousSibling.nodeName !== 'SPAN' ||
      !nextSibling ||
      nextSibling.nodeName !== 'SPAN' ||
      (parentElement && !/^(?:CODE|PRE|LI)$/.test(parentElement.nodeName))) &&
      br.remove();
  }
};

content.matchers.HeadingNumber = /^[1-9]\d*\.$|/;

/** @param {Fragment} fragment */
const normalizeHeadingsInFragment = fragment => {
  const {MarkdownIdentity: Identity, MarkdownIdentityPrefixer: Prefixer, MarkdownIdentityJoiner: Joiner} = entities;
  const {headings = (fragment.headings = {}), TEXT_NODE} = fragment;

  for (const subheading of /** @type {Iterable<Heading>} */ (fragment.querySelectorAll(
    content.selectors.SubheadingsInFragment,
  ))) {
    const previousElementSibling = subheading.previousElementSibling;
    const previousSibling = subheading.previousSibling;
    if (!previousElementSibling || previousSibling !== previousElementSibling) continue;
    // console.log({subheading, previousElementSibling, previousSibling});
    if (previousElementSibling && previousElementSibling.nodeName === 'HGROUP') {
      previousElementSibling.appendChild(subheading);
    } else if (previousElementSibling) {
      const hgroup = document.createElement('hgroup');
      previousElementSibling.before(hgroup);
      hgroup.appendChild(previousElementSibling);
      hgroup.appendChild(subheading);
    }
  }

  for (const heading of /** @type {Iterable<Heading>} */ (fragment.querySelectorAll(
    content.selectors.HeadingsInFragment,
  ))) {
    const level = parseFloat(heading.nodeName[1]);
    const textSpan = heading.querySelector('span[token-type]');
    const textNode =
      (textSpan && textSpan.firstChild && textSpan.firstChild.nodeType === TEXT_NODE && textSpan.firstChild) ||
      undefined;

    const number =
      textNode &&
      heading.matches('hgroup > *') &&
      parseFloat(content.matchers.HeadingNumber.exec(textSpan.textContent)[0]);

    // Assuming all hgroup headings are either intentional or
    //   implied from markout notation, we want to pull out
    //   numbering into a data attribute
    number > 0 && ((heading.dataset.headingNumber = number), textNode.remove());

    // We're limit anchoring from H1 thru H3
    // if (parseFloat(heading.nodeName[1]) > 3) continue;

    const [, identity] = Identity.exec(heading.textContent) || '';
    if (!identity) continue;
    /** @type {Anchor} */
    const anchor = document.createElement('a');
    anchor.id = identity
      .replace(Prefixer, '')
      .replace(Joiner, '-')
      .toLowerCase();
    anchor.append(...heading.childNodes);
    // anchor.tabIndex = -1;
    anchor.heading = heading.anchor = {anchor, identity, heading, level, number};
    heading.appendChild(anchor);

    const nav = anchor.querySelector('nav:last-child');
    nav && heading.appendChild(nav);

    // Unique mappings are prioritized by heading level
    (anchor.id in headings && headings[anchor.id].level > level) || (headings[anchor.id] = heading.anchor);
  }
};

// const content.matchers.BlockParts = /^(?:(\w+(?: \w+)*)(:| - | — |)|)(.*)$/u;
content.matchers.BlockParts = /^[*_]*?(?:(\*{1,2}|_{1,2}|)(\w+(?: \w+)*)\1(: | - | — |)|)([^]*)$|/u;

/** @param {Fragment} fragment */
content.normalizeBlockquotesInFragment = fragment => {
  /** @type {BlockQuote} */
  let previousBlockquote;
  /** @type {BlockQuote} */
  let nextBlockquote;
  /** @type {NodeLike | ElementLike} */
  let node;
  /** @type {NodeLike | ElementLike} */
  let previousNode;
  /** @type {NodeLike | ElementLike} */
  let blockNode;
  /** @type {RangeLike} */
  let range;
  let heading, delimiter, headingSeparator, body;
  const {COMMENT_NODE, TEXT_NODE, ELEMENT_NODE} = fragment;

  for (const blockquote of /** @type {Iterable<BlockQuote>} */ (fragment.querySelectorAll('blockquote:not(:empty)'))) {
    node = blockquote.querySelector(content.selectors.BlockHeadingNodesInFragment);

    // if (/\w+:/.test(blockquote.innerText) && node == null) debugger;

    node == null ||
      (body = blockquote.textContent.trim()) === '' ||
      ([, delimiter = '', heading = '', headingSeparator = '', body = ''] = content.matchers.BlockParts.exec(body));

    // console.log(`${content.selectors.BlockHeadingNodesInFragment}`, node);

    // console.log(`%o — ${delimiter}%s${delimiter}${headingSeparator}${body}`, {blockquote, node});

    body === '' || (blockquote.blockBody = body);

    if (node != null && heading && headingSeparator) {
      blockquote.blockHeadingNode = /** @type {HTMLSpanElement} */ (node);
      blockquote.dataset.blockHeading = blockquote.blockHeading = heading;
      blockquote.dataset.blockHeadingSeparator = blockquote.blockHeadingSeparator = headingSeparator;
      if ((fragment.markoutContentFlags || defaults).BLOCKQUOTE_HEADING_NORMALIZATION === true) {
        node.slot = 'block-heading';
        range = document.createRange();
        range.setStartAfter(node);
        previousNode = node;

        while (!(range.text = range.toString()).startsWith(headingSeparator) && (node = node.nextSibling) != null)
          range.setEndAfter(node);

        node = null;
        // if (node.nextSibling) do {
        // 	range.setEndAfter((node = node.nextSibling));
        // } while (!(range.text = range.toString()).startsWith(headingSeparator) && node.nextSibling != null);

        if (range.text !== headingSeparator) {
          console.log(
            `%o — [%s][%s][${body}]`,
            {blockquote, range, contents: range.contents},
            previousNode.textContent,
            range.toString(),
          );
        } else {
          node = document.createElement('span');
          node.textContent = headingSeparator;
          node.slot = 'block-heading-separator';
          range.deleteContents();
          // previousNode.after(node);
          blockNode = previousNode.parentElement;
          while (blockNode.parentElement !== blockquote) blockNode = blockNode.parentElement;
          blockNode.attachShadow({
            mode: 'open',
          }).innerHTML =
            //
            /* html */ `
							<style>:host {padding: 0.5em;}#contents:slotted(p:first-child) {margin-block-start: 0;-webkit-margin-before:0;}</style>
							<div style="display: grid; grid-template-columns: var(--block-heading-span, auto) 1fr; grid-gap: 1em;">
								<div style="text-align:right;">
									<slot name="block-heading"></slot>
									<slot name="block-heading-separator" hidden></slot>
								</div>
								<div><slot id=contents></slot></div>
							</div>`;
          blockNode.remove();
          blockNode.append(previousNode, node, ...blockquote.childNodes);
          blockquote.appendChild(blockNode);
          // blockquote.style.display = 'table-row';
        }
      }
    }
  }

  // TODO: Figure out why we need all this…
  for (const lastBlockquote of /** @type {Iterable<BlockQuote>} */ (fragment.querySelectorAll(
    ':not(blockquote)[blockquote-level]+blockquote[blockquote-level]',
  ))) {
    nextBlockquote = lastBlockquote;
    previousBlockquote = previousNode = undefined;
    lastBlockquote.blockquoteLevel = parseFloat(lastBlockquote.getAttribute('blockquote-level'));

    node = lastBlockquote.previousSibling;

    if (
      !(lastBlockquote.blockquoteLevel > 0) ||
      !(
        lastBlockquote.previousElementSibling === node ||
        node.nodeType === COMMENT_NODE ||
        node.textContent.trim() === ''
      )
    ) {
      content.normalizeBlockquotesInFragment.log({node, lastBlockquote, nextBlockquote, previousBlockquote});
      continue;
    }

    while (
      node != null &&
      (node.nodeName !== 'BLOCKQUOTE' || !(previousBlockquote = /** @type {BlockQuote } */ (node)))
    ) {
      node.blockquoteLevel =
        node.nodeType === ELEMENT_NODE
          ? parseFloat(node.getAttribute('blockquote-level'))
          : nextBlockquote.blockquoteLevel;
      previousNode = node.previousSibling;
      if (node.blockquoteLevel === nextBlockquote.blockquoteLevel) ; else if (node.blockquoteLevel > nextBlockquote.blockquoteLevel) {
        previousBlockquote = nextBlockquote;
        nextBlockquote = /** @type {BlockQuote } */ (document.createElement('blockquote'));
        nextBlockquote.setAttribute('blockquote-level', (nextBlockquote.blockquoteLevel = node.blockquoteLevel));
        previousBlockquote.prepend(nextBlockquote);
      } else if (node.blockquoteLevel < nextBlockquote.blockquoteLevel) {
        if (node.blockquoteLevel < lastBlockquote.blockquoteLevel) {
          // TODO: Is it safer to coerce or superseede?!
          node.blockquoteLevel = lastBlockquote.blockquoteLevel;
        }
        while (
          nextBlockquote.blockquoteLevel >= lastBlockquote.blockquoteLevel &&
          node.blockquoteLevel < nextBlockquote.blockquoteLevel &&
          nextBlockquote.parentElement.blockquoteLevel < nextBlockquote.blockquoteLevel
        ) {
          nextBlockquote = nextBlockquote.parentElement;
        }
      }
      nextBlockquote.prepend(node);
      node = previousNode;
    }

    if (lastBlockquote.previousSibling === previousNode && previousBlockquote === previousNode) {
      if (
        ('blockquoteLevel' in previousBlockquote
          ? previousBlockquote.blockquoteLevel
          : (previousBlockquote.blockquoteLevel = parseFloat(previousBlockquote.getAttribute('blockquote-level')))) > 0
      ) {
        // TODO: Is it safer to coerce or superseede?!
        if (previousBlockquote.blockquoteLevel < lastBlockquote.blockquoteLevel) continue;

        if (previousBlockquote.blockquoteLevel === lastBlockquote.blockquoteLevel) {
          previousBlockquote.childElementCount === 1 && previousBlockquote.firstElementChild.nodeName === 'DETAILS'
            ? previousBlockquote.firstElementChild.append(...lastBlockquote.childNodes)
            : previousBlockquote.append(...lastBlockquote.childNodes);
          lastBlockquote.remove();
        }
      } else if (!previousBlockquote.hasAttribute('blockquote-level')) {
        previousBlockquote.setAttribute(
          'blockquote-level',
          `${(previousBlockquote.blockquoteLevel = lastBlockquote.blockquoteLevel)}`,
        );
        // TODO: Figure out if we can merge!
      }
    }
  }
};

/** @param {{node: Node | Element, lastBlockquote: HTMLQuoteElement, nextBlockquote?: HTMLQuoteElement,  previousBlockquote?:HTMLQuoteElement} } nodes */
content.normalizeBlockquotesInFragment.log = nodes => {
  const format = [];
  const values = [];
  for (const name of ['node', 'lastBlockquote', 'nextBlockquote', 'previousBlockquote']) {
    const node = nodes[name];
    if (node == null || typeof node !== 'object') continue;
    format.push('%s [%d] — %O');
    values.push(name, node.blockquoteLevel || (node.getAttribute && node.getAttribute('blockquote-level')), node);
  }
  format.length && console.log(format.join('\n'), ...values);
};

content.symbols.NormalizedChecklists = Symbol('NormalizedChecklists');

/** @param {Fragment} fragment */
const normalizeChecklistsInFragment = fragment => {
  const seen =
    fragment[content.symbols.NormalizedChecklists] || (fragment[content.symbols.NormalizedChecklists] = new WeakSet());

  for (const checklist of fragment.querySelectorAll(
    'li[type=checkbox]:not([checked]):not([indeterminate]) li[type=checkbox]:not([checked])',
  )) {
    let parentChecklist = checklist;
    // console.log({checklist, parentChecklist});
    while ((parentChecklist = parentChecklist.parentElement.closest('li[type=checkbox]'))) {
      seen.has(parentChecklist) ||
        (seen.add(parentChecklist),
        parentChecklist.querySelector(':scope li[type=checkbox]:not([checked]):not([indeterminate])')
          ? parentChecklist.querySelector(':scope  li[type=checkbox][checked]')
            ? (parentChecklist.removeAttribute('checked'), parentChecklist.setAttribute('indeterminate', ''))
            : (parentChecklist.removeAttribute('checked'), parentChecklist.removeAttribute('indeterminate'))
          : !parentChecklist.querySelector(':scope li[type=checkbox][checked]') ||
            (parentChecklist.removeAttribute('indeterminate'), parentChecklist.setAttribute('checked', '')));

      // if (parentChecklist.hasAttribute('checked') || parentChecklist.hasAttribute('indeterminate')) break;
      // parentChecklist.setAttribute('indeterminate', '');
    }
  }
};

content.normalizeParagraphsInBlock = block => {
  let element, node, nodes, paragraph, text;
  node = block.firstChild;
  if (node == null) return;
  element = block.firstElementChild;
  // while (element != null && element.matches('span,code,kbd,tt,small,em,strong,b,i,a,q,wbr,br,slot')) {
  while (element != null && !element.matches('hr,pre,p,blockquote,table,div')) {
    element = element.nextElementSibling;
  }
  while (node !== element) {
    (nodes || (nodes = [])).push(node);
    node = node.nextSibling;
  }
  if (nodes) {
    paragraph = document.createElement('p');
    paragraph.append(...nodes);
    text = paragraph.textContent;
    // console.log({element, node, nodes, paragraph, text});
    text && text.trim() && block.prepend(paragraph);
  }
};

/** @param {Fragment} fragment */
const normalizeParagraphsInFragment = fragment => {
  if ((fragment.markoutContentFlags || defaults).BLOCK_PARAGRAPH_NORMALIZATION)
    for (const block of fragment.querySelectorAll('li:not(:empty), blockquote:not(:empty)'))
      content.normalizeParagraphsInBlock(block);
  if ((fragment.markoutContentFlags || defaults).LIST_PARAGRAPH_NORMALIZATION)
    for (const {parentElement: paragraph} of fragment.querySelectorAll(
      'li > p:first-child:last-child > ol:last-child, li > p:first-child:last-child > ul:last-child',
    )) {
      while (
        paragraph.lastElementChild != null &&
        (paragraph.lastElementChild.nodeName === 'OL' || paragraph.lastElementChild.nodeName === 'UL') &&
        (paragraph.lastChild === paragraph.lastElementChild ||
          paragraph.lastChild.nodeType === paragraph.COMMENT_NODE ||
          paragraph.lastChild.textContent.trim() === '')
      ) {
        paragraph.after(paragraph.lastElementChild);
      }
    }

  for (const empty of fragment.querySelectorAll('p:empty')) empty.remove();
};

/** @param {Fragment} fragment */
const normalizeDeclarativeStylingInFragment = fragment => {
  styling.apply.toFragment(fragment, normalizeDeclarativeStylingInFragment.defaults);
};

normalizeDeclarativeStylingInFragment.defaults = {
  attributes: {
    ['--band-fill:'](element, attribute, value, options) {
      element.style.background = `var(--band-fill${value})`;
      element.removeAttribute(attribute);
    },
  },
};

content.normalizeRenderedFragment = normalizeRenderedFragment;
content.normalizeBreaksInFragment = normalizeBreaksInFragment;
content.normalizeHeadingsInFragment = normalizeHeadingsInFragment;
content.normalizeChecklistsInFragment = normalizeChecklistsInFragment;
content.normalizeParagraphsInFragment = normalizeParagraphsInFragment;
content.normalizeDeclarativeStylingInFragment = normalizeDeclarativeStylingInFragment;

content.selectors.HeadingsInFragment = new Selectors(
  'h1:not([id]):not(:empty)',
  'h2:not([id]):not(:empty)',
  'h3:not([id]):not(:empty)',
  'h4:not([id]):not(:empty)',
  'h5:not([id]):not(:empty)',
  'h6:not([id]):not(:empty)',
);
content.selectors.SubheadingsInFragment = new Selectors('h1+h2', 'h2+h3', 'h3+h4', 'h4+h5', 'h5+h6');
content.selectors.BlockHeadingNodes = new Selectors('i:first-child > b', 'b:first-child > i', 'b', 'i');

// `details:first-child > summary:first-child > ${selector}`,
// `details:first-child > summary:first-child > p:first-child > ${selector}`,
content.selectors.BlockHeadingNodesInFragment = content.selectors.BlockHeadingNodes.flatMap(selector => [
  `:scope > ${(selector = `${selector}:first-child:not(:empty)`)}`,
  `:scope > p:first-child > ${selector}`,
  // `:scope > p:first-child > p:first-child > ${selector}`,
]);

/** @typedef {import('../types').Fragment} Fragment */
/** @typedef {import('../types').Fragment.Heading} Heading */
/** @typedef {import('../types').Fragment.Headings} Headings */
/** @typedef {import('../types').Fragment.Anchor} Anchor */
/** @typedef {import('../types').Fragment.BlockQuote} BlockQuote */
/** @typedef {Node & {[name: string]: any}} NodeLike */
/** @typedef {Element & {[name: string]: any}} ElementLike */
/** @typedef {Range & {[name: string]: any}} RangeLike */

// @ts-check

/** @param {string} sourceText @returns {Fragment}*/
const createRenderedFragment = sourceText => {
  /** @type {Fragment} */
  let fragment, normalizedText, tokens, renderedText;

  content.createRenderedFragment.template ||
    (content.createRenderedFragment.template = document.createElement('template'));

  content.createRenderedFragment.template.innerHTML = renderedText = render(
    (tokens = tokenize((normalizedText = normalize(sourceText)))),
  );

  // @ts-ignore
  fragment = content.createRenderedFragment.template.content.cloneNode(true);
  fragment.fragment = fragment;
  fragment.sourceText = sourceText;
  fragment.normalizedText = normalizedText;
  fragment.tokens = tokens;
  fragment.renderedText = renderedText;

  return fragment;
};

/** @type {HTMLTemplateElement} */
createRenderedFragment.template = undefined;

/** @param {Fragment} fragment */
const renderURLExpansionLinksInFragment = fragment => {
  for (const span of fragment.querySelectorAll('span[href]')) {
    if (span.closest('a')) continue;
    const anchor = document.createElement('a');
    anchor.href = span.getAttribute('href');
    span.before(anchor);
    anchor.append(...span.childNodes);
    span.remove();
  }
};

/** @param {Fragment} fragment */
const renderSourceTextsInFragment = fragment => {
  const promises = [];

  for (const element of fragment.querySelectorAll(`[${MarkupAttributeMap.SourceType}]:not(:empty)`))
    promises.push(
      renderSourceText({
        element,
        sourceType:
          element.getAttribute(MarkupAttributeMap.MarkupMode) ||
          element.getAttribute(MarkupAttributeMap.SourceType),
        sourceText: element.textContent,
      }),
    );

  return promises.length ? Promise.all(promises) : Promise.resolve();
};

content.createRenderedFragment = createRenderedFragment;
content.renderURLExpansionLinksInFragment = renderURLExpansionLinksInFragment;
content.renderSourceTextsInFragment = renderSourceTextsInFragment;

/** @typedef {import('../types').Fragment} Fragment */

// @ts-check

/** @param {Fragment} fragment */
const populateAssetsInFragment = fragment => {
  if (!fragment || fragment.assets) return;
  fragment.assets = [];

  for (const link of /** @type {Iterable<Link>} */ (fragment.querySelectorAll(content.AssetNodeSelector))) {
    if (link.nodeName === 'SCRIPT') {
      if (link.type === 'module') {
        (fragment.assets.modules || (fragment.assets.modules = [])).push(/** @type {HTMLScriptElement} */ (link));
      } else if (!link.type || link.type.trim().toLowerCase() === 'text/javascript') {
        (fragment.assets.scripts || (fragment.assets.scripts = [])).push(/** @type {HTMLScriptElement} */ (link));
      }
    } else if (link.nodeName === 'STYLE') {
      if (!link.type || link.type.trim().toLowerCase() === 'text/css') {
        (fragment.assets.stylesheets || (fragment.assets.stylesheets = [])).push(
          /** @type {HTMLStyleElement} */ (link),
        );
      }
    } else {
      /** @type {Links} */ (
        fragment.assets[content.AssetNodeMap[link.nodeName]] ||
        // @ts-ignore
        (fragment.assets[content.AssetNodeMap[link.nodeName]] = [])
      ).push(link);
    }
    fragment.assets.push(link);
  }

  return fragment;
};

/** @param {Fragment} fragment */
const flattenTokensInFragment = fragment => {
  for (const token of fragment.querySelectorAll('span[token-type],tt[token-type]')) {
    token.nodeName === 'TT' || token.before(...token.childNodes);
    token.remove();
  }
};

const AssetNodeMap = Enum({
  IMG: 'images',
  SOURCE: 'sources',
  VIDEO: 'videos',
});

const AssetNodeSelector = ['script', 'style', ...Object.keys(AssetNodeMap)]
  .map(tag => `${tag.toUpperCase()}[src]:not([slot]),${tag.toUpperCase()}[srcset]:not([slot])`)
  .join(',');

content.AssetNodeSelector = AssetNodeSelector;
content.AssetNodeMap = AssetNodeMap;
content.populateAssetsInFragment = populateAssetsInFragment;
content.flattenTokensInFragment = flattenTokensInFragment;

/** @typedef {import('./types').Fragment} Fragment */
/** @typedef {import('./types').Fragment.Link} Link */
/** @typedef {import('./types').Fragment.Links} Links */

// @ts-check

class MarkoutContent extends Component {
  /** @type {{[name: string]: boolean | undefined}} */
  static get flags() {
    // @ts-ignore
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
    // @ts-ignore
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
    // @ts-ignore
    if (this.untilDisclosed.resolver) this.untilDisclosed.resolver();
  }

  scrollToAnchor(anchor) {
    /** @type {HTMLAnchorElement} */
    let target;
    // @ts-ignore
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

    // @ts-ignore
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

    // @ts-ignore
    if (this.rewriteAnchors) {
      const anchors = contentSlot.querySelectorAll('a[href]');
      // @ts-ignore
      anchors && this.rewriteAnchors([...anchors]);
    }

    for (const details of contentSlot.querySelectorAll(
      `${
        // @ts-ignore
        /\?.*?\bdetails(?:=open|)\b/.test(location) ? 'details:not([markout-details=normal]):not([open]),' : ''
      } details:not(open)[markout-details=open]`,
    )) {
      // @ts-ignore
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
            void (
              // @ts-ignore
              ((this.untilDisclosed.resolver = resolver),
              // @ts-ignore
              (this.untilDisclosed.rejecter = rejecter))
            ),
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
        // @ts-ignore
        node.host && (node = node.host);
      }
    }
    // @ts-ignore
    promise = this.untilDisclosed.promise;
    this.isDisclosed = this.isConnected && !closure;
    if (closure) {
      if (!promise) {
        closure.addEventListener('toggle', this.untilDisclosed, {once: true});
        // @ts-ignore
        await (promise = this.untilDisclosed.promise = new Promise(this.untilDisclosed.awaiter));
        // @ts-ignore
        if (this.untilDisclosed.promise === promise)
          // @ts-ignore
          this.untilDisclosed.resolver = this.untilDisclosed.rejecter = this.untilDisclosed.promise = undefined;
      } else {
        await promise;
      }
    } else if (promise) {
      // @ts-ignore
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

  /** @param {content.Fragment} fragment */
  async linkMarkoutFragment(fragment) {
    if (fragment.instantiated) return fragment.instantiated;

    if (fragment.markoutContentFlags.ASSET_REMAPPING) {
      content.populateAssetsInFragment(fragment);

      const baseURL = fragment.baseURL || fragment.baseURI;

      for (const link of fragment.assets) {
        const {
          base: baseAttribute,
          // @ts-ignore
          [link.nodeName === 'SOURCE' ? 'srcset' : 'src']: srcAttribute,
        } = link.attributes;
        const base = baseAttribute ? baseAttribute.value : baseURL;
        baseAttribute && link.removeAttribute('base');
        link.setAttribute('link-base', base);
        if (srcAttribute) {
          const attribute = srcAttribute.name;
          const [href] = srcAttribute.value.split(/\s/, 1);
          link.setAttribute(`link-${attribute}`, href);
          link.setAttribute(
            attribute,
            // @ts-ignore
            (link[attribute] = this.sanitizeAssetURL(new URL(href, base), fragment, link, attribute)),
          );
        }
      }

      fragment.assets.stylesheets &&
        fragment.assets.stylesheets.length &&
        fragment.prepend(
          Object.assign(document.createElement('style'), {
            textContent: fragment.assets.stylesheets
              .map(
                stylesheet => (
                  stylesheet.remove(),
                  // @ts-ignore
                  `@import "${stylesheet.src}";`
                ),
              )
              .join('\n'),
          }),
        );
    }

    return fragment;
  }

  /**
   * @template T
   * @param {URL} url
   * @param {content.Fragment} fragment
   * @param {T} target
   * @param {string} [context]
   */
  sanitizeAssetURL(url, fragment, target, context) {
    return url;
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
    import(module.src);
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
    // @ts-ignore
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

debugging('markout-content', import.meta, [
  typeof location === 'object' && /[?&]debug(?=[&#]|=[^&]*\bmarkout-content|$)\b/.test(location.search),
  'rendered-counter',
]);

/** @param {HTMLAnchorElement} anchor */

const rewriteAnchors = (
  anchors,
  {
    RewritableURL = rewriteAnchors.defaults.RewritableURL,
    sourceURL,
    baseURL,
    search,
    rootNode = document,
    debugging = import.meta['debug:hashout:anchor-rewrite'],
  },
) => {
  debugging && console.groupCollapsed('%O ‹anchors› ', rootNode);

  for (const anchor of anchors) {
    const href = anchor.getAttribute('href');
    if (!href) continue;
    const [matched, parent, name, extension = '.md', query = '', hash = ''] = RewritableURL.exec(
      href.replace(/%23|%3F/g, decodeURIComponent),
    );

    // const alias = getAliasForAnchor(anchor);
    // const baseNode = (alias && getBaseForAnchor(alias)) || getBaseForAnchor(anchor);
    // const base = (alias && alias.name && /^\/\S+\/$/.test(alias.name) && baseNode && baseNode.href) || sourceURL;
    const base = sourceURL;

    debugging && console.log({matched, parent, name, extension, query, hash, base});

    if (base !== sourceURL) {
      anchor.href = new URL(matched, base);
      anchor.target || (anchor.target = '_blank');
    } else if (parent || (!!name && matched.startsWith(name))) {
      const pathname = `${parent || './'}${name ? `${name}${extension}` : ''}`;
      const href =
        name && extension.toLowerCase() === '.md'
          ? `${baseURL}${search}#${new URL(pathname, base).pathname}${hash}`
          : new URL(`${pathname}${query || (!hash && search) || ''}${hash}`, base);
      anchor.href = href;
    } else if (hash) {
      anchor.href = `${location}${matched}`;
    } else {
      anchor.target || (anchor.target = '_blank');
    }

    // if (debugging && hash) debugger;
    debugging && console.dirxml(anchor);
  }

  debugging && console.groupEnd();
};

rewriteAnchors.defaults = {
  RewritableURL: /^(\.*(?=\/)[^?#\n]*\/|)(?:(?:([^/?#\n]+?)(?:(\.[a-z]+)|)|)|)(\?[^#]+|)(#.*|)$|/i,
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
      rewriteAnchors([].concat(...anchors), {debugging, sourceURL, baseURL, search, rootNode});
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

export { Component };
//# sourceMappingURL=browser.js.map
