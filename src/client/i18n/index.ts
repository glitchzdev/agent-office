/**
 * The office in Spanish. Rather than threading a translation call through every window, this
 * watches the page and swaps the office's own English words for Spanish as they appear: whole
 * text nodes and the placeholder, title and aria-label attributes, matched exactly (or by one of
 * the patterns for sentences with a name in them). What isn't in the dictionary stays as it is,
 * and terminals, code and what people type are never touched.
 *
 * Spanish is on by default. `?lang=en` (kept in this browser) switches back to English, and
 * `?lang=es` returns to Spanish.
 */
import { ES_1 } from './es-1';
import { ES_2 } from './es-2';
import { ES_3 } from './es-3';
import { ES_4, ES_4_PATTERNS } from './es-4';
import { ES_PATTERNS } from './patterns';
import { installCanvasTranslation } from './canvas';

const STORE_KEY = 'office.lang';
const ATTRS = ['placeholder', 'title', 'aria-label'] as const;
/** Never translated inside these: terminals, code, and anything someone types. */
const SKIP = '.xterm, pre, code, textarea, script, style, [contenteditable], .no-translate';

const DICT = new Map<string, string>([...ES_1, ...ES_2, ...ES_3, ...ES_4]);
/** What we wrote, so a node we already translated isn't looked up again. */
const done = new WeakMap<Node, string>();

/** The Spanish for one text, or undefined when there's none. Spaces around it are kept. */
export function translate(text: string): string | undefined {
  const core = text.trim();
  if (!core || !/[A-Za-z]/.test(core)) return undefined;
  let es = DICT.get(core);
  if (es === undefined) {
    for (const [re, to] of [...ES_PATTERNS, ...ES_4_PATTERNS]) {
      if (re.test(core)) {
        es = core.replace(re, (...m) => to.replace(/\$(\d)/g, (_, i) => translate(String(m[Number(i)])) ?? String(m[Number(i)])));
        break;
      }
    }
  }
  if (es === undefined) return undefined;
  const lead = text.slice(0, text.length - text.trimStart().length);
  const trail = text.slice(text.trimEnd().length);
  return lead + es + trail;
}

/** Which language the office shows in this browser: `?lang=` first, then what was picked before. */
export function language(): 'es' | 'en' {
  try {
    const asked = new URLSearchParams(location.search).get('lang');
    if (asked === 'es' || asked === 'en') localStorage.setItem(STORE_KEY, asked);
    return localStorage.getItem(STORE_KEY) === 'en' ? 'en' : 'es';
  } catch {
    return 'es';
  }
}

function skipped(el: Element | null): boolean {
  return !!el?.closest(SKIP);
}

function textNode(node: Text) {
  const text = node.data;
  if (done.get(node) === text || skipped(node.parentElement)) return;
  const es = translate(text);
  if (es !== undefined && es !== text) node.data = es;
  done.set(node, node.data);
}

function element(el: Element) {
  if (skipped(el)) return;
  for (const name of ATTRS) {
    const v = el.getAttribute(name);
    if (!v) continue;
    const es = translate(v);
    if (es !== undefined && es !== v) el.setAttribute(name, es);
  }
}

function walk(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) return textNode(root as Text);
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
  if (root.nodeType === Node.ELEMENT_NODE) {
    if (skipped(root as Element)) return;
    element(root as Element);
  }
  const it = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.nodeType === Node.ELEMENT_NODE && (n as Element).matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  for (let n = it.nextNode(); n; n = it.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) textNode(n as Text);
    else element(n as Element);
  }
}

function title() {
  const es = translate(document.title);
  if (es !== undefined && es !== document.title) document.title = es;
}

/** Starts translating the page, now and as it changes. Does nothing when the browser picked English. */
export function installTranslation(): void {
  if (typeof document === 'undefined' || language() === 'en') return;
  document.documentElement.lang = 'es';
  installCanvasTranslation(translate);
  const start = () => {
    walk(document.body);
    title();
    new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === 'characterData') textNode(r.target as Text);
        else if (r.type === 'attributes') element(r.target as Element);
        else r.addedNodes.forEach(walk);
      }
      title();
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
  };
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
}

installTranslation();
