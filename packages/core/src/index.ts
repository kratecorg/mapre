export type { Deck, DeckMetadata, RenderOptions, Slide, SlideMetadata } from './types';

export { parseDeck } from './parser/parseDeck';
export { parseSlide } from './parser/parseSlide';
export { splitSlides } from './parser/splitSlides';
export {
  extractFrontMatter,
  extractSlideMetadata,
  parseKeyValueBlock,
} from './parser/metadata';
export {
  detectMaxFragmentLevel,
  preprocessFragments,
  postprocessFragments,
} from './parser/fragments';

export { renderSlide } from './render/renderSlide';
