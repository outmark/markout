const RewritableURL = /^(\.*(?=\/)[^?#\n]*\/)(?:([^/?#\n]+?)(?:(\.[a-z]+)|)|)(\?[^#]+|)(#.*|)$|/i;

const {dir, dirxml, group, groupCollapsed, groupEnd, log} = console;

export const rewriteAnchors = (
	anchors,
	{sourceURL, baseURL, search, rootNode = document, debugging = import.meta['debug:hashout:anchor-rewrite']},
) => {
	debugging && groupCollapsed('%O ‹anchors› ', rootNode);

	for (const anchor of anchors) {
		const [matched, parent, name, extension = '.md', query = '', hash = ''] = RewritableURL.exec(
			anchor.getAttribute('href'),
		);

		debugging && log({matched, parent, name, extension, query, hash});

		if (parent) {
			const pathname = `${parent}${name ? `${name}${extension}` : ''}`;

			const href =
				name && extension.toLowerCase() === '.md'
					? `${baseURL}${search}#${new URL(pathname, sourceURL).pathname}`
					: new URL(`${pathname}${query || ((!hash && search) || '')}${hash}`, sourceURL);
			anchor.href = href;
		} else {
			anchor.target || (anchor.target = '_blank');
		}

		debugging && dirxml(anchor);
	}

	debugging && groupEnd();
};

/// Debugging
import {debugging} from '/markout/lib/helpers.js';

debugging('hashout', import.meta, [
	// import.meta.url.includes('/markout/lib/') ||
	typeof location === 'object' && /[?&]debug(?=[&#]|=[^&]*\bhashout|$)\b/.test(location.search),
	'anchor-rewrite',
]);
