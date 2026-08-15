# AIC split verification

Branch: `aic-cleanup`

## Static checks completed

- `aic/index.html` still loads the outer shell stylesheet (`styles.css`) and scripts in the same order: `app.js`, `motor-contribution.js`, `aic-display.js`.
- The iframe still loads `../aic_calculator.html`.
- `aic_calculator.html` now loads `aic/inner-styles.css` in the head, then the Supabase library, and loads `aic/inner-app.js` at the end of the body.
- The inner calculator markup and all existing IDs used by the calculation, panel, restore, print, motor, and display code remain in place.
- `inner-app.js` still contains the original AIC constants, `calculate`, carry-forward, create/remove/reset panel logic, local-storage save/restore, print fallback, and access/session logic.
- `inner-styles.css` preserves the original CSS cascade order, including the later screen/print overrides that intentionally supersede earlier rules.
- The exact pre-split source remains available as `aic_calculator.pre-split.html` for rollback.
- The production `main` branch has not been changed.

## Runtime checks still required before merge

These need to be exercised in a browser against the cleanup branch or a preview deployment:

1. Initial AIC screen opens with one visible calculation panel under the outer shell.
2. Enter a known calculation and confirm AIC output matches production.
3. Confirm first AIC carries into downstream panel 1.
4. Add and remove downstream panels through the supported maximum.
5. Reset first and downstream panels.
6. Save/reload and verify Previous Calculation Found / Continue / Start New behavior.
7. Verify motor contribution controls and calculations.
8. Verify Full Page, Side by Side, Stacked, and Stacked Columns print layouts.
9. Verify Print / PDF and New Calculation header controls.
10. Verify desktop and phone layouts.

## Safety rule

Do not merge `aic-cleanup` into `main` until the runtime checklist passes. Do not begin visual redesign work on `main`; visual work should remain on the protected branch until approved.