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

    const preloads = head.querySelectorAll(`link[rel=preload][as="${type}"]`);

    if (type === 'style' && Array.prototype.find.call(ownerDocument.styleSheets, ({href}) => href === href)) {
      return resolvedPromise;
    } else if (type === 'script' && Array.prototype.find.call(ownerDocument.scripts, ({src}) => src === href)) {
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

export { Assets, Attributes, Component, Toggle, components, css, html, raw, styling };
//# sourceMappingURL=components.js.map
