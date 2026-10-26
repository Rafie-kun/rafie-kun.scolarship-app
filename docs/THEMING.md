# Somnia theming guide

Somnia uses one visual language across both apps: a flat, OMORI-inspired "dreamscape".
This guide explains the palette, where styles live and how to add UI that does not break
contrast.

---

## Palette

The theme is defined in `src/omori-theme.css` under `html.theme-mode-omori`:

| Token | Hex | Use |
| --- | --- | --- |
| `--omori-void` | `#08070d` | page background |
| `--omori-night` | `#0e0b17` | sidebar / deep surfaces |
| `--omori-panel` | `#191428` | cards and windows |
| `--omori-panel-2` | `#201a31` | buttons, nested panels |
| `--omori-panel-3` | `#292140` | selected tabs, raised chips |
| `--omori-line` | `#332b4a` | soft borders |
| `--omori-white` | `#f4f0e8` | primary text |
| `--omori-dim` | `#c8c0d8` | secondary text |
| `--omori-muted` | `#9a93ad` | hints and metadata |
| `--omori-lav` | `#cbb7f2` | primary accent |
| `--omori-mint` | `#a9e8c8` | success / progress |
| `--omori-gold` | `#f3dfa2` | warnings, highlights |
| `--omori-coral` | `#ef9a9a` | errors, destructive actions |

Use the tokens rather than new hex values. If a new token is genuinely needed, add it to
the theme file and document it here.

---

## Style layers

| File | Scope |
| --- | --- |
| `src/index.css` | Tailwind import and legacy base styles |
| `src/omori-theme.css` | Legacy app overrides; imported after `index.css` |
| `src/app/globals.css` | Next.js catalog app styles |

`omori-theme.css` is intentionally unlayered, so its rules win over Tailwind utilities.
That is how legacy `bg-[#...]` and `text-stone-*` classes are remapped without editing
every component.

---

## Rules of thumb

- **Flat over glassy.** Solid panel fills, 2px dark outlines, small radii. Avoid new
  gradients, blur or glow.
- **Crisp shadows.** Use a hard offset (`2px 2px 0 rgba(8, 7, 13, 0.55)`) rather than a
  soft floating shadow.
- **Pixel type is for labels, not paragraphs.** `font-press` / Pixelify Sans is for
  headings, buttons and HUD labels. Body copy uses Nunito.
- **Keep white space.** Do not fill every gap with a card.
- **Motion is quiet.** Short transitions, no infinite bounce except deliberate accents.
  Respect `prefers-reduced-motion`.
- **Original artwork only.** Do not add OMORI sprites, textures, fonts or copied layouts.

---

## Legacy class remaps

The legacy app still contains old Minecraft-era classes. `omori-theme.css` maps them:

- `text-stone-600/700/800` → muted / dim text
- `text-stone-900/950` → white
- `bg-[#3b3b8c]`, `bg-[#555]`, `bg-[#2c2c2c]` → panel colours
- `bg-[#1b3d1b]` → translucent mint
- arbitrary `text-[#ffff55]`, `text-[#55ff55]`, `text-[#55ffff]`, `text-[#ff5555]` →
  lavender / mint / sky / coral
- `border-4` and `rounded-none` → 1px borders and small radii

When adding a new component, prefer semantic classes and palette tokens. If you must use
an arbitrary hex, add a remap so it does not drift from the palette.

---

## Adding a new view

1. Use `mc-window` for the main panel and `mc-btn` for actions.
2. Use `font-press` for the section heading, `font-sans` for body copy.
3. Pick accent colours from the palette, not from the old Minecraft set.
4. Check the view at 360px width and at desktop width.
5. Check long labels, empty states and error states.
6. Run `npm run lint` and `npm run build`.

---

## Accessibility checklist

- Body text is at least `--omori-dim` on `--omori-panel`; never `text-stone-800` on a
  dark card.
- Focus states are visible (lavender ring or border).
- Icon-only buttons have a `title` or `aria-label`.
- Colour is not the only signal for status; include text or an icon.
- Interactive targets are large enough to tap on mobile.
