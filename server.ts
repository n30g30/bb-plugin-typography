import type { BbPluginApi, StandardSchemaV1 } from "@get-bb/plugin-sdk";
import { LIMITS, familyList, featureSettings, inRange } from "./css.ts";

function schema(check: (value: string) => boolean, message: string): StandardSchemaV1<string, string> {
  return {
    "~standard": {
      version: 1,
      vendor: "typography",
      validate: (value) => (check(value as string) ? { value: value as string } : { issues: [{ message }] }),
    },
  };
}

// Numbers are string settings so the form can clear them back to the theme default.
function number(kind: keyof typeof LIMITS, unit = "") {
  const [min, max] = LIMITS[kind];
  return schema((value) => !value.trim() || inRange(Number(value), kind), `Use a number from ${min} to ${max}${unit}`);
}

const family = schema((value) => !value.trim() || familyList(value, "serif") !== null, "Use a font name or a CSS family list without ; { } < > or \\");
const features = schema((value) => featureSettings(value) !== undefined, 'Use 4-letter feature tags, e.g. ss01 cv11 or "ss01", "zero" 0');
const FEATURES_HINT = 'OpenType features, e.g. ss01 cv11 or "liga" 0. Empty keeps the font defaults.';
const BOLD_HINT = "100 to 900. Empty keeps the theme weight.";

export default function plugin(bb: BbPluginApi) {
  bb.settings.define({
    uiFont: { type: "string", label: "Interface font", description: "Font family name. Empty uses the theme font.", default: "", experimental_schema: family },
    uiSize: { type: "string", label: "Interface font size", description: "Base text size in px. Empty uses the theme size (13). Other text sizes scale with it.", default: "", experimental_schema: number("size", " px") },
    uiLineHeight: { type: "string", label: "Interface line height", description: "Line height of chat and body text, e.g. 1.6. Empty uses the theme (1.625). Other line heights scale with it.", default: "", experimental_schema: number("lineHeight") },
    uiBold: { type: "string", label: "Interface bold weight", description: `Weight of bold and semibold text. ${BOLD_HINT}`, default: "", experimental_schema: number("bold") },
    uiFeatures: { type: "string", label: "Interface font features", description: FEATURES_HINT, default: "", experimental_schema: features },
    codeFont: { type: "string", label: "Code font", description: "Font family for code, diffs and monospace text. Empty uses the theme font.", default: "", experimental_schema: family },
    codeSize: { type: "string", label: "Code font size", description: "Code text size in px. Empty keeps the theme sizes.", default: "", experimental_schema: number("size", " px") },
    codeLineHeight: { type: "string", label: "Code line height", description: "Line height of code blocks and diffs, e.g. 1.5. Empty keeps the theme.", default: "", experimental_schema: number("lineHeight") },
    codeBold: { type: "string", label: "Code bold weight", description: `Weight of bold text in code. ${BOLD_HINT}`, default: "", experimental_schema: number("bold") },
    codeFeatures: { type: "string", label: "Code font features", description: FEATURES_HINT, default: "", experimental_schema: features },
  });
}
