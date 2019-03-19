import { a as Closures, b as Symbols, c as raw, d as sequence, e as all, f as previousTextFrom, g as indenter, h as patterns, i as identifier, j as entities } from './helpers.m.js';
export { UnicodeIdentifier, MarkdownIdentityPrefixer, MarkdownIdentityJoiner, MarkdownIdentityWord, MarkdownIdentity } from './entities.m.js';

/** @typedef {import('./types').Grouping} Grouping */
/** @typedef {import('./types').Tokenizer} Tokenizer */
/** @typedef {import('./types').Token} Token */
/** @typedef {import('./types')['Tokenizer']} TokenizerClass */
/** @typedef {{[name: string]: Grouping}} Groupers */
/** @typedef {(TokenizerClass)['createGrouper']} createGrouper */

class Grouping {
  /**
   * @param {{syntax: string, groupers: Groupers, createGrouper: createGrouper}} options
   */
  constructor({syntax, groupers, createGrouper, contextualizer}) {
    this.groupers = groupers;
    this.groupings = [];
    this.hints = new Set();
    this.syntax = syntax;
    this.goal = syntax;
    this.hint = syntax;
    this.contextualizer = contextualizer;
    this.context = syntax;
    this.create = createGrouper || Object;
  }

  /**
   * @param {Token} next
   * @param {Token} parent
   * @param state
   * @param context
   */
  close(next, state, context) {
    let after, grouper, parent;
    const {groupings, hints, syntax} = this;

    const closed = groupings.pop();
    grouper = closed;
    groupings.includes(grouper) || hints.delete(grouper.hinter);

    (closed.punctuator === 'opener' && (next.punctuator = 'closer')) ||
      (closed.punctuator && (next.punctuator = closed.punctuator));

    after = grouper.close && grouper.close(next, state, context);

    const previousGrouper = (grouper = groupings[groupings.length - 1]);

    this.goal = (previousGrouper && previousGrouper.goal) || syntax;
    this.grouper = previousGrouper;

    parent = (next.parent && next.parent.parent) || undefined;

    return {after, grouper, closed, parent};
  }

  open(next, context) {
    let opened, parent, grouper;

    const {groupers, groupings, hints, hint, syntax} = this;
    let {punctuator, text} = next;
    const hinter = punctuator ? `${syntax}-${punctuator}` : hint;
    const group = `${hinter},${text}`;

    grouper = groupers[group];

    const {
      mode: {matchers, comments, spans, closures},
    } = context;

    if (context.spans && punctuator === 'span') {
      const span = context.spans.get(text);
      punctuator = next.punctuator = 'span';
      opened =
        grouper ||
        this.create({
          syntax,
          goal: syntax,
          span,
          matcher: span.matcher || (matchers && matchers.span) || undefined,
          spans: (spans && spans[text]) || undefined,
          hinter,
          punctuator,
        });
    } else if (context.punctuator !== 'quote') {
      if (punctuator === 'quote') {
        opened =
          grouper ||
          this.create({
            syntax,
            goal: punctuator,
            quote: text,
            matcher: (matchers && matchers.quote) || undefined,
            spans: (spans && spans[text]) || undefined,
            hinter,
            punctuator,
          });
      } else if (punctuator === 'comment') {
        const comment = comments.get(text);
        opened =
          grouper ||
          this.create({
            syntax,
            goal: punctuator,
            comment,
            matcher: comment.matcher || (matchers && matchers.comment) || undefined,
            hinter,
            punctuator,
          });
      } else if (punctuator === 'closure') {
        const closure = (grouper && grouper.closure) || closures.get(text);
        punctuator = next.punctuator = 'opener';
        closure &&
          (opened =
            grouper ||
            this.create({
              syntax,
              goal: syntax,
              closure,
              matcher: closure.matcher || (matchers && matchers.closure) || undefined,
              hinter,
              punctuator,
            }));
      }
    }

    if (opened) {
      groupers[group] || (groupers[group] = grouper = opened);
      groupings.push(grouper), hints.add(hinter);
      this.goal = (grouper && grouper.goal) || syntax;
      parent = next;
    }

    return {grouper, opened, parent, punctuator};
  }
}

/** Tokenizer for a single mode (language) */
class Tokenizer {
  constructor(mode, defaults) {
    this.mode = mode;
    this.defaults = defaults || this.constructor.defaults || undefined;
  }

  /** Token generator from source using tokenizer.mode (or defaults.mode) */
  *tokenize(source, state = {}) {
    let done;

    // TODO: Consider supporting Symbol.species
    const Species = this.constructor;

    // Local context
    const contextualizer = this.contextualizer || (this.contextualizer = Species.contextualizer(this));
    let context = contextualizer.next().value;

    const {mode, syntax, createGrouper = Species.createGrouper || Object} = context;

    // Local grouping
    const groupers = mode.groupers || (mode.groupers = {});
    const grouping =
      state.grouping ||
      (state.grouping = new Grouping({
        syntax: syntax || mode.syntax,
        groupers,
        createGrouper,
        contextualizer,
      }));

    // Local matching
    let {match, index = 0} = state;

    // Local tokens
    let previous, last, parent;
    const top = {type: 'top', text: '', offset: index};

    let lastContext = context;

    state.source = source;

    const tokenize = state.tokenize || (text => [{text}]);

    while (true) {
      const {
        mode: {syntax, matchers, comments, spans, closures},
        punctuator: $$punctuator,
        closer: $$closer,
        spans: $$spans,
        matcher: $$matcher,
        token,
        forming = true,
      } = context;

      // Current contextual hint (syntax or hint)
      const hint = grouping.hint;

      while (lastContext === (lastContext = context)) {
        let next;

        state.last = last;

        const lastIndex = state.index || 0;

        $$matcher.lastIndex = lastIndex;
        match = state.match = $$matcher.exec(source);
        done = index === (index = state.index = $$matcher.lastIndex) || !match;

        if (done) return;

        // Current contextual match
        const {0: text, 1: whitespace, 2: sequence, index: offset} = match;

        // Current quasi-contextual fragment
        const pre = source.slice(lastIndex, offset);
        pre &&
          ((next = token({
            type: 'pre',
            text: pre,
            offset: lastIndex,
            previous,
            parent,
            hint,
            last,
            source,
          })),
          yield (previous = next));

        // Current contextual fragment
        const type = (whitespace && 'whitespace') || (sequence && 'sequence') || 'text';
        next = token({type, text, offset, previous, parent, hint, last, source});

        // Current contextual punctuator (from sequence)
        const closing =
          $$closer &&
          ($$closer.test ? $$closer.test(text) : $$closer === text || (whitespace && whitespace.includes($$closer)));

        let after;
        let punctuator = next.punctuator;

        if (punctuator || closing) {
          let closed, opened, grouper;

          if (closing) {
            ({after, closed, parent = top, grouper} = grouping.close(next, state, context));
          } else if ($$punctuator !== 'comment') {
            ({grouper, opened, parent = top, punctuator} = grouping.open(next, context));
          }

          state.context = grouping.context = grouping.goal || syntax;

          if (opened || closed) {
            next.type = 'punctuator';
            context = contextualizer.next((state.grouper = grouper || undefined)).value;
            grouping.hint = `${[...grouping.hints].join(' ')} ${grouping.context ? `in-${grouping.context}` : ''}`;
            opened && (after = opened.open && opened.open(next, state, context));
          }
        }

        // Current contextual tail token (yield from sequence)
        yield (previous = next);

        // Next reference to last contextual sequence token
        next && !whitespace && forming && (last = next);

        if (after) {
          let tokens, token, nextIndex;

          if (after.syntax) {
            const {syntax, offset, index} = after;
            const body = index > offset && source.slice(offset, index - 1);
            if (body) {
              body.length > 0 &&
                ((tokens = tokenize(body, {options: {sourceType: syntax}}, this.defaults)), (nextIndex = index));
              const hint = `${syntax}-in-${mode.syntax}`;
              token = token => ((token.hint = `${(token.hint && `${token.hint} `) || ''}${hint}`), token);
            }
          } else if (after.length) {
            const hint = grouping.hint;
            token = token => ((token.hint = `${hint} ${token.type || 'code'}`), context.token(token));
            (tokens = after).end > state.index && (nextIndex = after.end);
          }

          if (tokens) {
            for (const next of tokens) {
              previous && ((next.previous = previous).next = next);
              token && token(next);
              yield (previous = next);
            }
            nextIndex > state.index && (state.index = nextIndex);
          }
        }
      }
    }
  }

