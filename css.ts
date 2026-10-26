export interface TypographySettings {
  uiFont?: string;
  uiSize?: number;
  uiLineHeight?: number;
  uiBold?: number;
  uiFeatures?: string;
  codeFont?: string;
  codeSize?: number;
  codeLineHeight?: number;
  codeBold?: number;
  codeFeatures?: string;
}

export const LIMITS = {
  size: [8, 32],
  lineHeight: [1, 2.5],
  bold: [100, 900],
} as const;

export const TEXT_TOKENS = ["--text-2xs", "--text-xs", "--text-sm", "--text-base", "--text-lg", "--text-xl", "--text-2xl"];
export const LEADING_TOKENS = ["--leading-tight", "--leading-snug", "--leading-normal", "--leading-relaxed"];
const BASE_TOKEN = "--text-sm";
// Chat and markdown body text use leading-relaxed, so the interface line height is measured against it.
const BODY_LEADING = "--leading-relaxed";
const GENERICS = new Set(["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui", "ui-serif", "ui-sans-serif", "ui-monospace", "ui-rounded", "math", "emoji", "fangsong"]);
const UNSAFE = /[;{}<>\\\n\r]/;

// A single name is quoted for the user; anything with a comma is taken as a CSS family list.
export function familyList(input: string | undefined, generic: string): string | null {
  const value = input?.trim();
  if (!value || UNSAFE.test(value) || value.length > 300) return null;
  if (value.includes(",")) return value;
  if (GENERICS.has(value)) return value;
  return `"${value.replace(/["']/g, "")}", ${generic}`;
}

const ITEM = /^\s*(?:"([\x20-\x21\x23-\x5b\x5d-\x7e]{4})"|'([\x20-\x26\x28-\x5b\x5d-\x7e]{4})'|([A-Za-z0-9]{4}))(?:\s*=?\s*(on|off|\d{1,3})(?![A-Za-z0-9]))?\s*(?:,|(?=\s)|$)/;

// Accepts CSS syntax (`"ss01", "cv11" 2`) or shorthand (`ss01 cv11=2 liga off`). Returns undefined when invalid.
export function featureSettings(input: string | undefined): string | null | undefined {
  let rest = input?.trim() ?? "";
  if (!rest) return null;
  if (rest === "normal") return "normal";
  const items: string[] = [];
  while (rest) {
    const match = ITEM.exec(rest);
    if (!match || !match[0]) return undefined;
    const tag = match[1] ?? match[2] ?? match[3];
    const raw = match[4];
    const value = raw === undefined || raw === "on" ? "" : raw === "off" ? " 0" : ` ${Number(raw)}`;
    items.push(`"${tag}"${value}`);
    rest = rest.slice(match[0].length).trimStart();
  }
  return items.join(", ");
}

export function inRange(value: number, kind: keyof typeof LIMITS) {
  const [min, max] = LIMITS[kind];
  return Number.isFinite(value) && value >= min && value <= max;
}

function pick(value: number | undefined, kind: keyof typeof LIMITS) {
  return typeof value === "number" && inRange(value, kind) ? Number(value.toFixed(kind === "bold" ? 0 : 3)) : null;
}

function toPx(raw: string, rootPx: number) {
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return null;
  if (raw.endsWith("rem")) return value * rootPx;
  if (raw.endsWith("px")) return value;
  return null;
}

const ratio = (value: number) => Number(value.toFixed(5));

