import React, { Suspense, lazy } from 'react';

// Lazy load TinyMCE editor to reduce initial bundle size
const TinyMCEEditor = lazy(() => import('@tinymce/tinymce-react').then(module => ({ default: module.Editor })));

// Loading fallback component
const EditorLoader = () => (
  <div className="flex items-center justify-center p-8 border border-casa-ink/20 rounded-xl bg-casa-cream/40">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-casa-red"></div>
    <span className="ml-3 text-casa-ink/65">Loading editor...</span>
  </div>
);

/**
 * Lazy-loaded TinyMCE Editor wrapper
 * All props are passed through to the Editor component
 */
export default function LazyTinyMCE(props) {
  return (
    <Suspense fallback={<EditorLoader />}>
      <TinyMCEEditor {...props} />
    </Suspense>
  );
}

