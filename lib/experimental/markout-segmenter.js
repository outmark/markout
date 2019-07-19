// import dynamicImport from '/browser/dynamic-import.js';
import {sequence} from '/markout/lib/helpers.js';
import {Segmenter, INSET, LOOKAHEAD, UNKNOWN} from '../../../modules/segmenter/segmenter.js';

// console.log(import.meta.url);

globalThis.$mo = async function debug(specifier = '/markout/examples/markdown-testsuite.md') {
	const timestamp = `?${encodeURIComponent(Date.now())}`;
	// const {MarkoutSegments} = await import(`/markout/lib/experimental/markout-segmenter.js${timestamp}`);
	const url = new URL(specifier, location);
	const response = await fetch(url);
	if (!response.ok) console.warn(Error(`Failed to fetch ${url}`));
	const sourceText = await response.text();
	// console.log(dynamicImport);
	// const {debugSegmenter} = await dynamicImport('/modules/segmenter/segmenter.debug.js');
	const {debugSegmenter} = await (1, eval)('specifier => import(specifier)')('/modules/segmenter/segmenter.debug.js');
	debugSegmenter(MarkoutSegments, sourceText);
};

export const MarkoutSegments = (() => {
	const MarkoutLists = sequence/* regexp */ `[-*]|[1-9]+\d*\.|[ivx]+\.|[a-z]\.`;
	const MarkoutMatter = sequence/* regexp */ `---(?=\n.+)(?:\n.*)+?\n---`;
	const MarkoutStub = sequence/* regexp */ `<!--[^]*?-->|<!.*?>|<\?.*?\?>|<%.*?%>|<(?:\b|\/).*(?:\b|\/)>.*`;
	const MarkoutStart = sequence/* regexp */ `(?!(?:${MarkoutLists}) )(?:[^#${'`'}~<>|\n\s]|${'`'}{1,2}(?!${'`'})|~{1, 2}(?!~))`;
	const MarkoutLine = sequence/* regexp */ `(?:${MarkoutStart})(?:${MarkoutStub}|.*)*$`;
	// const MarkoutDivider = sequence/* regexp */`-(?:[ \t]*-)+|=(?:=[ \t]*)+`;
	const MarkoutDivider = sequence/* regexp */ `-{2,}|={2,}|\*{2,}|(?:- ){2,}-|(?:= ){2,}=|(?:\* ){2,}\*`;
	const MarkoutATXHeading = sequence/* regexp */ `#{1,6}(?= +${MarkoutLine})`;
	const MarkoutTextHeading = sequence/* regexp */ `${MarkoutStart}.*\n(?=\2\={3,}\n|\2\-{3,}\n)`;

	const MarkoutSegments = Segmenter.define(
		type =>
			sequence/* regexp */ `^
		  (?:
		    ${type(UNKNOWN)}(${MarkoutMatter}$|[ \t]*(?:${MarkoutStub})[ \t]*$)|
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
		      ${type(UNKNOWN)}(.+?$)
		    )
		  )(?=${type(LOOKAHEAD)}(\n?^.*$)?)
		`,
		'gmi',
	);
	return MarkoutSegments;
})();
