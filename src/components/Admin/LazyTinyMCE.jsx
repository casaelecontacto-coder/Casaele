import React, { Suspense, lazy } from 'react';

// Lazy load TinyMCE editor to reduce initial bundle size.
//
// Self-hosted via the `tinymce` npm package instead of TinyMCE's cloud CDN.
// The cloud build ties an API key to a list of approved origins in TinyMCE's
// own dashboard — any domain not on that list (a new Vercel deployment URL,
// a preview branch, casaele-admin.vercel.app before someone remembers to
// register it, etc.) gets a "domain not registered" banner and a disabled
// editor.
//
// The actual setup (tinymce core + models/themes/icons/skins/plugins) lives
// in ./tinymceSetup.js as plain static imports, in a specific required
// order — see the comment there. That whole module is loaded here as one
// dynamic import so it still code-splits into its own on-demand chunk.
const TinyMCEEditor = lazy(() => import('./tinymceSetup').then((m) => ({ default: m.Editor })));

// Loading fallback component
const EditorLoader = () => (
  <div className="flex items-center justify-center p-8 border border-casa-ink/20 rounded-xl bg-casa-cream/40">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-casa-red"></div>
    <span className="ml-3 text-casa-ink/65">Loading editor...</span>
  </div>
);

/**
 * Lazy-loaded TinyMCE Editor wrapper
 * All props are passed through to the Editor component.
 * - `license_key: 'gpl'` declares self-hosted open-source usage. Since
 *   TinyMCE 6, the editor renders a "license key has not been provided"
 *   error instead of initializing at all without this — it's not the same
 *   thing as the cloud apiKey, and every admin page needs it.
 * - `skin`/`content_css` are left at their defaults ('oxide' / 'default')
 *   on purpose: tinymceSetup.js pre-populates TinyMCE's resource cache
 *   (via `tinymce.Resource.add(...)`, imported as skin.js/content.js) with
 *   those exact CSS payloads, so TinyMCE's normal skin-loading flow finds
 *   them already cached instead of fetching over the network. Forcing
 *   `skin: false` skips that flow entirely — including the step that
 *   clears the `visibility: hidden` TinyMCE applies to the editor container
 *   while skin loading is in progress, leaving the editor permanently
 *   invisible even though it had otherwise initialized correctly.
 */
export default function LazyTinyMCE({ init, ...rest }) {
  return (
    <Suspense fallback={<EditorLoader />}>
      <TinyMCEEditor init={{ ...init, license_key: 'gpl' }} {...rest} />
    </Suspense>
  );
}

