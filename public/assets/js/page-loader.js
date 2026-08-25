/* ============================================
   Small App Tools standalone page loader
   Mounts a tool module into #tool-root on its
   standalone page. Keeps inline scripts out of
   the HTML so the CSP can stay strict.
   Usage:
     <script type="module" src="assets/js/page-loader.js?tool=bmi&mode=standalone"></script>
   ============================================ */

import * as tools from './tools/index.js';

const params = new URL(import.meta.url).searchParams;
const toolName = params.get('tool');
const mode = params.get('mode');

const mount = tools[toolName];
if (mount) {
    const options = mode ? { mode } : undefined;
    mount(document.getElementById('tool-root'), options);
}
