import assert from "node:assert/strict";
import { test } from "node:test";
import { buildCss, familyList, featureSettings } from "./css.ts";

test("familyList quotes single names and passes lists through", () => {
  assert.equal(familyList("JetBrains Mono", "monospace"), '"JetBrains Mono", monospace');
  assert.equal(familyList(" ui-monospace ", "monospace"), "ui-monospace");
  assert.equal(familyList('"Berkeley Mono", Menlo', "monospace"), '"Berkeley Mono", Menlo');
  assert.equal(familyList("", "monospace"), null);
  assert.equal(familyList("x}body{color:red", "monospace"), null);
});

test("featureSettings accepts CSS and shorthand syntax", () => {
  assert.equal(featureSettings('"ss01", "cv11" 2'), '"ss01", "cv11" 2');
  assert.equal(featureSettings("ss01 cv11=2 liga off calt on"), '"ss01", "cv11" 2, "liga" 0, "calt"');
  assert.equal(featureSettings("ss01, zero 1"), '"ss01", "zero" 1');
  assert.equal(featureSettings("normal"), "normal");
  assert.equal(featureSettings("  "), null);
  assert.equal(featureSettings("ss1"), undefined);
  assert.equal(featureSettings('"ss01"; color: red'), undefined);
});

test("buildCss is empty without settings", () => {
  assert.equal(buildCss({ uiFont: "", codeFeatures: "" }), "");
});

test("buildCss scales text tokens from the theme base size", () => {
  const css = buildCss(
    { uiFont: "Inter Display", uiSize: 14.3, uiFeatures: "cv11" },
    { "--text-sm": ".8125rem", "--text-sm--line-height": "calc(1.25 / .875)", "--text-xs": ".75rem", "--text-xs--line-height": "1.25rem" },
  );
  assert.match(css, /--font-sans:"Inter Display", sans-serif!important/);
  assert.match(css, /--default-font-feature-settings:"cv11"!important/);
  assert.match(css, /--text-sm:calc\(\.8125rem \* 1\.1\)!important/);
  assert.match(css, /--text-xs--line-height:calc\(1\.25rem \* 1\.1\)!important/);
  assert.doesNotMatch(css, /--text-sm--line-height/);
});

test("buildCss applies code font, size and features to code and diffs", () => {
  const css = buildCss({ codeFont: "Berkeley Mono", codeSize: 12.5, codeFeatures: "ss02" });
  assert.match(css, /--font-mono:"Berkeley Mono", monospace!important/);
  assert.match(css, /--diffs-font-family:"Berkeley Mono", monospace!important/);
  assert.match(css, /--diffs-font-features:"ss02"!important/);
  assert.match(css, /code,pre,kbd,samp,\.font-mono\{font-size:12\.5px!important\}/);
  assert.match(css, /\[style\*="--diffs-font-size"\]\{--diffs-font-size:12\.5px!important\}/);
});

test("buildCss keeps interface features out of code", () => {
  const css = buildCss({ uiFeatures: "ss07" });
  assert.match(css, /--diffs-font-features:normal!important/);
  assert.match(css, /\.font-mono\{font-feature-settings:normal!important\}/);
});

test("buildCss scales line heights against the body leading", () => {
  const css = buildCss(
    { uiLineHeight: 1.8, uiSize: 14.3 },
    { "--text-sm": ".8125rem", "--text-sm--line-height": "calc(1.25 / .875)", "--text-xs--line-height": "1.25rem", "--leading-relaxed": "1.625", "--leading-tight": "1.25" },
  );
  assert.match(css, /--text-sm--line-height:calc\(calc\(1\.25 \/ \.875\) \* 1\.10769\)!important/);
  assert.match(css, /--text-xs--line-height:calc\(1\.25rem \* 1\.21846\)!important/);
  assert.match(css, /--leading-relaxed:calc\(1\.625 \* 1\.10769\)!important/);
  assert.match(css, /--leading-tight:calc\(1\.25 \* 1\.10769\)!important/);
  assert.match(css, /html\{line-height:1\.66154!important\}/);
});

test("buildCss applies bold weights and code line height", () => {
  const css = buildCss({ uiBold: 650, codeBold: 500, codeLineHeight: 1.6 });
  assert.match(css, /--font-weight-semibold:650!important/);
  assert.match(css, /b,strong\{font-weight:650!important\}/);
  assert.match(css, /:is\(code,pre,kbd,samp,\.font-mono\) :is\(b,strong\)[^{]*\{font-weight:500!important\}/);
  assert.match(css, /pre,pre code,\.font-mono:not\(code\)\{line-height:1\.6!important\}/);
  assert.match(css, /--diffs-line-height:calc\(var\(--diffs-font-size\) \* 1\.6\)!important/);
});

test("buildCss reaches the ProseMirror composer", () => {
  const css = buildCss({ uiFeatures: "ss06 ss07", uiLineHeight: 1.8 }, { "--leading-relaxed": "1.625" });
  assert.match(css, /\.ProseMirror\{font-feature-settings:"ss06", "ss07", "liga" 0!important;line-height:1\.88307!important\}/);
  assert.match(buildCss({ uiFeatures: "liga, ss01" }), /\.ProseMirror\{font-feature-settings:"liga", "ss01"!important\}/);
});

test("buildCss keeps phone inputs at 16px or more", () => {
  const css = buildCss({ uiSize: 14 }, { "--text-sm": ".9375rem", "--text-base": "1rem" });
  assert.match(css, /@media \(width<=767px\) and \(pointer:coarse\)\{:root\{--text-base:max\(1rem, calc\(1rem \* 0\.93333\)\)!important\}\}/);
  assert.doesNotMatch(buildCss({ uiSize: 16 }, { "--text-sm": ".9375rem", "--text-base": "1rem" }), /@media/);
});

test("buildCss ignores out-of-range sizes", () => {
  assert.equal(buildCss({ codeSize: 100, uiSize: 2, uiLineHeight: 5, uiBold: 1000 }, { "--text-sm": ".8125rem" }), "");
});
