/**
 * Unicode Mathematical Alphanumeric Symbols → HTML decorator
 * - Converts MAS letters/digits in text nodes to base ASCII with styles
 * - Adds <b>/<i> wrappers for bold/italic
 * - Adds <span class="u-*"> for family (serif/sans/mono/script/fraktur/double-struck)
 * - Keeps tags/attributes unchanged
 *
 * NOTE: This maps **Latin** letters (A-Z, a-z) and digits (0-9).
 *       Greek MAS letters are NOT mapped by default.
 */

import Log from './logger';

export type StyleFlags = {
  bold?: boolean;
  italic?: boolean;
  family?:
    | 'serif'
    | 'script'
    | 'fraktur'
    | 'double-struck'
    | 'sans'
    | 'monospace';
};

type Run = { text: string; style: StyleFlags };

const Fam = {
  Serif: 'serif',
  Script: 'script',
  Fraktur: 'fraktur',
  DoubleStruck: 'double-struck',
  Sans: 'sans',
  Monospace: 'monospace',
} as const;

export type DecoratorOptions = {
  treatEscapedHtml?: boolean;
  unescapeDepth?: 1 | 2;
  classPrefix?: string;
  mode?: 'semantic' | 'visual';

  /** NEW: keep original unicode characters */
  preserveUnicode?: boolean;
};

/* -------------------------------- Utilities ------------------------------- */

export function unescapeHtmlOnce(s: string): string {
  // Unescape common HTML entities to raw characters
  return s
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}

export function smartUnescapeHtml(s: string, depth: 1 | 2 = 1): string {
  // Apply 1 or 2 rounds to handle single-escaped or double-escaped input
  let out = unescapeHtmlOnce(s);
  if (depth === 2) out = unescapeHtmlOnce(out);
  return out;
}

