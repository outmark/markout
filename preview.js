// import {dynamicImport} from '../pholio/lib/import.js';
import dynamicImport from '/browser/dynamic-import.js';
// import {darkMode} from '/browser/dark-mode.js';
// import {darkMode} from '/browser/dark-mode.js#autoOnly';

// console.log({darkMode});

// Only bootstrap preview if in valid browser window scope
if (typeof document === 'object' && document && typeof location === 'object' && 'hash' in location) {
	// Pickup declarative link "from head" if present
	const link = document.head.querySelector(
		'link[rel="alternate" i][type^="text/markout" i][type^="text/markdown" i][type^="text/md" i][href], link[rel="alternate" i][href$=".md" i][href$=".markdown" i], link[rel="alternate" i][href]',
	);

	// Pickup or create markdown-section in the body
	const section = document.body.querySelector('markout-content') || document.create('markout-content');

	// TODO: https://developers.google.com/web/updates/2015/09/history-api-scroll-restoration

	bootstrap: {
		section.isConnected || document.body.appendChild(section);
		const base = new URL('../markout/', import.meta.url);

		const defined = customElements.whenDefined(section.localName);

		// Only promote to preview shell if src is not present
		if (!section.hasAttribute('src')) {
			// State
			const README = `${base}README.md`;
			const hashes = (history.state && history.state.hashes) || {};

			const scrollToFragment = async fragment => {
				const [, anchor] = /#?([\-\w]*)/.exec(fragment);
				if (!anchor) return;

				await defined;
				await new Promise(requestAnimationFrame);
				await new Promise(resolve => setTimeout(resolve, 150));
				await new Promise(requestAnimationFrame);
				await new Promise(resolve => setTimeout(resolve, 150));
				await new Promise(requestAnimationFrame);
				section.scrollToAnchor(anchor);
			};

			const load = async (source, title = document.title) => {
				let href, referrer, src, hash, head, tail, entry, extension, fragment;

				// Pickup current fragment when source is hashchanged event
				if (source && 'type' in source && source.type === 'hashchange') {
					if (source.oldURL === source.newURL) return;
					// Responsibly responsive - nothing more :)
					await new Promise(requestAnimationFrame);
					source = location;
				}

				((hash = location.hash.trim()) &&
					// We're using location fragment
					((!source && (source = location)) || source === location) &&
					(hashes[hash] ||
						((referrer = `${location}`), (href = hash.slice(1)), (src = `${new URL(href, referrer)}`)))) ||
					// We're using an alternate link
					(link &&
						(href = link.href) &&
						(!source || source === link) &&
						(source = link) &&
						(src = `${new URL(href, (referrer = `${location}`))}`)) ||
					// We're using the literal source or defaulting to README
					(src = `${new URL(
						(href = `${source || ''}`.trim() || (source = section).getAttribute('src') || (source = README)),
						(referrer = section.sourceURL || `${location}`),
					)}`);

				if (source === location && hash && hash.length > 1) {
					[, head, tail, entry = 'README', extension = '.md', fragment = ''] =
						/^#([^#]*)(\/(?:([^#\/.][^#\/]*?)(?:(\.\w+)|))?)(#.*|)$/.exec(hash) || '';

					if (tail) {
						href = `${head}\/${entry}${extension}${fragment || ''}`;
						referrer = `${location}`.replace(hash, (hash = `#${href}`));
						src = `${new URL(href, referrer)}`;
						history.replaceState({hashes}, title, referrer);
					}
				}

				hash || (hash = '#');
				hashes[hash]
					? ({referrer, href, src, fragment} = hashes[hash])
					: (hashes[hash] = {referrer, href, src, fragment});

				// console.log({hashes, hash, referrer, href, src});

				history.replaceState({hashes}, title, `${location}`);

				if (href === section.sourceURL) return;

				await (section.load ? section.load(href) : section.setAttribute('src', href));

				fragment && scrollToFragment(fragment);
			};
			section.baseURL || ((section.baseURL = location.href.replace(/[?#].*$|$/, '')) && load());
			addEventListener('hashchange', load, {passive: true});
		}

		// Only bootstrap markout-content if not already bootstrapped
		if (typeof section.load !== 'function' || !section.matches(':defined')) {
			const url = new URL(import.meta.url);
			location.search.length > 1 && (url.search += `${url.search ? '&' : '?'}${location.search.slice(1)}`);
			url.search && (url.search = `?${[...new Set(url.search.slice(1).split('&'))].sort().join('&')}`);
			const DEV = /[?&]dev\b/.test(url.search);
			const LIB = `${base}${DEV ? 'lib/browser.js' : 'dist/browser.js'}${url.search}`;
			dynamicImport(new URL(LIB, base));
		}
	}
}

// if (document.readyState !== 'complete') {
// 	let listener;
// 	(await new Promise(resolve =>
// 		addEventListener(
// 			...(listener = [
// 				'readystatechange',
// 				() =>
// 					document.readyState !== 'complete' || resolve(Reflect.apply(removeEventListener, document, listener)),
// 				{passive: true},
// 			]),
// 		),
// 	)) || (await new Promise(resolve => requestAnimationFrame(resolve)));
// }
