"use strict";

/* LoadCalcPro X Generator — final calculation orchestration.
   Demand applies only to General + Appliance loads.
   HVAC and all Continuous loads are added after demand. */

window.calculate = function calculate(){
  if(typeof restorePromptOpen !== "undefined" && restorePromptOpen){
    return;
  }

  const generalLoad = generalLoadCalculation();
  const applianceLoads = applianceLoadCalculation();

  const continuousLoads =
    (typeof window.continuousLoadCalculation === "function")
      ? window.continuousLoadCalculation()
      : continuousLoadCalculation();

  /* Optional-method demand authority:
     General + Appliance only. */
  const demandLoads = combinedDemandCalculation(
    generalLoad,
    {
      service: applianceLoads.service,
      generator: applianceLoads.generator
    }
  );

  const hvacLoads =
    (typeof window.hvacLoadCalculation === "function")
      ? window.hvacLoadCalculation()
      : hvacLoadCalculation();

  /* HVAC and the complete Continuous-load section are
     added after the General + Appliance demand calculation. */
  const serviceHVACContinuous =
    hvacLoads.service + continuousLoads.service;

  const generatorHVACContinuous =
    hvacLoads.generator + continuousLoads.generator;

  setOutput("e44", hvacLoads.service);
  setOutput("f44", hvacLoads.generator);
  setOutput("e45", continuousLoads.service);
  setOutput("f45", continuousLoads.generator);

  const serviceTotalVA =
    demandLoads.service + serviceHVACContinuous;

  const generatorTotalVA =
    demandLoads.generator + generatorHVACContinuous;

  const voltage = serviceVoltage();
  const serviceCurrent = calculateAmps(serviceTotalVA, voltage);
  const generatorCurrent = calculateAmps(generatorTotalVA, voltage);
  const requiredLoads = validateRequiredGeneralLoads();

  clearIncompleteResultStyle();
  displayAmps("serviceAmps", serviceCurrent);
  displayAmps("generatorAmps", generatorCurrent);

  updatePrintRows({
    generalLoad: generalLoad,
    applianceLoads: applianceLoads,
    demandLoads: demandLoads,
    hvacLoads: hvacLoads,
    continuousLoads: continuousLoads,
    largestMotor: largestMotorCalculation(),
    serviceTotalVA: serviceTotalVA,
    generatorTotalVA: generatorTotalVA,
    serviceCurrent: serviceCurrent,
    generatorCurrent: generatorCurrent,
    voltage: voltage,
    requiredLoadsValid: requiredLoads.valid,
    managedLoadCount:
      (typeof window.getCompleteManagedLoadCount === "function")
        ? window.getCompleteManagedLoadCount()
        : applicableManagedLoadCount()
  });

  for(const row of MANAGED_ROWS){
    updateManagedControl(row);
  }

  [37,38,39,40].forEach(function(row){
    updateManagedControl(row);
  });

  if(typeof suppressAutoSave === "undefined" || !suppressAutoSave){
    saveState(false);
  }
};
