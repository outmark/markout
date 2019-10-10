import {SegmentMatcher, INSET, LOOKAHEAD, UNKNOWN} from '/markup/packages/matcher/lib/segment-matcher.js';

export const MarkoutSegments = (() => {
	const MarkoutLists = SegmentMatcher.sequence/* regexp */ `[-*]|[1-9]+\d*\.|[ivx]+\.|[a-z]\.`;
	const MarkoutMatter = SegmentMatcher.sequence/* regexp */ `---(?=\n.+)(?:\n.*)+?\n---`;
	const MarkoutStub = SegmentMatcher.sequence/* regexp */ `<!--[^]*?-->|<!.*?>|<\?.*?\?>|<%.*?%>|<(?:\b|\/).*(?:\b|\/)>.*`;
	const MarkoutStart = SegmentMatcher.sequence/* regexp */ `(?!(?:${MarkoutLists}) )(?:[^#${'`'}~<>|\n\s]|${'`'}{1,2}(?!${'`'})|~{1, 2}(?!~))`;
	const MarkoutLine = SegmentMatcher.sequence/* regexp */ `(?:${MarkoutStart})(?:${MarkoutStub}|.*)*$`;
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

MarkoutSegments.debug = async options => {
	const job = {options, ...options};
	try {
		job.timestamp = `?${encodeURIComponent(Date.now())}`;
		job.location =
			import.meta.location ||
			(import.meta.location =
				(globalThis.location != null &&
					typeof globalThis.location === 'object' &&
					globalThis.location &&
					globalThis.location.href) ||
				import.meta.url.replace(/\/(?:node_modules\/(?:@.+?\/|)|)(?:markout\/|)lib\/.*$/, '/'));
		if (job.specifier != null) {
			job.sourceText = null;
			job.url = new URL(job.specifier, job.location);
			job.response = await (job.request = fetch(job.url));
			if (!job.response.ok) throw Error(`Failed to fetch ${job.url}`);
			job.sourceText = await job.response.text();
		}
		if (job.sourceText != null) {
			/** @type {import('/markup/packages/matcher/lib/debug.js')} exports */
			const {debugMatcher} =
				import.meta.import['import(‹/markup/packages/matcher/lib/debug.js›)'] ||
				(await import.meta.import('/markup/packages/matcher/lib/debug.js'));
			debugMatcher(MarkoutSegments, job.sourceText, (job.debugging = {}));
		}
	} catch (exception) {
		job.error = exception;
	} finally {
		console.group('%o', job);
		if (job.error) console.warn(job.error);
		console.groupEnd();
	}
};

if (!import.meta.import) {
	Object.defineProperty(import.meta, 'import', {
		value: (ƒ => {
			import.meta.import = ƒ;
			ƒ = import.meta[`‹${(ƒ.url = import.meta.url)}›`] = ƒ.bind((ƒ.meta = import.meta));
			// console.log(import.meta);
			return ƒ;
		})(
			{
				/**
				 * @template {string} T
				 * @template V
				 * @param {T} url
				 * @returns {V extends {} ? V : Record<string, unknown>}
				 */
				async import(url) {
					let key, exports;
					key = 'import()';
					exports = this.import[key] || (this.import[key] = Object.freeze(Object.create(null)));
					url = `${url}`;
					try {
						if (url.includes('/') || url.startsWith('data:')) {
							key = `import(‹${url}›)`; //new URL(url, 'file:///').href;
							exports =
								key in this
									? this.import[key]
									: (this.import[key] = await (this['‹@›'] ||
											(this['‹@›'] = (1, eval)('specifier => import(specifier)')))(url));
						}
					} finally {
						exports !== this.import['import()'] || key in this || (this.import[key] = this.import['import()']);
					}
					return exports;
				},
			}.import,
		),
		writable: false,
	});
}

globalThis.$mo = (specifier = '/markout/examples/markdown-testsuite.md') => MarkoutSegments.debug({specifier});

/**
 * @template {string} T
 * @template V
 * @typedef {(url: T) => V extends {} ? V : import(T)} import.from
 */
