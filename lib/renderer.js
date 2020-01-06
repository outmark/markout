// import {tokenize as tokenizeMarkup, encodeEntities, encodeEntity} from './markup.js';
import * as markup from './markup.js';

import {MarkoutNormalizer} from './normalizer.js';
import {content} from './content.js';

/** @type {any} */
const {
  // Attempts to overcome **__**
  'markout-render-span-restacking': SPAN_RESTACKING = true,
  'markout-render-newline-consolidation': NEWLINE_CONSOLIDATION = false,
  // Patched regression from changing markdown.FRAGMENTS
  //   to /[^\\\n\s\[\]\(\)\<\>&`"*~_]+?/ which has been reversed
  'markout-render-patch-stray-brace': STRAY_BRACE = false,
  'markout-render-url-expansion': URL_EXPANSION = true,
} = import.meta;

export const normalize = sourceText => {
  const {normalizer = (normalize.normalizer = new MarkoutNormalizer())} = normalize;
  return normalizer.normalizeSourceText(sourceText);
};

export const render = tokens => {
  const {
    lookups = (render.lookups = createLookups()),
    renderer = (render.renderer = new MarkoutRenderer({lookups})),
  } = render;
  return renderer.renderTokens(tokens);
};

export const tokenize = sourceText => markup.tokenize(`${sourceText.trim()}\n}`, {sourceType: 'markdown'});

