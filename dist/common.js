import { sequence as sequence$1, debugging, normalizeString } from '/markout/lib/helpers.js';
import { encodeEntities, entities as entities$1, render as render$1, tokenize as tokenize$1, encodeEntity } from '/markup/dist/tokenizer.browser.js';

//@ts-check
/// <reference path="./types.d.ts" />

// const trace = /** @type {[function, any[]][]} */ [];

class Matcher extends RegExp {
	/**
	 * @template T
	 * @param {Matcher.Pattern} pattern
	 * @param {Matcher.Flags} [flags]
	 * @param {Matcher.Entities} [entities]
	 * @param {T} [state]
	 */
	constructor(pattern, flags, entities, state) {
		// trace.push([new.target, [...arguments]]);
		//@ts-ignore
		super(pattern, flags);
		// Object.assign(this, RegExp.prototype, new.target.prototype);
		(pattern &&
			pattern.entities &&
			Symbol.iterator in pattern.entities &&
			((!entities && (entities = pattern.entities)) || entities === pattern.entities)) ||
			Object.freeze((entities = (entities && Symbol.iterator in entities && [...entities]) || []));
		/** @type {MatcherEntities} */
		this.entities = entities;
		/** @type {T} */
		this.state = state;
		this.capture = this.capture;
		this.exec = this.exec;
		// this.test = this.test;
		({
			// LOOKAHEAD: this.LOOKAHEAD = Matcher.LOOKAHEAD,
			// INSET: this.INSET = Matcher.INSET,
			// OUTSET: this.OUTSET = Matcher.OUTSET,
			DELIMITER: this.DELIMITER = Matcher.DELIMITER,
			UNKNOWN: this.UNKNOWN = Matcher.UNKNOWN,
		} = new.target);
	}

	/**
	 * @template {MatcherMatchResult} T
	 * @param {string} text
	 * @param {number} capture
	 * @param {T} match
	 * @returns {T}
	 */
	capture(text, capture, match) {
		if (capture === 0) return void (match.capture = {});
		if (text === undefined) return;
		const index = capture - 1;
		const {
			entities: {[index]: entity},
			state,
		} = this;
		typeof entity === 'function'
			? ((match.entity = index), entity(text, capture, match, state))
			: entity == null || //entity === INSET ||
			  // entity === OUTSET ||
			  // entity === DELIMITER ||
			  // entity === LOOKAHEAD ||
			  // entity === UNKNOWN ||
			  (match.entity !== undefined || ((match.identity = entity), (match.entity = index)),
			  (match.capture[entity] = text));
	}

	/**
	 * @param {string} source
	 * @returns {MatcherMatchResult}
	 */
	exec(source) {
		// const tracing = trace.length;
		// trace.push([this.exec, [...arguments]]);
		/** @type {MatcherMatchArray} */
		const match = super.exec(source);
		// console.log(trace.slice(tracing, trace.length));
		match &&
			(match.forEach(this.capture || Matcher.prototype.capture, (match.matcher = this)),
			match.identity || (match.capture[this.UNKNOWN || Matcher.UNKNOWN] = match[0]));

		// @ts-ignore
		return match;
	}

	/**
	 * @param {Matcher.PatternFactory} factory
	 * @param {Matcher.Flags} [flags]
	 * @param {PropertyDescriptorMap} [properties]
	 */
	static define(factory, flags, properties) {
		/** @type {MatcherEntities} */
		const entities = [];
		entities.flags = '';
		// const pattern = factory(entity => void entities.push(((entity != null || undefined) && entity) || undefined));
		const pattern = factory(entity => {
			if (entity !== null && entity instanceof Matcher) {
				entities.push(...entity.entities);

				!entity.flags || (entities.flags = entities.flags ? Matcher.flags(entities.flags, entity.flags) : entity.flags);

				return entity.source;
			} else {
				entities.push(((entity != null || undefined) && entity) || undefined);
			}
		});
		flags = Matcher.flags('g', flags == null ? pattern.flags : flags, entities.flags);
		const matcher = new ((this && (this.prototype === Matcher.prototype || this.prototype instanceof RegExp) && this) ||
			Matcher)(pattern, flags, entities);

		properties && Object.defineProperties(matcher, properties);

		return matcher;
	}

	static flags(...sources) {
		let flags = '',
			iterative;
		for (const source of sources) {
			if (!source || (typeof source !== 'string' && typeof source.flags !== 'string')) continue;
			for (const flag of source.flags || source)
				(flag === 'g' || flag === 'y' ? iterative || !(iterative = true) : flags.includes(flag)) || (flags += flag);
		}
		// console.log('%o: ', flags, ...sources);
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
		/**
		 * @param {any} value
		 * @returns {string}
		 */
		sequence.span = value =>
			(value &&
				// TODO: Don't coerce to string here?
				(typeof value !== 'symbol' && `${value}`)) ||
			'';

		sequence.WHITESPACE = /^\s+|\s*\n\s*|\s+$/g;

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
}

const {
	// INSET = (Matcher.INSET = /* Symbol.for */ 'INSET'),
	// OUTSET = (Matcher.OUTSET = /* Symbol.for */ 'OUTSET'),
	DELIMITER = (Matcher.DELIMITER = /* Symbol.for */ 'DELIMITER'),
	UNKNOWN = (Matcher.UNKNOWN = /* Symbol.for */ 'UNKNOWN'),
	// LOOKAHEAD = (Matcher.LOOKAHEAD = /* Symbol.for */ 'LOOKAHEAD'),
	escape: escape$1 = (Matcher.escape = /** @type {<T>(source: T) => string} */ ((() => {
		const {replace} = Symbol;
		return source => /[\\^$*+?.()|[\]{}]/g[replace](source, '\\$&');
	})())),
	sequence,
	join,
	matchAll = (Matcher.matchAll =
		/**
		 * @template {RegExp} T
		 * @type {(string: Matcher.Text, matcher: T) => Matcher.Iterator<T> }
		 */
		//@ts-ignore
		(() =>
			Function.call.bind(
				// String.prototype.matchAll || // TODO: Uncomment eventually
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

						if (!(matcher.flags.includes('g') || matcher.flags.includes('y'))) return void (yield matcher.exec(string));

						for (
							let match, lastIndex = -1;
							lastIndex <
							((match = matcher.exec(string)) ? (lastIndex = matcher.lastIndex + (match[0].length === 0)) : lastIndex);
							yield match, matcher.lastIndex = lastIndex
						);
					},
				}.matchAll,
			))()),
} = Matcher;

