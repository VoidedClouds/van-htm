import {
  setupBasicHTML,
  setupReactiveState,
  setupForEach,
  setupShowWhen,
  setupPortal,
  setupSVG,
  setupCombined,
  setupArrayMap,
  setupEntityDecoding
} from './demo';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Set up all demos
  setupBasicHTML(document.getElementById('basic-html')!);
  setupReactiveState(document.getElementById('reactive-state')!);
  setupForEach(document.getElementById('for-each')!);
  setupShowWhen(document.getElementById('show-when')!);
  setupPortal(
    document.getElementById('portal-demo')!,
    document.getElementById('portal-target')!
  );
  setupSVG(document.getElementById('svg-demo')!);
  setupCombined(document.getElementById('combined')!);
  setupArrayMap(document.getElementById('array-map')!);
  setupEntityDecoding(document.getElementById('entity-decoding')!);
});