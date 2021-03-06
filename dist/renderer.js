import { encodeEntities, render as render$1, tokenize as tokenize$1, encodeEntity } from './markup.js';

//@ts-check
const CurrentMatch = Symbol('CurrentMatch');
const CurrentToken = Symbol('CurrentToken');
const CreatedToken = Symbol('CreatedToken');
const TotalTokens = Symbol('TotalTokens');
const TotalMatches = Symbol('TotalMatches');
const Next = Symbol('Next');
const Initialize = Symbol('Initialize');
const Finalize = Symbol('Finalize');
const Tokens = Symbol('Tokens');

/** @template {RegExp} T  @implements {MatcherIterator<T>} */
class MatcherState {
  /** @param {Partial<MatcherState<T>> & {initialize?(): void, finalize?(): void}} properties */
  constructor({source, matcher, initialize, finalize, ...properties}) {
    Object.assign(this, properties);

    this.done = false;
    /** @type {*} */
    this.value = undefined;

    /** @type {string} */
    this.source = String(source);
    /** @type {T} */
    this.matcher =
      matcher &&
      (matcher instanceof RegExp
        ? Object.setPrototypeOf(RegExp(matcher.source, matcher.flags || 'g'), matcher)
        : RegExp(matcher, 'g'));

    /** @type {RegExpExecArray} */
    this[CurrentMatch] = undefined;
    this[TotalMatches] = -1;
    this[Next] = this.getNextMatch;
    this[Initialize] =
      typeof initialize === 'function'
        ? () => {
            this.initialize();
            initialize();
          }
        : this.initialize;
    this[Finalize] =
      typeof finalize === 'function'
        ? () => {
            finalize();
            this.finalize();
          }
        : this.finalize;
  }

  initialize() {
    Object.defineProperties(this, {
      source: {value: this.source, writable: false, configurable: true},
      matcher: {value: this.matcher, writable: false, configurable: true},
    });
    this[TotalMatches] = 0;
  }

  finalize() {
    Object.freeze(this);
  }

  [Symbol.iterator]() {
    return this;
  }

  next() {
    if (this.done) return this;
    if (this[TotalMatches] === -1) this[Initialize]();
    if ((this.done = (this.value = this[Next]()) == null)) this[Finalize]();
    else this[TotalMatches]++;
    return this;
  }

  getNextMatch() {
    return !this.done &&
      this.matcher.lastIndex <
        ((this[CurrentMatch] = this.matcher.exec(this.source)) != null /* */
          ? this.matcher.lastIndex + (this[CurrentMatch][0].length === 0 && 1)
          : this.matcher.lastIndex)
      ? this[CurrentMatch]
      : undefined;
  }
}

/** @template {RegExp} T  @extends {MatcherState<T>} */
class TokenizerState extends MatcherState {
  /** @param {Partial<TokenizerState<T>>} properties */
  constructor(properties) {
    super(properties)[Next] = this.getNextToken;
  }

  initialize() {
    super.initialize();
    this[TotalTokens] = 0;
  }

  finalize() {
    super.finalize();
  }

  getNextToken() {
    if (this.done || this.getNextMatch() == null) return;

    this[CurrentToken] = this[CreatedToken];
    this[CreatedToken] = this.createToken(this[CurrentMatch], this);

    if (this[CreatedToken] !== undefined) {
      this[CreatedToken].index = ++this[TotalTokens];
    }

    // Initial design considered holding on to one token
    //   that used to be set to state.nextToken along with
    //   the matching state.nextTokenContext.
    //
    // TODO: Replace graceful holding with construct stacking.
    return this[CurrentToken] || this.getNextToken();
  }

  get [Tokens]() {
    return Object.defineProperty(this, Tokens, {value: [], writable: false, configurable: true})[Tokens];
  }

  /** @template T @returns {T} */
  createToken(match, state) {
    return;
  }
}

TokenizerState.prototype.previousToken = TokenizerState.prototype.nextToken = /** @type {Token} */ (undefined);

TokenizerState.defaults = {source: undefined, initialize: undefined, finalize: undefined};

//@ts-check

/** Matcher for composable matching */
class Matcher extends RegExp {
  /**
   * @param {MatcherPattern} pattern
   * @param {MatcherFlags} [flags]
   * @param {MatcherEntities} [entities]
   * @param {{}} [state]
   */
  constructor(pattern, flags, entities, state) {
    //@ts-ignore
    super(pattern, flags);
    (pattern &&
      pattern.entities &&
      Symbol.iterator in pattern.entities &&
      ((!entities && (entities = pattern.entities)) || entities === pattern.entities)) ||
      Object.freeze(
        Object.assign((entities = (entities && Symbol.iterator in entities && [...entities]) || []), {
          flags,
          meta: Matcher.metaEntitiesFrom(entities),
          identities: Matcher.identityEntitiesFrom(entities),
        }),
      );

    /** @type {MatcherEntities} */
    this.entities = entities;
    this.state = state;
    this.exec = this.exec;
    this.capture = this.capture;

    ({DELIMITER: this.DELIMITER = Matcher.DELIMITER, UNKNOWN: this.UNKNOWN = Matcher.UNKNOWN} = new.target);
  }

  /** @param {MatcherExecArray} match */
  capture(match) {
    // @ts-ignore
    if (match === null) return null;

    // @ts-ignore
    match.matcher = this;
    match.capture = {};

    //@ts-ignore
    for (
      let i = 0, entity;
      match[++i] === undefined ||
      void (
        (entity = this.entities[(match.entity = i - 1)]) == null ||
        (typeof entity === 'function'
          ? entity(match[0], i, match, this.state)
          : (match.capture[(match.identity = entity)] = match[0]))
      );

    );

    return match;
  }

  /** @param {string} source */
  exec(source) {
    const match = /** @type {MatcherExecArray} */ (super.exec(source));
    match == null || this.capture(match);
    return match;
  }

  /** @param {string} source */
  matchAll(source) {
    return /** @type {typeof Matcher} */ (this.constructor).matchAll(source, /** @type {any} */ (this));
  }

  /** @returns {entity is MatcherMetaEntity} */
  static isMetaEntity(entity) {
    return typeof entity === 'string' && entity.endsWith('?');
  }

  /** @returns {entity is MatcherIdentityEntity} */
  static isIdentityEntity(entity) {
    return typeof entity === 'string'
      ? entity !== '' && entity.trim() === entity && !entity.endsWith('?')
      : typeof entity === 'symbol';
  }

  static metaEntitiesFrom(entities) {
    return /** @type {MatcherEntitySet<MatcherMetaEntity>} */ (new Set([...entities].filter(Matcher.isMetaEntity)));
  }

  static identityEntitiesFrom(entities) {
    return /** @type {MatcherEntitySet<MatcherIdentityEntity>} */ (new Set(
      [...entities].filter(Matcher.isIdentityEntity),
    ));
  }

  /**
   * @param {MatcherPatternFactory} factory
   * @param {MatcherFlags} [flags]
   * @param {PropertyDescriptorMap} [properties]
   */
  static define(factory, flags, properties) {
    /** @type {MatcherEntities} */
    const entities = [];
    entities.flags = '';
    const pattern = factory(entity => {
      if (entity !== null && entity instanceof Matcher) {
        entities.push(...entity.entities);

        !entity.flags || (entities.flags = entities.flags ? Matcher.flags(entities.flags, entity.flags) : entity.flags);

        return entity.source;
      } else {
        entities.push(((entity != null || undefined) && entity) || undefined);
      }
    });
    entities.meta = Matcher.metaEntitiesFrom(entities);
    entities.identities = Matcher.identityEntitiesFrom(entities);
    flags = Matcher.flags('g', flags == null ? pattern.flags : flags, entities.flags);
    const matcher = new ((this && (this.prototype === Matcher.prototype || this.prototype instanceof RegExp) && this) ||
      Matcher)(pattern, flags, entities);

    properties && Object.defineProperties(matcher, properties);

    return matcher;
  }

  static flags(...sources) {
    let flags, iterative, sourceFlags;
    flags = '';
    for (const source of sources) {
      sourceFlags =
        (!!source &&
          (typeof source === 'string'
            ? source
            : typeof source === 'object' &&
              typeof source.flags !== 'string' &&
              typeof source.source === 'string' &&
              source.flags)) ||
        undefined;
      if (!sourceFlags) continue;
      for (const flag of sourceFlags)
        (flag === 'g' || flag === 'y' ? iterative || !(iterative = true) : flags.includes(flag)) || (flags += flag);
    }
    return flags;
  }

  static get sequence() {
    const {raw} = String;
    const {replace} = Symbol;

    /**
     * @param {TemplateStringsArray} template
     * @param  {...any} spans
     * @returns {string}
     */
    const sequence = (template, ...spans) =>
      sequence.WHITESPACE[replace](raw(template, ...spans.map(sequence.span)), '');
    // const sequence = (template, ...spans) =>
    //   sequence.WHITESPACE[replace](sequence.COMMENTS[replace](raw(template, ...spans.map(sequence.span)), ''), '');

    /**
     * @param {any} value
     * @returns {string}
     */
    sequence.span = value =>
      (value &&
        // TODO: Don't coerce to string here?
        typeof value !== 'symbol' &&
        `${value}`) ||
      '';

    sequence.WHITESPACE = /^\s+|\s*\n\s*|\s+$/g;
    // sequence.COMMENTS = /(?:^|\n)\s*\/\/.*(?=\n)|\n\s*\/\/.*(?:\n\s*)*$/g;

    Object.defineProperty(Matcher, 'sequence', {value: Object.freeze(sequence), enumerable: true, writable: false});
    return sequence;
  }

  static get join() {
    const {sequence} = this;

    const join = (...values) =>
      values
        .map(sequence.span)
        .filter(Boolean)
        .join('|');

    Object.defineProperty(Matcher, 'join', {value: Object.freeze(join), enumerable: true, writable: false});

    return join;
  }

