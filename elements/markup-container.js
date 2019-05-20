import dynamicImport from '/browser/dynamicImport.js';
import {html, css, Component, Assets} from '../lib/components.js';
import * as renderer from '../lib/renderer.js';
import * as entities from '../lib/entities.js';
import * as markup from '/markup/dist/tokenizer.browser.js';

const {'markup-line-numbers': LINE_NUMBERS = undefined, 'markup-soft-wrap': SOFT_WRAP = undefined} = import.meta;

const assets = new Assets({base: new URL('../', import.meta.url)}, 'style:styles/markup.css');

const {MarkupSourceTypeAttribute: SourceType, MarkupSyntaxAttribute: MarkupSyntax} = renderer;

const stylesheet = assets['style:styles/markup.css'];

const styles = css`
  @import "${stylesheet}";
`;

export class MarkupContent extends Component {}

try {
	MarkupContent.shadowRoot = {mode: 'closed'};

	MarkupContent.styles = styles;

	MarkupContent.template = html`
		<slot inert hidden style="display:none;"></slot>
		<slot id="styles" name="styles"></slot>
		<div id="links"></div>
		<div id="wrapper">
			<slot id="content" class="markup-content" name="content"></slot>
		</div>
	`;

	customElements.define('markup-content', MarkupContent);
} catch (exception) {
	console.warn(exception);
}

/** @typedef {HTMLSlotElement} SlotElement */
/** @typedef {HTMLDivElement} DivElement */
/** @typedef {HTMLAnchorElement} AnchorElement */
/** @typedef {HTMLElement} Element */
