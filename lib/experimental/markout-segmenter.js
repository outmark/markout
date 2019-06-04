// import dynamicImport from '/browser/dynamic-import.js';
// import dynamicImport from '/browser/dynamic-import.js';
import {sequence} from '/markout/lib/helpers.js';
// import {Segmenter, INSET, LOOKAHEAD, UNKNOWN} from './segmenter.js';
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
	const MarkoutLists = sequence`[-*]|[1-9]+\d*\.|[ivx]+\.|[a-z]\.`;
	const MarkoutMatter = sequence`---(?=\n.+)(?:\n.*)+?\n---`;
	const MarkoutStub = sequence`<!--[^]*?-->|<!.*?>|<\?.*?\?>|<%.*?%>|<(?:\b|\/).*(?:\b|\/)>.*`;
	const MarkoutStart = sequence`(?!(?:${MarkoutLists}) )(?:[^#${'`'}~<>|\n\s]|${'`'}{1,2}(?!${'`'})|~{1, 2}(?!~))`;
	const MarkoutLine = sequence`(?:${MarkoutStart})(?:${MarkoutStub}|.*)*$`;
	// const MarkoutDivider = sequence`-(?:[ \t]*-)+|=(?:=[ \t]*)+`;
	const MarkoutDivider = sequence`-{2,}|={2,}|\*{2,}|(?:- ){2,}-|(?:= ){2,}=|(?:\* ){2,}\*`;
	const MarkoutATXHeading = sequence`#{1,6}(?= +${MarkoutLine})`;
	const MarkoutTextHeading = sequence`${MarkoutStart}.*\n(?=\2\={3,}\n|\2\-{3,}\n)`;

	const MarkoutSegments = Segmenter.define(
		type =>
			sequence`^
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
