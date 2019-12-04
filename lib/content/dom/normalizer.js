//@ts-check
// / <reference path="../types.d.ts" />

import * as entities from '../../entities.js';
import {styling} from '../../components.js';
import {content} from '../content.js';
import {Selectors} from '../helpers.js';
import * as defaults from '../defaults.js';

/** @param {Fragment} fragment @param {Record<string, boolean>} [flags] */
export const normalizeRenderedFragment = (fragment, flags) => {
  flags = {
    DOM_MUTATIONS: fragment.markoutContentFlags.DOM_MUTATIONS = defaults.flags.DOM_MUTATIONS,
    BREAK_NORMALIZATION: fragment.markoutContentFlags.BREAK_NORMALIZATION = defaults.flags.BREAK_NORMALIZATION,
    HEADING_NORMALIZATION: fragment.markoutContentFlags.HEADING_NORMALIZATION = defaults.flags.HEADING_NORMALIZATION,
    PARAGRAPH_NORMALIZATION: fragment.markoutContentFlags.PARAGRAPH_NORMALIZATION = defaults.flags
      .PARAGRAPH_NORMALIZATION,
    BLOCK_PARAGRAPH_NORMALIZATION: fragment.markoutContentFlags.BLOCK_PARAGRAPH_NORMALIZATION = defaults.flags
      .BLOCK_PARAGRAPH_NORMALIZATION,
    LIST_PARAGRAPH_NORMALIZATION: fragment.markoutContentFlags.LIST_PARAGRAPH_NORMALIZATION = defaults.flags
      .LIST_PARAGRAPH_NORMALIZATION,
    CHECKLIST_NORMALIZATION: fragment.markoutContentFlags.CHECKLIST_NORMALIZATION = defaults.flags
      .CHECKLIST_NORMALIZATION,
    BLOCKQUOTE_NORMALIZATION: fragment.markoutContentFlags.BLOCKQUOTE_NORMALIZATION = defaults.flags
      .BLOCKQUOTE_NORMALIZATION,
    BLOCKQUOTE_HEADING_NORMALIZATION: fragment.markoutContentFlags.BLOCKQUOTE_HEADING_NORMALIZATION = defaults.flags
      .BLOCKQUOTE_HEADING_NORMALIZATION,
    TOKEN_FLATTENING: fragment.markoutContentFlags.TOKEN_FLATTENING = defaults.flags.TOKEN_FLATTENING,
    DECLARATIVE_STYLING: fragment.markoutContentFlags.DECLARATIVE_STYLING = defaults.flags.DECLARATIVE_STYLING,
    SOURCE_TEXT_RENDERING: fragment.markoutContentFlags.SOURCE_TEXT_RENDERING = defaults.flags.SOURCE_TEXT_RENDERING,
    ASSET_REMAPPING: fragment.markoutContentFlags.ASSET_REMAPPING = defaults.flags.ASSET_REMAPPING,
    ASSET_INITIALIZATION: fragment.markoutContentFlags.ASSET_INITIALIZATION = defaults.flags.ASSET_INITIALIZATION,
  } = {
    ...defaults.flags,
    ...(fragment.markoutContentFlags || (fragment.markoutContentFlags = {})),
    ...flags,
  };

  flags.DOM_MUTATIONS !== false &&
    ((flags.BREAK_NORMALIZATION === true || flags.DOM_MUTATIONS === true) &&
      content.normalizeBreaksInFragment(fragment),
    (flags.HEADING_NORMALIZATION === true || flags.DOM_MUTATIONS === true) &&
      content.normalizeHeadingsInFragment(fragment),
    (flags.PARAGRAPH_NORMALIZATION === true || flags.DOM_MUTATIONS === true) &&
      content.normalizeParagraphsInFragment(fragment),
    (flags.BLOCKQUOTE_NORMALIZATION === true || flags.DOM_MUTATIONS === true) &&
      content.normalizeBlockquotesInFragment(fragment),
    (flags.CHECKLIST_NORMALIZATION === true || flags.DOM_MUTATIONS === true) &&
      content.normalizeChecklistsInFragment(fragment),
    (flags.DECLARATIVE_STYLING === true || flags.DOM_MUTATIONS === true) &&
      content.normalizeDeclarativeStylingInFragment(fragment));

  (flags.TOKEN_FLATTENING === true || (flags.TOKEN_FLATTENING !== false && flags.DOM_MUTATIONS !== false)) &&
    //@ts-ignore
    content.flattenTokensInFragment(fragment);

  //@ts-ignore
  content.renderURLExpansionLinksInFragment(fragment);
};