export const encodeEscapedEntities = ((Escapes, replace) => text => text.replace(Escapes, replace))(
  /\\([*^~`_])(\1|)/g,
  (m, e, e2) => (e2 ? markup.encodeEntity(e).repeat(2) : markup.encodeEntity(e)),
);

const FencedBlockHeader = /^(?:(\w+)(?:\s+(.*?)\s*|)$|)/m;
const URLPrefix = /^(?:https?:|HTTPS?:)\/\/\S+$|^(?:[A-Za-z][!%\-0-9A-Z_a-z~]+\.)+(?:[a-z]{2,5}|[A-Z]{2,5})(?:\/\S*|)$/u;
const URLString = /^\s*(?:(?:https?:|HTTPS?:)\/\/\S+|(?:[A-Za-z][!%\-0-9A-Z_a-z~]+\.)+(?:[a-z]{2,5}|[A-Z]{2,5})\/\S*?)(?:[?][^\S(){}\[\]]*?|)(?:[#][^\S(){}\[\]]*?|)\s*$/u;
const URLScheme = /^https?:|HTTPS?:/;
//
const SPAN = 'span';

class MarkoutRenderingContext {
  constructor(renderer) {
    ({lookups: this.lookups} = this.renderer = renderer);

    [
      this.passthru,
      this.block,
      this.fenced,
      this.header,
      this.indent,
      this.newlines,
      this.comment,
    ] = this.renderedText = '';

    SPAN_RESTACKING && createSpanStack(this);
  }
}

class MarkoutRenderer {
  constructor({lookups = createLookups()} = {}) {
    this.lookups = lookups;
  }

  renderBlockTokens(token, context) {
    let before, tag, body, previous, inset;
    previous = token;
    inset = '';
    const {classes, block} = context;
    while ((previous = previous.previous)) {
      if (previous.lineBreaks) break;
      inset = `${previous.text}${inset}`;
    }
    if (!/[^> \t]/.test(inset)) {
      before = `<${block}${this.renderClasses(classes)}>`;
      tag = 'tt';
      classes.push('opener', `${token.type}-token`);
    } else {
      body = token.text;
    }
    return {before, tag, body};
  }

  // renderCommentToken(token, context) {}

  encodeURL(url) {
    return `${url}`.replace(/[\\"]/g, encodeURIComponent);
  }

  renderTokens(tokens, context = new MarkoutRenderingContext(this)) {
    let text, type, punctuator, lineBreaks, hint, previous, body, tag, classes, before, after, meta;
    context.tokens = tokens;

    const {lookups} = context;
    const {renderClasses} = this;

    // context.openTags = 0;
    context.openTags = [];
    context.closeTags = [];

    for (const token of context.tokens) {
      if (!token || !(body = token.text)) continue;
      ({text, type = 'text', punctuator, lineBreaks, hint = 'text', previous} = token);

      // Sub type 'text' to 'whitespace'
      // TODO: Sub type 'text' to 'break' (ie !!lineBreaks)
      type !== 'text' || lineBreaks || text.trim() || (type = 'whitespace');

      tag = classes = before = after = meta = undefined;

      if (context.passthru || context.fenced) {
        if (context.fenced) {
          if (context.fenced === context.passthru) {
            context.header += text;
            lineBreaks && ((context.header = context.header.trimRight()), (context.passthru = ''));
          } else if (punctuator === 'closer' && text === '```') {
            let sourceType, sourceAttributes;
            if (context.header) {
              [, sourceType = 'markup', sourceAttributes] = FencedBlockHeader.exec(context.header);
              import.meta['debug:fenced-block-header-rendering'] &&
                console.log('fenced-block-header', {
                  fenced: context.fenced,
                  header: context.header,
                  passthru: context.passthru,
                  sourceType,
                  sourceAttributes,
                  context,
                });
              sourceAttributes = `${sourceAttributes ? `${sourceAttributes} ` : ''}data-markout-fence="${
                context.fenced
              }" data-markout-header="${markup.encodeEntities(context.header)}" tab-index=-1`;
            } else {
              sourceAttributes = `data-markout-fence="${context.fenced}"`;
            }
            // passthru rendered code
            context.renderedText += `<${context.block} class="markup code" ${
              content.MarkupAttributeMap.SourceType
            }="${sourceType || 'markup'}"${(sourceAttributes && ` ${sourceAttributes}`) || ''}>${markup.encodeEntities(
              context.passthru,
            )}</${context.block}>`;
            context.header = context.indent = context.fenced = context.passthru = '';
          } else {
            // passthru code
            context.passthru += body.replace(context.indent, '');
          }
          continue;
        } else if (context.url) {
          if (type === 'text' || /^[~]/.test(text)) {
            context.passthru += text;
            continue;
          }
          if (URLString.test(context.passthru)) {
            [before, context.url, after] = context.passthru.split(/(\S+?(?=(\.?\s*$|$)))/);
            // context.url && console.log(context.url, {text, token, before, context, after});
            context.renderedText += `${before}<span href="${this.encodeURL(
              URLScheme.test(context.url) ? context.url : `https://${context.url}`,
            )}"><samp class=url>${context.url}</samp></span>${after}`;
            before = after = undefined;
          } else {
            context.renderedText += context.passthru;
          }
          context.url = context.passthru = '';
        } else {
          // Construct open and close tags
          if (context.currentTag) {
            // if (
            // 	punctuator === 'closer' &&
            // 	(body === '>' || body === '/>') &&
            // 	context.currentTag !== undefined &&
            // 	context.currentTag.opener !== undefined
            // ) {
            // 	debugTagOpenerPassthru(token, context, {
            // 		scope: {text, type, punctuator, lineBreaks, hint, previous, body, tag, classes, before, after, meta},
            // 	});
            // }

            // Construct body
            context.passthru += body;

            if (context.currentTag.nodeName === '') {
              if (type === 'text' || text === '-' || text === ':') {
                context.currentTag.construct += text;
              } else if (context.currentTag.construct === '') {
                context.currentTag.nodeName = ' ';
                context.currentTag.construct = text;
              } else {
                context.currentTag.nodeName = context.currentTag.construct;
                // Substitute element name from lookup
                context.currentTag.nodeName in lookups.elements &&
                  (context.passthru = context.passthru.replace(
                    context.currentTag.nodeName,
                    (context.currentTag.nodeName = lookups.elements[context.currentTag.nodeName]),
                  ));
              }
            } else {
              context.currentTag.construct = text;
              // console.log(text, {...context});
            }
          } else {
            // console.log(text, {...context});
            // Construct body
            context.passthru += body;
          }
          if (punctuator === 'closer' || (context.comment && punctuator === 'comment')) {
            // passthru body rendered
            context.renderedText += context.passthru;
            context.passthru = '';
          }
          continue;
        }
      }

      tag = SPAN;
      classes = context.classes = hint.split(/\s+/);
      before, after;

      if (hint.includes('-in-markdown')) {
        context.renderedText += token.text;
        continue;
      } else if (hint === 'markdown' || hint.startsWith('markdown ') || hint.includes('in-markdown')) {
        type !== 'text' || lineBreaks || (text in lookups.entities && (body = lookups.entities[text]));

        if (punctuator) {
          context.passthru =
            (((context.comment = punctuator === 'comment' && text) || lookups.tags.has(text)) && text) || '';
          // Opener
          if (punctuator === 'opener') {
            if (text === '<') {
              context.openTags.push(
                (context.currentTag = {opener: token, delimiter: text, construct: '', nodeName: ''}),
              );
            } else if (text === '</') {
              context.closeTags.push(
                (context.currentTag = {closer: token, delimiter: text, construct: '', nodeName: ''}),
              );
            }
          } else if (punctuator === 'closer') {
            context.currentTag = undefined;
          }
          if (context.passthru) continue;

          if (punctuator === 'opener') {
            if ((context.fenced = text === '```' && text)) {
              context.block = 'pre';
              context.passthru = context.fenced;
              [context.indent = ''] = /^[ \t]*/gm.exec(previous.text);
              context.indent && (context.indent = new RegExp(String.raw`^${context.indent}`, 'mg'));
              context.header = '';
              continue;
            } else if (text in lookups.spans) {
              if (SPAN_RESTACKING && (before = context.stack.open(text, body, classes)) === undefined) continue;
              before || ((before = `<${lookups.spans[text]}${renderClasses(classes)}>`), classes.push('opener'));
            } else if (text === '<!' || text === '<?') {
              let next;
              const closer = text === '<!' ? /-->$/ : /\?>$/;
              while (
                (next = context.tokens.next().value) &&
                (body += next.text) &&
                next.punctuator !== 'closer' &&
                !closer.test(next.text)
                // (next.punctuator === 'opener' && /^</.test(next.text)) ||
              );
              context.passthru = body;
              continue;
            }
          } else if (punctuator === 'closer') {
            if (text === '```') {
              context.block = lookups.blocks['```'] || 'pre';
            } else if (text in lookups.spans) {
              if (SPAN_RESTACKING && (after = context.stack.close(text, body, classes)) === undefined) continue;
              after || ((after = `</${lookups.spans[text]}>`), classes.push('closer'));
            }
          } else if (SPAN_RESTACKING && text in lookups.spans) {
            if (
              (context.stack[text] >= 0
                ? (after = context.stack.close(text, body, classes))
                : (before = context.stack.open(text, body, classes))) === undefined
            )
              continue;
          } else if (!context.block && (context.block = lookups.blocks[text])) {
            ({before = before, tag = tag, body = body} = this.renderBlockTokens(token, context));
          }
          (before || after) && (tag = 'tt');
          classes.push(`${punctuator}-token`);
        } else {
          if (
            URL_EXPANSION &&
            type === 'text' &&
            tag === SPAN &&
            before === after &&
            before === undefined &&
            URLPrefix.test(text)
          ) {
            context.passthru = context.url = text;
            continue;
            // before = `<a href="${text.trim()}">`;
            // after = `</a>`;
            // console.log(text, {tag, before, after}, token);
          }
          if (lineBreaks) {
            (!context.block && (tag = 'br')) || ((after = `</${context.block}>`) && (context.block = body = ''));
          } else if (type === 'sequence') {
            if (text[0] === '`') {
              tag = 'code';
              body = text.replace(/(``?)(.*)\1/, '$2');
              let fence = '`'.repeat((text.length - body.length) / 2);
              body = markup.encodeEntities(body.replace(/&nbsp;/g, '\u202F'));
              fence in lookups.entities && (fence = lookups.entities[fence]);
              classes.push('fenced-code');
              classes.push('code');
            } else if (text.startsWith('---') && !/[^\-]/.test(text)) {
              tag = 'hr';
            } else if (!context.block && (context.block = lookups.blocks[text])) {
              ({before = before, tag = tag, body = body} = this.renderBlockTokens(token, context));
            } else {
              // sequence
              body = text;
            }
          } else if (type === 'whitespace') {
            // if (span === 'code') body.replace(/\xA0/g, '&nbsp;');
            tag = '';
          } else {
            // debug(`${type}:token`)(type, token);
            classes.push(`${type}-token`);
            body = text;
          }
        }
      }

      meta =
        tag &&
        [
          punctuator && `punctuator="${escape(punctuator)}"`,
          type && `token-type="${escape(type)}"`,
          hint && `token-hint="${escape(hint)}"`,
          lineBreaks && `line-breaks="${escape(lineBreaks)}"`,
        ].join(' ');

      tag === 'span' && (body = encodeEscapedEntities(body));

      before && (context.renderedText += before);
      tag === 'br' || (context.newlines = 0)
        ? (!NEWLINE_CONSOLIDATION && (context.renderedText += '\n')) ||
          (context.newlines++ && (context.renderedText += '\n')) ||
          (context.renderedText += '<br/>')
        : tag === 'hr'
        ? (context.renderedText += '<hr/>')
        : body &&
          (tag
            ? (context.renderedText += `<${tag} ${meta}${renderClasses(classes)}>${body}</${tag}>`)
            : (context.renderedText += body));
      after && (context.renderedText += after);
    }

    if (STRAY_BRACE && context.renderedText.endsWith(`>}</span>`)) {
      context.renderedText = context.renderedText.slice(0, context.renderedText.lastIndexOf('<span'));
    }

    return context.renderedText;
  }

  renderClasses(classes) {
    return ((classes = [...classes].filter(Boolean).join(' ')) && ` class="${classes}"`) || '';
  }
}

