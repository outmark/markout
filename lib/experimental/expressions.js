import {Matcher} from '/modules/matcher/matcher.js';

/** Arrays of isolated characters */
export const ranges = {};

/** Strings forms of partial recursive expressions */
export const sequences = {};

/** Recursive expressions intended to search for qualified substring */
export const matchers = {};

/** Isolated expressions intended to test a qualified string */
export const patterns = {};

/** Strings forms of partial isolated expressions */
export const partials = {};

{
	const {freeze} = Object;
	const {sequence, escape, join} = Matcher;

	/** @param {string} string */
	const upper = string => string.toUpperCase();
	/** @param {string} string */
	const lower = string => string.toLowerCase();
	/** @param {string} string @param {string} [delimiter] */
	const split = (string, delimiter = '') => string.split(delimiter);
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
	split.cases = (string, delimiter = '') => {
		/** Ordered array of every unique original cased atom in the original string */
		const initialCase = freeze(union(...split(string, delimiter)));

		const lowerCaseString = lower(string);
		const upperCaseString = upper(string);

		if (lowerCaseString === upperCaseString) return [initialCase, initialCase, initialCase, initialCase];

		/** Ordered array of every unique original and transformed cased atom in the original string */
		const everyCase = freeze(
			union(...split(`${string}${delimiter}${lowerCaseString}${delimiter}${upperCaseString}`, delimiter)),
		);

		/** Ordered array of every unique lower cased atom in the original string */
		const lowerCase = freeze(union(...split(lowerCaseString, delimiter)));

		/** Ordered array of every unique upper cased atom in the original string */
		const upperCase = freeze(union(...split(upperCaseString, delimiter)));

		return everyCase.length === initialCase.length
			? [initialCase, lowerCase, upperCase, initialCase]
			: [everyCase, lowerCase, upperCase, initialCase];
	};

	/** @template T @param {...T} values @returns T[] */
	const union = (...values) => [...new Set(values)];

	const range = (...atoms) => `[${atoms.map(range.escape).join('')}]`;
	range.escape = (atom, index) =>
		atom === ']' ? '\\]' : atom === '\\' ? '\\\\' : atom === '-' && index !== 0 ? '\\-' : atom;

	Ranges: {
		const FENCE_MARKS = '`~';
		const LIST_MARKERS = '-*'; // 0=square 1=disc
		const CHECK_MARKS = ' x-'; // 0=unchecked 1=checked 2=indeterminate
		// NOTE: Ambiguities when testing if `i.` is roman or
		//       latin require temporary restrictions in favor
		//       of the more popular latin form.
		//
		//       Only the subset of ['i', 'v', 'x', 'l'] is
		//       used which excludes ['c', 'd', 'm'].
		const ARABIC_NUMBERS = '0123456789';
		const LATIN_LETTERS = 'abcdefghijklmnopqrstuvwxyz';
		const ROMAN_NUMERALS = 'ivxl';
		const NUMBERING_SEPARATORS = '.)';

		ranges.FenceMarks = freeze(split(FENCE_MARKS));

		ranges.ListMarkers = freeze(split(LIST_MARKERS));
		[ranges.CheckMarks, ranges.LowerCheckMarks, ranges.UpperCheckMarks] = split.cases(CHECK_MARKS);
		ranges.ArabicNumbers = freeze(split(ARABIC_NUMBERS));
		[ranges.LatinLetters, ranges.LowerLatinLetters, ranges.UpperLatinLetters] = split.cases(LATIN_LETTERS);
		[ranges.RomanNumerals, ranges.LowerRomanNumerals, ranges.UpperRomanNumerals] = split.cases(ROMAN_NUMERALS);
		ranges.NumberingSeparators = freeze(split(NUMBERING_SEPARATORS));
	}

	// TODO: Document partials and sequences

	Partials: {
		partials.BlockFence = join(...ranges.FenceMarks.map(fence => escape(fence.repeat(3))));

		// Unordered lists are broken into two distinct classes:
		//
		//   NOTE: Markout differs here in that markers are not semantically interchangeable
		//
		//   1. Matching Square character (ie `-` per popular notation):
		partials.SquareMark = escape(ranges.ListMarkers[0]);
		//
		//   2. Matching Disc character (ie `*` per lesser popular notation):
		partials.DiscMark = escape(ranges.ListMarkers[1]);
		//
		//   Unordered mark is the range of Square/Disc characters:
		partials.UnorderedMark = range(...ranges.ListMarkers);

		partials.NumberingSeparator = range(...ranges.NumberingSeparators);

		// Ordered lists are broken into three distinct classes:
		//
		//   NOTE: Ordered markers include both the numbering and trailing sparator.
		//
		//   1. Matching Decimal characters (one or more with leading zeros)
		//        NOTE: lookahead here is necessary to exclude matching just zero(s)
		partials.ArabicNumbering = sequence`(?=${ranges.ArabicNumbers[0]}*${range(
			...ranges.ArabicNumbers.slice(1),
		)})${range(...ranges.ArabicNumbers)}+`;
		//
		//      Matching Zero-leading Decimal characters (two or more):
		//        NOTE: lookahead here is necessary to exclude matching just zero(s)
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
	}

	Sequences: {
		sequences.DiscMarker = sequence`(?:${partials.DiscMark} )(?!${partials.Checkbox})`;
		sequences.SquareMarker = sequence`(?:${partials.SquareMark} )(?!${partials.Checkbox})`;
		sequences.UnorderedMarker = sequence`(?:${partials.UnorderedMark} )(?!${partials.Checkbox})`;
		sequences.ArabicMarker = `(?:${partials.ArabicMarker} )`;
		sequences.LatinMarker = sequence`(?:${partials.LatinMarker} )`;
		sequences.RomanMarker = sequence`(?:${partials.RomanMarker} )`;
		sequences.OrderedMarker = sequence`(?:${partials.OrderedMarker} )`;
		sequences.ChecklistMarker = sequence`(?:${partials.ChecklistMarker} )`;

		// There are two groups of list marker expressions:
		sequences.ListMarkerHead = sequence`(?:${partials.ListMarkerHead})(?: )`;
		sequences.ListMarker = sequence`(?:${join(
			sequences.ChecklistMarker,
			sequences.UnorderedMarker,
			sequences.OrderedMarker,
		)})`;

		// console.log({sequences, ranges, partials});
	}

	Matchers: {
		const INSET = sequence`[> \t]*`;
		// const ListMarker = sequence`[-*](?: |$)|[1-9]+\d*[.)](?: |$)|[a-z][.)](?: |$)|[ivx]+\.(?: |$)`;

		sequences.NormalizableBlocks = sequence/* fsharp */ `
      (?:^|\n)(${INSET}(?:${partials.BlockFence}))[^]+?(?:(?:\n\1[ \t]*)+\n?|$)
      |([^]+?(?:(?=\n${INSET}(?:${partials.BlockFence}))|$))
    `;
		matchers.NormalizableBlocks = new RegExp(sequences.NormalizableBlocks, 'g');

		sequences.NormalizableParagraphs = sequence/* fsharp */ `
      ^
      ((?:[ \t]*\n(${INSET}))+)
      ($|(?:
        (?!(?:${sequences.ListMarker}))
        [^-#>|~\n].*
        (?:\n${INSET}$)+
      )+)
    `;
		matchers.NormalizableParagraphs = new RegExp(sequences.NormalizableParagraphs, 'gmu');

		sequences.RewritableParagraphs = sequence/* fsharp */ `
      ^
      ([ \t]*[^\-\*#>\n].*?)
      (\b.*[^:\n\s>]+|\b)
      [ \t]*\n[ \t>]*?
      (?=(
        \b
        |${escape('[')}.*?${escape(']')}[^:\n]?
        |[^#${'`'}${escape('[')}\n]
      ))
    `;

		matchers.RewritableParagraphs = new RegExp(sequences.RewritableParagraphs, 'gmu');

		sequences.NormalizableLists = sequence/* fsharp */ `
      (?=(\n${INSET})(?:${sequences.ListMarker}))
      ((?:\1
        (?:${sequences.ListMarker}|   ?)+
        [^\n]+
        (?:\n${INSET})*
        (?=\1|$)
      )+)
    `;
		matchers.NormalizableLists = new RegExp(sequences.NormalizableLists, 'gmu');

		sequences.NormalizableListItem = sequence/* fsharp */ `
      ^
      (${INSET})
      ((?:${sequences.ListMarkerHead})|)
      ([^\n]+(?:\n\1(?:   ?|\t ?)(?![ \t]|${sequences.ListMarker}).*)*)$
    `;
		matchers.NormalizableListItem = new RegExp(sequences.NormalizableListItem, 'gmu');

		sequences.NormalizableReferences = sequence/* fsharp */ `
      \!?
      ${escape('[')}(\S.*?\S)${escape(']')}
      (?:
        ${escape('(')}(\S[^\n${escape('()[]')}]*?\S)${escape(')')}
        |${escape('[')}(\S[^\n${escape('()[]')}]*\S)${escape(']')}
      )
		`;
		// NOTE: Safari seems to struggle with /\S|\s/gmu
		matchers.NormalizableReferences = new RegExp(sequences.NormalizableReferences, 'gm');

		sequences.RewritableAliases = sequence/* fsharp */ `
      ^
      (${INSET})
      ${escape('[')}(\S.*?\S)${escape(']')}:\s+
      (\S+)(?:
        \s+${'"'}([^\n]*)${'"'}
        |\s+${"'"}([^\n]*)${"'"}
        |
      )\s*$
		`;
		// NOTE: Safari seems to struggle with /\S|\s/gmu
		matchers.RewritableAliases = new RegExp(sequences.RewritableAliases, 'gm');

		sequences.NormalizableLink = sequence/* fsharp */ `
      \s*((?:\s?[^${`'"`}${escape('()[]')}}\s\n]+)*)
      (?:\s+[${`'"`}]([^\n]*)[${`'"`}]|)
		`;
		// NOTE: Safari seems to struggle with /\S|\s/gmu
		matchers.NormalizableLink = new RegExp(sequences.NormalizableLink);
	}
}