  static get matchAll() {
    /** @template {RegExp} T @type {(string: MatcherText, matcher: T) => MatcherIterator<T> } */
    // const matchAll = (string, matcher) => new MatcherState(string, matcher);
    const matchAll = (() =>
      // TODO: Find a cleaner way to reference RegExp.prototype[Symbol.matchAll]
      Function.call.bind(
        String.prototype.matchAll || // TODO: Uncomment eventually
          {
            /**
             * @this {string}
             * @param {RegExp | string} pattern
             */
            *matchAll() {
              const matcher =
                arguments[0] &&
                (arguments[0] instanceof RegExp
                  ? Object.setPrototypeOf(RegExp(arguments[0].source, arguments[0].flags || 'g'), arguments[0])
                  : RegExp(arguments[0], 'g'));
              const string = String(this);

              if (!(matcher.flags.includes('g') || matcher.flags.includes('y')))
                return void (yield matcher.exec(string));

              for (
                let match, lastIndex = -1;
                lastIndex <
                ((match = matcher.exec(string))
                  ? (lastIndex = matcher.lastIndex + (match[0].length === 0))
                  : lastIndex);
                yield match, matcher.lastIndex = lastIndex
              );
            },
          }.matchAll,
      ))();

    Object.defineProperty(Matcher, 'matchAll', {value: Object.freeze(matchAll), enumerable: true, writable: false});

    return matchAll;
  }

  /**
   * @template {Matcher} T
   * @template {T} U
   * @template {{}} V
   * @param {T & V} matcher
   * @param {U} [instance]
   * @returns {U & V}
   */
  static clone(matcher, instance) {
    const {
      constructor: {prototype},
      source,
      flags,
      lastIndex,
      ...properties
    } = matcher;
    const clone = /** @type {U & V} */ (Object.assign(
      instance ||
        (prototype && 'source' in prototype && 'flags' in prototype
          ? RegExp(source, flags || 'g')
          : RegExp(matcher, 'g')),
      properties,
    ));
    // prototype && Object.setPrototypeOf(clone, prototype);
    Object.setPrototypeOf(
      clone,
      prototype || (this && this !== Matcher && this.prototype instanceof Matcher ? this.prototype : Matcher.prototype),
    );
    return clone;
  }

  /**
   * @template {Matcher} T
   * @template {{}} U
   * @param {T} matcher
   * @param {TokenizerState<T, U>} [state]
   * @returns {TokenMatcher<U>}
   */
  static create(matcher, state) {
    /** @type {typeof Matcher} */
    const Species = !this || this === Matcher || !(this.prototype instanceof Matcher) ? Matcher : this;

    return Object.defineProperty(
      ((
        state || (state = Object.create(null))
      ).matcher = /** @type {typeof Matcher} */ (matcher &&
      matcher instanceof RegExp &&
      matcher.constructor &&
      'function' !== typeof (/** @type {typeof Matcher} */ (matcher.constructor).clone) // prettier-ignore
        ? matcher.constructor
        : Species === Matcher || typeof Species.clone !== 'function'
        ? Matcher
        : Species
      ).clone(matcher)),
      'state',
      {value: state},
    );
  }
}

// Well-known identities for meaningful debugging which are
//   Strings but could possible be changed to Symbols
//
//   TODO: Revisit Matcher.UNKOWN
//

const {
  /** Identity for delimiter captures (like newlines) */
  DELIMITER = (Matcher.DELIMITER = Matcher.prototype.DELIMITER = /** @type {MatcherIdentityString} */ ('DELIMITER?')),
  /** Identity for unknown captures */
  UNKNOWN = (Matcher.UNKNOWN = Matcher.prototype.UNKNOWN = /** @type {MatcherIdentityString} */ ('UNKNOWN?')),
} = Matcher;

//@ts-check

const {
  escape: escape$1 = (Matcher.escape = /** @type {<T>(source: T) => string} */ ((() => {
    const {replace} = Symbol;
    return source => /[\\^$*+?.()|[\]{}]/g[replace](source, '\\$&');
  })())),
  join,
  sequence,
  matchAll,
} = Matcher;

// @ts-check

const {atoms, range} = (() => {
  const {freeze} = Object;

  /** @template {string} T @param {...T} strings */
  const atoms = (...strings) => freeze(strings); // .filter(atoms.filter).sort()

  atoms.filter = string => typeof string === 'string' && string.length;

  /** @param {string} string @param {string} [delimiter] */
  atoms.split = (string, delimiter = '') => freeze(string.split(delimiter));
  /**
   * Splits a string into case-distinct subsets as applicable.
   *
   * NOTE: A non-case-senstive string yields the single
   *       subset instance for all its cases. A fully cased
   *       string yields separate upper and lower case subsets
   *       and a single subset for both initial and any cases.
   *
   * @param {string} string @param {string} [delimiter]
   */
  atoms.split.cases = (string, delimiter = '') => {
    /** Ordered array of every unique original cased atom in the original string */
    const initialCase = freeze(atoms.union(...atoms.split(string, delimiter)));

    const lowerCaseString = string.toLowerCase();
    const upperCaseString = string.toUpperCase();

    if (lowerCaseString === upperCaseString) return [initialCase, initialCase, initialCase, initialCase];

    /** Ordered array of every unique original and transformed cased atom in the original string */
    const everyCase = freeze(
      atoms.union(...atoms.split(`${string}${delimiter}${lowerCaseString}${delimiter}${upperCaseString}`, delimiter)),
    );

    /** Ordered array of every unique lower cased atom in the original string */
    const lowerCase = freeze(atoms.union(...atoms.split(lowerCaseString, delimiter)));

    /** Ordered array of every unique upper cased atom in the original string */
    const upperCase = freeze(atoms.union(...atoms.split(upperCaseString, delimiter)));

    return everyCase.length === initialCase.length
      ? [initialCase, lowerCase, upperCase, initialCase]
      : [everyCase, lowerCase, upperCase, initialCase];
  };

  /** @template {string} T @param {...T} atoms @returns T[] */
  atoms.union = (...atoms) => [...new Set(atoms)];

  /** @template {string} T @param {...T} atoms @returns {string} */
  const range = (...atoms) => `[${atoms.map(range.escape).join('')}]`;
  range.escape = (atom, index) =>
    atom === ']' ? '\\]' : atom === '\\' ? '\\\\' : atom === '-' && index !== 0 ? '\\-' : atom;

  return {freeze, atoms, range};
})();

/** @param {string} inset */
const countInsetQuotes = inset => {
  /** @type {number} */
  let quotes, position;
  position = -1;
  quotes = 0;
  while (position++ < (position = inset.indexOf('>', position))) quotes++;
  return quotes;
};

const MATCHES = Symbol('matches');
const MATCH = Symbol('match');

// /** @param {string} string */
// const upper = string => string.toUpperCase();
// /** @param {string} string */
// const lower = string => string.toLowerCase();

// @ts-check

/** Arrays of isolated characters */
const ranges = {};

/** Strings forms of partial recursive expressions */
const sequences = {};

/** Recursive expressions intended to search for qualified substring */
const matchers = {};

/** Isolated expressions intended to test a qualified string */
const patterns = {};

/** Strings forms of partial isolated expressions */
const partials = {};

