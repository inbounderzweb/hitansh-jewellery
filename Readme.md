## A 3D scrollable website made with WEBGi, GSAP and Next.js

*Design by Anderson Mancini*

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

| Script              | Purpose                                    |
| ------------------- | ------------------------------------------ |
| `npm run lint`      | ESLint (Next.js core-web-vitals + TS rules) |
| `npm run typecheck` | TypeScript type check (`tsc --noEmit`)     |
| `npm run format`    | Format the code with Prettier              |
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

None. The site does not read any environment variables and needs no `.env` file.
If you add some later, remember that only variables prefixed with `NEXT_PUBLIC_`
are exposed to browser code.

## Updates

Check the [webgi manual](https://webgi.xyz/docs/manual/#sdk-links) for the latest version.
To use the different version:

-   Update the version number in `package.json` file for both `webgi` and `@types/webgi`.
-   Run `npm install` to update the dependencies.
-   Delete the `.next` folder: `rm -rf .next`
-   Run `npm run dev` or `npm run build` to run or build the project.

## Documentation

For the latest version and documentation: [WebGi Docs](https://webgi.xyz/docs/).

## License

For license and terms of use, see the [SDK License](https://webgi.xyz/docs/license).
