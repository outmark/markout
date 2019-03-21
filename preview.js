import {dynamicImport} from '../pholio/lib/import.js';

if (typeof document === 'object' && typeof location === 'object') {
	let title, href, hash, type;

	const section =
		document.querySelector('markout-content') || document.body.appendChild(document.create('markout-content'));

	const link = document.head.querySelector(
		'link[rel="alternate" i][type^="text/markout" i][type^="text/markdown" i][type^="text/md" i][href], link[rel="alternate" i][href$=".md" i][href$=".markdown" i], link[rel="alternate" i][href]',
	);

	const MarkoutPreviewBase = /\/?markout\/preview\.js\b.*$/i;
	const MarkoutBase = /\/?markout(?:\/.*)?$/i;
	const RootBase = /\/?$/;

	const base = MarkoutPreviewBase.test(import.meta.url)
		? import.meta.url.replace(MarkoutPreviewBase, '/')
		: location.origin
		? location.origin.replace(
				RootBase,
				MarkoutBase.test(location.pathname) ? location.pathname.replace(MarkoutBase, '/') : '/',
		  )
		: `${new URL('./', location)}`;

	if (!section.hasAttribute('src')) {
		const src =
			(link && ({href, title} = link) && href) ||
			((hash = location.hash) && (hash = hash.trim().slice(1)) && (href = `${new URL(hash, location.origin)}`)) ||
			((title = 'Markout'), `${base}./markout/README.md`);

		title ||
			((title = `${href.replace(/(.*?)((?:[^/]+?[/]?){1,2})(?:\..*|)$/, '$2')}`.trim()) &&
				(document.title = `${title} — Markout`));

		section.setAttribute('src', src);
	}

	addEventListener('hashchange', () => location.reload());

	const DEV = /^\?dev\b|\&dev\b/i.test(location.search);
	const LIB = `./${DEV ? 'lib/browser.js' : 'dist/browser.m.js'}`;

	dynamicImport(new URL(LIB, `${base}markout/`));
}

// section.rewriteAnchors = anchors => {
// 	for (const anchor of anchors) {
// 		!anchor || anchor.hash || !anchor.href || (anchor.href = `#${anchor.href}`);
// 	}
// };
// addEventListener('hashchange', () => {
// 	const src =
// 		(hash = location.hash) && (hash = hash.trim().slice(1)) && (href = `${new URL(hash, location.origin)}`);

// 	src && section.load(src);
// });

// const lib = `${base}quench/${
// 	/^\?dev\b|\&dev\b/i.test(location.search) ? 'lib/browser/markout.js' : 'dist/markout.m.js'
// }`;
// dynamicImport(lib);