{
  ranges.Brackets = atoms.split('()[]');
  ranges.Braces = atoms.split('{}');

   {
    ranges.Inseter = atoms.split('\t >'); // 0=tab 1=space 2=quote
    partials.Inset = range(...ranges.Inseter);
  }

   {
    // NOTE: Ambiguities when testing if `~` is meant for
    //			 fencing or strikethrough here make it harder
    //			 to retain intent and traceablility.
    ranges.FenceMarks = atoms.split('`'); // 0=grave 1=tilde
    partials.BlockFence = Matcher.join(...ranges.FenceMarks.map(fence => Matcher.escape(fence.repeat(3))));
  }

   {
    ranges.ListMarkers = atoms.split('-*'); // 0=square 1=disc
    [ranges.CheckMarks, ranges.LowerCheckMarks, ranges.UpperCheckMarks] = atoms.split.cases(' x-'); // 0=unchecked 1=checked 2=indeterminate
    ranges.NumberingSeparators = atoms.split('.)');
    ranges.ArabicNumbers = atoms.split('0123456789');
    // NOTE: Ambiguities when testing if `i.` is roman or
    //       latin require temporary restrictions in favor
    //       of the more popular latin form.
    //
    //       Only the subset of ['i', 'v', 'x', 'l'] is
    //       used which excludes ['c', 'd', 'm'].
    [ranges.RomanNumerals, ranges.LowerRomanNumerals, ranges.UpperRomanNumerals] = atoms.split.cases('ivxl');
    [ranges.LatinLetters, ranges.LowerLatinLetters, ranges.UpperLatinLetters] = atoms.split.cases(
      'abcdefghijklmnopqrstuvwxyz',
    );

    // Unordered lists are broken into two distinct classes:
    //
    //   NOTE: Markers are not semantically interchangeable
    //
    //   1. Matching Square character (ie `-` per popular notation):
    partials.SquareMark = Matcher.escape(ranges.ListMarkers[0]);
    //
    //   2. Matching Disc character (ie `*` per lesser popular notation):
    partials.DiscMark = Matcher.escape(ranges.ListMarkers[1]);
    //
    //   Unordered mark is the range of Square/Disc characters:
    partials.UnorderedMark = range(...ranges.ListMarkers);

    partials.NumberingSeparator = range(...ranges.NumberingSeparators);

    // Ordered lists are broken into three distinct classes:
    //
    //   NOTE: Ordered markers include both numbering and trailing sparator.
    //
    //   1. Matching Decimal characters (one or more with leading zeros)
    //        NOTE: lookahead is necessary to exclude matching just zero(s)
    partials.ArabicNumbering = Matcher.sequence`(?=${ranges.ArabicNumbers[0]}*${range(
      ...ranges.ArabicNumbers.slice(1),
    )})${range(...ranges.ArabicNumbers)}+`;
    //
    //      Matching Zero-leading Decimal characters (two or more):
    //        NOTE: lookahead is necessary to exclude matching just zero(s)
    partials.ZeroLeadingArabicNumbering = Matcher.sequence`(?=${ranges.ArabicNumbers[0]}*${range(
      ...ranges.ArabicNumbers.slice(1),
    )})${range(...ranges.ArabicNumbers)}{2,}`;
    //
    //      Matching Decimal marker (with any separator):
    partials.ArabicMarker = Matcher.sequence`${partials.ArabicNumbering}${partials.NumberingSeparator}`;
    //
    //      Matching Zero-leading Decimal marker (with any separator):
    partials.ZeroLeadingArabicMarker = Matcher.sequence`${partials.ZeroLeadingArabicNumbering}${partials.NumberingSeparator}`;
    //
    //   2. Matching Latin character (one only)
    partials.LatinNumbering = range(...ranges.LatinLetters);
    partials.LowerLatinNumbering = range(...ranges.LowerLatinLetters);
    partials.UpperLatinNumbering = range(...ranges.UpperLatinLetters);
    //
    //      Matching Latin marker (with any separator):
    partials.LatinMarker = Matcher.sequence`${partials.LatinNumbering}${partials.NumberingSeparator}`;
    partials.LowerLatinMarker = Matcher.sequence`${partials.LowerLatinNumbering}${partials.NumberingSeparator}`;
    partials.UpperLatinMarker = Matcher.sequence`${partials.UpperLatinNumbering}${partials.NumberingSeparator}`;
    //
    //   3. Matching Roman characters (one or more of the premitted subset)
    partials.RomanNumbering = Matcher.sequence`${range(...ranges.RomanNumerals)}+`;
    partials.LowerRomanNumbering = Matcher.sequence`${range(...ranges.LowerRomanNumerals)}+`;
    partials.UpperRomanNumbering = Matcher.sequence`${range(...ranges.UpperRomanNumerals)}+`;
    //
    //      Matching Roman marker (also with trailing "period" separator)
    partials.RomanMarker = Matcher.sequence`${partials.RomanNumbering}\.`;
    partials.LowerRomanMarker = Matcher.sequence`${partials.LowerRomanNumbering}\.`;
    partials.UpperRomanMarker = Matcher.sequence`${partials.UpperRomanNumbering}\.`;
    //
    //   Ordered marker is the union of Decimal/Latin/Roman partials:
    partials.OrderedMarker = Matcher.sequence`${Matcher.join(
      partials.ArabicMarker,
      partials.LatinMarker,
      partials.RomanMarker,
    )}`;

    // Checklists are extensions of unordered lists:
    //
    //   NOTE: Markout adds an additional `[-]` indeterminate state
    //
    //   a. Matching Enclosed character (without any brackets)
    partials.CheckMark = range(...ranges.CheckMarks);
    //
    //   b. Matching Enclosure characters (with enclosing brackets)
    partials.Checkbox = Matcher.sequence`\[${partials.CheckMark}\]`;
    //
    //   Checklist marker is space-separated Unordered marker and Checkbox:
    partials.ChecklistMarker = Matcher.sequence`${partials.UnorderedMark} ${partials.Checkbox}`;

    // Matching list markers is done in two ways:
    //
    //   1. Matching head portion (ie excluding the checkbox)
    partials.ListMarkerHead = Matcher.join(partials.UnorderedMark, partials.OrderedMarker);
    //
    //   2. Matching full marker (ie including the checkbox)
    partials.ListMarker = Matcher.sequence`${Matcher.join(
      partials.ChecklistMarker,
      partials.UnorderedMarker,
      partials.OrderedMarker,
    )}`;

    patterns.DiscMarker = Matcher.sequence`^${partials.DiscMark}(?= (?!${partials.Checkbox})|$)`;
    patterns.SquareMarker = Matcher.sequence`^${partials.SquareMark}(?= (?!${partials.Checkbox})|$)`;
    patterns.UnorderedMarker = Matcher.sequence`^${partials.UnorderedMark}(?= (?!${partials.Checkbox})|$)`;
    patterns.ArabicMarker = Matcher.sequence`^${partials.ArabicMarker}(?= |$)`;
    patterns.LatinMarker = Matcher.sequence`^${partials.LatinMarker}(?= |$)`;
    patterns.RomanMarker = Matcher.sequence`^${partials.RomanMarker}(?= |$)`;
    patterns.OrderedMarker = Matcher.sequence`^${partials.OrderedMarker}(?= |$)`;
    patterns.ChecklistMarker = Matcher.sequence`^${partials.ChecklistMarker}(?= |$)`;

    // There are two groups of list marker expressions:
    sequences.ListMarkerHead = Matcher.sequence`(?:${partials.ListMarkerHead})(?: )`;
    sequences.ListMarker = Matcher.sequence`(?:${Matcher.join(
      Matcher.sequence`(?:${partials.ChecklistMarker} )`,
      Matcher.sequence`(?:${partials.UnorderedMark} )(?!${partials.Checkbox})`,
      Matcher.sequence`(?:${partials.OrderedMarker} )`,
    )})`;

    sequences.NormalizableLists = Matcher.sequence/* regexp */ `
			(?=\n?^(${partials.Inset}*)(?:${sequences.ListMarker}))
			((?:\n?\1
				(?:${sequences.ListMarker}|   ?)+
				[^\n]+
				(?:\n${partials.Inset}*)*
				(?=\n\1|$)
			)+)
		`;

    sequences.NormalizableListItem = Matcher.sequence/* regexp */ `
			^
			(${partials.Inset}*)
			((?:${sequences.ListMarkerHead})|)
			([^\n]+(?:\n\1(?:   ?|\t ?)(?![ \t]|${sequences.ListMarker}).*)*)$
		`;
    matchers.NormalizableLists = new RegExp(sequences.NormalizableLists, 'gmu');
    matchers.NormalizableListItem = new RegExp(sequences.NormalizableListItem, 'gmu');
  }

  // console.log({sequences, ranges, partials});
  // TODO: Document partials and sequences

   {
    sequences.NormalizableBlocks = Matcher.sequence/* regexp */ `
      (?:^|\n)(${partials.Inset}*(?:${partials.BlockFence}))[^]+?(?:(?:\n\1[ \t]*)+\n?|$)
      |(?:^|\n)(${partials.Inset}*)(?:
				<style>[^]+?(?:(?:\n\2</style>[ \t]*)+\n?|$)
				|<script type=module>[^]+?(?:(?:\n\2</script>[ \t]*)+\n?|$)
				|<script>[^]+?(?:(?:\n\2</script>[ \t]*)+\n?|$)
			)
      |([^]+?(?:(?=\n${partials.Inset}*(?:${partials.BlockFence}|<script>|<style>|<script type=module>))|$))
    `;
    matchers.NormalizableBlocks = new RegExp(sequences.NormalizableBlocks, 'g');

    partials.HTMLTagBody = Matcher.sequence/* regexp */ `(?:[^${`"'`}>]+?|".*?"|'.*?')`;

    sequences.HTMLTags = Matcher.sequence/* regexp */ `
			<\/?[A-Za-z]\w*${partials.HTMLTagBody}*?>
			|<\?[^]*?\?>
			|<!--[^]*?-->
			|<!\w[^]>
		`;

    matchers.HTMLTags = new RegExp(sequences.HTMLTags, 'g');

    sequences.NormalizableParagraphs = Matcher.sequence/* regexp */ `
      ^((?:[ \t]*\n(${partials.Inset}*))+)
      ($|(?:
				(?:
					</?(?:span|small|big|kbd)\b${partials.HTMLTagBody}*?>
					|(?!(?:${Matcher.join(
            sequences.HTMLTags,
            // sequences.ListMarker,
          )}))
				)
				[^-#>|~\n].*
        (?:\n${partials.Inset}*$)+
      )+)
    `;
    matchers.NormalizableParagraphs = new RegExp(sequences.NormalizableParagraphs, 'gmu');

    sequences.RewritableParagraphs = Matcher.sequence/* regexp */ `
      ^([ \t]*[^\-\*#>\n].*?)
      (\b.*[^:\n\s>]+|\b)
      [ \t]*\n[ \t>]*?
      (?=(
				</?(?:span|small|big|kbd)\b${partials.HTMLTagBody}*?>[^-#>|~\n].*
        |\b(?!(?:${sequences.HTMLTags}))
        |\[.*?\][^:\n]?
        |[^#${'`'}\[\n]
      ))
    `;

    matchers.RewritableParagraphs = new RegExp(sequences.RewritableParagraphs, 'gmu');

    partials.BlockQuote = Matcher.sequence/* regexp */ `(?:  ?|\t)*>(?:  ?>|\t>)`;

    sequences.NormalizableBlockquotes = Matcher.sequence/* regexp */ `
			(?:((?:^|\n)[ \t]*\n|^)|\n)
			(${partials.BlockQuote}*)
			([ \t]*(?!>).*)
			(?=
				(\n\2${partials.BlockQuote}*)
				|(\n\2)
				|(\n${partials.BlockQuote}*)
				|(\n|$)
			)
		`;

    matchers.NormalizableBlockquotes = new RegExp(sequences.NormalizableBlockquotes, 'g');

    partials.LinkText = Matcher.sequence/* regexp */ `(?:[^\\\]]|\\.)*`;

    // We may need to guard against some special cases like:
    //
    //  - checklists                    (?!\[[- xX]\] )
    //  - eager whitespacing            (?:\[(?=\[\S.*?\S\]\])|!?)
    //
    //    NOTE: Guarding against eager whitespacing also needs
    //    to happen in partials.LinkText: [^\s\n\\].*?[^\s\n\\]
    //

    sequences.NormalizableReferences = Matcher.sequence/* regexp */ `
      \[
			(
				${partials.LinkText}(?=\]\])
				|${partials.LinkText}(?=
					\]\(([^\s\n\\][^\n${Matcher.escape('()[]')}]*?[^\s\n\\]|[^\s\n\\]|)\)
					|\]\[([^\s\n\\][^\n${Matcher.escape('()[]')}]*[^\s\n\\]|)\]
				)
			)\]{1,2}
      (?:\(\2\)|\[\3\]|)
		`;
    // NOTE: Safari seems to struggle with /\S|\s/gmu
    matchers.NormalizableReferences = new RegExp(sequences.NormalizableReferences, 'g');

    sequences.RewritableAliases = Matcher.sequence/* regexp */ `
      ^(${partials.Inset}*)
      \[(\S.*?\S)\]:\s+
      (\S+)(?:
        \s+${'"'}([^\n]*)${'"'}
        |\s+${"'"}([^\n]*)${"'"}
        |
      )\s*$
		`;
    // NOTE: Safari seems to struggle with /\S|\s/gmu
    matchers.RewritableAliases = new RegExp(sequences.RewritableAliases, 'gm');

    sequences.NormalizableLink = Matcher.sequence/* regexp */ `
      \s*((?:\s?[^${`'"`}${Matcher.escape('()[]')}}\s\n]+))
      (?:\s+[${`'"`}]([^\n]*)[${`'"`}]|)
		`; // (?:\s+{([^\n]*)}|)
    // NOTE: Safari seems to struggle with /\S|\s/gmu
    matchers.NormalizableLink = new RegExp(sequences.NormalizableLink);
  }
}

class ComposableList extends Array {
  static create(properties, ...elements) {
    return Object.assign(new ComposableList(...elements), properties);
  }

  toString(
    listInset = this.listInset || '',
    listType = this.listType || 'ul',
    listStyle = this.listStyle,
    listStart = this.listStart,
  ) {
    listStart &&
      typeof listStart !== 'number' &&
      (listStart = `${
        listStyle === 'lower-latin' || listStyle === 'upper-latin'
          ? ComposableList.parseLatin(listStart)
          : listStyle === 'lower-roman' || listStyle === 'upper-roman'
          ? ComposableList.parseRoman(listStart)
          : parseInt(listStart) || ''
      }`);

    const attributes = `${
      // TODO: Explore using type attribute instead
      (listStyle &&
        `style="list-style: ${listStyle}"${(listStyle in ListTypes && ` type="${ListTypes[listStyle]}"`) || ''}`) ||
        ''
    } ${
      // TODO: Check if guard against invalid start is needed
      (listStart && `start="${listStart}"`) || ''
    }`.trim();

    const listRows = [`${listInset}<${listType}${(attributes && ` ${attributes}`) || ''}>`];

    /** @type {import('./block-normalizer.js').MarkoutBlockNormalizer} */
    const normalizer = this.normalizer;

    // .split('\n\n').map(line => `<p>${line}</p>`).join('')
    for (const item of this) {
      if (item && typeof item === 'object') {
        if (item instanceof ComposableList) {
          const last = listRows.length - 1;
          const row = listRows[last];
          last > 0
            ? (listRows[listRows.length - 1] = `${row.slice(0, -5)}\n${item.toString(
                `${listInset}\t\t`,
              )}\n${listInset}\t</li>`)
            : listRows.push(`${listInset}\t<li>\n${item.toString(`${listInset}\t\t`)}\n${listInset}\t</li>`);
          // continue;
        } else {
          const insetText = `${item}`;
          let text = insetText;
          for (const character of listInset) {
            if (!text.startsWith(character)) break;
            text = text.slice(1);
          }
          // if (normalizer) {
          // 	console.log({normalizer, text});
          // 	text = normalizer.normalizeParagraphs(`\n\n${text}`);
          // }
          listRows.push(text);
          // listRows.push(text.replace(/^(.+?)(?=(<\/p>)|<[a-z]+\b|\n+))/, (m, a, b) => (a ? `<p>${a}${b || '</p>'}` : m)));
        }
      } else {
        const [, checked, content] = /^\s*(?:\[([-xX]| )\] |)([^]+?)\s*$/.exec(item);

        content &&
          listRows.push(
            checked
              ? `${listInset}\t<li type=checkbox ${
                  checked === ' ' ? '' : checked === '-' ? 'indeterminate' : ' checked'
                }> ${
                  content
                  // content.replace(/^(.+?)(?=(<\/p>)|<[a-z]+\b))/, (m, a, b) => (a ? `<p>${a}${b || '</p>'}` : m))
                } </li>`
              : `${listInset}\t<li> ${content} </li>`,
          );
      }
    }
    listRows.push(`${listInset}</${listType}>`);
    // console.log(this, {normalizer, listRows});
    return `\n${listRows.join('\n')}\n`;
  }
}

const ChecklistMarker = new RegExp(patterns.ChecklistMarker);
const SquareMarker = new RegExp(patterns.SquareMarker);
const DiscMarker = new RegExp(patterns.DiscMarker);
const ArabicMarker = new RegExp(patterns.ArabicMarker);
const ZeroLeadingArabicMarker = new RegExp(patterns.ZeroLeadingArabicMarker);
const LatinMarker = new RegExp(patterns.LatinMarker);
const RomanMarker = new RegExp(patterns.RomanMarker);
const OrderedMarker = new RegExp(patterns.OrderedMarker);
const UnorderedMarker = new RegExp(patterns.UnorderedMarker);
const ListTypes = {
  'lower-latin': 'a',
  'upper-latin': 'A',
  'lower-roman': 'i',
  'upper-roman': 'I',
  decimal: '1',
  'decimal-leading-zero': '1',
};

 {
  const parseLatin = latin => parseLatin.mappings[latin] || NaN;

  parseLatin.mappings = {};

  'abcdefghijklmnopqrstuvwxyz'.split('').forEach((latin, index) => {
    parseLatin.mappings[(parseLatin.mappings[latin] = parseLatin.mappings[latin.toUpperCase] = index + 1)] = latin;
  });

  ComposableList.parseLatin = parseLatin;
}

 {
  const parseRoman = roman =>
    /[^ivxlcdm]/i.test((roman = String(roman)))
      ? NaN
      : roman
          .toLowerCase()
          .split('')
          .reduce(parseRoman.reducer, 0);
  // prettier-ignore
  parseRoman.mappings = Object.freeze({i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000, 1: 'i', 5: 'v', 10: 'x', 50: 'l', 100: 'c', 500: 'd', 1000: 'm'});

  parseRoman.reducer = (decimal, character, index, characters) =>
    decimal +
    (parseRoman.mappings[character] < parseRoman.mappings[characters[index + 1]]
      ? -parseRoman.mappings[character]
      : parseRoman.mappings[character]);

  ComposableList.parseRoman = parseRoman;
}

ComposableList.ORDERED_STYLE = /^(?:(0+[1-9]\d*)(?=\. )|(\d+)(?=\. )|([ivx]+)(?=\. )|([a-z])(?=[.)] ))|/i;
ComposableList.ORDERED_STYLE.key = ['decimal-leading-zero', 'decimal', 'roman', 'latin'];

ComposableList.orderedStyleOf = (marker, variant, fallback) => {
  const category =
    ComposableList.ORDERED_STYLE.key[
      ComposableList.ORDERED_STYLE.exec(marker)
        .slice(1)
        .findIndex(Boolean)
    ];
  return (
    (category !== undefined &&
      (category === 'latin' || category === 'roman'
        ? `${
            variant === 'lower' || (variant !== 'upper' && marker === marker.toLowerCase()) ? 'lower' : 'upper'
          }-${category}`
        : category === 'decimal'
        ? variant !== 'leading-zero'
          ? 'decimal'
          : 'decimal-leading-zero'
        : variant !== 'decimal'
        ? 'decimal-leading-zero'
        : 'decimal')) ||
    fallback
  );
};

ComposableList.markerIsLike = (marker, expected) =>
  expected in ComposableList.LIKE ? ComposableList.LIKE[expected].test(marker) : undefined;

ComposableList.LIKE = {
  ['square']: SquareMarker,
  ['disc']: DiscMarker,
  ['decimal']: ArabicMarker,
  ['decimal-leading-zero']: ZeroLeadingArabicMarker,
  ['latin']: LatinMarker,
  // NOTE: We allow cases insenstivity as a common convencience feature
  ['lower-latin']: LatinMarker,
  ['upper-latin']: LatinMarker,
  ['roman']: RomanMarker,
  // NOTE: We allow cases insenstivity as a common convencience feature
  ['lower-roman']: RomanMarker,
  ['upper-roman']: RomanMarker,
  ['ol']: OrderedMarker,
  ['ul']: UnorderedMarker,
  ['checkbox']: ChecklistMarker,
};

const {
  /** Attempts to overcome **__** */
  'markout-render-comment-stashing': COMMENT_STASHING = false,
  'markout-render-paragraph-trimming': PARAGRAPH_TRIMMING = true,
} = import.meta;

const generateBlockquotes = (quotesAfter, quotesBefore = 0) => {
  let blockquotes, steps, level;

  steps = quotesAfter - (quotesBefore || 0);

  if (steps < 0) {
    return '</p></blockquote>'.repeat(-steps);
  } else if (steps > 0) {
    blockquotes = new Array(steps);
    for (level = quotesAfter; steps; blockquotes[steps--] = `<blockquote blockquote-level=${level--}><p>`);
    return blockquotes.join('');
  } else {
    return '';
  }
};

class MarkoutBlockNormalizer {
  /**
   * @param {string} sourceText
   * @param {{ aliases?: { [name: string]: alias } }} [state]
   */
  normalizeBlocks(sourceText, state = {}) {
    const {sources = (state.sources = []), [ALIASES]: aliases = (state[ALIASES] = {})} = state;

    const source = {sourceText, [BLOCKS]: [], [ALIASES]: {}};
    sources.push(source);

    // ({body: sourceText, comments: state.comments} = decomment(sourceText));

     {
      const {
        sourceText,
        [BLOCKS]: sourceBlocks,
        [BLOCKS]: {
          [MATCHES]: matchedBlocks = (sourceBlocks[MATCHES] = []),
          [MATCHES]: {
            fenced: fenced = (matchedBlocks.fenced = []),
            embedded: embedded = (matchedBlocks.embedded = []),
            unfenced: unfenced = (matchedBlocks.unfenced = []),
          },
        },
        [ALIASES]: sourceAliases,
        [ALIASES]: {
          [MATCHES]: matchedAliases = (sourceAliases[MATCHES] = []),
          [MATCHES]: {aliased = (matchedAliases.aliased = []), unaliased = (matchedAliases.unaliased = [])},
        },
      } = source;
      let match = (matchers.NormalizableBlocks.lastIndex = null);

      const replaceAlias = (text, indent, alias, href, title, index) => {
        const match = {text, indent, alias, href, title, index};

        // TODO: Figure out anchors: https://www.w3.org/TR/2017/REC-html52-20171214/links.html
        return alias && alias.trim()
          ? (aliased.push((sourceAliases[alias] = aliases[alias] = match)),
            `<a hidden rel="alias" name="${alias}" href="${href}" ref="${href}">${title || ''}</a>`)
          : (unaliased.push(match), text);
      };

      while ((match = matchers.NormalizableBlocks.exec(sourceText))) {
        matchedBlocks.push(([match.text, match.fence, match.inset, match.unfenced] = match));
        if (match.fence) {
          fenced.push(match);
        } else if (match.inset !== undefined) {
          embedded.push(match);
        } else {
          unfenced.push(match);
          match.text = match.text.replace(matchers.RewritableAliases, replaceAlias);
        }
      }

      // console.log(matchedBlocks);
    }

     {
      /** @type {{[BLOCKS]: {[MATCHES]: MatchedBlock[]}}} */
      const {[BLOCKS]: sourceBlocks} = source;
      for (const matchedBlock of sourceBlocks[MATCHES]) {
        sourceBlocks.push(
          matchedBlock.fence !== undefined
            ? this.normalizeFencing(
                matchedBlock.text,
                // Provides the fence
                matchedBlock,
              )
            : matchedBlock.inset !== undefined
            ? matchedBlock.text
            : this.normalizeParagraphs(
                this.normalizeBreaks(
                  this.normalizeLists(
                    this.normalizeBlockquotes(
                      this.normalizeReferences(matchedBlock.text, state),
                      // Provides the inset
                      matchedBlock,
                    ),
                  ),
                ),
              ),
        );
      }
      source.normalizedText = sourceBlocks.join('\n');
      import.meta['debug:markout:block-normalization'] && console.log('normalizeSourceText:', state);
    }

    // source.normalizedText = recomment(source.normalizedText, state.comments);

    return source.normalizedText;
  }

  /** @param {string} sourceText @param {MatchedBlock} matchedBlock */
  normalizeFencing(sourceText, matchedBlock) {
    // const debugging = true;
    const inset = sourceText.slice(0, sourceText.indexOf('```'));
    // debugging && console.log('normalizeFencing', {sourceText, inset, matchedBlock});
    if (inset.trim() === '') return sourceText;
    const quotesBefore = countInsetQuotes(inset);
    const Inset = new RegExp(`${escape$1(inset.trimRight())}(?:  ?|\t|(?=\n|$))`, 'g');
    // debugging && console.log('normalizeFencing', {sourceText, inset, matchedBlock});
    const normalized = sourceText.replace(/```\S*/, `$& blockquote-level=${quotesBefore}`).replace(Inset, '\n');
    return normalized;
  }

  /** @param {string} sourceText @param {MatchedBlock} matchedBlock */
  normalizeBlockquotes(sourceText, matchedBlock) {

    matchers.NormalizableBlockquotes.lastIndex = 0;
    sourceText = sourceText.replace(
      matchers.NormalizableBlockquotes,
      (matched, leader, quote, quoted, inquote, requote, dequote, unquote, index, sourceText) => {
        let before, after;
        if (quote === undefined) return matched;

        const quotesBefore = countInsetQuotes(quote);
        const indent = quote.slice(0, quote.indexOf('>'));
        const quotesAfter =
          unquote !== undefined
            ? 0
            : requote !== undefined
            ? quotesBefore
            : inquote !== undefined
            ? countInsetQuotes(inquote)
            : dequote !== undefined
            ? countInsetQuotes(dequote)
            : quotesBefore;

        before = leader !== undefined ? `${leader}${indent}${generateBlockquotes(quotesBefore, 0)}` : `\n${indent}`;

        after = generateBlockquotes(quotesAfter, quotesBefore);

        const replaced = `${before}${quoted.trimLeft()}${after ? `\n${indent}${after}` : ''}`;
        return replaced;
      },
    );

    return sourceText;
  }

  /**
   * @param {string} sourceText
   * @param {{ aliases?: { [name: string]: alias } }} [state]
   */
  normalizeReferences(sourceText, state = {}) {
    const debugging = import.meta['debug:markout:anchor-normalization'];
    const {aliases = (state.aliases = {})} = state;

    return sourceText.replace(matchers.NormalizableReferences, (m, text, link, alias, index) => {
      const reference = alias
        ? (alias = alias.trim())
        : link !== undefined
        ? (link = (link && link.trim()) || '')
        : text
        ? (alias = text)
        : undefined;

      // console.log('reference — %O ', {m, text, link, alias, index, reference, aliases});

      if (reference !== undefined) {
        let href, title, match;
        // debugging && console.log(m, {text, link, alias, reference, index});
        if (link) {
          [, href, title] = match = matchers.NormalizableLink.exec(link);
        } else if (alias && alias in aliases) {
          ({href, title} = match = aliases[alias]);
        }

        debugging && console.log('debug:markout:anchor-normalization — %O ', {m, text, link, alias, match});

        if (m[0] === '!') {
          return ` <img${href ? ` src="${encodeURI(href)}"` : ''}${
            text || title ? ` title="${text || title}"` : ''
          }${(alias && ` alias="${alias}"`) || ''} />`;
        } else {
          text = text || encodeEntities(href);
          return ` <a${href ? ` href="${href}"` : ''}${title ? ` title="${title}"` : ''}${(alias &&
            ` alias="${alias}"`) ||
            ''}>${text || reference}</a>`;
        }
      }
      return m;
    });
  }

  /** @param {string} sourceText */
  normalizeLists(sourceText) {
    const listProperties = {normalizer: this};
    return sourceText.replace(matchers.NormalizableLists, (m, feed, body) => {
      let match, indent;
      indent = feed.slice(1);
      let top = ComposableList.create(listProperties);
      let list = top;
      const lists = [top];
      matchers.NormalizableListItem.lastIndex = 0;
      while ((match = matchers.NormalizableListItem.exec(m))) {
        let [text, matchedInset, matchedMarker, matchedLine] = match;
        let like;
        if (!matchedLine.trim()) continue;

        // console.log(text, {matchedInset, matchedMarker, matchedLine});

        if (matchedMarker) {
          let depth = matchedInset.length;
          if (depth > list.listDepth) {
            const parent = list;
            list.push((list = ComposableList.create(listProperties)));
            list.parent = parent;
          } else if (depth < list.listDepth) {
            while ((list = list.parent) && depth < list.listDepth);
          } else if ('listStyle' in list && !(like = ComposableList.markerIsLike(matchedMarker, list.listStyle))) {
            const parent = list.parent;
            ((list = ComposableList.create(listProperties)).parent = parent)
              ? parent.push(list)
              : lists.push((top = list));
          } else if (depth !== list.listDepth && list.listDepth !== undefined) ;

          // console.log(text, [matchedMarker, list.listStyle, like]);

          if (!list)
            // debugger;
            break;

          'listInset' in list ||
            ((list.listInset = matchedInset),
            (list.listDepth = depth),
            (list.listType =
              matchedMarker[0] === '*' || matchedMarker[0] === '-'
                ? 'ul'
                : ((list.listStart = matchedMarker.replace(/\W/g, '')), 'ol')));

          'listStyle' in list ||
            (list.listStyle =
              (list.listType === 'ul' && ((matchedMarker[0] === '*' && 'disc') || 'square')) ||
              ComposableList.orderedStyleOf(matchedMarker));

          matchedLine = matchedLine.replace(/[ \t]*\n[> \t]*/g, ' ');
          list.push(matchedMarker[2] === '[' ? `${matchedMarker.slice(2)}${matchedLine}` : matchedLine);
        } else {
          if (list.length) {
            const index = list.length - 1;
            list[index] += `<p>${matchedLine}</p>`;
          } else {
            list.push(new String(m));
          }
        }
      }

      return lists.map(list => list.toString(indent)).join('\n');
    });
  }

  /** @param {string} sourceText */
  normalizeParagraphs(sourceText) {
    sourceText = sourceText.replace(matchers.NormalizableParagraphs, (m, feed, inset, body) => {
      let paragraphs, comments;

      COMMENT_STASHING && ({body, comments} = decomment(body));

      paragraphs = body
        .trim()
        .split(/^(?:[> \t]*\n)+[> \t]*/m)
        .filter(isNotBlank);

      import.meta['debug:markout:paragraph-normalization'] &&
        console.log('normalizeParagraphs:', {m, feed, inset, body, paragraphs});

      body = `${feed}<p> ${paragraphs.join(` </p>\n${inset}<p> `)} </p>\n`;

      COMMENT_STASHING && (body = recomment(body, comments));

      return body;
    });

    PARAGRAPH_TRIMMING && (sourceText = sourceText.replace(/<p>[\s\n]*<\/p>/g, ''));

    return sourceText;
  }

  normalizeBreaks(sourceText) {
    return sourceText.replace(matchers.RewritableParagraphs, (m, a, b, c, index, sourceText) => {
      import.meta['debug:markout:break-normalization'] &&
        console.log('normalizeBreaks:\n\t%o%o\u23CE%o [%o]', a, b, c, index);
      return `${a}${b} `;
    });
  }
}

// export const MATCHES = Symbol('matches');
const ALIASES = 'aliases';
const BLOCKS = 'blocks';

const decomment = body => {
  const comments = [];
  body = body.replace(/<!--[^]+-->/g, comment => `<!--${comments.push(comment)}!-->`);
  return {body, comments};
};

const recomment = (body, comments) => {
  return body.replace(
    new RegExp(`<!--(${comments.map((comment, i) => comments.length - i).join('|')})!-->`, 'g'),
    (comment, index) => comments[index] || '<!---->',
  );
};

const isNotBlank = text => typeof text === 'string' && !(text === '' || text.trim() === '');

/** @template {string} T @typedef {Partial<Record<T, string>>} MatchedRecord */
/** @typedef {MatchedRecord<'text'|'fence'|'inset'|'unfenced'>} MatchedBlockRecord */
/** @typedef {RegExpExecArray & MatchedBlockRecord} MatchedBlock */

//@ts-check

/** Segmenter for sub-match captures */
class SegmentMatcher extends Matcher {
  /**
   * @param {MatcherPattern} pattern
   * @param {MatcherFlags} [flags]
   * @param {MatcherEntities} [entities]
   * @param {{}} [state]
   */
  constructor(pattern, flags, entities, state) {
    //@ts-ignore
    super(pattern, flags, entities, state);
    this.captureEntity = this.captureEntity;
  }
  /**
   * @template {MatcherMatch} T
   * @param {string} text
   * @param {number} capture
   * @param {T} match
   * @returns {T}
   */
  captureEntity(text, capture, match) {
    if (capture === 0) return void (match.capture = {});
    if (text === undefined) return;
    const index = capture - 1;
    const {
      entities: {[index]: entity, meta, identities},
      state,
    } = this;
    // entity === INSET ||
    // entity === LOOKAHEAD ||
    // entity === Matcher.DELIMITER ||
    // entity === Matcher.UNKNOWN ||
    // debugger;
    if (!entity) return;

    if (typeof entity === 'function') {
      match.entity = index;
      entity(text, capture, match, state);
      return;
    }

    if (meta.has(entity)) {
      // match.entity || (match.entity = index);
      match.meta = `${(match.meta && `${match.meta} `) || ''}${/** @type {string} */ (entity)}`;
    } else if (identities.has(entity) && match.identity == null) {
      match.entity = index;
      match.identity = entity;
    }
    match.capture[/** @type {MatcherNamedEntity} */ (entity)] = text;
  }

  /** @param {MatcherExecArray} match */
  capture(match) {
    if (match === null) return null;

    match.matcher = this;
    match.capture = {};

    match &&
      (match.forEach(this.captureEntity || SegmentMatcher.prototype.captureEntity, this),
      match.identity ||
        (match.capture[
          (/** @type {MatcherMatch} */(match)).identity = this.UNKNOWN || Matcher.UNKNOWN // prettier-ignore
        ] = match[0]));

    return match;
  }

  async debug(options) {
    const job = {options, ...options};
    try {
      job.timestamp = `?${encodeURIComponent(Date.now())}`;
      job.location =
        (typeof globalThis === 'object' &&
          globalThis &&
          globalThis.location != null &&
          typeof globalThis.location === 'object' &&
          globalThis.location &&
          globalThis.location.href) ||
        /\/(?:node_modules\/(?:@.+?\/|)|)(?:Markdown\/|)lib\/.*$/[Symbol.replace](import.meta.url, '/');
      if (job.specifier != null) {
        job.sourceText = null;
        job.url = new URL(job.specifier, job.location);
        job.response = await (job.request = fetch(job.url));
        if (!job.response.ok) throw Error(`Failed to fetch ${job.url}`);
        job.sourceText = await job.response.text();
      }
      job.sourceText === null ||
        /** @type {import('./debug.js')} */ (await import('./debug.js')).debugMatcher(
          this, // SegmentMatcher.prototype,
          job.sourceText,
          (job.debugging = {}),
        );
    } catch (exception) {
      throw (job.error = (exception.stack, exception));
    } finally {
      console.group('%o', job);
      if (job.error) console.warn(job.error);
      console.groupEnd();
    }
  }
}

const {
  /** Identity for delimiter captures (like newlines) */
  INSET = (SegmentMatcher.INSET = SegmentMatcher.prototype.INSET = /** @type {MatcherIdentityString} */ ('INSET?')),
  /** Identity for unknown captures */
  LOOKAHEAD = (SegmentMatcher.LOOKAHEAD = SegmentMatcher.prototype.LOOKAHEAD =
    /** @type {MatcherIdentityString} */ ('LOOKAHEAD?')),
} = SegmentMatcher;

// await (SegmentMatcher.prototype.debug['implementation'] ||
//   (SegmentMatcher.prototype.debug['implementation'] = import(
//     // TODO: Find a better way to resolve matcher/lib/debug.js
//     '/markup/packages/matcher/lib/debug.js'
//   ).catch(exception => {
//     console.warn(exception);
//     return new Proxy(Object.seal(Object.freeze(() => {})), {
//       get() {
//         return arguments[0];
//       },
//       apply: Reflect.apply.bind(console.warn, null, [exception], undefined),
//     });
//   })))

// @ts-check

const MarkdownSegmenter = (() => {
  // SEE: https://github.github.com/gfm/#tables-extension-
  const MarkdownLists = SegmentMatcher.sequence/* regexp */ `
		[-*]
		|[1-9]+\d*\.
		|[ivx]+\.
		|[a-z]\.
	`;
  const MarkdownMatter = SegmentMatcher.sequence/* regexp */ `
		---(?=\n.+)(?:\n.*)+?\n---
	`;
  const MarkdownStub = SegmentMatcher.sequence/* regexp */ `
		<!--[^]*?-->
		|<!.*?>|<\?.*?\?>
		|<%.*?%>
		|<(?:\b|\/).*(?:\b|\/)>.*
	`;
  const MarkdownStart = SegmentMatcher.sequence/* regexp */ `
		(?:
			[^#${'`'}~<>|\n\s]
			|${'`'}{1,2}(?!${'`'})
			|~{1, 2}(?!~)
		)
	`;
  // (?!(?:${MarkdownLists}) )

  const MarkdownLine = SegmentMatcher.sequence/* regexp */ `
		(?!(?:${MarkdownLists}) )
		(?:${MarkdownStart})
		(?:${MarkdownStub}|.*)*$
	`;
  const MarkdownDivider = SegmentMatcher.sequence/* regexp */ `
		-{2,}
		|={2,}
		|\*{2,}
		|(?:- ){2,}-
		|(?:= ){2,}=
		|(?:\* ){2,}\*
	`;
  const MarkdownATXStyleHeading = SegmentMatcher.sequence/* regexp */ `
		#{1,6}(?= +\S)
	`;
  const MarkdownSetextHeading = SegmentMatcher.sequence/* regexp */ `
		${MarkdownStart}.*\n(?=
			\2\={3,}\n
			|\2\-{3,}\n
		)
	`;

  return /** @type {SegmentMatcher} */ (SegmentMatcher.define(
    entity => SegmentMatcher.sequence/* regexp */ `^
		  (?:
		    ${entity(UNKNOWN)}(${MarkdownMatter}$|[ \t]*(?:${MarkdownStub})[ \t]*$)|
		    (?:
		      ${entity(INSET)}((?:  |\t)*?(?:> ?)*?(?:> ?| *))
		      (?:
		        ${entity('fence')}(?:(${'```'}|~~~)(?=.*\n)[^]*?\n\2\3.*$)|
		        ${entity('heading')}(?:(${MarkdownATXStyleHeading}|${MarkdownSetextHeading}).*$)|
		        ${entity('list')}(?:(${MarkdownLists}) +${MarkdownLine}(?:\n\2 {2,4}${MarkdownLine})*$)|
		        ${entity('alias')}(?:(\[.+?\]: .+)$)|
		        ${entity('divider')}(?:(${MarkdownDivider})$)|
		        ${entity('feed')}(?:([ \t]*(?:\n\2[ \t])*)$)|
						${entity('table')}(
							[|](?=[ :-]).+[|]$(?:\n\2[|].+[|]$)+|
							[^|\n]*?\|[^|\n].*$(?:\n\2[^|\n]*?\|[^|\n].*$)+
						)|
		        ${entity('paragraph')}(?:(${MarkdownLine}(?:\n\2 {0,2}${MarkdownLine})*)$)
		      )|
		      ${entity(UNKNOWN)}(.+?$)
		    )
		  )(?=${entity(LOOKAHEAD)}(\n?^.*$)?)
		`,
    'gmi',
  ));
})();

typeof globalThis !== 'object' ||
  !globalThis ||
  (globalThis.$md = (specifier = '/markout/examples/markdown-testsuite.md') =>
    MarkdownSegmenter.debug({specifier, matcher: MarkdownSegmenter}));

// @ts-check

/** @template T @param {T} pairs @returns {Readonly<T>} */
const Enum = pairs => Object.freeze(Object.setPrototypeOf(Enum.reflect({...pairs}), null));

/** @template T @param {T} pairs @returns {T & {[K in PropertyKey & T[keyof T]]?: PropertyKey}} */
Enum.reflect = pairs => {
	/** @type {{[K in PropertyKey & T[keyof T]]?: {value: K}}} */
	const descriptors = {};
	for (const [key, value] of Object.entries(pairs))
		if (typeof value === 'string' || typeof value === 'number' || typeof value === 'symbol')
			descriptors[value] = {value: key, enumerable: false};
	Object.defineProperties(pairs, descriptors);

	return pairs;
};

/** @param {string} context @param {object} meta @param {(string | boolean)[]} [flags] */
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
	);

/** @type {(text: string, matcher: RegExp | string) => IterableIterator<RegExpExecArray>} */
const matchAll$1 = Function.call.bind(
	String.prototype.matchAll ||
		{
			/**
			 * @this {string}
			 * @param {RegExp | string} pattern
			 */
			*matchAll() {
				const matcher = arguments[0] && (arguments[0] instanceof RegExp ? arguments[0] : RegExp(arguments[0], 'g'));
				const string = String(this);
				for (
					let match, lastIndex = -1;
					lastIndex <
					// (((arguments[0].lastIndex = lastIndex > -1 ? lastIndex : null), (match = next()))
					(((matcher.lastIndex = lastIndex > -1 ? lastIndex + 1 : null), (match = matcher.exec(string)))
						? (lastIndex = matcher.lastIndex)
						: lastIndex);
					yield match
				);
			},
		}.matchAll,
);

/** @param {string} string */
const normalizeString = string => Object.keys({[string]: true})[0];

class MarkoutSegmentNormalizer extends MarkoutBlockNormalizer {
  /**
   * @param {string} sourceText
   * @param {{ sources?: *, aliases?: { [name: string]: * }, segments?: DocumentFragment }} [state]
   */
  normalizeSegments(sourceText, state = {}) {
    const debugging = import.meta['debug:markout:segment-normalization'];
    try {
      state.sources || (state.sources = []);
      state.aliases || (state.aliases = {});
      state[SEGMENTS] || (state[SEGMENTS] = []);

      // TODO: Implement Markout's Matcher-based segment normalization
      // setTimeout(() => this.debugSegments(sourceText), 5000);
      if (debugging) {
        this.normalizeMarkdownSegments(sourceText, state);
        setTimeout(() => console.log(state));
      }

      return this.normalizeBlocks(sourceText, state);
    } finally {
      // @ts-ignore
      import.meta['debug:markout:segment-normalization'] && console.log('normalizeSegments:', state);
    }
  }

  normalizeMarkdownSegments(sourceText, state) {
    const {
      [SEGMENTS]: segments = (state[SEGMENTS] = []),
      [SEGMENTS]: {[MATCHES]: matches = (state[SEGMENTS][MATCHES] = [])},
    } = state;
    for (const match of MarkdownSegmenter.matchAll(sourceText)) {
      const {
        0: text,
        identity,
        capture: {[MarkdownSegmenter.INSET]: inset},
      } = match;
      const segment = {identity, text, inset, [MATCH]: match};
      if (identity === 'table') {
        this.normalizeMarkdownTableSegment(segment);
        if (segment.identity === 'table') {
          (state[TABLES] || (state[TABLES] = [])).push(segment);
        }
      }
      segments.push(segment);
      matches.push(match);
    }
  }

  normalizeMarkdownTableSegment(segment) {
    const {text, inset} = segment;
    segment.lines = `\n${text}`.split(`\n${inset}`).slice(1);
    segment.rows = [];
    for (const text of segment.lines) {
      const cells = text.replace(/^\s*(?:\|\s*)?|(?:\|\s*)?\s*$/g, '').split(/\s*\|\s*/);
      cells.text = text;
      cells.inset = inset;
      if (segment.rows.length === 1 && !/[^-|: \t]/.test(text)) {
        segment.rows.header = segment.rows[0];
        segment.rows.format = cells;
      } else {
        cells.row = segment.rows.push(cells);
      }
    }
  }

  async debugSegments(sourceText, options) {
    MarkdownSegmenter.debug({...options, sourceText});
    // (await import('/markout/lib/markdown/markdown-segmenter.js')).MarkdownSegmenter.debug({sourceText});
  }
}

const SEGMENTS = 'segments';
const TABLES = 'tables';

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

const DOM_MUTATIONS = undefined;
const BREAK_NORMALIZATION = undefined;
const HEADING_NORMALIZATION = true;
const PARAGRAPH_NORMALIZATION = true;
const BLOCK_PARAGRAPH_NORMALIZATION = true;
const LIST_PARAGRAPH_NORMALIZATION = true;
const CHECKLIST_NORMALIZATION = true;
const BLOCKQUOTE_NORMALIZATION = true;
const BLOCKQUOTE_HEADING_NORMALIZATION = true;
const TOKEN_FLATTENING = true;
const DECLARATIVE_STYLING = true;
const SOURCE_TEXT_RENDERING = true;
const ASSET_REMAPPING = true;
const ASSET_INITIALIZATION = true;

var flags = /*#__PURE__*/Object.freeze({
  __proto__: null,
  DOM_MUTATIONS: DOM_MUTATIONS,
  BREAK_NORMALIZATION: BREAK_NORMALIZATION,
  HEADING_NORMALIZATION: HEADING_NORMALIZATION,
  PARAGRAPH_NORMALIZATION: PARAGRAPH_NORMALIZATION,
  BLOCK_PARAGRAPH_NORMALIZATION: BLOCK_PARAGRAPH_NORMALIZATION,
  LIST_PARAGRAPH_NORMALIZATION: LIST_PARAGRAPH_NORMALIZATION,
  CHECKLIST_NORMALIZATION: CHECKLIST_NORMALIZATION,
  BLOCKQUOTE_NORMALIZATION: BLOCKQUOTE_NORMALIZATION,
  BLOCKQUOTE_HEADING_NORMALIZATION: BLOCKQUOTE_HEADING_NORMALIZATION,
  TOKEN_FLATTENING: TOKEN_FLATTENING,
  DECLARATIVE_STYLING: DECLARATIVE_STYLING,
  SOURCE_TEXT_RENDERING: SOURCE_TEXT_RENDERING,
  ASSET_REMAPPING: ASSET_REMAPPING,
  ASSET_INITIALIZATION: ASSET_INITIALIZATION
});



var defaults = /*#__PURE__*/Object.freeze({
  __proto__: null,
  flags: flags
});

// @ts-check

// @ts-ignore
const content = /** @type {import('./content').content} */ ({});

Object.setPrototypeOf(content, null);

content.matchers = {};
content.symbols = {};
content.selectors = {};
content.defaults = defaults;

// @ts-check

const MarkupAttributeMap = Enum({
  SourceType: 'source-type',
  MarkupMode: 'markup-mode',
  MarkupSyntax: 'markup-syntax',
});

/**
 * @param {Partial<{element: HTMLElement, sourceType: string, sourceText: String}>} options
 * @returns {Promise<HTMLElement>}
 */
const renderSourceText = async options => {
  let element, sourceType, sourceText, state;

  if (
    !options ||
    typeof options !== 'object' ||
    (({element, sourceType, sourceText, ...options} = options),
    !(element
      ? !element.hasAttribute(content.MarkupAttributeMap.MarkupSyntax) &&
        (sourceType ||
          (sourceType =
            element.getAttribute(content.MarkupAttributeMap.MarkupMode) ||
            element.getAttribute(content.MarkupAttributeMap.SourceType)),
        sourceText || (sourceText = element.textContent || ''))
      : sourceText))
  )
    return void console.warn('Aborted: renderSourceText(%o => %o)', options, {element, sourceType, sourceText});

  element != null
    ? element.removeAttribute(content.MarkupAttributeMap.SourceType)
    : ((element = document.createElement('pre')).className = 'markup code');

  state = element['(markup)'] = {
    element,
    sourceText,
    sourceType,
    fragment: document.createDocumentFragment(),
    parsingGoal:
      (/^(js|javascript|es|ecmascript)$/i.test(sourceType) &&
        (element.matches('[script=module], [module]') ? 'module' : element.matches('[script]') ? 'script' : 'code')) ||
      undefined,
  };

  // TODO: Implement proper out-of-band handling for js versus es modes
  state.parsingGoal === 'module' && (state.sourceType = sourceType = 'es');

  element.setAttribute(content.MarkupAttributeMap.MarkupSyntax, state.sourceType);
  element.textContent = '';
  element.sourceText = sourceText;

  // @ts-ignore
  await render$1(sourceText, state);
  element.appendChild(state.fragment);

  return element;
};

content.MarkupAttributeMap = MarkupAttributeMap;
content.renderSourceText = renderSourceText;

// import {tokenize as tokenizeMarkup, encodeEntities, encodeEntity} from './markup.js';

/** @type {any} */
const {
  // Attempts to overcome **__**
  'markout-render-span-restacking': SPAN_RESTACKING = true,
  'markout-render-newline-consolidation': NEWLINE_CONSOLIDATION = false,
  // Patched regression from changing markdown.FRAGMENTS
  //   to /[^\\\n\s\[\]\(\)\<\>&`"*~_]+?/ which has been reversed
  'markout-render-patch-stray-brace': STRAY_BRACE = false,
  'markout-render-url-expansion': URL_EXPANSION = true,
} = import.meta;

const normalize = sourceText => {
  const {normalizer = (normalize.normalizer = new MarkoutNormalizer())} = normalize;
  return normalizer.normalizeSourceText(sourceText);
};

const render = tokens => {
  const {
    lookups = (render.lookups = createLookups()),
    renderer = (render.renderer = new MarkoutRenderer({lookups})),
  } = render;
  return renderer.renderTokens(tokens);
};

const tokenize = sourceText => tokenize$1(`${sourceText.trim()}\n}`, {sourceType: 'markdown'});

const encodeEscapedEntities = ((Escapes, replace) => text => text.replace(Escapes, replace))(
  /\\([*^~`_])(\1|)/g,
  (m, e, e2) => (e2 ? encodeEntity(e).repeat(2) : encodeEntity(e)),
);

const FencedBlockHeader = /^(?:(\w+)(?:\s+(.*?)\s*|)$|)/m;

const {URLScheme, URLPrefix, URLString} = {
  URLScheme: /^https?:|HTTPS?:|[a-z]{2,}[-+.0-9a-z]*\b:|[A-Z]{2,}[-+.0-9A-Z]*\b:/,
  URLPrefix: /^(?:https?:|HTTPS?:|[a-z]{2,}[-+.0-9a-z]*\b:|[A-Z]{2,}[-+.0-9A-Z]*\b:)\/\/\S+$|^(?:[A-Za-z][!%\-0-9A-Z_a-z~]+\.)+(?:[a-z]{2,5}|[A-Z]{2,5})(?:\/\S*|)$/u,
  URLString: /^\s*(?:(?:https?:|HTTPS?:|[a-z]{2,}[-+.0-9a-z]*\b:|[A-Z]{2,}[-+.0-9A-Z]*\b:)\/\/\S+|(?:[A-Za-z][!%\-0-9A-Z_a-z~]+\.)+(?:[a-z]{2,5}|[A-Z]{2,5})\/\S*?)(?:[?][^\s(){}\[\]]*?|)(?:[#][^\s(){}\[\]]*?|)\s*$/u,
};

const SPAN = 'span';

class MarkoutRenderingContext {
  constructor(renderer) {
    ({lookups: this.lookups} = this.renderer = renderer);

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
  constructor({lookups = createLookups()} = {}) {
    this.lookups = lookups;
  }

  renderBlockTokens(token, context) {
    let before, tag, body, previous, inset;
    previous = token;
    inset = '';
    const {classes, block} = context;
    while ((previous = previous.previous)) {
      if (previous.lineBreaks) break;
      inset = `${previous.text}${inset}`;
    }
    if (!/[^> \t]/.test(inset)) {
      before = `<${block}${this.renderClasses(classes)}>`;
      tag = 'tt';
      classes.push('opener', `${token.type}-token`);
    } else {
      body = token.text;
    }
    return {before, tag, body};
  }

  // renderCommentToken(token, context) {}

  encodeURL(url) {
    return `${url}`.replace(/[\\"]/g, encodeURIComponent);
  }

  renderTokens(tokens, context = new MarkoutRenderingContext(this)) {
    let text, type, punctuator, lineBreaks, hint, previous, body, tag, classes, before, after, meta;
    context.tokens = tokens;

    const {lookups} = context;
    const {renderClasses} = this;

    // context.openTags = 0;
    context.openTags = [];
    context.closeTags = [];

    for (const token of context.tokens) {
      if (!token || !(body = token.text)) continue;
      ({text, type = 'text', punctuator, lineBreaks, hint = 'text', previous} = token);

      // Sub type 'text' to 'whitespace'
      // TODO: Sub type 'text' to 'break' (ie !!lineBreaks)
      type !== 'text' || lineBreaks || text.trim() || (type = 'whitespace');

      tag = classes = before = after = meta = undefined;

      if (context.passthru || context.fenced) {
        if (context.fenced) {
          if (context.fenced === context.passthru) {
            context.header += text;
            lineBreaks && ((context.header = context.header.trimRight()), (context.passthru = ''));
          } else if (punctuator === 'closer' && text === '```') {
            let sourceType, sourceAttributes;
            if (context.header) {
              [, sourceType = 'markup', sourceAttributes] = FencedBlockHeader.exec(context.header);
              import.meta['debug:fenced-block-header-rendering'] &&
                console.log('fenced-block-header', {
                  fenced: context.fenced,
                  header: context.header,
                  passthru: context.passthru,
                  sourceType,
                  sourceAttributes,
                  context,
                });
              sourceAttributes = `${sourceAttributes ? `${sourceAttributes} ` : ''}data-markout-fence="${
                context.fenced
              }" data-markout-header="${encodeEntities(context.header)}" tab-index=-1`;
            } else {
              sourceAttributes = `data-markout-fence="${context.fenced}"`;
            }
            // passthru rendered code
            context.renderedText += `<${context.block} class="markup code" ${
              content.MarkupAttributeMap.SourceType
            }="${sourceType || 'markup'}"${(sourceAttributes && ` ${sourceAttributes}`) || ''}>${encodeEntities(
              context.passthru,
            )}</${context.block}>`;
            context.header = context.indent = context.fenced = context.passthru = '';
          } else {
            // passthru code
            context.passthru += body.replace(context.indent, '');
          }
          continue;
        } else if (context.url) {
          if (type === 'text' || /^[~=?#&:]/.test(text)) {
            context.passthru += text;
            continue;
          }
          if (URLString.test(context.passthru)) {
            [before, context.url, after] = context.passthru.split(/(\S+?(?=(\.?\s*$|$)))/);
            // context.url && console.log(context.url, {text, token, before, context, after});
            context.renderedText += `${before}<span href="${this.encodeURL(
              URLScheme.test(context.url) ? context.url : `https://${context.url}`,
            )}"><samp class=url>${context.url}</samp></span>${after}`;
            before = after = undefined;
          } else {
            context.renderedText += context.passthru;
          }
          context.url = context.passthru = '';
        } else {
          // Construct open and close tags
          if (context.currentTag) {
            // if (
            // 	punctuator === 'closer' &&
            // 	(body === '>' || body === '/>') &&
            // 	context.currentTag !== undefined &&
            // 	context.currentTag.opener !== undefined
            // ) {
            // 	debugTagOpenerPassthru(token, context, {
            // 		scope: {text, type, punctuator, lineBreaks, hint, previous, body, tag, classes, before, after, meta},
            // 	});
            // }

            // Construct body
            context.passthru += body;

            if (context.currentTag.nodeName === '') {
              if (type === 'text' || text === '-' || text === ':') {
                context.currentTag.construct += text;
              } else if (context.currentTag.construct === '') {
                context.currentTag.nodeName = ' ';
                context.currentTag.construct = text;
              } else {
                context.currentTag.nodeName = context.currentTag.construct;
                // Substitute element name from lookup
                context.currentTag.nodeName in lookups.elements &&
                  (context.passthru = context.passthru.replace(
                    context.currentTag.nodeName,
                    (context.currentTag.nodeName = lookups.elements[context.currentTag.nodeName]),
                  ));
              }
            } else {
              context.currentTag.construct = text;
              // console.log(text, {...context});
            }
          } else {
            // console.log(text, {...context});
            // Construct body
            context.passthru += body;
          }
          if (punctuator === 'closer' || (context.comment && punctuator === 'comment')) {
            // passthru body rendered
            context.renderedText += context.passthru;
            context.passthru = '';
          }
          continue;
        }
      }

      tag = SPAN;
      classes = context.classes = hint.split(/\s+/);

      if (hint.includes('-in-markdown')) {
        context.renderedText += token.text;
        continue;
      } else if (hint === 'markdown' || hint.startsWith('markdown ') || hint.includes('in-markdown')) {
        type !== 'text' || lineBreaks || (text in lookups.entities && (body = lookups.entities[text]));

        if (punctuator) {
          context.passthru =
            (((context.comment = punctuator === 'comment' && text) || lookups.tags.has(text)) && text) || '';
          // Opener
          if (punctuator === 'opener') {
            if (text === '<') {
              context.openTags.push(
                (context.currentTag = {opener: token, delimiter: text, construct: '', nodeName: ''}),
              );
            } else if (text === '</') {
              context.closeTags.push(
                (context.currentTag = {closer: token, delimiter: text, construct: '', nodeName: ''}),
              );
            }
          } else if (punctuator === 'closer') {
            context.currentTag = undefined;
          }
          if (context.passthru) continue;

          if (punctuator === 'opener') {
            if ((context.fenced = text === '```' && text)) {
              context.block = 'pre';
              context.passthru = context.fenced;
              [context.indent = ''] = /^[ \t]*/gm.exec(previous.text);
              context.indent && (context.indent = new RegExp(String.raw`^${context.indent}`, 'mg'));
              context.header = '';
              continue;
            } else if (text in lookups.spans) {
              if (SPAN_RESTACKING && (before = context.stack.open(text, body, classes)) === undefined) continue;
              before || ((before = `<${lookups.spans[text]}${renderClasses(classes)}>`), classes.push('opener'));
            } else if (text === '<!' || text === '<?') {
              let next;
              const closer = text === '<!' ? /-->$/ : /\?>$/;
              while (
                (next = context.tokens.next().value) &&
                (body += next.text) &&
                next.punctuator !== 'closer' &&
                !closer.test(next.text)
                // (next.punctuator === 'opener' && /^</.test(next.text)) ||
              );
              context.passthru = body;
              continue;
            }
          } else if (punctuator === 'closer') {
            if (text === '```') {
              context.block = lookups.blocks['```'] || 'pre';
            } else if (text in lookups.spans) {
              if (SPAN_RESTACKING && (after = context.stack.close(text, body, classes)) === undefined) continue;
              after || ((after = `</${lookups.spans[text]}>`), classes.push('closer'));
            }
          } else if (SPAN_RESTACKING && text in lookups.spans) {
            if (
              (context.stack[text] >= 0
                ? (after = context.stack.close(text, body, classes))
                : (before = context.stack.open(text, body, classes))) === undefined
            )
              continue;
          } else if (!context.block && (context.block = lookups.blocks[text])) {
            ({before = before, tag = tag, body = body} = this.renderBlockTokens(token, context));
          }
          (before || after) && (tag = 'tt');
          classes.push(`${punctuator}-token`);
        } else {
          if (
            URL_EXPANSION &&
            type === 'text' &&
            tag === SPAN &&
            before === after &&
            before === undefined &&
            URLPrefix.test(text)
          ) {
            context.passthru = context.url = text;
            continue;
            // before = `<a href="${text.trim()}">`;
            // after = `</a>`;
            // console.log(text, {tag, before, after}, token);
          }
          if (lineBreaks) {
            (!context.block && (tag = 'br')) || ((after = `</${context.block}>`) && (context.block = body = ''));
          } else if (type === 'sequence') {
            if (text[0] === '`') {
              tag = 'code';
              body = text.replace(/(``?)(.*)\1/, '$2');
              let fence = '`'.repeat((text.length - body.length) / 2);
              body = encodeEntities(body.replace(/&nbsp;/g, '\u202F'));
              fence in lookups.entities && (fence = lookups.entities[fence]);
              classes.push('fenced-code');
              classes.push('code');
            } else if (text.startsWith('---') && !/[^\-]/.test(text)) {
              tag = 'hr';
            } else if (!context.block && (context.block = lookups.blocks[text])) {
              ({before = before, tag = tag, body = body} = this.renderBlockTokens(token, context));
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

      meta =
        tag &&
        [
          punctuator && `punctuator="${escape(punctuator)}"`,
          type && `token-type="${escape(type)}"`,
          hint && `token-hint="${escape(hint)}"`,
          lineBreaks && `line-breaks="${escape(lineBreaks)}"`,
        ].join(' ');

      tag === 'span' && (body = encodeEscapedEntities(body));

      before && (context.renderedText += before);
      tag === 'br' || (context.newlines = 0)
        ? (!NEWLINE_CONSOLIDATION && (context.renderedText += '\n')) ||
          (context.newlines++ && (context.renderedText += '\n')) ||
          (context.renderedText += '<br/>')
        : tag === 'hr'
        ? (context.renderedText += '<hr/>')
        : body &&
          (tag
            ? (context.renderedText += `<${tag} ${meta}${renderClasses(classes)}>${body}</${tag}>`)
            : (context.renderedText += body));
      after && (context.renderedText += after);
    }

    if (STRAY_BRACE && context.renderedText.endsWith(`>}</span>`)) {
      context.renderedText = context.renderedText.slice(0, context.renderedText.lastIndexOf('<span'));
    }

    return context.renderedText;
  }

  renderClasses(classes) {
    return ((classes = [...classes].filter(Boolean).join(' ')) && ` class="${classes}"`) || '';
  }
}

/// Features

const createLookups = (
  repeats = {['*']: 2, ['`']: 3, ['#']: 6},
  entities = {['*']: '&#x2217;', ['`']: '&#x0300;'},
  aliases = {'*': ['_'], '**': ['__'], '`': ['``']},
  blocks = {['-']: 'li', ['>']: 'blockquote', ['#']: 'h*', ['```']: 'pre'},
  spans = {['*']: 'i', ['**']: 'b', ['~~']: 's', ['`']: 'code'},
  tags = ['<', '>', '<!--', '-->', '<?', '?>', '</', '/>'],
  elements = {'markout-iframe': 'iframe', 'markout-details': 'details', 'markout-blockquote': 'blockquote'},
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

  const escapes = {};

  for (const symbol of '* ^ ~ `'.split(' ')) {
    escapes[`\\${symbol}`] = `&#x${symbol.charAt(0).toString(16)};`;
  }

  return {entities, blocks, spans, tags: new Set(tags), elements};
};

const createSpanStack = context => {
  const {
    lookups: {spans},
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

export { ASSET_REMAPPING as A, BREAK_NORMALIZATION as B, CHECKLIST_NORMALIZATION as C, DOM_MUTATIONS as D, Enum as E, HEADING_NORMALIZATION as H, LIST_PARAGRAPH_NORMALIZATION as L, MarkupAttributeMap as M, PARAGRAPH_NORMALIZATION as P, SOURCE_TEXT_RENDERING as S, TOKEN_FLATTENING as T, BLOCK_PARAGRAPH_NORMALIZATION as a, BLOCKQUOTE_NORMALIZATION as b, content as c, defaults as d, BLOCKQUOTE_HEADING_NORMALIZATION as e, DECLARATIVE_STYLING as f, ASSET_INITIALIZATION as g, flags as h, renderSourceText as i, debugging as j, normalize as n, render as r, tokenize as t };
//# sourceMappingURL=renderer.js.map
