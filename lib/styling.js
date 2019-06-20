﻿export const declarativeStyling = (declarativeStyling => {
	const {getOwnPropertyNames, setPrototypeOf, getPrototypeOf, freeze, keys} = Object;
	const {lookup} = declarativeStyling;
	const Filter = /^(?!webkit[A-Z])(?!moz[A-Z])[a-zA-Z]{2,}$/;
	const Boundary = /[a-z](?=[A-Z])/g;
	const selectors = [];
	const style = document.createElement('span').style;

	declarativeStyling.normalize = (value, property) => {
		if (!value || !(value = value.trim())) return '';
		value.startsWith('--') && !value.includes(' ') && (value = `var(--${property}-${value.slice(2)}-style)`);
		return value;
	};

	declarativeStyling.mixin = (element, style) => {
		element.style.border = `var(--border-${style}-style)`;
		element.style.background = `var(--background-${style}-style)`;
		element.style.color = `var(--color-${style}-style)`;
		element.style.font = `var(--font-${style}-style)`;
	};

	for (const property of new Set([
		// Markout style properties
		'style', // mixin styling
		// CSS style properties
		...[
			// Webkit/Blink
			...getOwnPropertyNames(style),
			// Firefox
			...getOwnPropertyNames(getPrototypeOf(style)),
		].filter(property => style[property] === '' && Filter.test(property)),
	])) {
		const attribute = `${property.replace(Boundary, '$&-').toLowerCase()}:`;
		lookup[attribute] = property;
		selectors.push(`[${CSS.escape(attribute)}]`);
	}

	declarativeStyling.selector = selectors.join(',');
	freeze(setPrototypeOf(declarativeStyling.lookup, null));
	freeze(declarativeStyling.apply);

	Prefixes: {
		const autoprefix = value => {
			const prefixed = value.replace(autoprefix.matcher, autoprefix.replacer);
			// console.log(value, prefixed);
			return prefixed;
		};
		autoprefix.mappings = {};
		autoprefix.prefix = CSS.supports('-moz-appearance', 'initial')
			? '-moz-'
			: CSS.supports('-webkit-appearance', 'initial')
			? '-webkit-'
			: '';

		if (autoprefix.prefix) {
			const {mappings, prefix} = autoprefix;
			const map = (property, value, mapping = `${prefix}${value}`) =>
				CSS.supports(property, value) || (mappings[value] = mapping);

			if (prefix === '-webkit-') {
				map('width', 'fill-available');
			} else if (prefix === '-moz-') {
				map('width', 'fill-available', '-moz-available');
			}

			const mapped = keys(mappings);

			if (mapped.length > 0) {
				autoprefix.matcher = new RegExp(String.raw`\b-?(?:${mapped.join('|')})\b`, 'gi');
				freeze((autoprefix.replacer = value => mappings[value] || value));
				freeze(autoprefix.mappings);
				freeze((declarativeStyling.autoprefix = autoprefix));
			}
			// console.log(autoprefix, {...autoprefix});
		}
	}

	freeze(declarativeStyling);
	return declarativeStyling;
})({
	/** @type {{[name: string] : string}} */
	lookup: {},
	selector: '',
	apply: element => {
		const style = element.style;
		const {lookup, autoprefix, normalize} = declarativeStyling;
		for (const attribute of element.getAttributeNames()) {
			attribute in lookup &&
				(attribute === 'style:'
					? declarativeStyling.mixin(element, element.getAttribute(attribute))
					: autoprefix === undefined
					? (style[lookup[attribute]] = normalize(element.getAttribute(attribute), attribute.slice(0, -1)))
					: (style[lookup[attribute]] = autoprefix(normalize(element.getAttribute(attribute), attribute.slice(0, -1)))),
				element.removeAttribute(attribute));
		}
	},
	/** @type {(value: string) => string} */
	autoprefix: undefined,
});