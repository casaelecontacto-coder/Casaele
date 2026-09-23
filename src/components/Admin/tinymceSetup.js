// Self-hosted TinyMCE setup, loaded as a single lazy chunk from
// LazyTinyMCE.jsx.
//
// These MUST be plain static imports, in this exact order. `tinymce/tinymce`
// is the only real ES module here — its last line does
// `window.tinymce = tinymce$1`. Every file after it (models, themes, icons,
// skins, plugins) is actually a plain IIFE script that reads the bare
// `tinymce` global at module-evaluation time (e.g. `tinymce.PluginManager`)
// and mutates it — they are not written to be imported as independent ES
// modules. Static imports execute in source order with no ambiguity, so
// listing `tinymce/tinymce` first guarantees the global exists before
// anything below tries to use it.
//
// The previous version of this file loaded everything via
// `Promise.all([import(...), import(...), ...])`, which starts every dynamic
// import concurrently with no ordering guarantee — if a plugin/skin file's
// chunk evaluated before tinymce/tinymce's did, `tinymce.PluginManager`
// etc. would be undefined and that registration would throw or silently
// no-op, producing exactly the symptom this was fixing: a blank,
// toolbar-less box with no rich-text UI at all.
import 'tinymce/tinymce';
import 'tinymce/models/dom/model';
import 'tinymce/themes/silver';
import 'tinymce/icons/default';
import 'tinymce/skins/ui/oxide/skin.js';
import 'tinymce/skins/ui/oxide/content.js';
import 'tinymce/skins/content/default/content.js';
// Union of every plugin any admin page's `init.plugins` string references.
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/table';
import 'tinymce/plugins/code';
import 'tinymce/plugins/fullscreen';
import 'tinymce/plugins/image';
import 'tinymce/plugins/media';

export { Editor } from '@tinymce/tinymce-react';
