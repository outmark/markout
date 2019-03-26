// export * from './markout.js';
import '../../../quench/elements/markout-content.js';
import {loadSourceTextFrom} from '../../../components/lib/fetch.js';

(async () => {
	const {dir, dirxml, group, groupCollapsed, groupEnd, log} = console;

	const AnchorClick = '(a#onclick)';

	const RewritableURL = /^(\.*(?=\/)[^?#\n]*\/)(?:([^/?#\n]+?)(?:(\.[a-z]+)|)|)(\?[^#]+|)(#.*|)$|/i;

	/**
	 * @typedef {HTMLAnchorElement} Anchor
	 */
	class MarkoutContent {
		async load(src) {
			arguments.length || (src = this.getAttribute('src'));
			if (!src) return;
			const url = new URL(src, this.baseURI);
			this.sourceURL = url;
			this.rewriteAnchors = rewriteAnchors;
			this.sourceText = (await loadSourceTextFrom(url)) || '';
		}

		/**
		 * @typedef {Array<Anchor>} Anchors
		 * @param {Anchors} anchors
		 */
		rewriteAnchors(...anchors) {
			const {debugging = false} = MarkoutContent.prototype.rewriteAnchors;

			const {sourceURL} = this;

			// TODO: Figure out why anchors is double nested!
			anchors = anchors.flat();

			// debugging && groupCollapsed('%O ‹anchors› ', this);
			debugging && group('%O ‹anchors› ', this);
			// debugging && log(anchors);

			// const {pathname, search} = location;

			const search = location.search || '';
			// /^\?dev\b|\&dev\b/i.test(location.search) ? location.search : '';

			for (const anchor of anchors) {
				const [matched, parent, name, extension = '.md', query = '', hash = ''] = RewritableURL.exec(
					anchor.getAttribute('href'),
				);

				debugging && console.log({matched, parent, name, extension, query, hash});

				if (parent) {
					const pathname = `${parent}${name ? `${name}${extension}` : ''}`;

					const href =
						name && extension.toLowerCase() === '.md'
							? `/markout/${search}#${new URL(pathname, sourceURL).pathname}`
							: new URL(`${pathname}${query || ((!hash && search) || '')}${hash}`, sourceURL);
					anchor.href = href;
				} else {
					anchor.target || (anchor.target = '_blank');
				}

				debugging && dirxml(anchor);
			}
			debugging && groupEnd();

			// this.rewriteAnchors = undefined;
		}

		// /**
		//  * @param {PointerEvent & {target: Anchor}} event
		//  */
		// [AnchorClick](event) {
		// 	if (!event || !event.preventDefault) return;
		// 	event.preventDefault();
		// 	const {target, currentTarget, relatedTarget, returnValue} = event;
		// 	log('%O ‹%O› %o', this, event, {target, currentTarget, relatedTarget, returnValue});
		// }
	}

	const {load, rewriteAnchors, [AnchorClick]: onclickFallback} = MarkoutContent.prototype;

	for (const section of document.body.querySelectorAll('markout-content[src]') || '') {
		section.load || (section.load = load), section.load();
	}
})();