/** @param {Fragment} fragment */
export const normalizeBreaksInFragment = fragment => {
  for (const br of fragment.querySelectorAll('br')) {
    const {previousSibling, nextSibling, parentElement} = br;
    (!previousSibling ||
      previousSibling.nodeName !== 'SPAN' ||
      !nextSibling ||
      nextSibling.nodeName !== 'SPAN' ||
      (parentElement && !/^(?:CODE|PRE|LI)$/.test(parentElement.nodeName))) &&
      br.remove();
  }
};

content.matchers.HeadingNumber = /^[1-9]\d*\.$|/;

/** @param {Fragment} fragment */
export const normalizeHeadingsInFragment = fragment => {
  const {MarkdownIdentity: Identity, MarkdownIdentityPrefixer: Prefixer, MarkdownIdentityJoiner: Joiner} = entities;
  const {headings = (fragment.headings = {}), TEXT_NODE} = fragment;

  for (const subheading of /** @type {Iterable<Heading>} */ (fragment.querySelectorAll(
    content.selectors.SubheadingsInFragment,
  ))) {
    const previousElementSibling = subheading.previousElementSibling;
    const previousSibling = subheading.previousSibling;
    if (!previousElementSibling || previousSibling !== previousElementSibling) continue;
    // console.log({subheading, previousElementSibling, previousSibling});
    if (previousElementSibling && previousElementSibling.nodeName === 'HGROUP') {
      previousElementSibling.appendChild(subheading);
    } else if (previousElementSibling) {
      const hgroup = document.createElement('hgroup');
      previousElementSibling.before(hgroup);
      hgroup.appendChild(previousElementSibling);
      hgroup.appendChild(subheading);
    }
  }

  for (const heading of /** @type {Iterable<Heading>} */ (fragment.querySelectorAll(
    content.selectors.HeadingsInFragment,
  ))) {
    const level = parseFloat(heading.nodeName[1]);
    const textSpan = heading.querySelector('span[token-type]');
    const textNode =
      (textSpan && textSpan.firstChild && textSpan.firstChild.nodeType === TEXT_NODE && textSpan.firstChild) ||
      undefined;

    const number =
      textNode &&
      heading.matches('hgroup > *') &&
      parseFloat(content.matchers.HeadingNumber.exec(textSpan.textContent)[0]);

    // Assuming all hgroup headings are either intentional or
    //   implied from markout notation, we want to pull out
    //   numbering into a data attribute
    number > 0 && ((heading.dataset.headingNumber = number), textNode.remove());

    // We're limit anchoring from H1 thru H3
    // if (parseFloat(heading.nodeName[1]) > 3) continue;

    const [, identity] = Identity.exec(heading.textContent) || '';
    if (!identity) continue;
    /** @type {Anchor} */
    const anchor = document.createElement('a');
    anchor.id = identity
      .replace(Prefixer, '')
      .replace(Joiner, '-')
      .toLowerCase();
    anchor.append(...heading.childNodes);
    // anchor.tabIndex = -1;
    anchor.heading = heading.anchor = {anchor, identity, heading, level, number};
    heading.appendChild(anchor);

    const nav = anchor.querySelector('nav:last-child');
    nav && heading.appendChild(nav);

    // Unique mappings are prioritized by heading level
    (anchor.id in headings && headings[anchor.id].level > level) || (headings[anchor.id] = heading.anchor);
  }
};

// const content.matchers.BlockParts = /^(?:(\w+(?: \w+)*)(:| - | — |)|)(.*)$/u;
content.matchers.BlockParts = /^[*_]*?(?:(\*{1,2}|_{1,2}|)(\w+(?: \w+)*)\1(: | - | — |)|)([^]*)$|/u;

