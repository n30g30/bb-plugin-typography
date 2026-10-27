import { useEffect, useMemo, useRef } from "react";
import { Markdown, definePluginApp, experimental_SourceCode as SourceCode, experimental_usePluginId, useSettings } from "@get-bb/plugin-sdk/app";
import { COARSE_QUERY, LEADING_TOKENS, TEXT_TOKENS, buildCss, type TypographySettings } from "./css.ts";

const TEXT_KEYS = ["uiFont", "uiFeatures", "codeFont", "codeFeatures"] as const;
const NUMBER_KEYS = ["uiSize", "uiLineHeight", "uiBold", "codeSize", "codeLineHeight", "codeBold"] as const;

function pick(values: Record<string, unknown>): TypographySettings {
  const settings: Record<string, string | number> = {};
  for (const key of TEXT_KEYS) if (typeof values[key] === "string") settings[key] = values[key];
  for (const key of NUMBER_KEYS) {
    const value = values[key];
    if (typeof value === "number" || (typeof value === "string" && value.trim())) settings[key] = Number(value);
  }
  return settings;
}

function TypographyStyles() {
  const pluginId = experimental_usePluginId();
  const cacheKey = `${pluginId}:settings`;
  const { values, isLoading } = useSettings();
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const key = isLoading ? localStorage.getItem(cacheKey) : JSON.stringify(pick(values ?? {}));

  useEffect(() => {
    const style = document.createElement("style");
    style.dataset.pluginId = pluginId;
    document.head.append(style);
    styleRef.current = style;
    return () => style.remove();
  }, [pluginId]);

  const settings = useMemo<TypographySettings | null>(() => {
    try {
      return key ? (JSON.parse(key) as TypographySettings) : null;
    } catch {
      return null;
    }
  }, [key]);

  useEffect(() => {
    const style = styleRef.current;
    if (!style || !settings) return;
    if (!isLoading && key) localStorage.setItem(cacheKey, key);
    const apply = () => {
      style.textContent = "";
      const computed = getComputedStyle(document.documentElement);
      const tokens: Record<string, string> = {};
      for (const token of [...TEXT_TOKENS, ...TEXT_TOKENS.map((item) => `${item}--line-height`), ...LEADING_TOKENS]) {
        tokens[token] = computed.getPropertyValue(token).trim();
      }
      style.textContent = buildCss(settings, tokens, Number.parseFloat(computed.fontSize) || 16);
    };
    apply();
    const media = matchMedia(COARSE_QUERY);
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [settings, isLoading, key, cacheKey]);

  return null;
}

const MARKDOWN_SAMPLE = `### Sphinx of black quartz

Pack my box with five dozen **liquor jugs**. The quick brown fox jumps over the lazy dog, and *waltz, bad nymph,* for quick jigs vex. Call \`buildCss()\` with **\`bold code\`** inline.

- Numbers 0123456789, punctuation (a) [b] {c} "d" 'e'
- Ambiguous shapes: Il1 O0 rn m

\`\`\`ts
const ratio = width / height; // => != === <= >= ->
\`\`\`
`;

const CODE_SAMPLE = `export function scale(tokens: Record<string, string>, factor = 1.1) {
  // ligatures: => != !== <= >= -> |> :: ...
  const ambiguous = ["Il1|", "O0o", "{[()]}"];
  return Object.entries(tokens).map(([name, value]) => \`\${name}: calc(\${value} * \${factor})\`);
}
`;

function Sample({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="min-w-0 text-sm font-normal text-foreground">{label}</p>
        <p className="mt-0.5 text-xs leading-snug text-subtle-foreground/75">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Preview() {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface-recessed/70 px-3 py-3">
      <div className="space-y-4">
        <Sample label="Chat message" description="Interface font, size, line height, bold weight and features; inline code and code blocks.">
          <div className="rounded-md border border-border bg-background px-3 py-2">
            <Markdown content={MARKDOWN_SAMPLE} />
          </div>
        </Sample>
        <Sample label="Source viewer" description="Code font, size, line height and features as used in files and diffs.">
          <div className="overflow-hidden rounded-md border border-border">
            <SourceCode content={CODE_SAMPLE} path="sample.ts" />
          </div>
        </Sample>
      </div>
    </div>
  );
}

export default definePluginApp((app) => {
  app.slots.experimental_appOverlay({ id: "typography-styles", component: TypographyStyles });
  app.slots.settingsSection({ id: "preview", title: "Preview", description: "Samples update after each saved change.", component: Preview });
});
