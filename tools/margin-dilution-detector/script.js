document.addEventListener("DOMContentLoaded", function () {

  const calculateButton = document.getElementById("calculateButton");
  const shareButton = document.getElementById("shareWhatsAppButton");
  const resultContainer = document.getElementById("result");
  
  function showError(message) {
  resultContainer.innerHTML =
  "<p style='color:#b91c1c;font-weight:600'>" + message + "</p>";
  }
  
  function formatNumber(value) {
  const rounded = Math.round(value);
  return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  
  function runDiagnostic() {
  
  resultContainer.innerHTML = "";
  
  /* INPUT COLLECTION */
  
  const price = Number(document.getElementById("price").value);
  const cost = Number(document.getElementById("cost").value);
  const volume = Number(document.getElementById("volume").value);
  const discount = Number(document.getElementById("discount").value);
  const growth = Number(document.getElementById("growth").value);
  const fixedCost = Number(document.getElementById("fixedCost").value);
  
  const returnsInput = document.getElementById("returns").value;
  const costChangeInput = document.getElementById("costChange").value;
  const extraDiscountInput = document.getElementById("extraDiscount").value;
  
  const returnsPct = returnsInput === "" ? 0 : Number(returnsInput);
  const costChangePct = costChangeInput === "" ? 0 : Number(costChangeInput);
  const extraDiscountPct = extraDiscountInput === "" ? 0 : Number(extraDiscountInput);
  
  /* VALIDATION */
  
  if (
  !price || !cost || !volume || !fixedCost ||
  discount < 0 || growth < 0
  ) {
  showError("Enter valid numeric values in all required fields.");
  return;
  }
  
  if (
  discount > 100 || growth > 500 ||
  returnsPct > 100 || costChangePct > 100 ||
  extraDiscountPct > 100
  ) {
  showError("Percentage inputs must fall within reasonable ranges.");
  return;
  }
  
  /* BASELINE CALCULATION */
  
  const discountDecimal = discount / 100;
  const returnsDecimal = returnsPct / 100;
  
  const baselinePrice = price;
  const baselineUnits = volume * (1 - returnsDecimal);
  
  const baselineContributionPerUnit = baselinePrice - cost;
  
  const baselineContribution =
  baselineContributionPerUnit * baselineUnits;
  
  const baselineProfit =
  baselineContribution - fixedCost;
  
  /* SCENARIO CALCULATION */
  
  const growthDecimal = growth / 100;
  const costChangeDecimal = costChangePct / 100;
  const extraDiscountDecimal = extraDiscountPct / 100;
  
  const scenarioUnits =
  volume * (1 + growthDecimal) * (1 - returnsDecimal);
  
  const scenarioPrice =
  price * (1 - discountDecimal - extraDiscountDecimal);
  
  const scenarioCost =
  cost * (1 + costChangeDecimal);
  
  const scenarioContributionPerUnit =
  scenarioPrice - scenarioCost;
  
  const scenarioContribution =
  scenarioContributionPerUnit * scenarioUnits;
  
  const scenarioProfit =
  scenarioContribution - fixedCost;
  
  /* SENSITIVITY CALCULATION */
  
  const priceSensitivity =
  (price * 0.01) * scenarioUnits;
  
  /* REPORT TEXT VARIABLES */
  
  const baselineProfitDisplay = formatNumber(baselineProfit);
  const scenarioProfitDisplay = formatNumber(scenarioProfit);
  
  const deltaProfit = scenarioProfit - baselineProfit;
  const deltaProfitDisplay = formatNumber(deltaProfit);
  
  const percentDelta =
  baselineProfit !== 0 ? (deltaProfit / Math.abs(baselineProfit)) : 0;
  
  const percentDeltaDisplay =
  Math.round(percentDelta * 100);
  
  const baselineContributionDisplay =
  formatNumber(baselineContributionPerUnit);
  
  const scenarioContributionDisplay =
  formatNumber(scenarioContributionPerUnit);
  
  const baselineUnitsDisplay =
  formatNumber(baselineUnits);
  
  const scenarioUnitsDisplay =
  formatNumber(scenarioUnits);
  
  const sensitivityDisplay =
  formatNumber(priceSensitivity);
  
  /* REPORT RENDER */
  
  const report =
  "<p><strong>Diagnostic Summary</strong></p>" +
  "<p>Baseline profit generation is approximately " + baselineProfitDisplay +
  " per month based on " + baselineUnitsDisplay +
  " units and contribution per unit of " + baselineContributionDisplay +
  ". After discounting and volume expansion, projected profit becomes " +
  scenarioProfitDisplay + ", representing a change of " +
  deltaProfitDisplay + " or " + percentDeltaDisplay +
  "% relative to the original structure.</p>" +
  
  "<p><strong>Key Mechanics</strong></p>" +
  "<p>The baseline contribution per unit is " +
  baselineContributionDisplay +
  ". After discounting and supplier cost changes, scenario contribution falls to " +
  scenarioContributionDisplay +
  " per unit. Volume increases from " +
  baselineUnitsDisplay +
  " units to approximately " +
  scenarioUnitsDisplay +
  " units, demonstrating how higher order flow interacts with lower pricing.</p>" +
  
  "<p>A 1% change in selling price would shift contribution by roughly " +
  sensitivityDisplay +
  " at the current scenario sales volume.</p>" +
  
  "<p><strong>Operational Interpretation</strong></p>" +
  "<p>The interaction between discounting and volume growth determines whether additional orders strengthen or weaken profit generation. In this case the structure shows a profit movement of " +
  percentDeltaDisplay +
  "%. If contribution per unit falls faster than units increase, the organisation effectively scales activity without improving cash generation.</p>" +
  
  "<p><strong>Structural Risk Observation</strong></p>" +
  "<p>Discount-driven growth often appears positive in revenue reporting but may quietly compress margin across the cost structure. When contribution per unit declines from " +
  baselineContributionDisplay +
  " to " +
  scenarioContributionDisplay +
  ", the business must process significantly more orders simply to maintain the same profit position.</p>" +
  
  "<p><strong>Management Questions</strong></p>" +
  "<p>Which customer segments or sales channels most frequently trigger discounting behaviour in our order flow?</p>" +
  "<p>If supplier cost increases continued at current levels, how would that affect contribution per unit over the next 90 days?</p>" +
  "<p>Would removing discretionary discounts improve profit faster than increasing sales volume?</p>" +
  
  "<p><strong>Selective Engagement Note</strong></p>" +
  "<p>This calculator evaluates only one narrow dimension of business structure. Deeper diagnostic work examines interactions between profit drivers, cost structure, capital deployment, cash flow timing, revenue concentration, supplier dynamics, and forward operating scenarios. Only a limited number of businesses are worked with at any given time because the analysis requires detailed operational understanding. If the diagnostic thinking here resonates, the Contact page can be used to explore whether a deeper engagement would be appropriate.</p>";
  
  resultContainer.innerHTML = report;
  
  }
  
  calculateButton.addEventListener("click", runDiagnostic);
  
  shareButton.addEventListener("click", function () {
  
  const url = window.location.href;
  
  const shareLink =
  "https://api.whatsapp.com/send?text=" +
  encodeURIComponent("Useful diagnostic tool: " + url);
  
  window.open(shareLink, "_blank");
  
  });
  
  });