const debugTagOpenerPassthru = (token, context, details) => {
  console.log(
    '"%c%s%c%s%c%s%c" — %o',
    'color: LightSlateGrey;',
    context.renderedText.length > 20 ? `…${context.renderedText.slice(-20)}` : context.renderedText,
    'color: DarkSlateBlue;',
    context.passthru,
    'color: DarkSlateBlue; font-weight: 400;',
    (details && details.scope && details.scope.body) || token.text,
    '',
    {
      token: {...token},
      context: {...context},
      ...details,
    },
  );
};

class MarkoutOutput extends String {
  constructor(context) {
    super(context.renderedText).context = context;
  }
}

/// Features

const createLookups = (
  repeats = {['*']: 2, ['`']: 3, ['#']: 6},
  entities = {['*']: '&#x2217;', ['`']: '&#x0300;'},
  aliases = {'*': ['_'], '**': ['__'], '`': ['``']},
  blocks = {['-']: 'li', ['>']: 'blockquote', ['#']: 'h*', ['```']: 'pre'},
  spans = {['*']: 'i', ['**']: 'b', ['~~']: 's', ['`']: 'code'},
  tags = ['<', '>', '<!--', '-->', '<?', '?>', '</', '/>'],
  elements = {'markout-iframe': 'iframe', 'markout-details': 'details', 'markout-blockquote': 'blockquote'},
) => {
  const {keys} = Object;
  const symbols = new Set([...Object.keys(repeats), ...Object.keys(entities)]);
  for (const symbol of symbols) {
    let n = repeats[symbol] || 1;
    const entity = entities[symbol];
    let block = blocks[symbol];
    let span = spans[symbol];
    const tag = block || span;
    const map = (block && blocks) || (span && spans);
    for (let i = 1; n--; i++) {
      const k = symbol.repeat(i);
      const b = blocks[k];
      const s = spans[k];
      const m = (b && blocks) || (s && spans) || map;
      const t = (b || s || m[k] || tag).replace('*', i);
      const e = entities[k] || (entity && entity.repeat(i));
      m[k] = t;
      e && (entities[k] = e);
      if (k in aliases) for (const a of aliases[k]) (m[a] = t), e && (entities[a] = e);
    }
  }
  for (let h = 1, c = 2080, n = 6; n--; entities['#'.repeat(h)] = `#<sup>&#x${c + h++};</sup>`);

  const escapes = {};

  for (const symbol of '* ^ ~ `'.split(' ')) {
    escapes[`\\${symbol}`] = `&#x${symbol.charAt(0).toString(16)};`;
  }

  return {entities, blocks, spans, tags: new Set(tags), elements};
};

