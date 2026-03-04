document.addEventListener("DOMContentLoaded", function () {

  const calculateButton = document.getElementById("calculateButton");
  const shareButton = document.getElementById("shareWhatsAppButton");
  const resultContainer = document.getElementById("result");

  function showError(message) {
    resultContainer.innerHTML =
      "<p style='color:#b91c1c;font-weight:600'>" + message + "</p>";
  }

  function runDiagnostic() {

    const price = Number(document.getElementById("price").value);
    const cost = Number(document.getElementById("cost").value);
    const discountPercent = Number(document.getElementById("discountPercent").value);
    const volumeGrowthPercent = Number(document.getElementById("volumeGrowthPercent").value);

    if (!isFinite(price) || !isFinite(cost) || !isFinite(discountPercent) || !isFinite(volumeGrowthPercent)) {
      showError("Enter valid numeric values in all required fields.");
      return;
    }

    if (price <= 0 || cost < 0) {
      showError("Enter non negative costs and a positive selling price.");
      return;
    }

    if (discountPercent < 0 || discountPercent > 95) {
      showError("Enter a discount percent between 0 and 95.");
      return;
    }

    if (volumeGrowthPercent < -90 || volumeGrowthPercent > 500) {
      showError("Enter a volume growth percent between -90 and 500.");
      return;
    }

    const discountRate = discountPercent / 100;
    const volumeGrowthRate = volumeGrowthPercent / 100;

    const baselineUnits = 100;
    const newUnits = Math.round(baselineUnits * (1 + volumeGrowthRate));

    if (newUnits <= 0) {
      showError("Volume growth results in zero units. Enter a higher value.");
      return;
    }

    const baselineUnitMargin = price - cost;
    const discountedPrice = price * (1 - discountRate);
    const newUnitMargin = discountedPrice - cost;

    if (discountedPrice <= 0) {
      showError("Discount results in zero or negative price. Reduce the discount percent.");
      return;
    }

    const baselineTotalMargin = baselineUnitMargin * baselineUnits;
    const newTotalMargin = newUnitMargin * newUnits;

    const baselineMarginPct = baselineUnitMargin / price;
    const newMarginPct = newUnitMargin / discountedPrice;

    let totalMarginChangeRate = 0;
    if (baselineTotalMargin !== 0) {
      totalMarginChangeRate = (newTotalMargin - baselineTotalMargin) / Math.abs(baselineTotalMargin);
    }

    const unitMarginChangeRate = (newUnitMargin - baselineUnitMargin) / Math.abs(baselineUnitMargin === 0 ? 1 : baselineUnitMargin);

    const impliedBreakevenUnits = Math.round(baselineTotalMargin / (newUnitMargin === 0 ? 1 : newUnitMargin));
    const requiredGrowthUnits = Math.max(0, impliedBreakevenUnits - baselineUnits);
    const requiredGrowthRate = requiredGrowthUnits / baselineUnits;

    const completedCount = 1;

    let summaryVerdict = "";
    let riskLabel = "";
    let mechanicsNote = "";
    let operationalNote = "";
    let riskNote = "";

    if (newUnitMargin <= 0) {
      summaryVerdict = "Severe margin dilution: discounted sales destroy contribution.";
      riskLabel = "High";
      mechanicsNote = "Discounting pushes unit margin to zero or below, so volume cannot recover profit.";
      operationalNote = "More orders create workload and working capital demand without generating gross profit.";
      riskNote = "This pattern can mask structural loss making activity inside busy sales periods.";
    } else if (newTotalMargin < baselineTotalMargin) {
      summaryVerdict = "Margin dilution: volume growth did not offset the discount impact.";
      riskLabel = "High";
      mechanicsNote = "Unit margin dropped and the current volume increase is insufficient to preserve total contribution.";
      operationalNote = "You may be allocating capacity to lower quality revenue and training customers to demand price cuts.";
      riskNote = "If fixed costs are rising with activity, net profit may fall faster than gross margin indicates.";
    } else if (newTotalMargin >= baselineTotalMargin && newUnitMargin < baselineUnitMargin) {
      summaryVerdict = "Profit leverage achieved, but only through higher volume despite weaker unit margin.";
      riskLabel = "Medium";
      mechanicsNote = "Total contribution improved because volume growth outweighed the unit margin loss from discounting.";
      operationalNote = "This is sensitive to capacity constraints and service levels, because each unit is less profitable.";
      riskNote = "If volume slows, the lower unit margin remains and profit can snap back quickly.";
    } else if (newTotalMargin >= baselineTotalMargin && newUnitMargin >= baselineUnitMargin) {
      summaryVerdict = "Healthy growth: unit margin is stable and volume increased total contribution.";
      riskLabel = "Low";
      mechanicsNote = "Pricing discipline is holding and volume growth is translating into higher contribution.";
      operationalNote = "This suggests improved market demand or execution without trading margin for orders.";
      riskNote = "Confirm that costs and discounting are consistent across the full sales mix, not only averages.";
    } else {
      summaryVerdict = "Mixed signal: results depend on how representative the inputs are.";
      riskLabel = "Medium";
      mechanicsNote = "The pricing and cost inputs imply a narrow margin band where small changes shift outcomes.";
      operationalNote = "Segment by product and customer to confirm where discounting is concentrated.";
      riskNote = "Averages can hide loss making deals even when totals look stable.";
    }

    const baselineUnitMarginRounded = Math.round(baselineUnitMargin);
    const newUnitMarginRounded = Math.round(newUnitMargin);
    const discountedPriceRounded = Math.round(discountedPrice);

    const baselineTotalMarginRounded = Math.round(baselineTotalMargin);
    const newTotalMarginRounded = Math.round(newTotalMargin);

    const baselineMarginPctDisplay = Math.round(baselineMarginPct * 100);
    const newMarginPctDisplay = Math.round(newMarginPct * 100);

    const totalMarginChangePctDisplay = Math.round(totalMarginChangeRate * 100);
    const requiredGrowthPctDisplay = Math.round(requiredGrowthRate * 100);

    let mechanicsBullets = "";
    mechanicsBullets += "<li>Baseline unit margin: " + baselineUnitMarginRounded + " per unit (" + baselineMarginPctDisplay + "%).</li>";
    mechanicsBullets += "<li>Discounted price: " + discountedPriceRounded + " per unit, new unit margin: " + newUnitMarginRounded + " (" + newMarginPctDisplay + "%).</li>";
    mechanicsBullets += "<li>Baseline contribution on 100 units: " + baselineTotalMarginRounded + ". New contribution on " + newUnits + " units: " + newTotalMarginRounded + ".</li>";

    let operationalBullets = "";
    operationalBullets += "<li>Discounting changes the profit per order, not just the revenue line.</li>";
    operationalBullets += "<li>Volume growth consumes capacity, delivery time, and cash tied up in costs.</li>";
    operationalBullets += "<li>When unit margin compresses, you need more units just to stand still.</li>";

    let riskBullets = "";
    riskBullets += "<li>Risk level: " + riskLabel + " based on contribution change and unit margin stability.</li>";
    riskBullets += "<li>Contribution change versus baseline: " + totalMarginChangePctDisplay + "%.</li>";
    riskBullets += "<li>Estimated volume growth needed to break even at discounted margin: " + requiredGrowthPctDisplay + "%.</li>";

    const questions = [];
    questions.push("Which customers or channels are receiving discounts, and what is the approval rule?");
    questions.push("What capacity or service constraints tighten when lower margin volume increases?");
    questions.push("Can supplier terms, unit costs, or pricing fences be tightened to protect contribution?");

    const questionsHtml =
      "<ol style='margin:8px 0 0 18px'>" +
      "<li>" + questions[0] + "</li>" +
      "<li>" + questions[1] + "</li>" +
      "<li>" + questions[2] + "</li>" +
      "</ol>";

    const reportHtml =
      "<div class='tool-report'>" +
        "<p><strong>Diagnostic Summary</strong><br>" +
          summaryVerdict +
        "</p>" +
        "<p><strong>Key Mechanics</strong></p>" +
        "<ul style='margin:8px 0 0 18px'>" + mechanicsBullets + "</ul>" +
        "<p style='margin-top:10px'>" + mechanicsNote + "</p>" +
        "<p><strong>Operational Interpretation</strong></p>" +
        "<ul style='margin:8px 0 0 18px'>" + operationalBullets + "</ul>" +
        "<p style='margin-top:10px'>" + operationalNote + "</p>" +
        "<p><strong>Structural Risk Observation</strong></p>" +
        "<ul style='margin:8px 0 0 18px'>" + riskBullets + "</ul>" +
        "<p style='margin-top:10px'>" + riskNote + "</p>" +
        "<p><strong>Management Questions</strong>" + questionsHtml + "</p>" +
        "<p><strong>Selective Engagement Note</strong><br>" +
          "This calculator tests one narrow dimension of your profit structure: whether discount driven volume growth is improving contribution. Deeper diagnostics examine profit drivers across product and customer mix, cost structure behavior under load, capital deployment and working capital pressure, cash flow timing by invoice and supplier terms, revenue concentration and customer dependency, supplier dynamics, and forward operating scenarios under different pricing and capacity assumptions. If this type of diagnostic thinking resonates, use the Contact page to discuss a broader structural review." +
        "</p>" +
      "</div>";

    resultContainer.innerHTML = reportHtml;

    void completedCount;

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