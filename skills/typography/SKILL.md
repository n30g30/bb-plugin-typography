---
name: typography
description: Set bb's interface and code font family, size, line height, bold weight, and OpenType features through the Typography plugin. Use when the user asks to change bb fonts, text size, line spacing, bold weight, or font features.
---

# Typography

Settings live in Settings > Typography (with live preview samples) and in the CLI. Values apply live in all bb windows; an empty value keeps the theme default.

```
bb plugin config typography                          # show values
bb plugin config typography set uiFont "Inter Display"
bb plugin config typography set uiSize 14            # px; other text sizes scale with it
bb plugin config typography set uiLineHeight 1.7     # chat/body text; other line heights scale with it
bb plugin config typography set uiBold 650           # bold and semibold text
bb plugin config typography set uiFeatures "ss01 cv11"
bb plugin config typography set codeFont "Berkeley Mono"
bb plugin config typography set codeSize 13          # px; code, pre, .font-mono and diffs
bb plugin config typography set codeLineHeight 1.5   # code blocks and diffs
bb plugin config typography set codeBold 600
bb plugin config typography set codeFeatures 'liga off, zero'
bb plugin config typography unset codeSize
```

- Font: one family name (quoted automatically, generic fallback added) or a CSS list containing a comma, used as-is.
- Size: 8 to 32 px. Interface size is the base text size (theme default 13); the theme's other text sizes scale by the same ratio.
- Line height: 1 to 2.5. Interface line height targets chat and markdown text (theme 1.625); every other theme line height scales by the same ratio.
- Bold weight: 100 to 900. Static fonts snap to the nearest installed weight; variable fonts use the exact value. Code bold does not reach syntax-highlighting token weights inside the diff and source viewers.
- Features: 4-letter tags separated by spaces or commas, each optionally followed by a value (`on`, `off`, or a number, `=` allowed), or CSS syntax like `"ss01", "cv11" 2`.
- The font must be installed on the device that renders bb; there is no font picker.
