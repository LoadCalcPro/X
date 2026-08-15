# AIC cleanup audit

Branch: `aic-cleanup`

This audit is the safety baseline before changing the working AIC calculator.

## Current live structure

- `aic/index.html` is the outer LoadCalcPro X shell. It owns the navy application header, the five desktop controls, iframe sizing, navigation, New Calculation behavior, restore-modal positioning, and coordination with the inner calculator.
- `aic/index.html` loads the legacy inner calculator through `../aic_calculator.html` in `#aicFrame`.
- `aic/aic-display.js` is an active enhancement layer. It replaces the visible formula/calculation presentation, creates the current engineering print reports and selectable print layouts, and wraps the inner `calculate()` function so the engineering display refreshes after calculations.
- `aic/motor-contribution.js` is an active enhancement layer. It adds motor contribution inputs, NEC motor FLC tables, motor state, and motor-result integration.
- Root `aic_calculator.html` remains the calculation engine/UI host and contains the original calculator HTML, calculation functions, local-storage behavior, panel creation/removal, access/restore code, and a large historical CSS/print cascade.

## Important dependency findings

1. The inner `aic_calculator.html` cannot be cleaned by deleting later CSS merely because it duplicates earlier CSS. Several later rules intentionally override the older live/mobile/print rules.
2. The hidden `.result` elements are still used as calculation/data nodes even though a later screen rule hides their visual boxes. They must not be deleted during cleanup.
3. `aic-display.js` depends on IDs and functions supplied by `aic_calculator.html`, including `calculate`, `createPanel`, `updatePanelControls`, `saveCurrentValues`, and the existing field IDs. Those names must remain stable through cleanup.
4. `motor-contribution.js` also depends on the iframe structure and the existing panel/card IDs and data attributes. Those interfaces must remain stable.
5. The outer shell performs deliberate late/repeated initialization after iframe load. Those repeated calls may look redundant, but they currently protect against timing/order issues and will not be removed until the split allows deterministic initialization.
6. The current print system is primarily produced by `aic-display.js`, while older print CSS still exists in `aic_calculator.html`. That historical print CSS is a cleanup candidate, but only after verifying there is no fallback path still using it.

## Cleanup rules

- No calculation formulas or constants will be changed.
- No field IDs, panel IDs, storage keys, or public function names will be changed during cleanup.
- No desktop appearance changes will be mixed into cleanup.
- No mobile appearance changes will be mixed into cleanup.
- No print-layout changes will be mixed into cleanup.
- Cleanup changes will stay on `aic-cleanup` until tested.

## Safe cleanup order

1. Inventory the root `aic_calculator.html` CSS blocks and classify each as active, overridden-but-required, or obsolete.
2. Inventory the root JavaScript functions and identify which are called by the outer shell/enhancement files.
3. Remove only code proven unreachable or fully superseded.
4. Verify one-panel startup, restore/new calculation, AIC calculation, panel add/remove, carry-forward, motor contribution, autosave, and all four print modes.
5. After verification, split the legacy root file into dedicated HTML/CSS/JS files while preserving the same external IDs/functions.
6. Only after the split is stable, make the two agreed visual changes: outer workspace frame and light-blue final Isc row.