const createSpanStack = context => {
  const {
    lookups: {spans},
    renderer,
  } = context;
  const stack = [];
  stack.open = (text, body, classes) => {
    const {[text]: lastIndex, length: index} = stack;
    if (lastIndex < 0) return (stack[text] = undefined); // ie continue
    if (lastIndex >= 0) return stack.close(text, body, classes);
    const span = spans[text];
    const before = `<${span}${renderer.renderClasses(classes)}>`;
    stack[text] = index;
    stack.push({text, body, span, index});
    return classes.push('opener'), before;
  };
  stack.close = (text, body, classes) => {
    const span = spans[text];
    const {[text]: index, length} = stack;
    if (index === length - 1) {
      index >= 0 && (stack.pop(), (stack[text] = undefined));
      const after = `</${span}>`;
      return classes.push('closer'), after;
    } else if (index >= 0) {
      classes.push('closer', `closer-token`);
      const details = `token-type="auto"${renderer.renderClasses(classes)}`;
      const closing = stack.splice(index, length).reverse();
      for (const {span, text, body} of closing) {
        context.renderedText += `<tt punctuator="closer" ${details}>${body}</tt></${span}>`;
        stack[text] < index || (stack[text] = -1);
      }
    } else {
      context.renderedText += text;
    }
  };
  context.stack = stack;
};

/** @typedef {{text?: string, indent?: string, index: number}} match */
/** @typedef {{href: string, title: string}} alias */

/// Debugging

import {debugging} from '/markout/lib/helpers.js';

debugging('markout', import.meta, [
  // import.meta.url.includes('/markout/lib/') ||
  typeof location === 'object' && /[?&]debug(?=[&#]|=[^&]*\bmarkout|$)\b/.test(location.search),
  'block-normalization',
  'paragraph-normalization',
  'anchor-normalization',
  'break-normalization',
  'fenced-block-header-rendering',
]);
