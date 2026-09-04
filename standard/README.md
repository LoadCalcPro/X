# Standard Method Dwelling Calculator

## Saved working draft — pending corrections

This is a checkpoint for continued development, not a completed release. The user requested saving this version to GitHub before further adjustments.

Next work: restore the original workbook's separate neutral-load calculation and verify its X markers against the user's explanation that they identify loads eligible for neutral reduction. Browser layout, controls and print verification remain outstanding. Do not treat the current omission of neutral calculations as the final agreed scope.

Open `standard/index.html` through a static server. This is a separate NEC 2023 single-dwelling calculator, based on the user's `Calculators 9-3-26.xlsx`, sheet `Standard D`, and the current production generator's visual conventions. Existing generator/AIC files are unchanged.

## Scope

- Single dwelling supplied by two ungrounded conductors at 208 or 240 V; calculated load VA and amperes, not conductor/breaker selection or neutral sizing.
- General demand, fixed appliances, household cooking, electric dryers, multiple HVAC systems, motors, EV and other continuous/noncontinuous loads.
- No generator management, optional-method heating demand factors, three-phase aggregate loads, multi-dwelling diversity, or automatic neutral reduction.
- A report uses the same engine results as the screen. Typical short calculations fit one Letter page; longer equipment lists paginate without suppressing entered loads. Full width and compact left layouts, branded or calculation-only, use the browser print/PDF dialog.
- Autosave is isolated from the generator/AIC keys. A modal offers restore or reset without writing a blank state over saved work.
- No dashboard entitlement or paid-product mapping is introduced. Those require a product/access decision before making this calculator a membership offering. This branch prepares the page for review.

## Calculation decisions

General demand uses the first 3,000 VA at 100%, the next 117,000 VA at 35%, and the remainder above 120,000 VA at 25%. The workbook instead used a 120,000-VA middle band, moving the upper breakpoint to 123,000 VA.

The Appliance Loads section is for fastened-in-place appliances. Its rows assume that scope without individual Fixed or horsepower questions, including when restoring older saved drafts. The existing 500-VA rating threshold still governs automatic qualification; a previously recorded quarter-horsepower qualification is retained. New below-threshold entries remain at 100% rather than guessing horsepower. Portable/nonqualifying loads can be entered under Other Noncontinuous Load. Quantity counts individual appliances.  Cooking, dryers, HVAC and EV are separated from that demand group.

Cooking now follows Standard D row-by-row: each row groups appliances of the same rating. It automatically calculates the Table 220.55 demand for that quantity and rating, displays the selected method and demand on the row and report, then sums those row demands once. This preserves the workbook workflow; combining all cooking appliances into one overall demand group is not used. Columns A/B are applied where the row rating is within Note 3; Column C otherwise, with the over-12-kW adjustment. Ratings at or below 1.75 kW and above 27 kW stay at nameplate. All-nameplate load is an available conservative upper bound. No branch-circuit combination shortcut is used for separate ovens/cooktops.

Dryers have a per-unit 5,000-VA minimum before Table 220.54. EV charging has a per-unit 7,200-VA minimum before the 125% continuous factor.

HVAC alternatives are mutually exclusive only when the user selects that arrangement. Concurrent supplemental heat is included at 100%. The engine compares operating alternatives with the one largest-motor addition included; a cooling motor can make cooling govern even when heating has a larger base load. Independent systems add, with one 25% motor addition across the whole service. Motor components already present in equipment inputs are not added twice. Motor load inputs must use applicable code/nameplate load, not MCA or breaker rating.

## References

- User workbook: `Calculators 9-3-26.xlsx`, `Standard D`.
- NFPA 2023-cycle published Table 220.55 and notes, pages 78–79: https://www.nfpa.org/api/files?path=/files/AboutTheCodes/70/70_A2022_NEC_P02_SD_SRStatements.pdf
- Leviton's licensed NEC 2023 extract, 220.53 and 220.57: https://captaincode2023.leviton.com/node/319
- Municipal standard-method worksheet (general procedure and motor addition): https://www.cityofslt.gov/DocumentCenter/View/18447/NEC-Load-Calculations
- NFPA published Table 220.54 in code-cycle materials: https://docinfofiles.nfpa.org/files/AboutTheCodes/70/70_A2025_NEC_P02_SD_MeetingAgenda_1024.pdf

## Verification

Run `node --test tests/standard-engine.test.cjs` from the repository root. Tests cover demand boundaries, mixed cooking loads, fixed-appliance eligibility, dryer thresholds, HVAC concurrency, governing motor cases, EV minimums, invalid entries, and a complete dwelling example.

## Worksheet layout

The load sections now form one continuous worksheet. General, cooking, dryer, appliance, motor, HVAC and result rows share column positions on desktop. Row descriptions and inline method notes stay on the sheet; quantities, ratings and outputs align. Mobile retains labeled inputs and responsive rows. Fixed and horsepower checkboxes are removed from the appliance form.
