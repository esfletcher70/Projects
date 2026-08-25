/* ============================================
   Small App Tools standalone page loader
   Mounts a tool module into #tool-root on its
   standalone page. Keeps inline scripts out of
   the HTML so the CSP can stay strict.
   Usage: <script type="module" src="assets/js/page-loader.js"
           data-tool="bmi" data-mode="standalone"></script>
   ============================================ */

import * as tools from './tools/index.js';

const script = document.currentScript;
const toolName = script.dataset.tool;
const mode = script.dataset.mode;

const tool = tools[toolName];
if (tool) {
    const options = mode ? { mode } : undefined;
    tool.mount(document.getElementById('tool-root'), options);
}
