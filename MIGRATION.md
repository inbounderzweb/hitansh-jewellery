# Migration report: Parcel 1 → Next.js 16

Branch: `nextjs-migration` (the original Parcel project is untouched on `main`).

## 1. What the project was

A single-page, static marketing site:

- **Build tool:** Parcel 1 (`parcel-bundler`), plain JavaScript, one `index.html`.
- **3D:** WebGi 0.6.3 (Three.js based) viewer that loads `scroll-ring-pear.glb`, plus a
  custom `MaterialConfiguratorPlugin` that builds the gem/metal swatch UI.
- **Animation:** GSAP 3.11 + ScrollTrigger (scroll-driven camera path and section text).
- **Other:** jQuery 1.9.1 from a CDN (only for one scroll-to-top call), Google Fonts via
  `<link>`, SEO/Open Graph/Twitter meta tags, Vercel deploy script.
- **Not present:** no API calls, backend, authentication, sessions, forms, CRUD,
  uploads/downloads, environment variables, routing beyond `/`, or state library.

## 2. What it is now

| Area | Before | After |
| --- | --- | --- |
| Framework | Parcel 1 static HTML | **Next.js 16.4.6**, App Router, Turbopack |
| UI runtime | Plain DOM | React 19.3 (Server Components + 2 small Client Components) |
| Language | JavaScript | TypeScript 5.9 (`strict`) |
| Page markup | `index.html` | `src/app/page.tsx` + `src/components/*` (Server Components) |
| 3D / animation logic | `src/scripts.js` | `src/lib/viewer/setupViewer.ts` (1:1 port), loaded client-side only |
| SEO | `<meta>` tags | Next.js Metadata API (`metadata` + `viewport` exports) |
| Fonts | Google Fonts `<link>` | `next/font/google` (self-hosted, no layout shift) |
| Logo image | `<img>` | `next/image` (optimized, intrinsic size, `quality=100`) |
| Static files | `assets/` copied by a Parcel plugin | `public/assets/` (same URLs: `/assets/...`) |
| jQuery | CDN script | Removed: replaced by a 10-line `ScrollToTopOnLoad` component |
| Error / loading UI | none | `error.tsx`, `global-error.tsx`, `loading.tsx` |
| Lint / format | Prettier | ESLint 10 (`eslint-config-next`) + Prettier |
| GSAP | 3.11.4 | 3.15.1 (same major version, same API) |
| WebGi | 0.6.3 | 0.6.3 (unchanged on purpose: see §6) |

## 3. File mapping

| Original | New |
| --- | --- |
| `index.html` `<head>` | `src/app/layout.tsx` (`metadata`, `viewport`, fonts, CSS imports) |
| `index.html` loader | `src/components/Loader.tsx` |
| `index.html` header | `src/components/Header.tsx` |
| `index.html` sections 1–3 | `src/components/Sections.tsx` |
| `index.html` customizer footer | `src/components/CustomizerFooter.tsx` |
| `index.html` canvas | `src/components/WebgiViewer.tsx` |
| `<body onload="scrollToTop()">` + jQuery | `src/components/ScrollToTopOnLoad.tsx` |
| `src/scripts.js` | `src/lib/viewer/setupViewer.ts` |
| `src/styles.css`, `src/animations.css` | unchanged location (only font-family values changed, see §4) |
| `assets/` | `public/assets/` (already present and byte-identical; the duplicate was removed) |

**Removed** (all recoverable from `main`):

- `index.html` and `src/scripts.js`: ported as above.
- Root `assets/`: a byte-identical duplicate of `public/assets/` (verified with checksums).
- `public/index.html`, `public/*.{js,css,map}`, `public/realvwr.2e439cdd.webp`: an old,
  committed Parcel build. Next.js would have served it publicly at `/index.html`.
- `.DS_Store` files.
- Dependencies `parcel-bundler`, `parcel-plugin-static-files-copy`, the `resolutions`
  block (for Parcel's Babel), `@types/jquery`, `animations.css` (npm package, never
  imported: the site uses the local `src/animations.css`), and `vercel` CLI v27 (the
  `deploy` script now uses `npx vercel --prod`).

## 4. Changes made only for framework compatibility

