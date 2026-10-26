# bb-plugin-typography

A [bb](https://getbb.app) plugin that sets the interface and code font family, size, line height, bold weight, and OpenType features. Settings live in Settings > Typography, with a live preview, and in the CLI.

## Install

```sh
bb plugin install git:https://github.com/n30g30/bb-plugin-typography.git
```

## Settings

| Key | Meaning |
| --- | --- |
| `uiFont` / `codeFont` | One family name, or a CSS family list containing a comma |
| `uiSize` / `codeSize` | Size in px, 8 to 32. Interface size is the base text size; other sizes scale with it |
| `uiLineHeight` / `codeLineHeight` | 1 to 2.5. Interface value targets chat text; other line heights scale with it |
| `uiBold` / `codeBold` | Weight for bold text, 100 to 900 |
| `uiFeatures` / `codeFeatures` | OpenType features: `"ss01", "cv11" 2` or `ss01 cv11=2 liga off` |

Empty values keep the theme defaults.

```sh
bb plugin config typography set codeFont "Berkeley Mono"
bb plugin config typography unset codeFont
```

bb's bundled Inter has no stylistic sets; install full Inter and set `uiFont` to `Inter` to use `ss`/`cv` features.

## Development

```sh
npm install
npm test
npm run typecheck
bb plugin build
bb plugin install .
```

The icon is `TextFontIcon` from [Hugeicons](https://hugeicons.com) (MIT).
