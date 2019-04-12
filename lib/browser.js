import '../../../quench/elements/markout-content.js';
import * as hashout from './hashout.js';

(async () => {
	await customElements.whenDefined('markout-content');

	/**
	 * @typedef {HTMLAnchorElement} Anchor
	 */
	class MarkoutContent {
		async load(src) {
			let error;
			arguments.length || (src = this.getAttribute('src'));
			if (!src) return;
			const url = new URL(src, this.baseURI);
			// const previous = this.sourceURL;
			// try {
			// const loading = loadTextFrom(url);
			const response = await fetch(url);
			if (!response.ok) throw Error(`Failed to fetch ${url}`);
			const text = await response.text();
			this.sourceURL = url;
			this.sourceText = text || '';
			// return;
			// (error = loading.error) || ((this.sourceURL = url), (this.sourceText = text));
			// }
			// catch (exception) {
			// 	error = (exception.stack, exception);
			// }
			// if (error) {
			// 	// if (previous) this.sourceURL = previous;
			// 	throw error;
			// }
			// return;
		}

		/**
		 * @typedef {Array<Anchor>} Anchors
		 * @param {Anchors} anchors
		 */
		rewriteAnchors(...anchors) {
			const debugging = import.meta['debug:markout:anchor-rewrite'];
			const rootNode = this;
			const {sourceURL, baseURL = `/markout/`} = rootNode;
			const search = location.search || '';
			hashout.rewriteAnchors(anchors.flat(), {debugging, sourceURL, baseURL, search, rootNode});
		}
	}

	const sections = document.body.querySelectorAll('markout-content[src]');
	if (sections) {
		const {load, rewriteAnchors} = MarkoutContent.prototype;
		for (const section of sections) {
			section.load || ((section.load = load), section.rewriteAnchors || (section.rewriteAnchors = rewriteAnchors)),
				section.load().catch(exception => (section.sourceText = `<pre>${exception}</pre>`));
		}
	}
})();

/// Debugging
import {debugging} from '/markout/lib/helpers.js';

// console.log(import.meta.url, /[?&]debug\b/.test(import.meta.url));

debugging('markout', import.meta, [
	// import.meta.url.includes('/markout/lib/') ||
	// /[?](?:.*[&]|)debug\b/.test(import.meta.url) ||
	// (typeof location === 'object' && /[?&]debug(?=[&#]|=[^&]*\bmarkout|$)\b/.test(location.search)),
	/[?&]debug\b/.test(import.meta.url) || /[?&]debug\b/.test(location.search),
	'anchor-rewrite',
]);
