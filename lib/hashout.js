/** @param {HTMLAnchorElement} anchor */
export const getAliasForAnchor = anchor => {
  // Abort if no anchor or '(base)' is assigned or null
  if (!anchor || anchor.nodeName !== 'A' || !anchor.parentElement) return null;
  if (anchor['(alias)'] !== undefined) return anchor['(alias)'] || null;

  let name = anchor.getAttribute('alias');

  return (anchor['(alias)'] =
    (name && anchor.getRootNode().querySelector(`a[rel=alias][name="${name}"][ref]`)) || null);
};

/** @param {HTMLAnchorElement} anchor */
export const getBaseForAnchor = anchor => {
  // Abort if no anchor or '(base)' is assigned or null
  if (!anchor || anchor.nodeName !== 'A' || !anchor.parentElement) return null;
  if (anchor['(base)'] !== undefined) return anchor['(base)'] || null;

  return (anchor['(base)'] = anchor.parentElement.querySelector('base[href]') || null);
};

export const rewriteAnchors = (
  anchors,
  {
    RewritableURL = rewriteAnchors.defaults.RewritableURL,
    sourceURL,
    baseURL,
    search,
    rootNode = document,
    debugging = import.meta['debug:hashout:anchor-rewrite'],
  },
) => {
  debugging && console.groupCollapsed('%O ‹anchors› ', rootNode);

  for (const anchor of anchors) {
    const href = anchor.getAttribute('href');
    if (!href) continue;
    const [matched, parent, name, extension = '.md', query = '', hash = ''] = RewritableURL.exec(
      href.replace(/%23|%3F/g, decodeURIComponent),
    );

    // const alias = getAliasForAnchor(anchor);
    // const baseNode = (alias && getBaseForAnchor(alias)) || getBaseForAnchor(anchor);
    // const base = (alias && alias.name && /^\/\S+\/$/.test(alias.name) && baseNode && baseNode.href) || sourceURL;
    const base = sourceURL;

    debugging && console.log({matched, parent, name, extension, query, hash, base});

    if (base !== sourceURL) {
      anchor.href = new URL(matched, base);
      anchor.target || (anchor.target = '_blank');
    } else if (parent) {
      const pathname = `${parent}${name ? `${name}${extension}` : ''}`;
      const href =
        name && extension.toLowerCase() === '.md'
          ? `${baseURL}${search}#${new URL(pathname, base).pathname}${hash}`
          : new URL(`${pathname}${query || (!hash && search) || ''}${hash}`, base);
      anchor.href = href;
    } else if (hash) {
      anchor.href = `${location}${matched}`;
    } else {
      anchor.target || (anchor.target = '_blank');
    }

    // if (debugging && hash) debugger;
    debugging && console.dirxml(anchor);
  }

  debugging && console.groupEnd();
};

rewriteAnchors.defaults = {
  RewritableURL: /^(\.*(?=\/)[^?#\n]*\/|)(?:(?:([^/?#\n]+?)(?:(\.[a-z]+)|)|)|)(\?[^#]+|)(#.*|)$|/i,
};

/// Debugging
import {debugging} from '/markout/lib/helpers.js';

debugging('hashout', import.meta, [
  // import.meta.url.includes('/markout/lib/') ||
  typeof location === 'object' && /[?&]debug(?=[&#]|=[^&]*\bhashout|$)\b/.test(location.search),
  'anchor-rewrite',
]);