// `tokens` holds the theme's raw values for TEXT_TOKENS (with their --line-height pairs) and LEADING_TOKENS, read from :root without our overrides.
export function buildCss(settings: TypographySettings, tokens: Record<string, string> = {}, rootPx = 16): string {
  const root: string[] = [];
  const rules: string[] = [];

  const uiFamily = familyList(settings.uiFont, "sans-serif");
  if (uiFamily) root.push(`--font-sans:${uiFamily}`);
  const uiFeatures = featureSettings(settings.uiFeatures);
  if (uiFeatures) root.push(`--default-font-feature-settings:${uiFeatures}`);

  const uiSize = pick(settings.uiSize, "size");
  const basePx = toPx(tokens[BASE_TOKEN] ?? "", rootPx);
  const sizeScale = uiSize !== null && basePx ? ratio(uiSize / basePx) : 1;
  const uiLineHeight = pick(settings.uiLineHeight, "lineHeight");
  const bodyLeading = Number.parseFloat(tokens[BODY_LEADING] ?? "") || 1.625;
  const leadingScale = uiLineHeight !== null ? ratio(uiLineHeight / bodyLeading) : 1;
  for (const token of TEXT_TOKENS) {
    const value = tokens[token];
    if (value && sizeScale !== 1) root.push(`${token}:calc(${value} * ${sizeScale})`);
    const lineHeight = tokens[`${token}--line-height`];
    if (!lineHeight) continue;
    // Unitless line heights already follow the font size.
    const scale = ratio((toPx(lineHeight, rootPx) !== null ? sizeScale : 1) * leadingScale);
    if (scale !== 1) root.push(`${token}--line-height:calc(${lineHeight} * ${scale})`);
  }
  if (leadingScale !== 1) {
    for (const token of LEADING_TOKENS) {
      if (tokens[token]) root.push(`${token}:calc(${tokens[token]} * ${leadingScale})`);
    }
    rules.push(`html{line-height:${ratio(1.5 * leadingScale)}!important}`);
  }

  const uiBold = pick(settings.uiBold, "bold");
  if (uiBold !== null) {
    root.push(`--font-weight-semibold:${uiBold}`, `--font-weight-bold:${uiBold}`);
    rules.push(`b,strong{font-weight:${uiBold}!important}`);
  }

  const codeFamily = familyList(settings.codeFont, "monospace");
  if (codeFamily) root.push(`--font-mono:${codeFamily}`, `--diffs-font-family:${codeFamily}`);
  // Monospace text outside <code> (diffs, .font-mono) inherits the interface features unless reset.
  const codeFeatures = featureSettings(settings.codeFeatures) || (uiFeatures ? "normal" : null);
  if (codeFeatures) {
    root.push(`--default-mono-font-feature-settings:${codeFeatures}`, `--diffs-font-features:${codeFeatures}`);
    rules.push(`.font-mono{font-feature-settings:${codeFeatures}!important}`);
  }
  const codeSize = pick(settings.codeSize, "size");
  if (codeSize !== null) {
    root.push(`--diffs-font-size:${codeSize}px`);
    rules.push(`code,pre,kbd,samp,.font-mono{font-size:${codeSize}px!important}`);
  }
  const codeLineHeight = pick(settings.codeLineHeight, "lineHeight");
  if (codeLineHeight !== null) {
    rules.push(`pre,pre code,.font-mono:not(code){line-height:${codeLineHeight}!important}`);
  }
  // bb sets the diff viewer's size and line height inline on its wrapper.
  const diffs = [
    codeSize !== null && `--diffs-font-size:${codeSize}px!important`,
    codeLineHeight !== null && `--diffs-line-height:calc(var(--diffs-font-size) * ${codeLineHeight})!important`,
  ].filter(Boolean);
  if (diffs.length) rules.push(`[style*="--diffs-font-size"]{${diffs.join(";")}}`);
  const codeBold = pick(settings.codeBold, "bold");
  if (codeBold !== null) {
    rules.push(`:is(code,pre,kbd,samp,.font-mono) :is(b,strong),:is(b,strong) :is(code,kbd,samp),.font-mono:is(.font-semibold,.font-bold){font-weight:${codeBold}!important}`);
  }

  if (root.length) rules.unshift(`:root{${root.map((item) => `${item}!important`).join(";")}}`);
  return rules.join("\n");
}