/** @param {Fragment} fragment */
content.normalizeBlockquotesInFragment = fragment => {
  /** @type {BlockQuote} */
  let previousBlockquote;
  /** @type {BlockQuote} */
  let nextBlockquote;
  /** @type {NodeLike | ElementLike} */
  let node;
  /** @type {NodeLike | ElementLike} */
  let previousNode;
  /** @type {NodeLike | ElementLike} */
  let blockNode;
  /** @type {RangeLike} */
  let range;
  let heading, delimiter, headingSeparator, body;
  const {COMMENT_NODE, TEXT_NODE, ELEMENT_NODE} = fragment;

  for (const blockquote of /** @type {Iterable<BlockQuote>} */ (fragment.querySelectorAll('blockquote:not(:empty)'))) {
    node = blockquote.querySelector(content.selectors.BlockHeadingNodesInFragment);

    // if (/\w+:/.test(blockquote.innerText) && node == null) debugger;

    node == null ||
      (body = blockquote.textContent.trim()) === '' ||
      ([, delimiter = '', heading = '', headingSeparator = '', body = ''] = content.matchers.BlockParts.exec(body));

    // console.log(`${content.selectors.BlockHeadingNodesInFragment}`, node);

    // console.log(`%o — ${delimiter}%s${delimiter}${headingSeparator}${body}`, {blockquote, node});

    body === '' || (blockquote.blockBody = body);

    if (node != null && heading) {
      blockquote.blockHeadingNode = /** @type {HTMLSpanElement} */ (node);
      blockquote.dataset.blockHeading = blockquote.blockHeading = heading;
      blockquote.dataset.blockHeadingSeparator = blockquote.blockHeadingSeparator = headingSeparator;
      if ((fragment.markoutContentFlags || defaults).BLOCKQUOTE_HEADING_NORMALIZATION === true) {
        node.slot = 'block-heading';
        range = document.createRange();
        range.setStartAfter(node);
        previousNode = node;

        while (!(range.text = range.toString()).startsWith(headingSeparator) && (node = node.nextSibling) != null)
          range.setEndAfter(node);

        node = null;
        // if (node.nextSibling) do {
        // 	range.setEndAfter((node = node.nextSibling));
        // } while (!(range.text = range.toString()).startsWith(headingSeparator) && node.nextSibling != null);

        if (range.text !== headingSeparator) {
          console.log(
            `%o — [%s][%s][${body}]`,
            {blockquote, range, contents: range.contents},
            previousNode.textContent,
            range.toString(),
          );
        } else {
          node = document.createElement('span');
          node.textContent = headingSeparator;
          node.slot = 'block-heading-separator';
          range.deleteContents();
          // previousNode.after(node);
          blockNode = previousNode.parentElement;
          while (blockNode.parentElement !== blockquote) blockNode = blockNode.parentElement;
          blockNode.attachShadow({
            mode: 'open',
          }).innerHTML =
            //
            /* html */ `
							<style>:host {padding: 0.5em;}#contents:slotted(p:first-child) {margin-block-start: 0;-webkit-margin-before:0;}</style>
							<div style="display: grid; grid-template-columns: var(--block-heading-span, auto) 1fr; grid-gap: 1em;">
								<div style="text-align:right;">
									<slot name="block-heading"></slot>
									<slot name="block-heading-separator" hidden></slot>
								</div>
								<div><slot id=contents></slot></div>
							</div>`;
          blockNode.remove();
          blockNode.append(previousNode, node, ...blockquote.childNodes);
          blockquote.appendChild(blockNode);
          // blockquote.style.display = 'table-row';
        }
      }
    }
  }

  // TODO: Figure out why we need all this…
  for (const lastBlockquote of /** @type {Iterable<BlockQuote>} */ (fragment.querySelectorAll(
    ':not(blockquote)[blockquote-level]+blockquote[blockquote-level]',
  ))) {
    nextBlockquote = lastBlockquote;
    previousBlockquote = previousNode = undefined;
    lastBlockquote.blockquoteLevel = parseFloat(lastBlockquote.getAttribute('blockquote-level'));

    node = lastBlockquote.previousSibling;

    if (
      !(lastBlockquote.blockquoteLevel > 0) ||
      !(
        lastBlockquote.previousElementSibling === node ||
        node.nodeType === COMMENT_NODE ||
        node.textContent.trim() === ''
      )
    ) {
      content.normalizeBlockquotesInFragment.log({node, lastBlockquote, nextBlockquote, previousBlockquote});
      continue;
    }

    while (
      node != null &&
      (node.nodeName !== 'BLOCKQUOTE' || !(previousBlockquote = /** @type {BlockQuote } */ (node)))
    ) {
      node.blockquoteLevel =
        node.nodeType === ELEMENT_NODE
          ? parseFloat(node.getAttribute('blockquote-level'))
          : nextBlockquote.blockquoteLevel;
      previousNode = node.previousSibling;
      if (node.blockquoteLevel === nextBlockquote.blockquoteLevel) {
      } else if (node.blockquoteLevel > nextBlockquote.blockquoteLevel) {
        previousBlockquote = nextBlockquote;
        nextBlockquote = /** @type {BlockQuote } */ (document.createElement('blockquote'));
        nextBlockquote.setAttribute('blockquote-level', (nextBlockquote.blockquoteLevel = node.blockquoteLevel));
        previousBlockquote.prepend(nextBlockquote);
      } else if (node.blockquoteLevel < nextBlockquote.blockquoteLevel) {
        if (node.blockquoteLevel < lastBlockquote.blockquoteLevel) {
          // TODO: Is it safer to coerce or superseede?!
          node.blockquoteLevel = lastBlockquote.blockquoteLevel;
        }
        while (
          nextBlockquote.blockquoteLevel >= lastBlockquote.blockquoteLevel &&
          node.blockquoteLevel < nextBlockquote.blockquoteLevel &&
          nextBlockquote.parentElement.blockquoteLevel < nextBlockquote.blockquoteLevel
        ) {
          nextBlockquote = nextBlockquote.parentElement;
        }
      }
      nextBlockquote.prepend(node);
      node = previousNode;
    }

    if (lastBlockquote.previousSibling === previousNode && previousBlockquote === previousNode) {
      if (
        ('blockquoteLevel' in previousBlockquote
          ? previousBlockquote.blockquoteLevel
          : (previousBlockquote.blockquoteLevel = parseFloat(previousBlockquote.getAttribute('blockquote-level')))) > 0
      ) {
        // TODO: Is it safer to coerce or superseede?!
        if (previousBlockquote.blockquoteLevel < lastBlockquote.blockquoteLevel) continue;

        if (previousBlockquote.blockquoteLevel === lastBlockquote.blockquoteLevel) {
          previousBlockquote.childElementCount === 1 && previousBlockquote.firstElementChild.nodeName === 'DETAILS'
            ? previousBlockquote.firstElementChild.append(...lastBlockquote.childNodes)
            : previousBlockquote.append(...lastBlockquote.childNodes);
          lastBlockquote.remove();
        }
      } else if (!previousBlockquote.hasAttribute('blockquote-level')) {
        previousBlockquote.setAttribute(
          'blockquote-level',
          `${(previousBlockquote.blockquoteLevel = lastBlockquote.blockquoteLevel)}`,
        );
        // TODO: Figure out if we can merge!
      }
    }
  }
};

