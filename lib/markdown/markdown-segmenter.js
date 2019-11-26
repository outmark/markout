// @ts-check

import {SegmentMatcher, INSET, LOOKAHEAD, UNKNOWN} from '/markup/packages/matcher/lib/segment-matcher.js';

export const MarkdownSegmenter = (() => {
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
