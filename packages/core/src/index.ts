export type { Deck, DeckMetadata, RenderOptions, Slide, SlideMetadata } from './types';

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
export { applyMarkup } from './render/markup';