export function escapeHtml(s: string): string {
  // Escape raw characters; DO NOT double-escape already-escaped entities
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/* ----------------------- MAS (Latin letters & digits) ---------------------- */

/**
 * Map a single MAS code point to [baseChar, styleFlags] or null if not MAS.
 * Covers Latin A-Z/a-z letters in:
 *  - Serif (bold/italic/bold-italic)
 *  - Script (regular/bold)
 *  - Fraktur (regular/bold)
 *  - Double-struck
 *  - Sans (regular/bold/italic/bold-italic)
 *  - Monospace
 * And digits in bold, double-struck, sans, sans-bold, monospace.
 */
function mapMathAlnum(cp: number): [string, StyleFlags] | null {
  const mapRange = (
    start: number,
    end: number,
    baseStart: number,
    style: StyleFlags,
  ) => {
    if (cp >= start && cp <= end) {
      const base = baseStart + (cp - start);
      return [String.fromCharCode(base), style] as [string, StyleFlags];
    }
    return null;
  };

  const A = 'A'.charCodeAt(0);
  const a = 'a'.charCodeAt(0);
  const ZERO = '0'.charCodeAt(0);

  // ====== Serif Bold / Italic / Bold-Italic ======
  let r =
    mapRange(0x1d400, 0x1d419, A, { bold: true, family: Fam.Serif }) || // 𝐀..𝐙
    mapRange(0x1d41a, 0x1d433, a, { bold: true, family: Fam.Serif }); // 𝐚..𝐳
  if (r) return r;

  r =
    mapRange(0x1d434, 0x1d44d, A, { italic: true, family: Fam.Serif }) || // 𝐴..𝑍
    mapRange(0x1d44e, 0x1d467, a, { italic: true, family: Fam.Serif }); // 𝑎..𝑧
  if (r) return r;

  r =
    mapRange(0x1d468, 0x1d481, A, {
      bold: true,
      italic: true,
      family: Fam.Serif,
    }) || // 𝑨..𝒁
    mapRange(0x1d482, 0x1d49b, a, {
      bold: true,
      italic: true,
      family: Fam.Serif,
    }); // 𝒂..𝒛
  if (r) return r;

  // ====== Script / Bold Script ======
  r =
    mapRange(0x1d49c, 0x1d4b5, A, { family: Fam.Script }) || // 𝒜..𝓕 (spans with gaps)
    mapRange(0x1d4b6, 0x1d4cf, a, { family: Fam.Script }); // 𝓖..𝓩 (spans)
  if (r) return r;

  r =
    mapRange(0x1d4d0, 0x1d4e9, A, { bold: true, family: Fam.Script }) || // 𝓐..𝓩
    mapRange(0x1d4ea, 0x1d503, a, { bold: true, family: Fam.Script }); // 𝓪..𝔃
  if (r) return r;

  // ====== Fraktur / Bold Fraktur ======
  r =
    mapRange(0x1d504, 0x1d51d, A, { family: Fam.Fraktur }) || // 𝔄..𝔜 (gaps)
    mapRange(0x1d51e, 0x1d537, a, { family: Fam.Fraktur }); // 𝔞..𝔷
  if (r) return r;

  r =
    mapRange(0x1d56c, 0x1d585, A, { bold: true, family: Fam.Fraktur }) || // 𝕬..𝖅
    mapRange(0x1d586, 0x1d59f, a, { bold: true, family: Fam.Fraktur }); // 𝖆..𝖟
  if (r) return r;

  // ====== Double-struck ======
  r =
    mapRange(0x1d538, 0x1d551, A, { family: Fam.DoubleStruck }) || // 𝔸..𝕐
    mapRange(0x1d552, 0x1d56b, a, { family: Fam.DoubleStruck }); // 𝕒..𝕫
  if (r) return r;

  // ====== Sans / Sans Bold / Sans Italic / Sans Bold Italic ======
  r =
    mapRange(0x1d5a0, 0x1d5b9, A, { family: Fam.Sans }) || // 𝖠..𝖹
    mapRange(0x1d5ba, 0x1d5d3, a, { family: Fam.Sans }); // 𝖺..𝗓
  if (r) return r;

  r =
    mapRange(0x1d5d4, 0x1d5ed, A, { bold: true, family: Fam.Sans }) || // 𝗔..𝗭
    mapRange(0x1d5ee, 0x1d607, a, { bold: true, family: Fam.Sans }); // 𝗮..𝘇
  if (r) return r;

  r =
    mapRange(0x1d608, 0x1d621, A, { italic: true, family: Fam.Sans }) || // 𝘈..𝘡
    mapRange(0x1d622, 0x1d63b, a, { italic: true, family: Fam.Sans }); // 𝘢..𝘻
  if (r) return r;

  r =
    mapRange(0x1d63c, 0x1d655, A, {
      bold: true,
      italic: true,
      family: Fam.Sans,
    }) || // 𝘼..𝙕
    mapRange(0x1d656, 0x1d66f, a, {
      bold: true,
      italic: true,
      family: Fam.Sans,
    }); // 𝙖..𝙯
  if (r) return r;

  // ====== Monospace ======
  r =
    mapRange(0x1d670, 0x1d689, A, { family: Fam.Monospace }) || // 𝙰..𝚉
    mapRange(0x1d68a, 0x1d6a3, a, { family: Fam.Monospace }); // 𝚊..𝚣
  if (r) return r;

  // ====== Digits ======
  r = mapRange(0x1d7ce, 0x1d7d7, ZERO, { bold: true, family: Fam.Serif }); // 𝟎..𝟗
  if (r) return r;
  r = mapRange(0x1d7d8, 0x1d7e1, ZERO, { family: Fam.DoubleStruck }); // 𝟘..𝟡
  if (r) return r;
  r = mapRange(0x1d7e2, 0x1d7eb, ZERO, { family: Fam.Sans }); // 𝟢..𝟫
  if (r) return r;
  r = mapRange(0x1d7ec, 0x1d7f5, ZERO, { bold: true, family: Fam.Sans }); // 𝟬..𝟵
  if (r) return r;
  r = mapRange(0x1d7f6, 0x1d7ff, ZERO, { family: Fam.Monospace }); // 𝟶..𝟿
  if (r) return r;

  return null; // not a mapped MAS Latin/digit code point
}

/* ------------------------- Text → HTML (with classes) ---------------------- */

function toRuns(input: string): Run[] {
  const runs: Run[] = [];
  let cur: Run | null = null;

  for (const ch of input) {
    const cp = ch.codePointAt(0)!;
    const mapped = mapMathAlnum(cp);
    const baseChar = mapped ? mapped[0] : ch;
    const style = mapped ? mapped[1] : {};

    const same =
      !!cur &&
      cur.style.bold === !!style.bold &&
      cur.style.italic === !!style.italic &&
      cur.style.family === style.family;

    if (same) {
      cur!.text += baseChar;
    } else {
      if (cur) runs.push(cur);
      cur = { text: baseChar, style };
    }
  }
  if (cur) runs.push(cur);

  return runs;
}

function familyToClass(family: StyleFlags['family'], prefix: string): string {
  if (!family) return '';
  switch (family) {
    case 'serif':
      return `${prefix}serif`;
    case 'sans':
      return `${prefix}sans`;
    case 'monospace':
      return `${prefix}mono`;
    case 'script':
      return `${prefix}script`;
    case 'fraktur':
      return `${prefix}fraktur`;
    case 'double-struck':
      return `${prefix}dstruck`;
    default:
      return '';
  }
}

function hasStyledUnicode(text: string): boolean {
  return /[\u{1D400}-\u{1D7FF}\u{FF00}-\u{FFEF}]/u.test(text);
}

/**
 * Convert *plain text* (no tags) into HTML fragments with:
 * - <b>/<i> (semantic) OR inline CSS (visual) for weight/style
 * - <span class="u-*"> for family
 */
function unicodeTextToHtmlWithClasses(
  text: string,
  {
    classPrefix = 'u-',
    mode = 'semantic',
  }: Pick<DecoratorOptions, 'classPrefix' | 'mode'> = {},
): string {
  // ✅ Preserve stylish unicode exactly as-is
  if (hasStyledUnicode(text)) {
    return escapeHtml(text);
  }

  const runs = toRuns(text);
  const out: string[] = [];

  for (const r of runs) {
    const cls = familyToClass(r.style.family, classPrefix);
    let inner = escapeHtml(r.text);

    //here is start

    if (mode === 'semantic') {
    }
    //here is end

    if (mode === 'semantic') {
      if (r.style.bold) inner = `<b>${inner}</b>`;
      if (r.style.italic) inner = `<i>${inner}</i>`;
      out.push(cls ? `<span class="${cls}">${inner}</span>` : inner);
    } else {
      // mode === 'visual'
      const css: string[] = [];
      if (r.style.bold) css.push('font-weight:700');
      if (r.style.italic) css.push('font-style:italic');
      const styleAttr = css.length ? ` style="${css.join(';')}"` : '';
      out.push(
        cls ? `<span class="${cls}"${styleAttr}>${inner}</span>` : inner,
      );
    }
  }

  return out.join('');
}

/* ------------------------- HTML decorator (entrypoint) ---------------------- */

/**
 * Decorate an HTML string:
 * - If `treatEscapedHtml`, the string is unescaped (once or twice) to *real HTML* first.
 * - Split by REAL tags /<[^>]+>/ and only process text chunks.
 * - Return valid HTML with <span class="u-*"> and <b>/<i> as needed.
 */
export function decorateMathAlnumInHtml(
  html: string,
  {
    treatEscapedHtml = false,
    unescapeDepth = 1,
    classPrefix = 'u-',
    mode = 'semantic',
    preserveUnicode = false,
  }: DecoratorOptions = {},
): string {
  Log(html + '<-----------------html');

  const realHtml = treatEscapedHtml
    ? smartUnescapeHtml(html, unescapeDepth)
    : html;

  // ✅ If we want to preserve unicode, return immediately
  if (preserveUnicode) {
    return realHtml;
  }

  return realHtml
    .split(/(<[^>]+>)/g)
    .map(part =>
      part.startsWith('<')
        ? part
        : unicodeTextToHtmlWithClasses(part, { classPrefix, mode }),
    )
    .join('');
}
``;