1. **Client-only 3D code.** WebGi accesses `window`/WebGL at import time, so
   `setupViewer.ts` is loaded with `import()` inside a `useEffect`. A module-level guard
   ensures it starts once, even under React Strict Mode's double effects in development.
2. **Asset paths made absolute.** `./assets/scroll-ring-pear.glb` → `/assets/...`, and the
   same for the swatch images (identical result on `/`).
3. **Fonts.** `'Archivo'`, `'Playfair Display SC'` and `'Qwitcher Grypen'` in
   `styles.css` now reference the `next/font` CSS variables (`var(--font-archivo)` and
   so on). The weights and subsets are the same ones the original loaded. `'Lato'`
   was never loaded by the original (it fell back to `sans-serif`) and is left as is.
4. **TypeScript port of `scripts.js`.** The logic is unchanged. Three dead constructs were
   dropped or annotated because they had no runtime effect (each has a comment in the code):
   - a 4th "position" argument passed to `gsap.fromTo()`, which accepts three arguments;
   - `ringColorsContainer.pointerEvents = 'none'`, which set a property on the element
     rather than on its style;
   - `gsap.timeline({ default: … })`, a typo for `defaults` that GSAP ignores. It was
     kept as is so easing is unchanged.
5. **`/index.html` → `/` permanent redirect** so old links to the Parcel URL keep working.

## 5. Verification performed

All checks ran against the **production build** (`next build && next start`). The
reference was the original Parcel `dist/` build, served statically. The browser was
headless Chromium with software WebGL.

- `next build`: succeeds, and `/` is prerendered as static HTML.
- `tsc --noEmit` (strict): 0 errors. `eslint .`: 0 errors and 0 warnings.
- **Interaction flow** (desktop 1440×900, iPad Mini, iPhone 13), scripted end to end:
  load and loader hide → "Start now" → scroll to sections 2 and 3 → "Customize it" →
  gem panel → select *Ruby* → close → metal panel → select *Rose Gold* → close → EXIT →
  scroll back to top. At every step the DOM state matches the original: scroll position,
  `overflow` locks, EXIT button visibility, footer visibility, section-3 display,
  active swatch, panel visibility, and the full list of 20 generated swatches and close
  buttons.
- **Layout parity:** 52 static elements × 5 viewports (1440, 1024, iPad Mini, iPhone 13,
  iPhone SE) have the same layout box, font family, size, weight, line-height,
  letter-spacing, colour, background, border, radius, shadow, z-index, padding and
  margin as the original. The only difference is an invisible `color: transparent`
  that `next/image` adds to the logo `<img>`.
- **Visual comparison:** side-by-side screenshots of every step at each viewport. The
  typography, logo, buttons, panels and tooltips match. The only differences are in the
  3D camera and animation phase, because frames are captured at slightly different
  times.
- **Console:** no hydration warnings, no React errors, and no failed requests in
  development or production. The remaining Three.js warnings
  (`Unsupported encoding`, `sRGB encoded textures…`) also appear in the original.
- **Rendering parity:** both builds create exactly one WebGL context with identical
  attributes, the same canvas resolution and the same render-loop rate.
- **SEO:** every original meta tag is emitted (title, description, keywords, `og:*`,
  `twitter:*`, icons, viewport). Next.js also emits `twitter:title` and
  `twitter:description`, plus `initial-scale=1` in the viewport tag.

## 6. Known issues / items not changed

These were present in the original. The first three were preserved by the migration
and then **fixed in the motion update (§7)**:

- ~~"Start now" does not scroll~~: fixed. The inner `<a href="#">` used to jump back to
  the top and cancel the scroll.
- ~~The loader progress bar never advances~~: fixed. The listener is now attached
  before the model loads.
- ~~Intro animation race (scroll lock released inside the customizer on very slow
  devices)~~: fixed. Scrolling is never unlocked while the customizer is open.

Still preserved as is:

- The markup has `<li>` elements outside a `<ul>` and a duplicated `id="nav-tabs-inner"`,
  kept so the CSS selectors and behaviour stay identical.
- The music and dark-mode controls were commented out and remain disabled.
  `music_loop.mp3`, `eng.glb`, `new_scene.glb` and several SVGs are unused, but they
  are kept in `public/assets/`.

Not resolved / to be aware of:

