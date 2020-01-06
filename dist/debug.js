// @ts-check
/// <reference path="./types.d.ts" />

/** @param {Matcher} matcher @param {string} sourceText @param {MatcherDebugOptions} [options] */
const debugMatcher = (matcher, sourceText, options = {}) => (
  ({timing: options.timing = false} = options),
  debugMatcher.matches(debugMatcher.matchAll(matcher, sourceText, options), options)
);

/** @param {Matcher} matcher @param {string} sourceText @param {MatcherDebugOptions} [options] */
debugMatcher.matchAll = (matcher, sourceText, options = {}) => {
  const {timing = false} = options;
  const stamp = `${(timing === true && `-${Date.now()}`) || timing || ''}`;
  timing && console.time(`matching${stamp}`);
  // @ts-ignore
  // TODO: Find a cleaner way to reference RegExp.prototype[Symbol.matchAll]
  options.matches = [
    ...matcher.constructor['matchAll']((options.sourceText = sourceText), (options.matcher = matcher)),
  ];
  timing && console.timeEnd(`matching${stamp}`);
  return options.matches;
};

/** @param {MatcherMatch[]} matches @param {MatcherDebugOptions} options */
debugMatcher.matches = (matches, options = {}) => {
  const {
    method = 'log',
    timing = false,
    warnings = true,
    matcher,
    // @ts-ignore
    colors = (matcher && matcher.colors) || debugMatcher.colors,
    logs = [],

    uniqueTypes = matcher &&
      // @ts-ignore
      matcher.entities && [...new Set(matcher.entities.filter(entity => typeof entity === 'string'))],
  } = options;
  const stamp = `${(timing === true && `-${Date.now()}`) || timing || ''}`;

  timing && console.time(`printing${stamp}`);

  const INITIAL = method === 'render' ? '' : RESET_STYLE;

  const {DELIMITER = 'DELIMITER?', UNKNOWN = 'UNKNOWN?', INSET = 'INSET?'} = /** @type {*} */ (matcher);

  try {
    let format;
    let lastIndex = -1;
    for (const match of matches) {
      if (!match) continue;
      format = '';
      const {0: string, index, identity, entity, capture, meta, input, ...properties} = match;
      // @ts-ignore
      let {[DELIMITER]: delimiter, [UNKNOWN]: unknown, [INSET]: inset} = capture;
      const values = [];
      // @ts-ignore
      const delta = (properties.index = index) - (properties.lastIndex = lastIndex);
      // @ts-ignore
      const skipped = (properties.skipped = lastIndex > 0 &&
        delta > 1 && {index, lastIndex, delta, text: input.slice(lastIndex, index) || ''});

      format = '';

      if (skipped && skipped.text.length) {
        const {text, ...indices} = skipped;
        const details = CSS.escape(
          JSON.stringify(indices)
            .replace(/"/g, '')
            .replace(/\s*\n\s*/, ' ')
            .slice(1, -1),
        );
        values.push(
          // @ts-ignore
          ...(skipped.lines = text.replace(/^\n/, '').split(/\n/)).flatMap((line, index) => [
            `${INITIAL} color: coral;`,
            index ? `\n${SEGMENT_MARGIN}` : `${'skipped'.padStart(SEGMENT_MARGIN.length - 1)}\u{00A0}`,
            `${INITIAL} border: 0 solid coral; border-left-width: 1.5px; border-right-width: 1.5px; color: coral;  background: #FFFAFA; --details: "${details}";`,
            line,
          ]),
          INITIAL,
        ),
          // @ts-ignore
          (format += `${`%c%s%c%s`.repeat(skipped.lines.length)}%c\0`);

        logs.push([method, [format, ...values.splice(0, values.length)]]);
        format = '';
      }

      // @ts-ignore
      unknown !== undefined && (properties.unknown = unknown);
      // @ts-ignore
      delimiter !== undefined && (properties.delimiter = delimiter);

      // @ts-ignore
      const overlap = (properties.overlap = (delta < 0 && string.slice(0, 1 - delta)) || '');
      overlap && warnings && logs.push(['warn', ['overlap:', {overlap, delta, match, index, lastIndex}]]);

      const color = !identity
        ? //
          // @ts-ignore
          colors.unknown || COLORS.unknown
        : identity in colors
        ? colors[identity]
        : colors[((uniqueTypes && identity && uniqueTypes.indexOf(identity)) || entity || 0) % colors.length];

      const details = CSS.escape(
        JSON.stringify({properties, capture}, null, 1)
          .replace(/^(\s*)"(.*?)":/gm, '$1$2:')
          // .replace(/\s*\n\s*/g, ' ')
          .slice(2, -2),
      );

      {
        let lines, lineFormat;
        if (inset) {
          const start = (inset && inset.length) || 0;
          const end = (delimiter && -delimiter.length) || undefined;
          lines = string.slice(start, end).split(`\n${inset || ''}`);
          inset = (inset && (method !== 'render' ? inset.replace(/ /g, SPACE).replace(/\t/g, TAB) : inset)) || '';
          lineFormat = `%c%s%c%s%c`;
          values.push(
            ...lines.flatMap((line, index) => [
              `${INITIAL} /* border: 1px solid ${color}90; */ color: ${color};${(!index &&
                ` --color: ${color}; --details: "${details}";`) ||
                ''}`,
              `${INITIAL} border: 1px solid ${color}90; background: ${color}EE; color: white; font-weight: 300;`,
              inset || '\u200D',
              `${INITIAL} border: 1px solid ${color}90; color: ${color}90; background: ${color}11; font-weight: 500; text-shadow: 0 0 0 #999F;`,
              line || '\u200D',
              INITIAL,
            ]),
          );
        } else {
          lines = string.slice(0, (delimiter && -delimiter.length) || undefined).split(/\n|\r\n/g);
          lineFormat = `%c%s%c`;
          values.push(
            ...lines.flatMap((line, index) => [
              `${INITIAL} /* border: 1px solid ${color}90; */ color: ${color};${(!index &&
                ` --color: ${color}; --details: "${details}";`) ||
                ''}`,
              `${INITIAL} border: 1px solid ${color}90; color: ${color}90; background: ${color}11; font-weight: 500; text-shadow: 0 0 0 #999F;`,
              line || '\u200D',
              INITIAL,
            ]),
          );
        }
        // @ts-ignore
        format += `%c${identity.padStart(
          SEGMENT_MARGIN.length - 1,
        )}\u{00A0}${lineFormat}${`%c\n${SEGMENT_MARGIN}${lineFormat}`.repeat(lines.length - 1)}`;

        (delimiter =
          (delimiter && (method !== 'render' ? delimiter.replace(/ /g, SPACE).replace(/\t/g, TAB) : delimiter)) || ''),
          values.push(
            `${INITIAL} border: 1px solid ${color}90; background: ${color}EE; color: white; font-weight: 300;"`,
            delimiter || '\u200D',
            INITIAL,
          ),
          (format += `%c%s%c`);
      }

      logs.push([
        method,
        [
          `${format}`.trimRight(),
          ...values.splice(0, values.length),
          //{string, identity, meta, capture, match}
        ],
      ]);

      lastIndex = index + string.length;
    }
  } catch (exception) {
    if (!warnings) throw (exception.stack, exception);
    else logs.push(['warn', [exception]]);
  }
  timing && console.timeEnd(`printing${stamp}`);

  // debugger;

  return render[method === 'render' ? 'output' : 'console'](...logs);
};

const SEGMENT_MARGIN = `\u{00A0}`.repeat(10);
const RESET_STYLE = 'font-family: monospace; padding: 1px 0; margin: 1px 0; line-height: 1.75em;';
const SPACE = `\u{2423}`;
const TAB = `\u{2192}`;
const FORMATTING = /(.*?)(%c|%s|%d|%[\d\.]*f|%o|%O|$)/g;

const COLORS = (debugMatcher.colors = ['#CCCC00', '#00CCCC', '#CC00CC', '#FF6600', '#00FF66', '#6600FF']);

 {
  // @ts-ignore
  COLORS.empty = '#FF3333';
  // @ts-ignore
  COLORS.feed = '#3333FF';
  // @ts-ignore
  COLORS.sequence = '#33FF33';
  // @ts-ignore
  COLORS.unknown = '#FF00FF';
}

const render = (format, ...values) => {
  const spans = [];

  FORMATTING.lastIndex = null;
  if (typeof format === 'string' && FORMATTING.test(format)) {
    FORMATTING.lastIndex = null;
    let i = 0;
    let span;
    const push = text => (span ? span.push(text) : spans.push(text));
    const roll = () => (span && spans.push(render.span(span.style, ...span)), (span = undefined));
    // @ts-ignore
    for (const [, pre, formatting = '%O'] of format.matchAll(FORMATTING)) {
      const value = values[i++];
      pre && push(render.pre(pre));
      switch (formatting.slice(-1)) {
        case 'c':
          roll();
          span = [];
          // @ts-ignore
          span.style = value;
          break;
        case 's':
          push(render.string(value));
          break;
        default:
          push(render.object(value));
          break;
      }
    }
  }

  return `<pre>${spans.join('')}</pre>`;
};

 {
  render.pre = value => `<span class="pre">${value}</span>`;
  render.string = value => `<span class="string">${`${value}`.replace(/\t/g, '<tt class="tab">$&</tt>')}</span>`;
  render.object = value => `<span class="object">${JSON.stringify(value)}</span>`;
  render.span = (style, ...content) => `<span class="span" style='${style || ''}'>${content.join('\u00A0')}</span>`;
  render.output = (...logs) => logs.flatMap(render.output.entry);
  render.output.entry = ([method, args]) => (method ? render(...args) : []);
  render.console = (...logs) => void logs.map(render.console.entry);
  render.console.entry = ([method, args]) => void (method in console && Reflect.apply(console[method], console, args));
}

/** @typedef {MatcherDebugOptions} Options */
/** @typedef {MatcherDebugOptions.InternalDebugOptions} InternalOptions */
/** @typedef {MatcherDebugOptions.ExternalOptions} ExternalOptions */

export { debugMatcher };
//# sourceMappingURL=debug.js.map
