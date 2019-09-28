//@ts-check
/// <reference path="./types.d.ts" />

import {Enum} from '../helpers.js';

import './markup.js';
import './dom/normalizer.js';
import './dom/renderer.js';
// export * from './dom/normalizer.js';
// export * from './dom/renderer.js';
import {content} from './content.js';

/** @param {Fragment} fragment */
export const populateAssetsInFragment = fragment => {
	if (!fragment || fragment.assets) return;
	fragment.assets = [];

	for (const link of /** @type {Iterable<Link>} */ (fragment.querySelectorAll(content.AssetNodeSelector))) {
		if (link.nodeName === 'SCRIPT') {
			if (link.type === 'module') {
				(fragment.assets.modules || (fragment.assets.modules = [])).push(/** @type {HTMLScriptElement} */ (link));
			} else if (!link.type || link.type.trim().toLowerCase() === 'text/javascript') {
				(fragment.assets.scripts || (fragment.assets.scripts = [])).push(/** @type {HTMLScriptElement} */ (link));
			}
		} else if (link.nodeName === 'STYLE') {
			if (!link.type || link.type.trim().toLowerCase() === 'text/css') {
				(fragment.assets.stylesheets || (fragment.assets.stylesheets = [])).push(
					/** @type {HTMLStyleElement} */ (link),
				);
			}
		} else {
			/** @type {Links} */ (
				fragment.assets[content.AssetNodeMap[link.nodeName]] ||
				//@ts-ignore
				(fragment.assets[content.AssetNodeMap[link.nodeName]] = [])
			).push(link);
		}
		fragment.assets.push(link);
	}

	return fragment;
};

/** @param {Fragment} fragment */
export const flattenTokensInFragment = fragment => {
	for (const token of fragment.querySelectorAll('span[token-type],tt[token-type]')) {
		token.nodeName === 'TT' || token.before(...token.childNodes);
		token.remove();
	}
};

export const AssetNodeMap = Enum({
	IMG: 'images',
	SOURCE: 'sources',
	VIDEO: 'videos',
});

export const AssetNodeSelector = ['script', 'style', ...Object.keys(AssetNodeMap)]
	.map(tag => `${tag.toUpperCase()}[src]:not([slot])`)
	.join(',');

content.AssetNodeSelector = AssetNodeSelector;
content.AssetNodeMap = AssetNodeMap;
content.populateAssetsInFragment = populateAssetsInFragment;
content.flattenTokensInFragment = flattenTokensInFragment;

/** @typedef {import('./types').Fragment} Fragment */
/** @typedef {import('./types').Fragment.Link} Link */
/** @typedef {import('./types').Fragment.Links} Links */