/** @param {{node: Node | Element, lastBlockquote: HTMLQuoteElement, nextBlockquote?: HTMLQuoteElement,  previousBlockquote?:HTMLQuoteElement} } nodes */
content.normalizeBlockquotesInFragment.log = nodes => {
  const format = [];
  const values = [];
  for (const name of ['node', 'lastBlockquote', 'nextBlockquote', 'previousBlockquote']) {
    const node = nodes[name];
    if (node == null || typeof node !== 'object') continue;
    format.push('%s [%d] — %O');
    values.push(name, node.blockquoteLevel || (node.getAttribute && node.getAttribute('blockquote-level')), node);
  }
  format.length && console.log(format.join('\n'), ...values);
};

content.symbols.NormalizedChecklists = Symbol('NormalizedChecklists');

/** @param {Fragment} fragment */
export const normalizeChecklistsInFragment = fragment => {
  const seen =
    fragment[content.symbols.NormalizedChecklists] || (fragment[content.symbols.NormalizedChecklists] = new WeakSet());

  for (const checklist of fragment.querySelectorAll(
    'li[type=checkbox]:not([checked]):not([indeterminate]) li[type=checkbox]:not([checked])',
  )) {
    let parentChecklist = checklist;
    // console.log({checklist, parentChecklist});
    while ((parentChecklist = parentChecklist.parentElement.closest('li[type=checkbox]'))) {
      seen.has(parentChecklist) ||
        (seen.add(parentChecklist),
        parentChecklist.querySelector(':scope li[type=checkbox]:not([checked]):not([indeterminate])')
          ? parentChecklist.querySelector(':scope  li[type=checkbox][checked]')
            ? (parentChecklist.removeAttribute('checked'), parentChecklist.setAttribute('indeterminate', ''))
            : (parentChecklist.removeAttribute('checked'), parentChecklist.removeAttribute('indeterminate'))
          : !parentChecklist.querySelector(':scope li[type=checkbox][checked]') ||
            (parentChecklist.removeAttribute('indeterminate'), parentChecklist.setAttribute('checked', '')));

      // if (parentChecklist.hasAttribute('checked') || parentChecklist.hasAttribute('indeterminate')) break;
      // parentChecklist.setAttribute('indeterminate', '');
    }
  }
};

