//@ts-check
/// <reference path="./types.d.ts" />

import * as flags from './flags.js';

/** @type {import('./types').content} */
export const content = {};

Object.setPrototypeOf(content, null);

content.matchers = {};
content.symbols = {};
content.defaults = {};
content.defaults.flags = flags;
content.flags = flags;
Object.freeze(Object.setPrototypeOf(content.defaults, null));
