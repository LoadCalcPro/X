# AIC cleanup audit

This audit protects the working AIC calculator while we clean and later split the code.

## Current live structure

- `aic/index.html` is the outer LoadCalcPro X shell. It provides the navy header, five top controls, iframe sizing, print-layout bridge, new-calculation control, panel-count normalization, and the link to the inner calculator.
- `aic_calculator.html` is the inner calculator. It still owns the calculation fields, panel creation/removal, saved calculation state, restore modal, core AIC math, and legacy standalone/mobile/print styling.
- `aic/aic-display.js` is an active display/print adapter. It replaces the visible formula/calculation presentation, builds the current engineering print reports, supports Full Page / Side by Side / Stacked / Stacked Columns, and wraps the inner `calculate()` function.
- `aic/motor-contribution.js` is active. It adds the motor contribution UI, NEC motor tables, motor state, and motor values used by the display/print adapter.

## Important dependencies that must not be deleted during cleanup

1. Hidden inner result nodes such as `aicResult` and `cConstant` are still data sources for other scripts even when their original result boxes are hidden.
2. `calculate()` in `aic_calculator.html` is wrapped by `aic-display.js`; changing its name/signature or removing it will break the current display.
3. Panel IDs and suffix conventions (`utilityFault2`, `distance2`, etc.) are shared by the core calculator, display adapter, saved-state logic, and motor contribution code.
4. The outer iframe timing calls and resize observer are intentional compatibility safeguards. Do not remove them merely because some calls look repetitive.
5. The old inner header/access UI is hidden by the outer shell during normal use, but it still supports direct standalone access. It should not be removed until routing is intentionally changed.
6. The current print result is primarily controlled by `aic-display.js`. Old print CSS inside `aic_calculator.html` is a cleanup candidate, but it cannot be deleted until standalone/direct printing requirements are decided and tested.

## CSS classification

### Active / keep

- Base calculator card, form grid, labels, inputs/selects, buttons, panel controls.
- Restore modal styling and behavior.
- Mobile rules for the inner calculator.
- Formula source classes because the core calculator still generates them before the display adapter replaces the visible presentation.
- Print classes referenced by current generated report markup (`clean-print-report`, `print-report-*`, etc.) until the display/print layer is separated.

### Overridden but still potentially required

- Original `.result`, `.metric`, `.formula`, and `.formula-report` presentation rules. The visible result is replaced/hid by the display adapter, but the nodes and markup are still used as calculation/update targets.
- Original AIC print rules in `aic_calculator.html`. The shell/display layer supersedes them in normal X use, but they remain a fallback for direct standalone use.
- Inner `.form-titlebar` and access gate styling. The outer shell hides them in normal X use, but they remain a direct-access fallback.

### Safe cleanup targets after verification

- Exact duplicate selector declarations inside `aic_calculator.html` where the later declaration has the same value and no intermediate dependency.
- Comments and abandoned style blocks that reference markup no longer created anywhere in the core, display, or motor scripts.
- Repeated print-control declarations that can be consolidated without changing cascade order or specificity.
- Legacy print presentation only after a dedicated print stylesheet/renderer is established and standalone direct-print behavior is intentionally retired or preserved separately.

## JavaScript classification

### Active / keep

- Core AIC math (`calculate`, constants lookup, `constantKey`, `readNumber`, formatting).
- Panel create/remove/reset and carry-forward behavior.
- Local-storage save/restore behavior.
- Outer shell iframe sizing, print bridge, panel-capacity handling, restore positioning.
- `aic-display.js` calculation wrapper and current report builder.
- `motor-contribution.js` motor UI/state/calculation.

### Do not simplify yet

- Multiple delayed `prepareInnerPage()` / resize calls in the outer shell.
- The first-panel normalization in both shell/display layers until startup and restore behavior are tested on the cleanup branch.
- Compatibility aliases/functions used by the current print adapter.

## Cleanup sequence

1. Preserve current `main`; all cleanup work stays on `aic-cleanup`.
2. Consolidate only proven duplicate CSS with no visual/behavior change.
3. Verify: initial one-panel startup, restore modal, new calculation, calculation math, carry-forward, add/remove panels, motor contribution, all four print layouts, mobile layout.
4. After verification, split the inner calculator into HTML/CSS/JS while preserving IDs, function names, and load order.
5. Move print-specific code/styles to a dedicated print module after the base split is stable.
6. Only then make the agreed visual changes (outer workspace frame and highlighted final Isc row).

## Rule for this branch

No cleanup commit should intentionally change the visible design or numerical output. If a change cannot be proven behavior-neutral, leave it in place until after the split and testing.