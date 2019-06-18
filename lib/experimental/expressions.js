import {Matcher} from '/modules/matcher/matcher.js';

export const sequences = {};
export const matchers = {};

{
	const {sequence, escape, join} = Matcher;

	const FENCE = sequence`${'`'.repeat(3)}|${escape('~').repeat(3)}`;
	const INSET = sequence`[> \t]*`;
	// const LIST = sequence`- ${escape('[')}[ xX]${escape(']')}(?: |$)|[-*] |[1-9]+\d*\. |[a-z]\. |[ivx]+\. `;
	// const LIST = sequence`[-*] (?=${escape('[')}[ xX]${escape(']')} |)|[1-9]+\d*\. |[a-z]\. |[ivx]+\. `;
	const LIST = sequence`[-*](?: |$)|[1-9]+\d*\.(?: |$)|[a-z][.)](?: |$)|[ivx]+\.(?: |$)`;

	sequences.NormalizableBlocks = sequence/* fsharp */ `
    (?:^|\n)(${INSET}(?:${FENCE}))[^]+?(?:(?:\n\1[ \t]*)+\n?|$)
    |([^]+?(?:(?=\n${INSET}(?:${FENCE}))|$))
  `;
	matchers.NormalizableBlocks = new RegExp(sequences.NormalizableBlocks, 'g');

	sequences.NormalizableParagraphs = sequence/* fsharp */ `
    ^
    ((?:[ \t]*\n(${INSET}))+)
    ($|(?:
      (?!(?:${LIST}))
      [^\-#>|~\n].*
      (?:\n${INSET}$)+
    )+)
  `;
	matchers.NormalizableParagraphs = new RegExp(sequences.NormalizableParagraphs, 'gm');

	sequences.RewritableParagraphs = sequence/* fsharp */ `
    ^
    ([ \t]*[^\-\*#>\n].*?)
    (\b.*[^:\n\s>]+|\b)
    [ \t]*\n[ \t>]*
    (?=(
      \b
      |${escape('[')}.*?${escape(']')}[^:\n]?
      |[^#${'`'}${escape('[')}\n]
    ))
  `;

	matchers.RewritableParagraphs = new RegExp(sequences.RewritableParagraphs, 'gm');

	sequences.NormalizableLists = sequence/* fsharp */ `
    (?=(\n${INSET})(?:${LIST}))
    ((?:\1
      (?:${LIST}|   ?)+
      [^\n]+
      (?:\n${INSET})*
      (?=\1|$)
    )+)
  `;
	matchers.NormalizableLists = new RegExp(sequences.NormalizableLists, 'g');

	sequences.NormalizableListItem = sequence/* fsharp */ `
    ^
    (${INSET})
    (${LIST}|)
    ([^\n]+(?:\n\1(?:   ?|\t ?)(?![ \t]|${LIST}).*)*)$
  `;
	matchers.NormalizableListItem = new RegExp(sequences.NormalizableListItem, 'gm');

	sequences.NormalizableReferences = sequence/* fsharp */ `
    \!?
    ${escape('[')}(\S.*?\S)${escape(']')}
    (?:
      ${escape('(')}(\S[^\n${escape('()[]')}]*?\S)${escape(')')}
      |${escape('[')}(\S[^\n${escape('()[]')}]*\S)${escape(']')}
    )
  `;
	matchers.NormalizableReferences = new RegExp(sequences.NormalizableReferences, 'gm');

	sequences.RewritableAliases = sequence/* fsharp */ `
    ^
    (${INSET})
    ${escape('[')}(\S.*?\S)${escape(']')}:\s+
    (\S+)(?:
      \s+${'"'}([^\n]*)${'"'}
      |\s+${"'"}([^\n]*)${"'"}
      |
    )(?=\s*$)
  `;
	matchers.RewritableAliases = new RegExp(sequences.RewritableAliases, 'gm');

	sequences.NormalizableLink = sequence/* fsharp */ `
    \s*(
      (?:\s?[^${`'"`}${escape('()[]')}}\s\n]+)*
    )
    (?:\s+[${`'"`}]([^\n]*)[${`'"`}]|)
  `;
	matchers.NormalizableLink = new RegExp(sequences.NormalizableLink);
}
