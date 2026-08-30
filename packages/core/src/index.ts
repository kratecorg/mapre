export type {
  Deck,
  DeckMetadata,
  DeckSourceSegment,
  DeckTree,
  RenderOptions,
  SegmentDetail,
  Slide,
  SlideMetadata,
  TreeNode,
} from './types';

export { buildDeckTree, isMultiLevelEnabled, MULTI_LEVEL_KEY } from './tree/buildDeckTree';

export { parseDeck } from './parser/parseDeck';
export { parseSlide } from './parser/parseSlide';
export type { ParseSlideOptions } from './parser/parseSlide';
export { splitSlides } from './parser/splitSlides';
export { splitChannels, DEFAULT_CHANNEL } from './parser/channels';
export {
  extractFrontMatter,
  extractSlideMetadata,
  matchDirective,
  parseKeyValueBlock,
} from './parser/metadata';
export {
  detectMaxFragmentLevel,
  preprocessFragments,
  postprocessFragments,
} from './parser/fragments';

export { renderSlide } from './render/renderSlide';
export { applyTemplate } from './render/applyTemplate';
export { applyColumns } from './render/columns';
export type { ColumnsOptions } from './render/columns';
export { applyMarkup } from './render/markup';
