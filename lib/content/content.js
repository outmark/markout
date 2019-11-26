//@ts-check
/// <reference path="./types.d.ts" />

import * as defaults from './defaults.js';

export const content = /** @type {import('./content').content} */ ({});

Object.setPrototypeOf(content, null);

content.matchers = {};
content.symbols = {};
content.selectors = {};
content.defaults = defaults;