  /**
   * Context generator using tokenizer.mode (or defaults.mode)
   */
  get contextualizer() {
    const value = this.constructor.contextualizer(this);
    Object.defineProperty(this, 'contextualizer', {value});
    return value;
  }

  /**
   * Tokenizer context generator
   */
  static *contextualizer(tokenizer) {
    // Local contextualizer state
    let grouper;

    // Tokenizer mode
    const mode = tokenizer.mode;
    const defaults = tokenizer.defaults;
    mode !== undefined || (mode = (defaults && defaults.mode) || undefined);
    if (!mode) throw ReferenceError(`Tokenizer.contextualizer invoked without a mode`);

    // TODO: Refactoring
    const initialize = context => {
      context.token ||
        (context.token = (tokenizer => (tokenizer.next(), token => tokenizer.next(token).value))(
          this.tokenizer(context),
        ));
      return context;
    };

    if (!mode.context) {
      const {
        syntax,
        matcher = (mode.matcher = (defaults && defaults.matcher) || undefined),
        quotes,
        punctuators = (mode.punctuators = {aggregators: {}}),
        punctuators: {aggregators = ($punctuators.aggregators = {})},
        patterns: {
          maybeKeyword = (mode.patterns.maybeKeyword =
            (defaults && defaults.patterns && defaults.patterns.maybeKeyword) || undefined),
        } = (mode.patterns = {maybeKeyword: null}),
        spans: {['(spans)']: spans} = (mode.spans = {}),
      } = mode;

      initialize(
        (mode.context = {
          mode,
          punctuators,
          aggregators,
          matcher,
          quotes,
          spans,
        }),
      );
    }

    const {
      syntax: $syntax,
      matcher: $matcher,
      quotes: $quotes,
      punctuators: $punctuators,
      punctuators: {aggregators: $aggregators},
    } = mode;

    while (true) {
      if (grouper !== (grouper = yield (grouper && grouper.context) || mode.context) && grouper && !grouper.context) {
        const {
          goal = $syntax,
          punctuator,
          punctuators = $punctuators,
          aggregators = $aggregators,
          closer,
          spans,
          matcher = $matcher,
          quotes = $quotes,
          forming = goal === $syntax,
        } = grouper;

        initialize(
          (grouper.context = {
            mode,
            punctuator,
            punctuators,
            aggregators,
            closer,
            spans,
            matcher,
            quotes,
            forming,
          }),
        );
      }
    }
  }

