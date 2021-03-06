﻿// @ts-check
/// <reference path="../global.d.ts" />

import {Matcher} from '/markup/packages/matcher/matcher.js';

import {atoms, range} from './helpers.js';

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
  ranges.Brackets = atoms.split('()[]');
  ranges.Braces = atoms.split('{}');

  Insets: {
    ranges.Inseter = atoms.split('\t >'); // 0=tab 1=space 2=quote
    partials.Inset = range(...ranges.Inseter);
  }

  Fences: {
    // NOTE: Ambiguities when testing if `~` is meant for
    //			 fencing or strikethrough here make it harder
    //			 to retain intent and traceablility.
    ranges.FenceMarks = atoms.split('`'); // 0=grave 1=tilde
    partials.BlockFence = Matcher.join(...ranges.FenceMarks.map(fence => Matcher.escape(fence.repeat(3))));
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

  Matchers: {
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

export const expressions = {ranges, sequences, matchers, patterns, partials};
