// import './content/assets.js';
import './content/markup.js';
import {content} from './content/content.js';

export {content} from './content/content.js';
export const {AssetTypeMap, MarkupAttributeMap} = content;

// import {Enum} from './helpers.js';

// export const AssetTypeMap = Enum({
// 	IMG: 'images',
// 	VIDEO: 'videos',
// 	SOURCE: 'sources',
// });

// export const MarkupAttributeMap = Enum({
// 	SourceType: 'source-type',
// 	MarkupMode: 'markup-mode',
// 	MarkupSyntax: 'markup-syntax',
// });

// {
// 	content.matchers = {};
// 	content.symbols = {};
// 	content.defaults = {};

// 	content.defaults.flags = {
// 		DOM_MUTATIONS: undefined,
// 		BREAK_NORMALIZATION: undefined,
// 		HEADING_NORMALIZATION: true,
// 		PARAGRAPH_NORMALIZATION: true,
// 		BLOCK_PARAGRAPH_NORMALIZATION: true,
// 		CHECKLIST_NORMALIZATION: true,
// 		BLOCKQUOTE_NORMALIZATION: true,
// 		BLOCKQUOTE_HEADING_NORMALIZATION: true,
// 		TOKEN_FLATTENING: true,
// 		DECLARATIVE_STYLING: true,
// 		SOURCE_TEXT_RENDERING: true,
// 		ASSET_REMAPPING: true,
// 		ASSET_INITIALIZATION: true,
// 	};

// 	Object.freeze(content.defaults.flags);
// 	Object.freeze(content.defaults);

// 	content.AssetTypeMap = AssetTypeMap;
// 	content.MarkupAttributeMap = MarkupAttributeMap;
// }
