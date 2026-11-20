
_Design by Anderson Mancini_

<img width="1666" alt="Screenshot 2024-03-01 at 22 58 27" src="https://github.com/kKaskak/realvwr-scroll/assets/117831817/de87f8f2-1187-481f-8ada-d9b6c2d4a5bc">

## About webgi: [https://webgi.xyz/](https://webgi.xyz/)

Showcase Products in Full 3D with Incredible Details on websites and apps

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack) + React 19 + TypeScript
- [WebGi 0.6.3](https://webgi.xyz/) for the 3D ring viewer and material configurator
- [GSAP 3](https://gsap.com/) + ScrollTrigger for the scroll-driven camera and text animations
- [Lenis](https://lenis.darkroom.engineering/) for inertia smooth scrolling (synced to GSAP's ticker; disabled for `prefers-reduced-motion`)

> This project was migrated from Parcel 1 to Next.js. See [MIGRATION.md](MIGRATION.md)
> for what changed and why.

## Requirements

- Node.js **20.9 or newer**
- npm

## Running

First install the dependencies:

```bash
npm install
```

To run the project in development mode:

```bash
npm run dev
```

Then navigate to [http://localhost:3000](http://localhost:3000) in a web browser to see the default scene in a viewer.

To build and run the project for production:

```bash
npm run build
npm start
```

Other scripts:

| Script              | Purpose                                           |
| ------------------- | ------------------------------------------------- |
| `npm run lint`      | ESLint (Next.js core-web-vitals + TS rules)       |
| `npm run typecheck` | TypeScript type check (`tsc --noEmit`)            |
| `npm run format`    | Format the code with Prettier                     |
| `npm run deploy`    | Deploy to Vercel production (`npx vercel --prod`) |

> Note: in the old Parcel setup `npm start` started the dev server. It now starts
> the production server (Next.js convention); use `npm run dev` for development.

## Project structure

```
public/assets/            Static files served from /assets/* (3D models, images, sounds)
src/app/layout.tsx        Root layout: <html>/<body>, SEO metadata, viewport, fonts, global CSS
src/app/page.tsx          The single page, composed from the components below
src/app/loading.tsx       Route loading UI (reuses the site loader)
src/app/error.tsx         Route error boundary
src/app/global-error.tsx  Root-layout error boundary
src/app/fonts.ts          Google fonts via next/font (self-hosted)
src/components/           Loader, Header, Sections, CustomizerFooter (Server Components)
                          WebgiViewer, ScrollToTopOnLoad (Client Components)
src/lib/viewer/setupViewer.ts  WebGi viewer, material configurator, intro timeline and GSAP scroll animation
src/lib/viewer/smoothScroll.ts Lenis smooth scrolling wired into GSAP ScrollTrigger
src/styles.css            Site styles
src/animations.css        Scale in/out keyframe animations
```

The page markup is rendered on the server as static HTML. The 3D experience
(`setupViewer.ts`) is browser-only and is loaded with a dynamic `import()` from the
`WebgiViewer` Client Component after hydration.

The assets are stored in the `public/assets` directory. The ring model is
`public/assets/scroll-ring-pear.glb`; the material swatch images in
`public/assets/images/` must be named exactly like the material names in the model
(e.g. `Rose Gold.png`).

## Environment variables

See `.env.example` for every variable. All are optional for the public site:
without `MONGODB_URI` it serves the catalogue built into `src/content/site.ts`.
Only variables prefixed with `NEXT_PUBLIC_` are exposed to browser code.

## Admin panel (`/admin`)

Manages products, collections, the home page banner rings, images and
enquiries. Changes appear on the public site immediately.

1. Set `MONGODB_URI` (e.g. MongoDB Atlas) and the three `CLOUDINARY_*`
   variables in `.env.local` locally, and in the hosting provider for production.
2. Create an administrator (asks for a password, 12+ characters; re-run to
   reset a password, which also signs that account out everywhere):

    ```bash
    npm run admin:create -- owner@example.com "Full Name"
    ```

3. Sign in at `/admin` and choose **Import current catalogue** on the
   dashboard. Until then the website keeps showing the built-in pieces.

How it fits together:

- **Data:** MongoDB collections `products`, `collections`, `enquiries`,
  `adminUsers`, `sessions`, `rateLimits`, `meta` (`src/lib/db`). Public pages
  read through `src/lib/data/catalogue.ts`, cached under the `catalogue` tag;
  every admin change refreshes it (`updateTag`).
- **Auth:** scrypt password hashes; random session tokens in an httpOnly
  cookie scoped to `/admin`, stored only as SHA-256 hashes; login throttled
  per email and per IP. `src/proxy.ts` redirects signed-out visitors, and every
  admin page, data function and Server Action re-checks the session
  (`requireAdmin`).
- **Images:** the browser uploads straight to Cloudinary with a short-lived
  signature from the server (the API secret never leaves the server).
  Images removed, replaced or belonging to deleted products are deleted from
  Cloudinary when you save. The site delivers them with `f_auto,q_auto` and
  responsive widths.
- **3D banner:** Admin → 3D banner manages the hero slides at the top
  (`#view1`, collection `heroSlides`): text, glow colour, Explore target,
  order and visibility (up to six visible; at least one must stay visible).
  Each slide shows one of:
    - **360° video:** pick the ring's turntable MP4; the admin's browser cuts 72
      frames (one per 5°), removes a white studio background, and uploads the
      frames to Cloudinary (`src/lib/spin/fromVideo.ts`). The ring turns as
      visitors scroll. The video itself is never uploaded.
    - **Photos:** up to six views, crossfaded while scrolling.
    - **3D ring model:** the built-in model recoloured with a stone and metal
      preset (camera moves reuse the four presets in turn).

    Photo and spin slides hide the 3D canvas (`src/components/HeroPhotos.tsx`).
    Choose **Import current slides** there first; until then the built-in
    slides are shown.

- **Ring showcase:** Admin → Ring showcase manages the four-ring photo
  section further down (`#quartet`). Its animation is designed for exactly four rings, so it
  shows the first four visible rings in the list order; extra rings wait as
  reserves, and with fewer than four visible the section is hidden. Choose
  **Import current rings** there first; until then the built-in four are shown.
- **Enquiries:** `/api/enquiry` stores each enquiry (rate-limited per IP) and,
  if `ENQUIRY_WEBHOOK_URL` is set, also forwards it there for notifications.

## Updates

Check the [webgi manual](https://webgi.xyz/docs/manual/#sdk-links) for the latest version.
To use the different version:

- Update the version number in `package.json` file for both `webgi` and `@types/webgi`.
- Run `npm install` to update the dependencies.
- Delete the `.next` folder: `rm -rf .next`
- Run `npm run dev` or `npm run build` to run or build the project.

## Documentation

For the latest version and documentation: [WebGi Docs](https://webgi.xyz/docs/).

## License

For license and terms of use, see the [SDK License](https://webgi.xyz/docs/license).
