/* ============================================
   Small App Tools tool module registry
   Maps tool names to their modules so pages can
   load a tool by name via page-loader.js without
   inline scripts.
   ============================================ */

export { mount as calculator } from './calculator.js';
export { mount as bmi } from './bmi.js';
export { mount as mortgage } from './mortgage.js';
export { mount as retirement } from './retirement.js';
export { mount as imageCompression } from './image-compression.js';
export { mount as weather } from './weather.js';
export { mount as qrCode } from './qr-code.js';
export { mount as pomodoro } from './pomodoro.js';
export { mount as artOfTheDay } from './art-of-the-day.js';
export { mount as songOfTheDay } from './song-of-the-day.js';
