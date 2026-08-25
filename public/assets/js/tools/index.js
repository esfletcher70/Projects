/* ============================================
   Small App Tools tool module registry
   Maps tool names to their modules so pages can
   load a tool by name via page-loader.js without
   inline scripts.
   ============================================ */

export { mount as calculator } from './tools/calculator.js';
export { mount as bmi } from './tools/bmi.js';
export { mount as mortgage } from './tools/mortgage.js';
export { mount as retirement } from './tools/retirement.js';
export { mount as imageCompression } from './tools/image-compression.js';
export { mount as weather } from './tools/weather.js';
export { mount as qrCode } from './tools/qr-code.js';
export { mount as pomodoro } from './tools/pomodoro.js';
export { mount as artOfTheDay } from './tools/art-of-the-day.js';
export { mount as songOfTheDay } from './tools/song-of-the-day.js';
