import React, { Suspense, lazy } from 'react';

// Lazy load TinyMCE editor to reduce initial bundle size.
//
// Self-hosted via the `tinymce` npm package instead of TinyMCE's cloud CDN.
// The cloud build ties an API key to a list of approved origins in TinyMCE's
// own dashboard — any domain not on that list (a new Vercel deployment URL,
// a preview branch, casaele-admin.vercel.app before someone remembers to
// register it, etc.) gets a "domain not registered" banner and a disabled
// editor. Importing tinymce's core/theme/icons/skins/plugins here makes
// `window.tinymce` exist before the Editor component from
// @tinymce/tinymce-react ever mounts; the wrapper detects that and uses it
// directly, skipping its cloud script loader (and any apiKey prop) entirely.
const TinyMCEEditor = lazy(async () => {
  const [{ Editor }] = await Promise.all([
    import('@tinymce/tinymce-react'),
    import('tinymce/tinymce'),
    import('tinymce/models/dom/model'),
    import('tinymce/themes/silver'),
    import('tinymce/icons/default'),
    import('tinymce/skins/ui/oxide/skin.js'),
    import('tinymce/skins/ui/oxide/content.js'),
    import('tinymce/skins/content/default/content.js'),
    // Union of every plugin any admin page's `init.plugins` string references.
    import('tinymce/plugins/link'),
    import('tinymce/plugins/lists'),
    import('tinymce/plugins/table'),
    import('tinymce/plugins/code'),
    import('tinymce/plugins/fullscreen'),
    import('tinymce/plugins/image'),
    import('tinymce/plugins/media'),
  ]);
  return { default: Editor };
});

// Loading fallback component
const EditorLoader = () => (
  <div className="flex items-center justify-center p-8 border border-casa-ink/20 rounded-xl bg-casa-cream/40">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-casa-red"></div>
    <span className="ml-3 text-casa-ink/65">Loading editor...</span>
  </div>
);

/**
 * Lazy-loaded TinyMCE Editor wrapper
 * All props are passed through to the Editor component. `skin`/`content_css`
 * in `init` are forced to false so TinyMCE doesn't also try to fetch a skin
 * stylesheet from a CDN path — the skin/content CSS is already bundled in
 * via the imports above.
 */
export default function LazyTinyMCE({ init, ...rest }) {
  return (
    <Suspense fallback={<EditorLoader />}>
      <TinyMCEEditor init={{ ...init, skin: false, content_css: false }} {...rest} />
    </Suspense>
  );
}