- **WebGi 0.6.3 is old.** It is only distributed as a tarball on
  `storage.googleapis.com` (still reachable at the time of migration). Upgrading WebGi
  is a separate project because its API and rendering changed. It was kept at 0.6.3 to
  guarantee identical visuals.
- **Vercel project settings.** If the Vercel project was set up for Parcel (framework
  "Other", output directory `dist`), switch the framework preset to **Next.js** and
  clear the custom output directory before deploying.
- **Real-device testing.** Automated tests ran in headless Chromium with software WebGL.
  Please also check on a real iPhone/iPad (Safari) and a desktop with a GPU, because
  WebGL performance and iOS Safari could not be tested here.
- The local, git-ignored `dist/` folder (old Parcel output) can be deleted once you no
  longer need it for comparison. There is also a stray empty `package-lock.json` in the
  parent folder (`hitansh-jewellery/`); `next.config.ts` pins the project root so it is
  ignored.

## 7. Motion & smooth-scroll update

The goal was to match the scroll smoothness and cinematic pacing of the reference
experience (<https://webgi-jewelry.vercel.app/>), keeping this site's design, camera
path, materials and customizer unchanged. The reference is the WebGi jewelry template
this project was built from, and its source map shows the techniques it uses: Lenis
smooth scrolling feeding GSAP ScrollTrigger, and one choreographed intro timeline.

| | Before | After |
| --- | --- | --- |
| Page scrolling | Native wheel steps; the scrubbed camera jumped between steps | **Lenis** inertia scrolling with the reference settings (`duration 2.2`, soft exponential ease-out), driven inside GSAP's ticker so the scroll, ScrollTrigger and tweens update in the same frame |
| Intro | Three independent tweens started at once (the `'-=0.8'`-style offsets were ignored); 4s CSS fade of the loader | One timeline: loader fades (1.4s) → camera flies in (4s, `power2.inOut`, same start and end coordinates) → header drops in → hero container slides in and its heading and copy rise in sequence. Scrolling unlocks when the intro ends |
| Background script words ("Forever", "Emotions") | Static | Scroll-linked parallax drift (behind the foreground copy) |
| Customizer toolbar | Popped in and out | Rises in (1s, `power3.out`) and sinks out (0.4s); hiding is timer-based so it never depends on frame rate |
| Customizer mode | Scroll locked via `overflow` only | Lenis also stops, so the wheel and touch go only to the ring (orbit and zoom). It restarts on EXIT |
| Touch devices | Scrubbed camera followed native scroll 1:1 | Native momentum scrolling is kept (Lenis doesn't hijack touch); the camera scrub gets a short 0.8s catch-up to hide frame stepping. `ignoreMobileResize` stops jumps when the address bar shows or hides |
| "Start now" | Did nothing | Glides to the "Forever" section |
| Loader progress bar | Never moved | Shows real model download progress |
| `prefers-reduced-motion` | — | Smooth scrolling is disabled (native, instant scrolling) |

**Not taken from the reference** (they would change this site's design): its pink
background and vignette, the scroll-driven ring colour changes, the side-bar section
dots, the "scroll" indicator, and its different ring model.

**Files:** `src/lib/viewer/smoothScroll.ts` (new), `src/lib/viewer/setupViewer.ts`,
`src/app/layout.tsx` (Lenis base CSS), and the `lenis` 1.3.27 dependency.

**Verification** (production build, headless Chromium with software WebGL):
- Scroll stays locked during the intro, and the header and hero finish with clean
  inline styles.
- Lenis glide was measured frame by frame:
  - one wheel notch (300px) eases from 320 to 620 over about 2.5s;
  - "Start now" glides from 0 to section 2 over about 2.4s with no `#` jump.
- In the customizer:
  - wheel input never scrolls the page;
  - after EXIT the toolbar is hidden with no leftover inline styles and smooth
    scrolling resumes.
- On iPhone emulation, the gem strip still swipes sideways while page scroll is locked,
  and tapping a swatch still selects it.
- Reduced motion: wheel scrolling is immediate (no glide).
- No page errors.

Frame-rate smoothness itself can't be measured in a software-rendered browser (about
1–4 fps). Please check the feel on real hardware: a desktop with a GPU, an iPhone in
Safari, and a mid-range Android phone.