content.normalizeParagraphsInBlock = block => {
  let element, node, nodes, paragraph, text;
  node = block.firstChild;
  if (node == null) return;
  element = block.firstElementChild;
  // while (element != null && element.matches('span,code,kbd,tt,small,em,strong,b,i,a,q,wbr,br,slot')) {
  while (element != null && !element.matches('hr,pre,p,blockquote,table,div')) {
    element = element.nextElementSibling;
  }
  while (node !== element) {
    (nodes || (nodes = [])).push(node);
    node = node.nextSibling;
  }
  if (nodes) {
    paragraph = document.createElement('p');
    paragraph.append(...nodes);
    text = paragraph.textContent;
    // console.log({element, node, nodes, paragraph, text});
    text && text.trim() && block.prepend(paragraph);
  }
};

/** @param {Fragment} fragment */
export const normalizeParagraphsInFragment = fragment => {
  if ((fragment.markoutContentFlags || defaults).BLOCK_PARAGRAPH_NORMALIZATION)
    for (const block of fragment.querySelectorAll('li:not(:empty), blockquote:not(:empty)'))
      content.normalizeParagraphsInBlock(block);
  if ((fragment.markoutContentFlags || defaults).LIST_PARAGRAPH_NORMALIZATION)
    for (const {parentElement: paragraph} of fragment.querySelectorAll(
      'li > p:first-child:last-child > ol:last-child, li > p:first-child:last-child > ul:last-child',
    )) {
      while (
        paragraph.lastElementChild != null &&
        (paragraph.lastElementChild.nodeName === 'OL' || paragraph.lastElementChild.nodeName === 'UL') &&
        (paragraph.lastChild === paragraph.lastElementChild ||
          paragraph.lastChild.nodeType === paragraph.COMMENT_NODE ||
          paragraph.lastChild.textContent.trim() === '')
      ) {
        paragraph.after(paragraph.lastElementChild);
      }
    }

  for (const empty of fragment.querySelectorAll('p:empty')) empty.remove();
};

/** @param {Fragment} fragment */
export const normalizeDeclarativeStylingInFragment = fragment => {
  styling.apply.toFragment(fragment, normalizeDeclarativeStylingInFragment.defaults);
};

normalizeDeclarativeStylingInFragment.defaults = {
  attributes: {
    ['--band-fill:'](element, attribute, value, options) {
      element.style.background = `var(--band-fill${value})`;
      element.removeAttribute(attribute);
    },
  },
};

content.normalizeRenderedFragment = normalizeRenderedFragment;
content.normalizeBreaksInFragment = normalizeBreaksInFragment;
content.normalizeHeadingsInFragment = normalizeHeadingsInFragment;
content.normalizeChecklistsInFragment = normalizeChecklistsInFragment;
content.normalizeParagraphsInFragment = normalizeParagraphsInFragment;
content.normalizeDeclarativeStylingInFragment = normalizeDeclarativeStylingInFragment;

content.selectors.HeadingsInFragment = new Selectors(
  'h1:not([id]):not(:empty)',
  'h2:not([id]):not(:empty)',
  'h3:not([id]):not(:empty)',
  'h4:not([id]):not(:empty)',
  'h5:not([id]):not(:empty)',
  'h6:not([id]):not(:empty)',
);
content.selectors.SubheadingsInFragment = new Selectors('h1+h2', 'h2+h3', 'h3+h4', 'h4+h5', 'h5+h6');
content.selectors.BlockHeadingNodes = new Selectors('i:first-child > b', 'b:first-child > i', 'b', 'i');

// `details:first-child > summary:first-child > ${selector}`,
// `details:first-child > summary:first-child > p:first-child > ${selector}`,
content.selectors.BlockHeadingNodesInFragment = content.selectors.BlockHeadingNodes.flatMap(selector => [
  `:scope > ${(selector = `${selector}:first-child:not(:empty)`)}`,
  `:scope > p:first-child > ${selector}`,
  // `:scope > p:first-child > p:first-child > ${selector}`,
]);

/** @typedef {import('../types').Fragment} Fragment */
/** @typedef {import('../types').Fragment.Heading} Heading */
/** @typedef {import('../types').Fragment.Headings} Headings */
/** @typedef {import('../types').Fragment.Anchor} Anchor */
/** @typedef {import('../types').Fragment.BlockQuote} BlockQuote */
/** @typedef {Node & {[name: string]: any}} NodeLike */
/** @typedef {Element & {[name: string]: any}} ElementLike */
/** @typedef {Range & {[name: string]: any}} RangeLike */
