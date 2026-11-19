/**
 * The office's words painted in the 3D world (signs, boards, the cards and bubbles over workers'
 * heads) in Spanish too. The page translator (index.ts) only sees the DOM, and these are drawn to
 * canvases: the labels and cards from world/toon.ts go through `setLabelTranslation` (labels.ts), and any other text
 * drawn to a canvas whole (a board's title, its empty note) is swapped at fillText and measureText,
 * so its width is measured in Spanish too. Only exact dictionary matches and patterns change, so a
 * PR title or a worker's name is drawn as it is.
 */
import { setLabelTranslation } from './labels';

export function installCanvasTranslation(translate: (text: string) => string | undefined): void {
  const es = (text: string) => translate(text) ?? text;
  setLabelTranslation(es);
  if (typeof CanvasRenderingContext2D === 'undefined') return;
  const proto = CanvasRenderingContext2D.prototype;
  const fill = proto.fillText;
  const stroke = proto.strokeText;
  const measure = proto.measureText;
  proto.fillText = function (text: string, x: number, y: number, maxWidth?: number) {
    return maxWidth === undefined ? fill.call(this, es(String(text)), x, y) : fill.call(this, es(String(text)), x, y, maxWidth);
  };
  proto.strokeText = function (text: string, x: number, y: number, maxWidth?: number) {
    return maxWidth === undefined ? stroke.call(this, es(String(text)), x, y) : stroke.call(this, es(String(text)), x, y, maxWidth);
  };
  proto.measureText = function (text: string) {
    return measure.call(this, es(String(text)));
  };
}
