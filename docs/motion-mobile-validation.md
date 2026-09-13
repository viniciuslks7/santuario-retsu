# Motion and mobile update

The embedded browser reported `prefers-reduced-motion`, so the original site
opened with its motion setting checked. The visible play/pause control now lets
visitors override that default and remembers their explicit choice locally.

Added a gentle overview orbit (stops when the visitor drags), artifact turntables
(manual inspection takes over), four cloth banners and subtle lantern flicker.
Mobile retains the balanced renderer with DPR 1 and no postprocessing by default.

Responsive changes include 44px header controls, safe-area spacing, horizontally
scrollable catalogs, shorter-canvas camera framing, separated scene/story/catalog
regions, landscape layout, and an expandable story reader on small screens.

Validation on the production build through the in-app Chromium browser:

- 1280 × 720: scene rendered, animation control worked, preference survived reload.
- 320 × 568: page width 320px, all four header controls 44 × 44px and within the
  viewport, scene/story boundaries aligned, 6.5px gap between story and catalog.
- 390 × 844: inspection, expanded reading and journal visually reviewed; balanced
  quality selected automatically after reload; motion override remained enabled.
- 844 × 390: split scene/story layout reviewed; expanded reader measured
  812 × 263px, with catalog hidden during reading.
- Dragging the overview unchecked automatic camera tour while world motion stayed
  active. No JavaScript errors were reported during this review.
- `npm run lint` and `npm run build` passed.

These are browser viewport checks, not physical iOS/Android device or FPS tests.
