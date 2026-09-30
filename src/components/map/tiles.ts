/** The one map tile layer, shared by the coffee map and the location picker. */

export const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

/** `haraya-tiles` mutes the tile colors in index.css; pins and routes live in other panes and keep theirs. */
export const TILE_OPTIONS = {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
  className: 'haraya-tiles',
};