//@ts-check

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


// /** @param {string} string */
// const upper = string => string.toUpperCase();
// /** @param {string} string */
// const lower = string => string.toLowerCase();

//@ts-check

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
	Insets: {
		ranges.Inseter = atoms.split('\t >'); // 0=tab 1=space 2=quote
		partials.Inset = range(...ranges.Inseter);
	}

	Fences: {
		// NOTE: Ambiguities when testing if `~` is meant for
		//			 fencing or strikethrough here make it harder
		//			 to retain intent and traceablility.
		ranges.FenceMarks = atoms.split('`'); // 0=grave 1=tilde
		partials.BlockFence = join(...ranges.FenceMarks.map(fence => escape$1(fence.repeat(3))));
	}

	Lists: {
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
		partials.SquareMark = escape$1(ranges.ListMarkers[0]);
		//
		//   2. Matching Disc character (ie `*` per lesser popular notation):
		partials.DiscMark = escape$1(ranges.ListMarkers[1]);
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
		partials.ArabicNumbering = sequence`(?=${ranges.ArabicNumbers[0]}*${range(
			...ranges.ArabicNumbers.slice(1),
		)})${range(...ranges.ArabicNumbers)}+`;
		//
		//      Matching Zero-leading Decimal characters (two or more):
		//        NOTE: lookahead is necessary to exclude matching just zero(s)
		partials.ZeroLeadingArabicNumbering = sequence`(?=${ranges.ArabicNumbers[0]}*${range(
			...ranges.ArabicNumbers.slice(1),
		)})${range(...ranges.ArabicNumbers)}{2,}`;
		//
		//      Matching Decimal marker (with any separator):
		partials.ArabicMarker = sequence`${partials.ArabicNumbering}${partials.NumberingSeparator}`;
		//
		//      Matching Zero-leading Decimal marker (with any separator):
		partials.ZeroLeadingArabicMarker = sequence`${partials.ZeroLeadingArabicNumbering}${partials.NumberingSeparator}`;
		//
		//   2. Matching Latin character (one only)
		partials.LatinNumbering = range(...ranges.LatinLetters);
		partials.LowerLatinNumbering = range(...ranges.LowerLatinLetters);
		partials.UpperLatinNumbering = range(...ranges.UpperLatinLetters);
		//
		//      Matching Latin marker (with any separator):
		partials.LatinMarker = sequence`${partials.LatinNumbering}${partials.NumberingSeparator}`;
		partials.LowerLatinMarker = sequence`${partials.LowerLatinNumbering}${partials.NumberingSeparator}`;
		partials.UpperLatinMarker = sequence`${partials.UpperLatinNumbering}${partials.NumberingSeparator}`;
		//
		//   3. Matching Roman characters (one or more of the premitted subset)
		partials.RomanNumbering = sequence`${range(...ranges.RomanNumerals)}+`;
		partials.LowerRomanNumbering = sequence`${range(...ranges.LowerRomanNumerals)}+`;
		partials.UpperRomanNumbering = sequence`${range(...ranges.UpperRomanNumerals)}+`;
		//
		//      Matching Roman marker (also with trailing "period" separator)
		partials.RomanMarker = sequence`${partials.RomanNumbering}\.`;
		partials.LowerRomanMarker = sequence`${partials.LowerRomanNumbering}\.`;
		partials.UpperRomanMarker = sequence`${partials.UpperRomanNumbering}\.`;
		//
		//   Ordered marker is the union of Decimal/Latin/Roman partials:
		partials.OrderedMarker = sequence`${join(partials.ArabicMarker, partials.LatinMarker, partials.RomanMarker)}`;

		// Checklists are extensions of unordered lists:
		//
		//   NOTE: Markout adds an additional `[-]` indeterminate state
		//
		//   a. Matching Enclosed character (without any brackets)
		partials.CheckMark = range(...ranges.CheckMarks);
		//
		//   b. Matching Enclosure characters (with enclosing brackets)
		partials.Checkbox = sequence`\[${partials.CheckMark}\]`;
		//
		//   Checklist marker is space-separated Unordered marker and Checkbox:
		partials.ChecklistMarker = sequence`${partials.UnorderedMark} ${partials.Checkbox}`;

		// Matching list markers is done in two ways:
		//
		//   1. Matching head portion (ie excluding the checkbox)
		partials.ListMarkerHead = join(partials.UnorderedMark, partials.OrderedMarker);
		//
		//   2. Matching full marker (ie including the checkbox)
		partials.ListMarker = sequence`${join(partials.ChecklistMarker, partials.UnorderedMarker, partials.OrderedMarker)}`;

		patterns.DiscMarker = sequence`^${partials.DiscMark}(?= (?!${partials.Checkbox})|$)`;
		patterns.SquareMarker = sequence`^${partials.SquareMark}(?= (?!${partials.Checkbox})|$)`;
		patterns.UnorderedMarker = sequence`^${partials.UnorderedMark}(?= (?!${partials.Checkbox})|$)`;
		patterns.ArabicMarker = sequence`^${partials.ArabicMarker}(?= |$)`;
		patterns.LatinMarker = sequence`^${partials.LatinMarker}(?= |$)`;
		patterns.RomanMarker = sequence`^${partials.RomanMarker}(?= |$)`;
		patterns.OrderedMarker = sequence`^${partials.OrderedMarker}(?= |$)`;
		patterns.ChecklistMarker = sequence`^${partials.ChecklistMarker}(?= |$)`;

		// There are two groups of list marker expressions:
		sequences.ListMarkerHead = sequence`(?:${partials.ListMarkerHead})(?: )`;
		sequences.ListMarker = sequence`(?:${join(
			sequence`(?:${partials.ChecklistMarker} )`,
			sequence`(?:${partials.UnorderedMark} )(?!${partials.Checkbox})`,
			sequence`(?:${partials.OrderedMarker} )`,
		)})`;

		sequences.NormalizableLists = sequence/* fsharp */ `
			(?=\n?^(${partials.Inset}*)(?:${sequences.ListMarker}))
			((?:\n?\1
				(?:${sequences.ListMarker}|   ?)+
				[^\n]+
				(?:\n${partials.Inset}*)*
				(?=\n\1|$)
			)+)
		`;

		sequences.NormalizableListItem = sequence/* fsharp */ `
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

	Matchers: {
		sequences.NormalizableBlocks = sequence/* fsharp */ `
      (?:^|\n)(${partials.Inset}*(?:${partials.BlockFence}))[^]+?(?:(?:\n\1[ \t]*)+\n?|$)
      |(?:^|\n)(${partials.Inset}*)(?:
				<style>[^]+?(?:(?:\n\2</style>[ \t]*)+\n?|$)
				|<script type=module>[^]+?(?:(?:\n\2</script>[ \t]*)+\n?|$)
				|<script>[^]+?(?:(?:\n\2</script>[ \t]*)+\n?|$)
			)
      |([^]+?(?:(?=\n${partials.Inset}*(?:${partials.BlockFence}|<script>|<style>|<script type=module>))|$))
    `;
		matchers.NormalizableBlocks = new RegExp(sequences.NormalizableBlocks, 'g');

		partials.HTMLTagBody = sequence/* fsharp */ `(?:[^${`"'`}>]+?|".*?"|'.*?')`;

		sequences.HTMLTags = sequence/* fsharp */ `
			<\/?[a-zA-z]\w*${partials.HTMLTagBody}*?>
			|<\?[^]*?\?>
			|<!--[^]*?-->
			|<!\w[^]>
		`;

		matchers.HTMLTags = new RegExp(sequences.HTMLTags, 'g');

		sequences.NormalizableParagraphs = sequence/* fsharp */ `
      ^
      ((?:[ \t]*\n(${partials.Inset}*))+)
      ($|(?:
				(?:
					</?(?:span|small|big|kbd)\b${partials.HTMLTagBody}*?>
					|(?!(?:${join(
						sequences.HTMLTags,
						// sequences.ListMarker,
					)}))
				)
				[^-#>|~\n].*
        (?:\n${partials.Inset}*$)+
      )+)
    `;
		matchers.NormalizableParagraphs = new RegExp(sequences.NormalizableParagraphs, 'gmu');

		sequences.RewritableParagraphs = sequence/* fsharp */ `
      ^
      ([ \t]*[^\-\*#>\n].*?)
      (\b.*[^:\n\s>]+|\b)
      [ \t]*\n[ \t>]*?
      (?=(
				</?(?:span|small|big|kbd)\b${partials.HTMLTagBody}*?>[^-#>|~\n].*
        |\b(?!(?:${sequences.HTMLTags}))
        |${escape$1('[')}.*?${escape$1(']')}[^:\n]?
        |[^#${'`'}${escape$1('[')}\n]
      ))
    `;

		matchers.RewritableParagraphs = new RegExp(sequences.RewritableParagraphs, 'gmu');

		partials.BlockQuote = sequence/* fsharp */ `(?:  ?|\t)*>(?:  ?>|\t>)`;

		sequences.NormalizableBlockquotes = sequence/* fsharp */ `
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

		sequences.NormalizableReferences = sequence/* fsharp */ `
      !?
      ${escape$1('[')}(\S.*?\S)${escape$1(']')}
      (?:
        ${escape$1('(')}(\S[^\n${escape$1('()[]')}]*?\S)${escape$1(')')}
        |${escape$1('[')}(\S[^\n${escape$1('()[]')}]*\S)${escape$1(']')}
      )
		`;
		// NOTE: Safari seems to struggle with /\S|\s/gmu
		matchers.NormalizableReferences = new RegExp(sequences.NormalizableReferences, 'gm');

		sequences.RewritableAliases = sequence/* fsharp */ `
      ^
      (${partials.Inset}*)
      ${escape$1('[')}(\S.*?\S)${escape$1(']')}:\s+
      (\S+)(?:
        \s+${'"'}([^\n]*)${'"'}
        |\s+${"'"}([^\n]*)${"'"}
        |
      )\s*$
		`;
		// NOTE: Safari seems to struggle with /\S|\s/gmu
		matchers.RewritableAliases = new RegExp(sequences.RewritableAliases, 'gm');

		sequences.NormalizableLink = sequence/* fsharp */ `
      \s*((?:\s?[^${`'"`}${escape$1('()[]')}}\s\n]+)*)
      (?:\s+[${`'"`}]([^\n]*)[${`'"`}]|)
		`;
		// NOTE: Safari seems to struggle with /\S|\s/gmu
		matchers.NormalizableLink = new RegExp(sequences.NormalizableLink);
	}
}

class ComposableList extends Array {
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
				} else {
					const insetText = `${item}`;
					let text = insetText;
					for (const character of listInset) {
						if (!text.startsWith(character)) break;
						text = text.slice(1);
					}
					listRows.push(text);
				}
			} else {
				const [, checked, content] = /^\s*(?:\[([-xX]| )\] |)(.+?)\s*$/.exec(item);

				content &&
					listRows.push(
						checked
							? `${listInset}\t<li type=checkbox ${
									checked === ' ' ? '' : checked === '-' ? 'indeterminate' : ' checked'
							  }> ${content} </li>`
							: `${listInset}\t<li> ${content} </li>`,
					);
			}
		}
		listRows.push(`${listInset}</${listType}>`);
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

LATIN: {
	const parseLatin = latin => parseLatin.mappings[latin] || NaN;

	parseLatin.mappings = {};

	'abcdefghijklmnopqrstuvwxyz'.split('').forEach((latin, index) => {
		parseLatin.mappings[(parseLatin.mappings[latin] = parseLatin.mappings[latin.toUpperCase] = index + 1)] = latin;
	});

	ComposableList.parseLatin = parseLatin;
}

ROMAN: {
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
	'markout-render-merged-marking': MERGED_MARKING = false,
	'markout-render-comment-stashing': COMMENT_STASHING = false,
	'markout-render-paragraph-trimming': PARAGRAPH_TRIMMING = true,
} = import.meta;

const generateBlockquotes = (quotesAfter, quotesBefore = 0) => {
	let blockquotes, steps;

	steps = quotesAfter - (quotesBefore || 0);

	if (steps < 0) {
		return '</p></blockquote>'.repeat(-steps);
	} else if (steps > 0) {
		blockquotes = new Array(steps);
		for (let level = quotesAfter; steps; blockquotes[steps--] = `<blockquote blockquote-level=${level--}><p>`);
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

		Blocks: {
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
					  `<a hidden rel="alias" name="${alias}" href="${href}">${title || ''}</a>`)
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

		Normalization: {
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
		const {aliases = (state.aliases = {})} = state;

		return sourceText.replace(matchers.NormalizableReferences, (m, text, link, alias, index) => {
			const reference = (alias && (alias = alias.trim())) || (link && (link = link.trim()));

			if (reference) {
				let href, title;
				// debugging && console.log(m, {text, link, alias, reference, index});
				if (link) {
					[, href, title] = matchers.NormalizableLink.exec(link);
				} else if (alias && alias in aliases) {
					({href, title} = aliases[alias]);
				}

				if (m[0] === '!') {
					return ` <img${href ? ` src="${encodeURI(href)}"` : ''}${
						text || title ? ` title="${text || title}"` : ''
					} />`;
				} else {
					text = text || encodeEntities(href);
					return ` <a${href ? ` href="${href}"` : ''}${title ? ` title="${title}"` : ''}>${text || reference}</a>`;
				}
			}
			return m;
		});
	}

	/** @param {string} sourceText */
	normalizeLists(sourceText) {
		return sourceText.replace(matchers.NormalizableLists, (m, feed, body) => {
			let match, indent;
			indent = feed.slice(1);
			let top = new ComposableList();
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
						list.push((list = new ComposableList()));
						list.parent = parent;
					} else if (depth < list.listDepth) {
						while ((list = list.parent) && depth < list.listDepth);
					} else if ('listStyle' in list && !(like = ComposableList.markerIsLike(matchedMarker, list.listStyle))) {
						const parent = list.parent;
						((list = new ComposableList()).parent = parent) ? parent.push(list) : lists.push((top = list));
					}

					// console.log(text, [matchedMarker, list.listStyle, like]);

					if (!list) break;

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
			return `${a}${b}${MERGED_MARKING ? '<tt class="normalized-break"> \u{035C}</tt>' : ' '}`;
		});
	}
}

const MATCHES = Symbol('matches');
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
		} else if (type !== UNKNOWN$1) {
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

const {INSET, UNKNOWN: UNKNOWN$1, LOOKAHEAD} = Object.defineProperties(Segmenter, {
	INSET: {value: Symbol.for('INSET'), enumerable: true},
	UNKNOWN: {value: Symbol.for('UNKNOWN'), enumerable: true},
	LOOKAHEAD: {value: Symbol.for('LOOKAHEAD'), enumerable: true},
});

// import dynamicImport from '/browser/dynamic-import.js';

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
	const MarkoutLists = sequence$1`[-*]|[1-9]+\d*\.|[ivx]+\.|[a-z]\.`;
	const MarkoutMatter = sequence$1`---(?=\n.+)(?:\n.*)+?\n---`;
	const MarkoutStub = sequence$1`<!--[^]*?-->|<!.*?>|<\?.*?\?>|<%.*?%>|<(?:\b|\/).*(?:\b|\/)>.*`;
	const MarkoutStart = sequence$1`(?!(?:${MarkoutLists}) )(?:[^#${'`'}~<>|\n\s]|${'`'}{1,2}(?!${'`'})|~{1, 2}(?!~))`;
	const MarkoutLine = sequence$1`(?:${MarkoutStart})(?:${MarkoutStub}|.*)*$`;
	// const MarkoutDivider = sequence`-(?:[ \t]*-)+|=(?:=[ \t]*)+`;
	const MarkoutDivider = sequence$1`-{2,}|={2,}|\*{2,}|(?:- ){2,}-|(?:= ){2,}=|(?:\* ){2,}\*`;
	const MarkoutATXHeading = sequence$1`#{1,6}(?= +${MarkoutLine})`;
	const MarkoutTextHeading = sequence$1`${MarkoutStart}.*\n(?=\2\={3,}\n|\2\-{3,}\n)`;

	const MarkoutSegments = Segmenter.define(
		type =>
			sequence$1`^
		  (?:
		    ${type(UNKNOWN$1)}(${MarkoutMatter}$|[ \t]*(?:${MarkoutStub})[ \t]*$)|
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
		      ${type(UNKNOWN$1)}(.+?$)
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
		try {
			// TODO: Implement Markout's Matcher-based segment normalization
			// for (const segment of matchAll(sourceText, MarkoutSegments)) {}
			// state.segments = [...matchAll(sourceText, MarkoutSegments)];

			return this.normalizeBlocks(sourceText, state);
		} finally {
			import.meta['debug:markout:segment-normalization'] && console.log('normalizeSegments:', state);
		}
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

const entities = /*#__PURE__*/Object.freeze({
	UnicodeIdentifier: UnicodeIdentifier,
	MarkdownIdentityPrefixer: MarkdownIdentityPrefixer,
	MarkdownIdentityJoiner: MarkdownIdentityJoiner,
	MarkdownIdentityWord: MarkdownIdentityWord,
	MarkdownIdentity: MarkdownIdentity
});

const declarativeStyling = (declarativeStyling => {
	const {getOwnPropertyNames, setPrototypeOf, getPrototypeOf, freeze, keys} = Object;
	const {lookup} = declarativeStyling;
	const Prefix = /^-?webkit-|-?moz-/;
	const Boundary = /[a-z](?=[A-Z])/g;
	const selectors = [];
	const style = document.createElement('span').style;

	for (const property of new Set([
		// Markout style properties
		'style', // mixin styling
		// CSS style properties
		...[
			// Webkit/Blink
			...getOwnPropertyNames(style),
			// Firefox
			...getOwnPropertyNames(getPrototypeOf(style)),
		].filter(property => style[property] === ''),
		// ].filter(property => style[property] === '' && Filter.test(property)),
	])) {
		const attribute = `${property.replace(Boundary, '$&-').toLowerCase()}:`.replace(Prefix, '');
		lookup[attribute] = property;
		selectors.push(`[${CSS.escape(attribute)}]`);
	}

	declarativeStyling.selector = selectors.join(',');
	freeze(setPrototypeOf(declarativeStyling.lookup, null));
	freeze(declarativeStyling.apply);

	Prefixes: {
		const autoprefix = value => {
			const prefixed = value.replace(autoprefix.matcher, autoprefix.replacer);
			// console.log(value, prefixed);
			return prefixed;
		};
		autoprefix.mappings = {};
		autoprefix.prefix = CSS.supports('-moz-appearance', 'initial')
			? '-moz-'
			: CSS.supports('-webkit-appearance', 'initial')
			? '-webkit-'
			: '';

		if (autoprefix.prefix) {
			const {mappings, prefix} = autoprefix;
			const map = (property, value, mapping = `${prefix}${value}`) =>
				CSS.supports(property, value) || (mappings[value] = mapping);

			if (prefix === '-webkit-') {
				map('width', 'fill-available');
			} else if (prefix === '-moz-') {
				map('width', 'fill-available', '-moz-available');
			}

			const mapped = keys(mappings);

			if (mapped.length > 0) {
				autoprefix.matcher = new RegExp(String.raw`\b-?(?:${mapped.join('|')})\b`, 'gi');
				freeze((autoprefix.replacer = value => mappings[value] || value));
				freeze(autoprefix.mappings);
				freeze((declarativeStyling.autoprefix = autoprefix));
			}
			// console.log(autoprefix, {...autoprefix});
		}
	}

	declarativeStyling.normalize = (value, property) => {
		if (!value || !(value = value.trim())) return '';
		value.startsWith('--') && !value.includes(' ') && (value = `var(${value}--${property}--)`);
		return value;
	};

	declarativeStyling.mixin = (element, style) => {
		// TODO: Explore computedStyle mixins
		element.style.border = `var(--${style}--border--, unset)`;
		element.style.background = `var(--${style}--background--, unset)`;
		element.style.color = `var(--${style}--color--, unset)`;
		element.style.font = `var(--${style}--font--, unset)`;
		element.style.opacity = `var(--${style}--opacity--, unset)`;
	};

	// declarativeStyling.mixin['markout-content'] = undefined;

	freeze(declarativeStyling);
	return declarativeStyling;
})({
	/** @type {{[name: string] : string}} */
	lookup: {},
	selector: '',
	apply: element => {
		const style = element.style;
		const {lookup, autoprefix, normalize} = declarativeStyling;
		for (const attribute of element.getAttributeNames()) {
			attribute in lookup &&
				(attribute === 'style:'
					? declarativeStyling.mixin(element, element.getAttribute(attribute))
					: autoprefix === undefined
					? (style[lookup[attribute]] = normalize(element.getAttribute(attribute), attribute.slice(0, -1)))
					: (style[lookup[attribute]] = autoprefix(normalize(element.getAttribute(attribute), attribute.slice(0, -1)))),
				element.removeAttribute(attribute));
		}
	},
	/** @type {(value: string) => string} */
	autoprefix: undefined,
	/** @type {(element: HTMLElement, style: string) => void} */
	mixin: undefined,
	/** @type {(value: string, property: string) => string} */
	normalize: undefined,
});

//@ts-check

/** @template T @param {T} pairs @returns {Readonly<T>} */
const Enum = pairs => Object.freeze(Object.setPrototypeOf(pairs, null));

// const {
// 	fromEntries = (reducer => (...entries) => entries.reduce(reducer, {}))(
// 		(entries, [key, value]) => ((entries[key] = value), entries),
// 	),
// } = Object;

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

// export const typeed = (type, index) => index !== 0 && type != null;

// export class RenderableList extends Array {
// 	toString(inset = this.inset || '', type = this.type || 'ul', style = this.style, start = this.start) {
// 		const attributes = `${
// 			// TODO: Explore using type attribute instead
// 			(style && `style="list-style: ${style}"`) || ''
// 		} ${
// 			// TODO: Check if guard against invalid start is needed
// 			(start && `start="${start}"`) || ''
// 		}`.trim();

// 		const rows = [`${inset}<${type}${(attributes && ` ${attributes}`) || ''}>`];
// 		for (const item of this) {
// 			if (item && typeof item === 'object') {
// 				if (item instanceof RenderableList) {
// 					const last = rows.length - 1;
// 					const row = rows[last];
// 					last > 0
// 						? (rows[rows.length - 1] = `${row.slice(0, -5)}\n${item.toString(`${inset}\t\t`)}\n${inset}\t</li>`)
// 						: rows.push(`${inset}\t<li>\n${item.toString(`${inset}\t\t`)}\n${inset}\t</li>`);
// 				} else {
// 					const insetText = `${item}`;
// 					let text = insetText;
// 					for (const character of inset) {
// 						if (!text.startsWith(character)) break;
// 						text = text.slice(1);
// 					}
// 					rows.push(text);
// 				}
// 			} else {
// 				rows.push(`${inset}\t<li>${`${item}`.trim()}</li>`);
// 			}
// 		}
// 		rows.push(`${inset}</${type}>`);
// 		return `\n${rows.join('\n')}\n`;
// 	}
// }

// export const MarkoutContentFlags = '(markout content flags)';

const {
	defaults,
	createRenderedFragment,
	normalizeRenderedFragment,
	populateAssetsInFragment,
	normalizeBreaksInFragment,
	normalizeHeadingsInFragment,
	normalizeChecklistsInFragment,
	normalizeParagraphsInFragment,
	flattenTokensInFragment,
	applyDeclarativeStylingInFragment,
	renderSourceTextsInFragment,
} = (() => {
	/** @type {HTMLTemplateElement} */
	let template;

	const defaults = Object.freeze({
		flags: Object.freeze({
			DOM_MUTATIONS: undefined,
			BREAK_NORMALIZATION: undefined,
			HEADING_NORMALIZATION: true,
			PARAGRAPH_NORMALIZATION: true,
			CHECKLIST_NORMALIZATION: true,
			BLOCKQUOTE_NORMALIZATION: true,
			TOKEN_FLATTENING: true,
			DECLARATIVE_STYLING: true,
			SOURCE_TEXT_RENDERING: true,
			ASSET_REMAPPING: true,
			ASSET_INITIALIZATION: true,
		}),
	});

	/** @param {string} sourceText @returns {DocumentFragment}*/
	const createRenderedFragment = sourceText => {
		let fragment, normalizedText, tokens, renderedText;
		template || (template = document.createElement('template'));

		template.innerHTML = renderedText = render(
			(tokens = tokenize((normalizedText = normalize(sourceText)))),
		);

		// console.log({sourceText, normalizedText, innerHTML: template.innerHTML});

		fragment = template.content.cloneNode(true);
		fragment.fragment = fragment;
		fragment.sourceText = sourceText;
		fragment.normalizedText = normalizedText;
		fragment.tokens = tokens;
		fragment.renderedText = renderedText;

		return fragment;
	};

	/** @param {DocumentFragment} fragment @param {Record<string, boolean>} [flags] */
	const normalizeRenderedFragment = (fragment, flags) => {
		flags = {
			DOM_MUTATIONS: fragment.markoutContentFlags.DOM_MUTATIONS = defaults.DOM_MUTATIONS,
			BREAK_NORMALIZATION: fragment.markoutContentFlags.BREAK_NORMALIZATION = defaults.BREAK_NORMALIZATION,
			HEADING_NORMALIZATION: fragment.markoutContentFlags.HEADING_NORMALIZATION = defaults.HEADING_NORMALIZATION,
			PARAGRAPH_NORMALIZATION: fragment.markoutContentFlags.PARAGRAPH_NORMALIZATION = defaults.PARAGRAPH_NORMALIZATION,
			CHECKLIST_NORMALIZATION: fragment.markoutContentFlags.CHECKLIST_NORMALIZATION = defaults.CHECKLIST_NORMALIZATION,
			BLOCKQUOTE_NORMALIZATION: fragment.markoutContentFlags
				.BLOCKQUOTE_NORMALIZATION = defaults.BLOCKQUOTE_NORMALIZATION,
			TOKEN_FLATTENING: fragment.markoutContentFlags.TOKEN_FLATTENING = defaults.TOKEN_FLATTENING,
			DECLARATIVE_STYLING: fragment.markoutContentFlags.DECLARATIVE_STYLING = defaults.DECLARATIVE_STYLING,
			SOURCE_TEXT_RENDERING: fragment.markoutContentFlags.SOURCE_TEXT_RENDERING = defaults.SOURCE_TEXT_RENDERING,
			ASSET_REMAPPING: fragment.markoutContentFlags.ASSET_REMAPPING = defaults.ASSET_REMAPPING,
			ASSET_INITIALIZATION: fragment.markoutContentFlags.ASSET_INITIALIZATION = defaults.ASSET_INITIALIZATION,
		} = {
			...defaults.flags,
			...(fragment.markoutContentFlags || (fragment.markoutContentFlags = {})),
			...flags,
		};

		flags.DOM_MUTATIONS !== false &&
			((flags.BREAK_NORMALIZATION === true || flags.DOM_MUTATIONS === true) && normalizeBreaksInFragment(fragment),
			(flags.HEADING_NORMALIZATION === true || flags.DOM_MUTATIONS === true) && normalizeHeadingsInFragment(fragment),
			(flags.PARAGRAPH_NORMALIZATION === true || flags.DOM_MUTATIONS === true) &&
				normalizeParagraphsInFragment(fragment),
			(flags.BLOCKQUOTE_NORMALIZATION === true || flags.DOM_MUTATIONS === true) &&
				normalizeBlockquotesInFragment(fragment),
			(flags.CHECKLIST_NORMALIZATION === true || flags.DOM_MUTATIONS === true) &&
				normalizeChecklistsInFragment(fragment),
			(flags.DECLARATIVE_STYLING === true || flags.DOM_MUTATIONS === true) &&
				applyDeclarativeStylingInFragment(fragment));

		(flags.TOKEN_FLATTENING === true || (flags.TOKEN_FLATTENING !== false && DOM_MUTATIONS !== false)) &&
			flattenTokensInFragment(fragment);

		renderURLExpansionLinksInFragment(fragment);
	};

	/** Populate remappable elements @param {DocumentFragment} fragment */
	const populateAssetsInFragment = fragment => {
		if (!fragment || fragment.assets) return;
		fragment.assets = [];

		for (const link of fragment.querySelectorAll(AssetSelector)) {
			if (link.nodeName === 'SCRIPT') {
				if (link.type === 'module') {
					(fragment.assets.modules || (fragment.assets.modules = [])).push(link);
				} else if (!link.type || link.type.trim().toLowerCase() === 'text/javascript') {
					(fragment.assets.scripts || (fragment.assets.scripts = [])).push(link);
				}
			} else if (link.nodeName === 'STYLE') {
				if (!link.type || link.type.trim().toLowerCase() === 'text/css') {
					(fragment.assets.stylesheets || (fragment.assets.stylesheets = [])).push(link);
				}
			} else {
				(fragment.assets[AssetTypeMap[link.nodeName]] || (fragment.assets[AssetTypeMap[link.nodeName]] = [])).push(
					link,
				);
			}
			fragment.assets.push(link);
		}

		return fragment;
	};

	/** @param {DocumentFragment} fragment */
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

	/** @param {DocumentFragment} fragment */
	const normalizeHeadingsInFragment = fragment => {
		const {MarkdownIdentity: Identity, MarkdownIdentityPrefixer: Prefixer, MarkdownIdentityJoiner: Joiner} = entities;
		const {headings = (fragment.headings = {}), TEXT_NODE} = fragment;

		for (const subheading of fragment.querySelectorAll(`h1+h2, h2+h3, h3+h4, h4+h5, h5+h6`)) {
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

		const HeadingNumber = /^[1-9]\d*\.$|/;

		for (const heading of fragment.querySelectorAll(
			`h1:not([id]):not(:empty),h2:not([id]):not(:empty),h3:not([id]):not(:empty),h4:not([id]):not(:empty),h5:not([id]):not(:empty),h6:not([id]):not(:empty)`,
		)) {
			const level = parseFloat(heading.nodeName[1]);
			const textSpan = heading.querySelector('span[token-type]');
			const textNode =
				(textSpan && textSpan.firstChild && textSpan.firstChild.nodeType === TEXT_NODE && textSpan.firstChild) ||
				undefined;

			const number = textNode && heading.matches('hgroup > *') && parseFloat(HeadingNumber.exec(textSpan.textContent));

			// Assuming all hgroup headings are either intentional or
			//   implied from markout notation, we want to pull out
			//   numbering into a data attribute
			number > 0 && ((heading.dataset.headingNumber = number), textNode.remove());

			// We're limit anchoring from H1 thru H3
			// if (parseFloat(heading.nodeName[1]) > 3) continue;

			const [, identity] = Identity.exec(heading.textContent) || '';
			if (!identity) continue;
			const anchor = document.createElement('a');
			anchor.id = identity
				.replace(Prefixer, '')
				.replace(Joiner, '-')
				.toLowerCase();
			anchor.append(...heading.childNodes);
			// anchor.tabIndex = -1;
			anchor.heading = heading.anchor = {anchor, identity, heading, level, number};
			heading.appendChild(anchor);

			// Unique mappings are prioritized by heading level
			(anchor.id in headings && headings[anchor.id].level > level) || (headings[anchor.id] = heading.anchor);
		}
	};

	/** @param {DocumentFragment} fragment */
	const normalizeBlockquotesInFragment = fragment => {
		/** @type {HTMLQuoteElement} */
		let previousBlockquote, nextBlockquote;
		/** @type {Node | Element} */
		let node, previousNode;
		const {COMMENT_NODE, TEXT_NODE, ELEMENT_NODE} = fragment;
		/** @type {IterableIterator<HTMLQuoteElement>} */
		const matchedBlockquotes = fragment.querySelectorAll(
			// 'blockquote[blockquote-level]+:not(blockquote)[blockquote-level]')
			':not(blockquote)[blockquote-level]+blockquote[blockquote-level]',
		);

		// return;
		for (const lastBlockquote of matchedBlockquotes) {
			nextBlockquote = lastBlockquote;

			(previousNode = undefined);

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
				normalizeBlockquotesInFragment.log({node, lastBlockquote, nextBlockquote, previousBlockquote});
				// debugger;
				continue;
			}

			while (node != null && (node.nodeName !== 'BLOCKQUOTE' || !(previousBlockquote = node))) {
				node.blockquoteLevel =
					node.nodeType === ELEMENT_NODE
						? parseFloat(node.getAttribute('blockquote-level'))
						: nextBlockquote.blockquoteLevel;
				previousNode = node.previousSibling;
				if (node.blockquoteLevel === nextBlockquote.blockquoteLevel) ; else if (node.blockquoteLevel > nextBlockquote.blockquoteLevel) {
					previousBlockquote = nextBlockquote;
					nextBlockquote = document.createElement('blockquote');
					nextBlockquote.setAttribute('blockquote-level', (nextBlockquote.blockquoteLevel = node.blockquoteLevel));
					// debugger;
					previousBlockquote.prepend(nextBlockquote);
				} else if (node.blockquoteLevel < nextBlockquote.blockquoteLevel) {
					if (node.blockquoteLevel < lastBlockquote.blockquoteLevel) {
						// TODO: Is it safer to coerce or superseede?!
						// debugger;
						node.blockquoteLevel = lastBlockquote.blockquoteLevel;
					}
					while (
						nextBlockquote.blockquoteLevel >= lastBlockquote.blockquoteLevel &&
						node.blockquoteLevel <
							nextBlockquote.blockquoteLevel(
								nextBlockquote.parentElement.blockquoteLevel < nextBlockquote.blockquoteLevel,
							)
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
						: (previousBlockquote.blockquoteLevel = parseFloat(previousBlockquote.getAttribute('blockquote-level')))) >
					0
				) {
					if (previousBlockquote.blockquoteLevel < lastBlockquote.blockquoteLevel) {
						// TODO: Is it safer to coerce or superseede?!
						// debugger;
						continue;
					}

					if (previousBlockquote.blockquoteLevel === lastBlockquote.blockquoteLevel) {
						if (
							previousBlockquote.childElementCount === 1 &&
							previousBlockquote.firstElementChild.nodeName === 'DETAILS'
						) {
							previousBlockquote.firstElementChild.append(...lastBlockquote.childNodes);
						} else {
							previousBlockquote.append(...lastBlockquote.childNodes);
						}
						lastBlockquote.remove();
					}
				} else if (!previousBlockquote.hasAttribute('blockquote-level')) {
					previousBlockquote.setAttribute(
						'blockquote-level',
						(previousBlockquote.blockquoteLevel = lastBlockquote.blockquoteLevel),
					);
					// TODO: Figure out if we can merge!
					// debugger;
				}
			}
		}
	};

	/** @param {{node: Node | Element, lastBlockquote: HTMLQuoteElement, nextBlockquote?: HTMLQuoteElement,  previousBlockquote?:HTMLQuoteElement} } nodes */
	normalizeBlockquotesInFragment.log = nodes => {
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

	const normalizeChecklistsInFragment = fragment => {
		for (const checklist of fragment.querySelectorAll(
			'li[type=checkbox]:not([checked]):not([indeterminate]) li[type=checkbox]:not([checked])',
		)) {
			let parentChecklist = checklist;
			// console.log({checklist, parentChecklist});
			while ((parentChecklist = parentChecklist.parentElement.closest('li[type=checkbox]'))) {
				if (parentChecklist.hasAttribute('checked') || parentChecklist.hasAttribute('indeterminate')) break;
				parentChecklist.setAttribute('indeterminate', '');
			}
		}
	};

	const normalizeParagraphsInFragment = fragment => {
		for (const empty of fragment.querySelectorAll('p:empty')) empty.remove();
	};

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

	const flattenTokensInFragment = fragment => {
		for (const token of fragment.querySelectorAll('span[token-type],tt[token-type]')) {
			token.nodeName === 'TT' || token.before(...token.childNodes);
			token.remove();
		}
	};

	const applyDeclarativeStylingInFragment = fragment => {
		if (
			typeof declarativeStyling.apply === 'function' &&
			typeof declarativeStyling.selector === 'string' &&
			declarativeStyling.selector !== ''
		)
			for (const element of fragment.querySelectorAll(declarativeStyling.selector)) declarativeStyling.apply(element);
	};

	const renderSourceTextsInFragment = fragment => {
		const promises = [];

		for (const element of fragment.querySelectorAll(`[${SourceTypeAttribute}]:not(:empty)`))
			promises.push(
				renderSourceText({
					element,
					sourceType: element.getAttribute(MarkupModeAttribute) || element.getAttribute(SourceTypeAttribute),
					sourceText: element.textContent,
				}),
			);

		return promises.length ? Promise.all(promises) : Promise.resolve();
	};

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
				? !element.hasAttribute(MarkupSyntaxAttribute) &&
				  (sourceType ||
						(sourceType = element.getAttribute(MarkupModeAttribute) || element.getAttribute(SourceTypeAttribute)),
				  sourceText || (sourceText = element.textContent || ''))
				: sourceText))
		)
			return void console.warn('Aborted: renderSourceText(%o => %o)', arguments[0], {element, sourceType, sourceText});

		element != null
			? element.removeAttribute(SourceTypeAttribute)
			: ((element = document.createElement('pre')).className = 'markup code');

		state = element['(markup)'] = {element, sourceText, sourceType, fragment: document.createDocumentFragment()};

		// TODO: Implement proper out-of-band handling for js versus es modes
		if (/^(js|javascript|es|ecmascript)$/i.test(sourceType)) {
			(state.parsingGoal = element.matches('[script=module], [module]')
				? 'module'
				: element.matches('[script]')
				? 'script'
				: 'code') === 'module' && (state.sourceType = sourceType = 'es');
		}

		element.setAttribute(MarkupSyntaxAttribute, state.sourceType);
		element.textContent = '';
		element.sourceText = sourceText;
		// await markup.render(sourceText, {sourceType, fragment});
		await render$1(sourceText, state);
		element.appendChild(state.fragment);

		return element;
	};

	return {
		defaults,
		createRenderedFragment,
		normalizeRenderedFragment,
		populateAssetsInFragment,
		normalizeBreaksInFragment,
		normalizeHeadingsInFragment,
		normalizeChecklistsInFragment,
		normalizeParagraphsInFragment,
		flattenTokensInFragment,
		applyDeclarativeStylingInFragment,
		renderSourceTextsInFragment,
	};
})();

const SourceTypeAttribute = 'source-type';
const MarkupModeAttribute = 'markup-mode';
const MarkupSyntaxAttribute = 'markup-syntax';

const AssetTypeMap = Enum({
	IMG: 'images',
	VIDEO: 'videos',
	SOURCE: 'sources',
});

const AssetSelector = ['script', 'style', ...Object.keys(AssetTypeMap)]
	.map(tag => `${tag.toUpperCase()}[src]:not([slot])`)
	.join(',');

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
const URLPrefix = /^(?:https?:|HTTPS?:)\/\/\S+$|^(?:[A-Za-z][!%\-0-9A-Za-z_~]+\.)+(?:[a-z]{2,5}|[A-Z]{2,5})(?:\/\S*|)$/u;
const URLString = /^\s*(?:(?:https?:|HTTPS?:)\/\/\S+|(?:[A-Za-z][!%\-0-9A-Za-z_~]+\.)+(?:[a-z]{2,5}|[A-Z]{2,5})\/\S*)\s*$/u;
const URLScheme = /^https?:|HTTPS?:/;
//
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
						context.renderedText += `<${context.block} class="markup code" ${SourceTypeAttribute}="${sourceType ||
							'markup'}"${(sourceAttributes && ` ${sourceAttributes}`) || ''}>${encodeEntities(context.passthru)}</${
							context.block
						}>`;
						context.header = context.indent = context.fenced = context.passthru = '';
					} else {
						// passthru code
						context.passthru += body.replace(context.indent, '');
					}
					continue;
				} else if (context.url) {
					if (type === 'text') {
						context.passthru += text;
						continue;
					}
					if (URLString.test(context.passthru)) {
						[before, context.url, after] = context.passthru.split(/(\S+)/);
						context.renderedText += `${before}<span href="${encodeURI(
							URLScheme.test(context.url) ? context.url : `https://${context.url}`,
						)}">${context.url}</span>${after}`;
						before = after = undefined;
						// console.log(context.passthru, token);
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
								(next.punctuator !== 'closer' && !closer.test(next.text))
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
	elements = {'markout-details': 'details'},
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

export { MarkupSyntaxAttribute as M, SourceTypeAttribute as S, normalizeRenderedFragment as a, renderSourceTextsInFragment as b, createRenderedFragment as c, defaults as d, MarkupModeAttribute as e, normalize as n, populateAssetsInFragment as p, render as r, tokenize as t };
//# sourceMappingURL=common.js.map
