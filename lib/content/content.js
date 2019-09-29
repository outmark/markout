//@ts-check
/// <reference path="./types.d.ts" />

import * as defaults from './defaults.js';

/** @type {import('./types').content} */
export const content = {};

Object.setPrototypeOf(content, null);

content.matchers = {};
content.symbols = {};
content.selectors = {};
content.defaults = defaults;