  static *tokenizer(context) {
    let done, next;

    const {
      mode: {syntax, keywords, assigners, operators, combinators, nonbreakers, comments, closures, breakers, patterns},
      punctuators,
      aggregators,
      spans,
      quotes,
      forming = true,
    } = context;

    const {maybeIdentifier, maybeKeyword, segments} = patterns || false;
    const wording = keywords || maybeIdentifier ? true : false;

    const matchSegment =
      segments &&
      (segments[Symbol.match] ||
        (!(Symbol.match in segments) &&
          (segments[Symbol.match] = (segments => {
            const sources = [];
            const names = [];
            for (const name of Object.getOwnPropertyNames(segments)) {
              const segment = segments[name];
              if (segment && segment.source && !/\\\d/.test(segment.source)) {
                names.push(name);
                sources.push(segment.source.replace(/\\?\((.)/g, (m, a) => (m[0] !== '\\' && a !== '?' && '(?:') || m));
              }
            }
            const {length} = names;
            if (!length) return false;
            const matcher = new RegExp(`(${sources.join('|)|(')}|)`, 'u');
            return text => {
              // OR: for (const segment of names) if (segments[segment].test(text)) return segment;
              const match = matcher.exec(text);
              if (match[0]) for (let i = 1, n = length; n--; i++) if (match[i]) return names[i - 1];
            };
          })(segments))));

    const LineEndings = /$/gm;
    const punctuate = text =>
      (nonbreakers && nonbreakers.includes(text) && 'nonbreaker') ||
      (operators && operators.includes(text) && 'operator') ||
      (comments && comments.includes(text) && 'comment') ||
      (spans && spans.includes(text) && 'span') ||
      (quotes && quotes.includes(text) && 'quote') ||
      (closures && closures.includes(text) && 'closure') ||
      (breakers && breakers.includes(text) && 'breaker') ||
      false;
    const aggregate = text =>
      (assigners && assigners.includes(text) && 'assigner') ||
      (combinators && combinators.includes(text) && 'combinator') ||
      false;

    while (!done) {
      let token;

      if (next && next.text) {
        const {text, type, hint, previous, parent, last} = next;

        if (type === 'sequence') {
          ((next.punctuator =
            (previous && (aggregators[text] || (!(text in aggregators) && (aggregators[text] = aggregate(text))))) ||
            (punctuators[text] || (!(text in punctuators) && (punctuators[text] = punctuate(text)))) ||
            undefined) &&
            (next.type = 'punctuator')) ||
            (matchSegment &&
              (next.type = matchSegment(text)) &&
              (next.hint = `${(hint && `${hint} `) || ''}${next.type}`)) ||
            (next.type = 'sequence');
        } else if (type === 'whitespace') {
          next.breaks = text.match(LineEndings).length - 1;
        } else if (forming && wording) {
          const word = text.trim();
          word &&
            ((keywords &&
              keywords.includes(word) &&
              (!last || last.punctuator !== 'nonbreaker' || (previous && previous.breaks > 0)) &&
              (next.type = 'keyword')) ||
              (maybeIdentifier && maybeIdentifier.test(word) && (next.type = 'identifier')));
        } else {
          next.type = 'text';
        }

        previous && (previous.next = next) && (parent || (next.parent = previous.parent));

        token = next;
      }

      next = yield token;
    }
  }

  static createGrouper({
    syntax,
    goal = syntax,
    quote,
    comment,
    closure,
    span,
    grouping = comment || closure || span || undefined,
    punctuator,
    spans = (grouping && grouping.spans) || undefined,
    matcher = (grouping && grouping.matcher) || undefined,
    quotes = (grouping && grouping.quotes) || undefined,
    punctuators = {aggregators: {}},
    opener = quote || (grouping && grouping.opener) || undefined,
    closer = quote || (grouping && grouping.closer) || undefined,
    hinter,
    open = (grouping && grouping.open) || undefined,
    close = (grouping && grouping.close) || undefined,
  }) {
    return {syntax, goal, punctuator, spans, matcher, quotes, punctuators, opener, closer, hinter, open, close};
  }
}

const TOKENIZERS = 'tokenizers';
const MAPPINGS = 'mappings';
const MODES = 'modes';

const none = {
  syntax: 'markup',
  matcher: /([\s\n]+)|(\\(?:(?:\\\\)*\\|[^\\\s])?|\/\/+|\/\*+|\*+\/|\(|\)|\[|\]|,|;|\.\.\.|\.|\b:\/\/\b|::|:|\?|`|"|'|\$\{|\{|\}|=>|<\/|\/>|\++|\-+|\*+|&+|\|+|=+|!={0,3}|<{1,3}=?|>{1,2}=?)|[+\-*/&|^%<>~!]=?/g,
};

const define = (instance, property, value, options) => {
  if (!instance.hasOwnProperty(property))
    return (
      Object.defineProperty(instance, property, {
        value,
        writable: (options && options.writable === true) || false,
        configurable: (options && options.configurable === true) || false,
        enumerable: !options || options.enumerable === true,
      }),
      value
    );
};

class Parser {
  /**
   * @param source {string}
   * @param state {{sourceType?: string}}
   */
  tokenize(source, state = {}) {
    const {
      options: {
        sourceType,
        mode = (state.options.mode = (sourceType && this.get(sourceType)) || none),
      } = (state.options = {}),
    } = state;
    let tokenizer = mode && this[TOKENIZERS].get(mode);
    if (!source || !mode) return [];
    !tokenizer && this[TOKENIZERS].set(mode, (tokenizer = new Tokenizer(mode)));
    state.parser = this;
    state.tokenize = (this.hasOwnProperty('tokenize') && this.tokenize) || (this.tokenize = this.tokenize.bind(this));
    return tokenizer.tokenize(source, state);
  }

  get [TOKENIZERS]() {
    return define(this, TOKENIZERS, new WeakMap());
  }
  get [MAPPINGS]() {
    return define(this, MAPPINGS, Object.create(null));
  }

  get [MODES]() {
    return define(this, MODES, Object.create(null));
  }

  get(id = 'default') {
    const {[MAPPINGS]: mappings, [MODES]: modes} = this;
    if (id in modes) return modes[id];
    let mapping = mappings[id];
    !mapping || mapping.syntax === id || (mapping = mappings[mapping.syntax]);
    if (mapping && mapping.factory) {
      const {syntax, factory, options} = mapping;
      if (options.requires && options.requires.length > 0) {
        const list = [];
        for (const id of options.requires) id in modes || this.get(id) || list.push(id);
        if (list.length) {
          list.length > 1 && list.push(list.splice(-2, 2).join(' and '));
          throw Error(`Cannot initialize "${syntax}" which requires the list mode(s): ${list.join(', ')}`);
        }
      }
      return (mapping.mode = modes[id] = factory(options, modes));
    }
  }

  /**
   * @param mode {ModeFactory | Mode}
   * @param options {ModeOptions}
   */
  register(mode, options) {
    const {[MAPPINGS]: mappings, [MODES]: modes} = this;

    if (!mappings) return;

    const factory = typeof mode === 'function' && mode;

    const {syntax, aliases = (options.aliases = [])} = ({syntax: options.syntax = mode.syntax} = options = {
      syntax: undefined,
      ...factory.defaults,
      ...options,
    });

    if (!syntax || typeof syntax !== 'string')
      throw TypeError(`Cannot register "${syntax}" since it not valid string'`);

    if (mappings[syntax]) {
      if (factory ? factory === mappings[syntax].factory : mode === modes[syntax]) return;
      else throw ReferenceError(`Cannot register "${syntax}" since it is already registered`);
    }

    if (aliases && aliases.length > 0) {
      for (const alias of aliases) {
        if (!alias || typeof alias !== 'string')
          throw TypeError(`Cannot register "${syntax}" since it's alias "${alias}" not valid string'`);
        else if (mappings[alias])
          throw ReferenceError(`Cannot register "${syntax}" since it's alias "${alias}" is already registered`);
      }
    }

    const mapping = factory ? {syntax, factory, options} : {syntax, mode, options};

    const descriptor = {value: mapping, writable: false};
    for (const id of [syntax, ...aliases]) {
      Object.defineProperty(mappings, id, descriptor);
    }
  }

  /**
   * @param mode {string}
   * @param requires {string[]}
   */
  requires(mode, requires) {
    const missing = [];
    for (const mode of requires) mode in this[MAPPINGS] || missing.push(`"${mode}"`);
    if (!missing.length) return;
    throw Error(`Cannot initialize "${mode}" which requires the missing mode(s): ${missing.join(', ')}`);
  }
}

/**
 * @typedef { Partial<{syntax: string, matcher: RegExp, [name:string]: Set | Map | {[name:string]: Set | Map | RegExp} }> } Mode
 * @typedef { {[name: string]: Mode} } Modes
 * @typedef { {[name: string]: {syntax: string} } } Mappings
 * @typedef { {aliases?: string[], syntax: string} } ModeOptions
 * @typedef { (options: ModeOptions, modes: Modes) => Mode } ModeFactory
 */

// * @typedef { typeof helpers } Helpers

const css = Object.defineProperties(
  ({syntax} = css.defaults) => ({
    syntax,
    comments: Closures.from('/*…*/'),
    closures: Closures.from('{…} (…) […]'),
    quotes: Symbols.from(`' "`),
    assigners: Symbols.from(`:`),
    combinators: Symbols.from('> :: + :'),
    nonbreakers: Symbols.from(`-`),
    breakers: Symbols.from(', ;'),
    matcher: /([\s\n]+)|(\\(?:(?:\\\\)*\\|[^\\\s])?|\/\*|\*\/|\(|\)|\[|\]|"|'|\{|\}|,|;|\.|\b:\/\/\b|::\b|:(?!active|after|any|any-link|backdrop|before|checked|default|defined|dir|disabled|empty|enabled|first|first-child|first-letter|first-line|first-of-type|focus|focus-visible|focus-within|fullscreen|host|hover|in-range|indeterminate|invalid|lang|last-child|last-of-type|left|link|matches|not|nth-child|nth-last-child|nth-last-of-type|nth-of-type|only-child|only-of-type|optional|out-of-range|read-only|required|right|root|scope|target|valid|visited))/g,
    matchers: {
      quote: /(\n)|(\\(?:(?:\\\\)*\\|[^\\\s])?|\*\/|`|"|'|\$\{)/g,
      comment: /(\n)|(\*\/|\b(?:[a-z]+\:\/\/|\w[\w\+\.]*\w@[a-z]+)\S+|@[a-z]+)/gi,
    },
  }),
  {
    defaults: {value: {syntax: 'css'}},
  },
);

const html = Object.defineProperties(
  ({syntax} = html.defaults) => {
    const html = {
      syntax,
      keywords: Symbols.from('DOCTYPE doctype'),
      comments: Closures.from('<!--…-->'),
      closures: Closures.from('<%…%> <!…> <…/> </…> <…>'),
      quotes: [],
      patterns: {
        maybeKeyword: /^[a-z](\w*)$/i,
        closeTag: /<\/\w[^<>{}]*?>/g,
        // maybeIdentifier: /^(?:(?:[a-z][\-a-z]*)?[a-z]+\:)?(?:[a-z][\-a-z]*)?[a-z]+$/,
      },
      matcher: /([\s\n]+)|("|'|=|&#x?[a-f0-9]+;|&[a-z]+;|\/?>|<%|%>|<!--|-->|<[\/\!]?(?=[a-z]+\:?[a-z\-]*[a-z]|[a-z]+))/gi,
      matchers: {
        quote: /(\n)|(\\(?:(?:\\\\)*\\|[^\\\s])|"|')/g,
        comment: /(\n)|(-->)/g,
      },
    };

    const DOCTAGS = Symbols.from('SCRIPT STYLE');
    const TAG = /^[a-z]+$/i;
    // TODO: Check if custom/namespace tags ever need special close logic
    // const TAGLIKE = /^(?:(?:[a-z][\-a-z]*)?[a-z]+\:)?(?:[a-z][\-a-z]*)?[a-z]+$/i;

    const HTMLTagClosure = html.closures.get('<');

    HTMLTagClosure.patterns = html.patterns;

    HTMLTagClosure.close = (next, state, context) => {
      const parent = next && next.parent;
      const first = parent && parent.next;
      const tag = first && first.text && TAG.test(first.text) && first.text.toUpperCase();

      if (tag && DOCTAGS.includes(tag)) {
        let {source, index} = state;
        const $$matcher = html.patterns.closeTag;

        let match;
        $$matcher.lastIndex = index;

        // TODO: Check if `<script>`…`</SCRIPT>` is still valid!
        const $$closer = new RegExp(raw`^<\/(?:${first.text.toLowerCase()}|${tag})\b`);

        let syntax = (tag === 'STYLE' && 'css') || '';

        if (!syntax) {
          const openTag = source.slice(parent.offset, index);
          const match = /\stype=.*?\b(.+?)\b/.exec(openTag);
          syntax = tag === 'SCRIPT' && (!match || !match[1] || /^module$|javascript/i.test(match[1])) ? 'es' : '';
        }

        while ((match = $$matcher.exec(source))) {
          if ($$closer.test(match[0])) {
            if (syntax) {
              return {offset: index, index: match.index, syntax};
            } else {
              const offset = index;
              const text = source.slice(offset, match.index - 1);
              state.index = match.index;
              return [{text, offset, previous: next, parent}];
            }
          }
        }
      }
    };
    HTMLTagClosure.quotes = Symbols.from(`' "`);
    HTMLTagClosure.closer = /\/?>/;

    return html;
  },
  {
    defaults: {value: {syntax: 'html', aliases: ['htm']}},
  },
);

const markdown = Object.defineProperties(
  ({syntax} = defaults, {html}) => {
    const matcher = ((...matchers) => {
      let matcher = matchers[matchers.length - 1];
      try {
        matchers.push(
          (matcher = sequence`${all(
            sequence`(${markdown.WHITESPACE})`,
            sequence`(${all(
              markdown.ESCAPES,
              markdown.ENTITIES,
              markdown.RULES,
              markdown.BLOCKS,
              markdown.INLINES,
              markdown.TYPOGRAPHS,
              markdown.TAGS,
              markdown.BRACKETS,
              markdown.FENCES,
              markdown.SPANS,
            )})`,
            markdown.INDICIES,
            markdown.DECIMAL,
            markdown.EXPONENTIAL,
            markdown.FRAGMENTS,
          )}${'/gim'}`),
        );
        return matcher;
      } catch (exception) {
        matchers.push(exception.message.replace(/.*Invalid regular expression: /, ''));
        console.warn(exception);
      }
      matcher.matchers = matchers;
      return matcher;
    })(
      /(^\s+|\n)|(&#x?[a-f0-9]+;|&[a-z]+;|(?:```+|\~\~\~+|(?:--+|==+)(?=\s*$)|(?:\#{1,6}|\-|\b\d+\.|\b[a-z]\.|\b[ivx]+\.)(?=\s+\S*))|–|—|"|'|=|\/>|<%|%>|<!--|-->|<[\/\!]?(?=[a-z]+\:?[a-z\-]*[a-z]|[a-z]+)|<|>|\(|\)|\[|\]|__?|([*~`])\3?\b|(?:\b|\b\B|\B)([*~`])\4?)|\b[^\n\s\[\]\(\)\<\>&]*[^\n\s\[\]\(\)\<\>&_]\b|[^\n\s\[\]\(\)\<\>&]+(?=__?\b)|\\./gim,
      sequence`(${markdown.WHITESPACE})|(${markdown.ENTITIES}|(?:${markdown.FENCES}|(?:${markdown.RULES})(?=\s*$)|(?:${
        markdown.BLOCKS
      })(?=\s+\S*))|${markdown.TYPOGRAPHS}|${markdown.TAGS}|${markdown.BRACKETS}|${markdown.INLINES})|${
        markdown.FRAGMENTS
      }|${markdown.ESCAPES}${'/gim'}`,
    );

    const mode = {
      syntax,
      comments: Closures.from('<!--…-->'),
      quotes: [],
      closures: Closures.from(html.closures, markdown.CLOSURES),
      operators: html.operators,
      matcher: matcher,
      spans: Closures.from('``…`` `…`'),
      matchers: {comment: /(\n)|(-->)/g},
    };

    const open = (parent, state, grouper) => {
      const {source, index: start} = state;
      const fence = parent.text;
      const fencing = previousTextFrom(parent, '\n');
      const indenting = fencing.slice(fencing.indexOf('\n') + 1, -fence.length) || '';
      let end = source.indexOf(`\n${fencing}`, start);
      const INDENT = (indenting && indenter(indenting)) || /^/m;
      const CLOSER = new RegExp(raw`^${INDENT.source.slice(1) || ''}${fence}`, 'mg');

      CLOSER.lastIndex = start;
      let closerMatch = CLOSER.exec(source);
      if (closerMatch && closerMatch.index >= start) {
        end = closerMatch.index;
      } else {
        const FENCE = new RegExp(raw`^[\>\|\s]*${fence}`, 'mg');
        FENCE.lastIndex = start;
        const fenceMatch = FENCE.exec(source);
        if (fenceMatch && fenceMatch.index >= start) {
          end = fenceMatch.index;
        } else return;
      }

      if (end > start) {
        let offset = start;
        let text, head, lines;

        const body = source.slice(start, end) || '';
        const tokens = [];
        tokens.end = end;
        {
          [head, ...lines] = body.split(/\r?(\n)\r?/g);
          if (head) {
            tokens.push({text: head, type: 'comment', offset, parent}), (offset += head.length);
          }
          for (const line of lines) {
            if (line === '\n') {
              text = line;
              tokens.push({text, type: 'whitespace', offset, parent}), (offset += text.length);
            } else {
              const [indent] = INDENT.exec(line) || '';
              const inset = (indent && indent.length) || 0;
              if (inset) {
                for (const text of indent.split(/(\s+)/g)) {
                  if (!text) continue;
                  const type = (text.trim() && 'sequence') || 'whitespace';
                  tokens.push({text, type, offset, parent});
                  offset += text.length;
                }
                text = line.slice(inset) || '';
              } else {
                text = line;
              }
              if (text) {
                tokens.push({text, type: 'code', offset, parent}), (offset += text.length);
              }
            }
          }
        }

        if (tokens.length) {
          const last = tokens[tokens.length - 1];
          if (!last.text) tokens.pop();
          return tokens;
        }
      }
    };

    {
      const quotes = html.closures.get('<').quotes;
      for (const opener of ['\`\`\`', '\~\~\~']) {
        const FenceClosure = mode.closures.get(opener);
        if (FenceClosure) {
          FenceClosure.matcher = new RegExp(
            raw`/(\s*\n)|(${opener}(?=\s|$)|^(?:[\s>|]*\s)?\s*)|.*$`,
            'gm',
          );
          FenceClosure.quotes = quotes;
          FenceClosure.open = open;
        }
      }
    }

    return mode;
  },
  {
    defaults: {get: () => ({...markdown.DEFAULTS})},
  },
);

Definitions: {
  Defaults: {
    markdown.DEFAULTS = {syntax: 'markdown', aliases: ['md'], requires: ['html']};
  }

  markdown.BLOCK = '```…``` ~~~…~~~';
  markdown.INLINE = '[…] (…) *…* **…** _…_ __…__ ~…~ ~~…~~';
  markdown.CLOSURES = `${markdown.BLOCK} ${markdown.INLINE}`;
  markdown.WHITESPACE = /^\s+|\s+$|\n+/;
  markdown.ESCAPES = /\\./;
  markdown.ENTITIES = /&#x?[a-f0-9]+;|&[a-z]+;/;
  markdown.FENCES = /(?:\x60{3,}|\x7E{3,})(?=\b| |$)/;
  markdown.RULES = /(?:[\-]{2,}|[=]{2,})(?=\s*$)/;
  markdown.BLOCKS = /(?:\#{1,6}|\-|\b\d+\.|\b[a-z]\.|\b[ivx]+\.)(?=\s+\S)/;
  markdown.TYPOGRAPHS = /\B[–—](?=\ )|"|'|=/;
  markdown.TAGS = /\/>|<%|%>|<!--|-->|<[\/\!]?(?=[a-z]+\:?[a-z\-]*[a-z]|[a-z]+)/;
  markdown.BRACKETS = /<|>|\(|\)|\[|\]/;
  markdown.INLINES = /\b([*~_])(?:\3\b(?=[^\n]*[^\n\s\\]\3\3)|\b(?=[^\n]*[^\n\s\\]\3))|(?:\b|\b\B|\B)([*~_])\4?/;
  markdown.SPANS = /(``?(?![`\n]))[^\n]*?[^\\`\n]\5/;
  markdown.INDICIES = /\b(?:[\da-zA-Z]+\.)+[\da-zA-Z]+\.?/;
  markdown.DECIMAL = /[+\-]?\d+(?:,\d{3})*(?:\.\d+)?|[+\-]?\d*\.\d+/;
  markdown.EXPONENTIAL = /\d+[eE]\-?\d+|\d+\.\d+[eE]\-?\d+/;
  markdown.FRAGMENTS = /\b[^\n\s\[\]\(\)\<\>&`"]*[^\n\s\[\]\(\)\<\>&_`"]\b|[^\n\s\[\]\(\)\<\>&`"]+(?=__?\b)/;
}

const javascript = Object.defineProperties(
  ({syntax} = defaults) => ({
    syntax,
    comments: Closures.from(javascript.COMMENTS),
    quotes: Symbols.from(javascript.QUOTES),
    closures: Closures.from(javascript.CLOSURES),
    spans: {'`': Closures.from(javascript.SPANS['`'])},
    keywords: Symbols.from(javascript.KEYWORDS),
    assigners: Symbols.from(javascript.ASSIGNERS),
    combinators: Symbols.from(javascript.COMBINATORS),
    nonbreakers: Symbols.from(javascript.NONBREAKERS),
    operators: Symbols.from(javascript.OPERATORS),
    breakers: Symbols.from(javascript.BREAKERS),
    patterns: {
      ...patterns,
      maybeIdentifier: identifier(entities.es.IdentifierStart, entities.es.IdentifierPart),
      segments: {
        regexp: /^\/[^\n\/\*][^\n]*\//,
      },
    },
    matcher: sequence`([\s\n]+)|(${all(
      javascript.REGEXPS,
      javascript.COMMENTS,
      javascript.QUOTES,
      javascript.CLOSURES,
      ...javascript.PUNCTUATORS,
    )})`,
    matchers: {
      "'": /(\n)|(')|(\\.)/g,
      '"': /(\n)|(")|(\\.)/g,
      '`': /(\n)|(`|\$\{)|(\\.)/g,
      quote: /(\n)|(`|"|'|\$\{)|(\\.)/g,
      comment: /(\n)|(\*\/|\b(?:[a-z]+\:\/\/|\w[\w\+\.]*\w@[a-z]+)\S+|@[a-z]+)/gi,
    },
  }),
  {
    defaults: {get: () => ({...javascript.DEFAULTS})},
  },
);

Definitions: {
  Defaults: {
    javascript.DEFAULTS = {syntax: 'javascript', aliases: ['javascript', 'es', 'js', 'ecmascript']};
  }
  javascript.REGEXPS = /\/(?=[^\*\/\n][^\n]*\/(?:[a-z]+\b)?(?:[ \t]+[^\n\s\(\[\{\w]|[\.\[;,]|[ \t]*[\)\]\}\;\,\n]|\n|$))(?:[^\\\/\n\t\[]+|\\\S|\[(?:\\\S|[^\\\n\t\]]+)+?\])+?\/[a-z]*/g;

  javascript.COMMENTS = /\/\/|\/\*|\*\/|^\#\!.*\n/g;
  javascript.COMMENTS['(closures)'] = '//…\n /*…*/';

  javascript.QUOTES = /`|"|'/g;
  javascript.QUOTES['(symbols)'] = `' " \``;

  javascript.CLOSURES = /\{|\}|\(|\)|\[|\]/g;
  javascript.CLOSURES['(closures)'] = '{…} (…) […]';

  javascript.SPANS = {'`': {['(closures)']: '${…}'}};

  javascript.KEYWORDS = {
    ['(symbols)']:
      // abstract enum interface package namespace declare type module
      'arguments as async await break case catch class export const continue debugger default delete do else export extends finally for from function get if import in instanceof let new of return set static super switch this throw try typeof var void while with yield',
  };

  javascript.PUNCTUATORS = [
    /,|;|\.\.\.|\.|\:|\?|=>/,
    /\+\+|\+=|\+|--|-=|-|\*\*=|\*\*|\*=|\*|\/=|\//,
    /&&|&=|&|\|\||\|=|\||\%=|\%|\^=|\^|~=|~/,
    /<<=|<<|<=|<|>>>=|>>>|>>=|>>|>=|>/,
    /!==|!=|!|===|==|=/,
  ];

  javascript.ASSIGNERS = {['(symbols)']: '= += -= *= /= **= %= &= |= <<= >>= >>>= ^= ~='};

  javascript.COMBINATORS = {['(symbols)']: '=== == + - * / ** % & && | || ! !== > < >= <= => >> << >>> ^ ~'};
  javascript.NONBREAKERS = {['(symbols)']: '.'};
  javascript.OPERATORS = {['(symbols)']: '++ -- ... ? :'};
  javascript.BREAKERS = {['(symbols)']: ', ;'};
}

const mjs = Object.defineProperties(
  ({syntax} = mjs.defaults, {javascript: {quotes, closures, spans, matchers}}) => ({
    syntax,
    keywords: Symbols.from('import export default'),
    quotes,
    closures,
    spans,
    matcher: javascript.MJS,
    matchers: {quote: matchers.quote, closure: javascript.CLOSURE},
  }),
  {
    defaults: {get: () => ({...mjs.DEFAULTS})},
  },
);

const cjs = Object.defineProperties(
  ({syntax} = cjs.defaults, {javascript: {quotes, closures, spans, matchers}}) => ({
    syntax,
    keywords: Symbols.from('import module exports require'),
    quotes,
    closures,
    spans,
    matcher: javascript.CJS,
    matchers: {quote: matchers.quote, closure: javascript.CLOSURE},
  }),
  {
    defaults: {get: () => ({...cjs.DEFAULTS})},
  },
);

const esx = Object.defineProperties(
  ({syntax} = esx.defaults, {javascript: {quotes, closures, spans, matchers}, mjs, cjs}) => ({
    syntax,
    keywords: Symbols.from(mjs.keywords, cjs.keywords),
    quotes,
    closures,
    spans,
    matcher: javascript.ESX,
    matchers: {quote: matchers.quote, closure: javascript.ESX},
  }),
  {
    defaults: {get: () => ({...esx.DEFAULTS})},
  },
);

Definitions: {
  Defaults: {
    const requires = [javascript.defaults.syntax];

    mjs.DEFAULTS = {syntax: 'mjs', aliases: ['esm'], requires};
    cjs.DEFAULTS = {syntax: 'cjs', requires};
    esx.DEFAULTS = {syntax: 'esx', requires: [...requires, 'cjs', 'mjs']};
  }

  const {REGEXPS, CLOSURES} = javascript;

  // TODO: Undo $ matching once fixed
  const QUOTES = /`|"(?:[^\\"]+|\\.)*(?:"|$)|'(?:[^\\']+|\\.)*(?:'|$)/g;
  const COMMENTS = /\/\/.*(?:\n|$)|\/\*[^]*?(?:\*\/|$)|^\#\!.*\n/g;
  const STATEMENTS = all(QUOTES, CLOSURES, REGEXPS, COMMENTS);
  const BLOCKLEVEL = sequence`([\s\n]+)|(${STATEMENTS})`;
  const TOPLEVEL = sequence`([\s\n]+)|(${STATEMENTS})`;
  javascript.CLOSURE = sequence`(\n+)|(${STATEMENTS})`;
  javascript.MJS = sequence`${TOPLEVEL}|\bexport\b|\bimport\b`;
  javascript.CJS = sequence`${BLOCKLEVEL}|\bexports\b|\bmodule.exports\b|\brequire\b|\bimport(?=\(|\.)`;
  javascript.ESX = sequence`${BLOCKLEVEL}|\bexports\b|\bimport\b|\bmodule.exports\b|\brequire\b`;
}



const modes = /*#__PURE__*/Object.freeze({
  css: css,
  html: html,
  markdown: markdown,
  javascript: javascript,
  mjs: mjs,
  cjs: cjs,
  esx: esx
});

const parser = new Parser();
for (const id in modes) parser.register(modes[id]);

const {assign, defineProperty} = Object;

const document$1 = void null;

class Node {
  get children() {
    return defineProperty(this, 'children', {value: new Set()}).children;
  }
  get childElementCount() {
    return (this.hasOwnProperty('children') && this.children.size) || 0;
  }
  get textContent() {
    return (
      (this.hasOwnProperty('children') && this.children.size && [...this.children].join('')) || ''
    );
  }
  set textContent(text) {
    this.hasOwnProperty('children') && this.children.size && this.children.clear();
    text && this.children.add(new String(text));
  }
  appendChild(element) {
    return element && this.children.add(element), element;
  }
  append(...elements) {
    if (elements.length) for (const element of elements) element && this.children.add(element);
  }
  removeChild(element) {
    element &&
      this.hasOwnProperty('children') &&
      this.children.size &&
      this.children.delete(element);
    return element;
  }
  remove(...elements) {
    if (elements.length && this.hasOwnProperty('children') && this.children.size)
      for (const element of elements) element && this.children.delete(element);
  }
}

class Element extends Node {
  get innerHTML() {
    return this.textContent;
  }
  set innerHTML(text) {
    this.textContent = text;
  }
  get outerHTML() {
    const {className, tag, innerHTML} = this;
    return `<${tag}${(className && ` class="${className}"`) || ''}>${innerHTML || ''}</${tag}>`;
  }
  toString() {
    return this.outerHTML;
  }
  toJSON() {
    return this.toString();
  }
}

class DocumentFragment extends Node {
  toString() {
    return this.textContent;
  }
  toJSON() {
    return (this.childElementCount && [...this.children]) || [];
  }
  [Symbol.iterator]() {
    return ((this.childElementCount && this.children) || '')[Symbol.iterator]();
  }
}

class Text extends String {
  toString() {
    return encodeEntities(super.toString());
  }
}

const createElement = (tag, properties, ...children) => {
  const element = assign(new Element(), {
    tag,
    className: (properties && properties.className) || '',
    properties,
  });
  children.length && defineProperty(element, 'children', {value: new Set(children)});
  return element;
};

const createText = (content = '') => new Text(content);
const encodeEntity = entity => `&#${entity.charCodeAt(0)};`;
const encodeEntities = string => string.replace(/[\u00A0-\u9999<>\&]/gim, encodeEntity);
const createFragment = () => new DocumentFragment();

const pseudo = /*#__PURE__*/Object.freeze({
  document: document$1,
  Node: Node,
  Element: Element,
  DocumentFragment: DocumentFragment,
  Text: Text,
  createElement: createElement,
  createText: createText,
  encodeEntity: encodeEntity,
  encodeEntities: encodeEntities,
  createFragment: createFragment
});

const {document: document$2, Element: Element$1, Node: Node$1, Text: Text$1, DocumentFragment: DocumentFragment$1} =
  'object' === typeof self && (self || 0).window === self && self;

const {createElement: createElement$1, createText: createText$1, createFragment: createFragment$1} = {
  createElement: (tag, properties, ...children) => {
    const element = document$2.createElement(tag);
    properties && Object.assign(element, properties);
    if (!children.length) return element;
    if (element.append) {
      while (children.length > 500) element.append(...children.splice(0, 500));
      children.length && element.append(...children);
    } else if (element.appendChild) {
      for (const child of children) element.appendChild(child);
    }
    return element;
  },

  createText: (content = '') => document$2.createTextNode(content),

  createFragment: () => document$2.createDocumentFragment(),
};

const dom = /*#__PURE__*/Object.freeze({
  document: document$2,
  Element: Element$1,
  Node: Node$1,
  Text: Text$1,
  DocumentFragment: DocumentFragment$1,
  createElement: createElement$1,
  createText: createText$1,
  createFragment: createFragment$1
});

// TEST: Trace for ESM testing
typeof process === 'object' && console.info('[ESM]: %o', import.meta.url);

const native = document$2 && dom;

//@ts-check

/**
 * @template T
 * @typedef {Promise<T> | T} async
 */

/**
 * @template T
 * @typedef {{next(): async<IteratorResult<async<T>>>}} iterator
 */

/**
 * @template T
 * @typedef {iterator<T> | {[Symbol.iterator](): iterator<T>}  | {[Symbol.asyncIterator](): iterator<T>}} iterable
 */

/**
 * @template T, U
 * @param {iterable<T>} iterable
 * @param {(value: T) => U} ƒ
 */
async function each(iterable, ƒ) {
  const iterator =
    (iterable && ('next' in iterable && typeof iterable.next === 'function' && iterable)) ||
    ((Symbol.asyncIterator in iterable && iterable[Symbol.asyncIterator]()) ||
      (Symbol.iterator in iterable && iterable[Symbol.iterator]()));
  try {
    if (iterator || typeof iterator.next === 'function') {
      let result, done;
      while (!done && (result = await iterator.next())) {
        await ƒ(await result.value);
        done = result.done;
      }
    }
  } finally {
    iterator &&
      iterable !== iterator &&
      'return' in iterator &&
      typeof iterator.return === 'function' &&
      iterator.return();
  }
}

// export async function next(iterator, previous, received, done) {
//   let result, value;
//   !previous || (await previous);
//   const next = done ? 'return' : 'next';
//   !(iterator && next in iterator && typeof iterator[next] === 'function') ||
//     !((result = received === VOID ? iterator[next]() : iterator[next](received)) && (result = await result)) ||
//     ('done' in result && (done = !!(await result.done)), 'value' in result && (value = await result.value));
//   return {value, done: !!done};
// }

// export const AsyncIterator = (() => {
//   const Done = Symbol('[[Done]]');
//   const Result = Symbol('[[Result]]');
//   const Iterator = Symbol('[[Iterator]]');
//   const DONE = Object.freeze(Object.seal({done: true, value: undefined}));
//   const VOID = Symbol('[[Void]]');
//   const EMPTY = [];
//   const reject = async reason => ({value: Promise.reject(reason), done: true});
//   const next = async (iterator, previous, received, done) => {
//     let result, value;
//     !previous || (await previous);
//     const next = done ? 'return' : 'next';
//     !(iterator && next in iterator && typeof iterator[next] === 'function') ||
//       !((result = received === VOID ? iterator[next]() : iterator[next](received)) && (result = await result)) ||
//       ('done' in result && (done = !!(await result.done)), 'value' in result && (value = await result.value));
//     return {value, done: !!done};
//   };

//   /**
//    * @template T
//    * @implements {AsyncIterableIterator<T>}
//    */
//   class AsyncIterator {
//     /** @param {IterableIterator<T> | AsyncIterableIterator<T>} [iterator] */
//     constructor(iterator) {
//       Object.defineProperty(this, Iterator, {
//         value:
//           (iterator &&
//             (iterator[Iterator] ||
//               (Symbol.iterator in iterator && iterator[Symbol.iterator]()) ||
//               (Symbol.asyncIterator in iterator && iterator[Symbol.asyncIterator]()))) ||
//           EMPTY[Symbol.iterator](),
//       });
//     }

//     [Symbol.asyncIterator]() {
//       return this;
//     }

//     /** @param {T} [value] @returns {Promise<IteratorResult<T>>} */
//     async next(value) {
//       let result;
//       return this[Done]
//         ? this[Result] || DONE
//         : ((this[Done] = (await (result = this[Result] = next(
//             this[Iterator],
//             this[Result],
//             arguments.length ? value : VOID,
//           ))).done),
//           result);
//     }

//     /**
//      * @param {any} [value]
//      * @returns {Promise<IteratorResult>}
//      */
//     async return(value) {
//       return this[Done]
//         ? this[Result] || DONE
//         : (this[Result] = next(this[Iterator], null, arguments.length ? value : VOID, (this[Done] = true)));
//     }

//     /**
//      * @param {any} error
//      * @returns {Promise<IteratorResult>}
//      */
//     async throw(error) {
//       return this[Done] ? this[Result] || DONE : ((this[Done] = true), (this[Result] = reject(error)));
//     }
//   }

//   return AsyncIterator;
// })();

// const x = new AsyncIterator([1]);
// const y = x[Symbol.asyncIterator]();

// export const async = {
//   each: async (iterable, ƒ) => {

//   }
// };

//  * @param {AsyncIterableIterator<T> | AsyncIterator<T>} iterable

/// OPTIONS
/** The tag name of the element to use for rendering a token. */
const SPAN = 'span';

/** The class name of the element to use for rendering a token. */
const CLASS = 'markup';

/** Uses lightweight proxy objects that can be serialized into HTML text */
const HTML_MODE = true;
/// INTERFACE

const renderers = {};

function* renderer(tokens, tokenRenderers = renderers) {
  for (const token of tokens) {
    const {type = 'text', text, punctuator, breaks} = token;
    const tokenRenderer =
      (punctuator && (tokenRenderers[punctuator] || tokenRenderers.operator)) ||
      (type && tokenRenderers[type]) ||
      (text && tokenRenderers.text);
    const element = tokenRenderer && tokenRenderer(text, token);
    element && (yield element);
  }
}

async function render(tokens, fragment) {
  let logs, template, first, elements;
  try {
    fragment || (fragment = Fragment());
    logs = fragment.logs || (fragment.logs = []);
    elements = renderer(tokens);
    if ((first = await elements.next()) && 'value' in first) {
      template = Template();
      if (!native$1 && template && 'textContent' in fragment) {
        logs.push(`render method = 'text' in template`);
        const body = [first.value];
        first.done || (await each(elements, element => body.push(element)));
        template.innerHTML = body.join('');
        fragment.appendChild(template.content);
      } else if ('push' in fragment) {
        logs.push(`render method = 'push' in fragment`);
        fragment.push(first.value);
        first.done || (await each(elements, element => fragment.push(element)));
      } else if ('append' in fragment) {
        logs.push(`render method = 'append' in fragment`);
        fragment.append(first.value);
        first.done || (await each(elements, element => fragment.append(element)));
      }
    }
    return fragment;
  } finally {
    template && (template.innerHTML = '');
    template = fragment = logs = elements = first = null;
  }
}

const supported = !!native;
const native$1 = !HTML_MODE && supported;
const implementation = native$1 ? native : pseudo;
const {createElement: Element$2, createText: Text$2, createFragment: Fragment} = implementation;
const Template = template =>
  !supported || Template.supported === false
    ? false
    : Template.supported === true
    ? document.createElement('template')
    : (Template.supported = !!(
        (template = document.createElement('template')) && 'HTMLTemplateElement' === (template.constructor || '').name
      )) && template;

/// RENDERERS
const factory = (tag, properties) => (content, token) => {
  if (!content) return;
  typeof content !== 'string' || (content = Text$2(content));
  const element = Element$2(tag, properties, content);
  element && token && (token.hint && (element.className += ` ${token.hint}`));
  return element;
};

Object.assign(renderers, {
  whitespace: Text$2,
  text: factory(SPAN, {className: CLASS}),

  variable: factory('var', {className: `${CLASS} variable`}),
  keyword: factory(SPAN, {className: `${CLASS} keyword`}),
  identifier: factory(SPAN, {className: `${CLASS} identifier`}),
  operator: factory(SPAN, {className: `${CLASS} punctuator operator`}),
  assigner: factory(SPAN, {className: `${CLASS} punctuator operator assigner`}),
  combinator: factory(SPAN, {className: `${CLASS} punctuator operator combinator`}),
  punctuation: factory(SPAN, {className: `${CLASS} punctuator punctuation`}),
  quote: factory(SPAN, {className: `${CLASS} punctuator quote`}),
  breaker: factory(SPAN, {className: `${CLASS} punctuator breaker`}),
  opener: factory(SPAN, {className: `${CLASS} punctuator opener`}),
  closer: factory(SPAN, {className: `${CLASS} punctuator closer`}),
  span: factory(SPAN, {className: `${CLASS} punctuator span`}),
  sequence: factory(SPAN, {className: `${CLASS} sequence`}),
  literal: factory(SPAN, {className: `${CLASS} literal`}),
  indent: factory(SPAN, {className: `${CLASS} sequence indent`}),
  comment: factory(SPAN, {className: `${CLASS} comment`}),
  code: factory(SPAN, {className: `${CLASS}`}),
});

const versions = [parser];

const tokenize = (source, options = {}) => {
  const version = versions[options.version - 1] || versions[0];
  options.tokenize = (version || parser).tokenize;
  try {
    return version.tokenize(source, {options});
  } finally {
    // || console.info('Markup Version %O', version);
  }
};

const render$1 = async (source, options) => render(tokenize(source, options), options && options.fragment);

const warmup = (source, options) => {
  const key = (options && JSON.stringify(options)) || '';
  let cache = (warmup.cache || (warmup.cache = new Map())).get(key);
  cache || warmup.cache.set(key, (cache = new Set()));
  if (cache.has(source)) return;
  for (const item of tokenize(source, options));
  cache.add(source);
};

// import {entities} from '@smotaal/tokenizer/extensions/common/patterns.js';

// import {raw} from './helpers.js';

// export const {
// 	UnicodeIdentifier,
// 	MarkdownIdentityPrefixer,
// 	MarkdownIdentityJoiner,
// 	MarkdownIdentityWord,
// 	MarkdownIdentity,
// } = (({
// 	IdentifierStart,
// 	IdentifierPart,
// 	UnicodeIdentifierStart = IdentifierStart.slice(2),
// 	UnicodeIdentifierPart = IdentifierPart.slice(2),
// 	UnicodeIdentifier = raw`[${UnicodeIdentifierStart}][${UnicodeIdentifierPart}]*`,
// 	MarkdownWordPrefixes = raw`$@`,
// 	MarkdownWordPrefix = raw`[${MarkdownWordPrefixes}]?`,
// 	MarkdownWord = raw`${MarkdownWordPrefix}${UnicodeIdentifier}`,
// 	MarkdownWordJoiners = raw` \\\/:_\-\xA0\u2000-\u200B\u202F\u2060`,
// 	MarkdownWordJoiner = raw`[${MarkdownWordJoiners}]+`,
// 	MarkdownIdentity = raw`(?:\s|\n|^)(${MarkdownWord}(?:${MarkdownWordJoiner}${MarkdownWord})*(?=\b[\s\n]|$))`,
// }) => ({
// 	UnicodeIdentifier: new RegExp(UnicodeIdentifier, 'u'),
// 	MarkdownIdentityPrefixer: new RegExp(raw`^[${MarkdownWordPrefixes}]?`, 'u'),
// 	MarkdownIdentityJoiner: new RegExp(raw`[${MarkdownWordJoiners}]+`, 'ug'),
// 	MarkdownIdentityWord: new RegExp(MarkdownWord, 'u'),
// 	MarkdownIdentity: new RegExp(MarkdownIdentity, 'u'),
// 	// MarkdownIdentitySeparators: new RegExp(raw`[${MarkdownWordPrefixes}${MarkdownWordJoiners}]+`, 'ug')
// }))(entities.es);

export { tokenize, render$1 as render, warmup, encodeEntity, encodeEntities };
//# sourceMappingURL=markup.m.js.map
