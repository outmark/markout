// import dynamicImport from '/browser/dynamic-import.js';
// import {sequence} from '/markout/lib/helpers.js';
import {SegmentMatcher, INSET, LOOKAHEAD, UNKNOWN} from '/markup/packages/matcher/lib/segment-matcher.js';

// console.log(import.meta.url);

globalThis.$mo = async function debug(specifier = '/markout/examples/markdown-testsuite.md') {
	const timestamp = `?${encodeURIComponent(Date.now())}`;
	const url = new URL(specifier, location);
	const response = await fetch(url);
	if (!response.ok) console.warn(Error(`Failed to fetch ${url}`));
	const sourceText = await response.text();
	// console.log(dynamicImport);
	const {debugMatcher, debugSegmenter = debugMatcher} = await (1, eval)('specifier => import(specifier)')(
		'/markup/packages/matcher/lib/debug.js',
	);
	debugSegmenter(MarkoutSegments, sourceText);
};

export const MarkoutSegments = (() => {
	const MarkoutLists = SegmentMatcher.sequence/* regexp */ `[-*]|[1-9]+\d*\.|[ivx]+\.|[a-z]\.`;
	const MarkoutMatter = SegmentMatcher.sequence/* regexp */ `---(?=\n.+)(?:\n.*)+?\n---`;
	const MarkoutStub = SegmentMatcher.sequence/* regexp */ `<!--[^]*?-->|<!.*?>|<\?.*?\?>|<%.*?%>|<(?:\b|\/).*(?:\b|\/)>.*`;
	const MarkoutStart = SegmentMatcher.sequence/* regexp */ `(?!(?:${MarkoutLists}) )(?:[^#${'`'}~<>|\n\s]|${'`'}{1,2}(?!${'`'})|~{1, 2}(?!~))`;
	const MarkoutLine = SegmentMatcher.sequence/* regexp */ `(?:${MarkoutStart})(?:${MarkoutStub}|.*)*$`;
	// const MarkoutDivider = SegmentMatcher.sequence/* regexp */`-(?:[ \t]*-)+|=(?:=[ \t]*)+`;
	const MarkoutDivider = SegmentMatcher.sequence/* regexp */ `-{2,}|={2,}|\*{2,}|(?:- ){2,}-|(?:= ){2,}=|(?:\* ){2,}\*`;
	const MarkoutATXHeading = SegmentMatcher.sequence/* regexp */ `#{1,6}(?= +${MarkoutLine})`;
	const MarkoutTextHeading = SegmentMatcher.sequence/* regexp */ `${MarkoutStart}.*\n(?=\2\={3,}\n|\2\-{3,}\n)`;

	const MarkoutSegments = SegmentMatcher.define(
		entity => SegmentMatcher.sequence/* regexp */ `^
		  (?:
		    ${entity(UNKNOWN)}(${MarkoutMatter}$|[ \t]*(?:${MarkoutStub})[ \t]*$)|
		    (?:
		      ${entity(INSET)}((?:  |\t)*?(?:> ?)*?(?:> ?| *))
		      (?:
		        ${entity('fence')}(?:(${'```'}|~~~)(?=.*\n)[^]*?\n\2\3.*$)|
		        ${entity('table')}(?:([|](?=[ :-]).+[|]$)(?:\n\2[|].+[|]$)+)|
		        ${entity('heading')}(?:(${MarkoutATXHeading}|${MarkoutTextHeading}).*$)|
		        ${entity('list')}(?:(${MarkoutLists}) +${MarkoutLine}(?:\n\2 {2,4}${MarkoutLine})*$)|
		        ${entity('alias')}(?:(\[.+?\]: .+)$)|
		        ${entity('divider')}(?:(${MarkoutDivider})$)|
		        ${entity('feed')}(?:([ \t]*(?:\n\2[ \t])*)$)|
		        ${entity('paragraph')}(?:(${MarkoutLine}(?:\n\2 {0,2}${MarkoutLine})*)$)
		      )|
		      ${entity(UNKNOWN)}(.+?$)
		    )
		  )(?=${entity(LOOKAHEAD)}(\n?^.*$)?)
		`,
		'gmi',
	);
	return MarkoutSegments;
})();
