/**
 * The translation the 3D world's labels and cards go through (world/toon.ts calls `localizeLabel`).
 * As they are until the page's language sets one (canvas.ts). Kept apart so toon.ts doesn't pull in
 * the dictionaries, nor the dictionaries three.js.
 */
let localize: (text: string) => string = (text) => text;

export function localizeLabel(text: string): string {
  return localize(text);
}

export function setLabelTranslation(fn: (text: string) => string): void {
  localize = fn;
}
