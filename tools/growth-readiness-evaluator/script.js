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

    const currentRevenue = Number(document.getElementById("currentRevenue").value);
    const grossMarginPct = Number(document.getElementById("grossMarginPct").value);
    const annualFixedCosts = Number(document.getElementById("annualFixedCosts").value);
    const availableCash = Number(document.getElementById("availableCash").value);
    const debtorDays = Number(document.getElementById("debtorDays").value);
    const inventoryDays = Number(document.getElementById("inventoryDays").value) || 0;
    const targetGrowthPct = Number(document.getElementById("targetGrowthPct").value);
    const growthGrossMarginPct = Number(document.getElementById("growthGrossMarginPct").value) || grossMarginPct;
    const additionalFixedCosts = Number(document.getElementById("additionalFixedCosts").value) || 0;

    /* VALIDATION */

    if (!currentRevenue || currentRevenue <= 0) {
      showError("Enter a valid current annual revenue figure.");
      return;
    }
    if (!grossMarginPct || grossMarginPct <= 0 || grossMarginPct >= 100) {
      showError("Enter a gross margin percentage between 1 and 99.");
      return;
    }
    if (!annualFixedCosts || annualFixedCosts <= 0) {
      showError("Enter a valid annual fixed costs figure.");
      return;
    }
    if (isNaN(availableCash) || availableCash < 0) {
      showError("Enter a valid available cash and facility figure.");
      return;
    }
    if (!debtorDays || debtorDays <= 0) {
      showError("Enter a valid debtor days figure.");
      return;
    }
    if (!targetGrowthPct || targetGrowthPct <= 0) {
      showError("Enter a target revenue growth percentage.");
      return;
    }

    /* BASELINE CALCULATION */

    const currentGrossProfit = currentRevenue * (grossMarginPct / 100);
    const currentOperatingProfit = currentGrossProfit - annualFixedCosts;
    const currentOperatingMarginPct = (currentOperatingProfit / currentRevenue) * 100;

    /* Working capital tied up at current scale */
    const currentWCPerDay = currentRevenue / 365;
    const currentDebtorBalance = currentWCPerDay * debtorDays;
    const currentInventoryBalance = currentWCPerDay * (inventoryDays * (1 - grossMarginPct / 100)); /* inventory at cost */

    /* GROWTH SCENARIO CALCULATION */

    const revenueIncrease = currentRevenue * (targetGrowthPct / 100);
    const targetRevenue = currentRevenue + revenueIncrease;

    /* Incremental gross profit from growth revenue */
    const incrementalGrossProfit = revenueIncrease * (growthGrossMarginPct / 100);

    /* Total fixed costs post-growth */
    const totalFixedCosts = annualFixedCosts + additionalFixedCosts;

    /* Post-growth operating profit */
    const growthGrossProfit = currentGrossProfit + incrementalGrossProfit;
    const growthOperatingProfit = growthGrossProfit - totalFixedCosts;
    const growthOperatingMarginPct = (growthOperatingProfit / targetRevenue) * 100;

    /* Additional working capital required */
    const targetWCPerDay = targetRevenue / 365;
    const targetDebtorBalance = targetWCPerDay * debtorDays;
    const targetInventoryBalance = targetWCPerDay * (inventoryDays * (1 - growthGrossMarginPct / 100));

    const additionalDebtorFunding = targetDebtorBalance - currentDebtorBalance;
    const additionalInventoryFunding = targetInventoryBalance - currentInventoryBalance;
    const totalAdditionalWC = additionalDebtorFunding + additionalInventoryFunding;

    /* Cash gap */
    const cashGap = totalAdditionalWC + additionalFixedCosts - availableCash;
    const isCashPositive = cashGap <= 0;

    /* Fixed cost leverage */
    const fixedCostLeveragePct = (annualFixedCosts / targetFixedCostBase()) * 100;
    function targetFixedCostBase() { return totalFixedCosts > 0 ? totalFixedCosts : annualFixedCosts; }

    /* Payback period for growth investment (months to recover WC + setup costs from incremental operating profit) */
    const totalGrowthInvestment = totalAdditionalWC + additionalFixedCosts;
    const monthlyIncrementalProfit = (growthOperatingProfit - currentOperatingProfit) / 12;
    const paybackMonths = monthlyIncrementalProfit > 0 ? Math.ceil(totalGrowthInvestment / monthlyIncrementalProfit) : null;

    /* READINESS ASSESSMENT */

    let readinessLabel = "";
    let readinessSummary = "";

    if (currentOperatingProfit <= 0) {
      readinessLabel = "structurally unready";
      readinessSummary = "The business is not generating operating profit at the current scale. Growing revenue before restoring profitability amplifies cost pressure without guaranteed margin improvement.";
    } else if (cashGap > availableCash * 2 && !isCashPositive) {
      readinessLabel = "cash-constrained";
      readinessSummary = "The working capital and setup costs required to fund the target growth significantly exceed available cash and facility. Growth requires external capital or a reduction in the working capital cycle before expansion is viable.";
    } else if (growthOperatingMarginPct < 0) {
      readinessLabel = "margin-constrained";
      readinessSummary = "The incremental margin on growth revenue and the fixed cost step-up results in operating loss at the target scale. The growth structure as described is not margin-accretive.";
    } else if (!isCashPositive) {
      readinessLabel = "conditionally ready";
      readinessSummary = "The growth target is operationally achievable but requires additional funding of " + formatNumber(cashGap) + " to bridge the working capital requirement. Growth is viable with additional capital or facility.";
    } else {
      readinessLabel = "structurally ready";
      readinessSummary = "Available cash and facility is sufficient to fund the working capital requirement of the growth target. The margin structure improves or holds at the target scale.";
    }

    /* REPORT RENDER */

    const report =
      "<p><strong>Diagnostic Summary</strong></p>" +
      "<p>The growth target of " + targetGrowthPct + "% would take annual revenue from " + formatNumber(currentRevenue) + " to " + formatNumber(targetRevenue) + ". At the current gross margin of " + grossMarginPct + "%" + (growthGrossMarginPct !== grossMarginPct ? " (growth margin: " + growthGrossMarginPct + "%)" : "") + ", incremental gross profit on growth revenue is " + formatNumber(incrementalGrossProfit) + ". After fixed cost step-up of " + formatNumber(additionalFixedCosts) + ", operating profit moves from " + formatNumber(currentOperatingProfit) + " to " + formatNumber(growthOperatingProfit) + ". The business is assessed as <strong>" + readinessLabel + "</strong>. " + readinessSummary + "</p>" +

      "<p><strong>Key Mechanics</strong></p>" +
      "<table><thead><tr><th>Metric</th><th>Current</th><th>Post-growth</th></tr></thead><tbody>" +
      "<tr><td>Annual revenue</td><td>" + formatNumber(currentRevenue) + "</td><td>" + formatNumber(targetRevenue) + "</td></tr>" +
      "<tr><td>Gross profit</td><td>" + formatNumber(currentGrossProfit) + "</td><td>" + formatNumber(growthGrossProfit) + "</td></tr>" +
      "<tr><td>Gross margin %</td><td>" + Math.round(grossMarginPct * 10) / 10 + "%</td><td>" + Math.round(((growthGrossProfit / targetRevenue) * 100) * 10) / 10 + "%</td></tr>" +
      "<tr><td>Fixed costs</td><td>" + formatNumber(annualFixedCosts) + "</td><td>" + formatNumber(totalFixedCosts) + "</td></tr>" +
      "<tr><td>Operating profit</td><td>" + formatNumber(currentOperatingProfit) + "</td><td>" + formatNumber(growthOperatingProfit) + "</td></tr>" +
      "<tr><td>Operating margin %</td><td>" + Math.round(currentOperatingMarginPct * 10) / 10 + "%</td><td>" + Math.round(growthOperatingMarginPct * 10) / 10 + "%</td></tr>" +
      "</tbody></table>" +
      "<p>The growth target requires approximately " + formatNumber(totalAdditionalWC) + " in additional working capital (" + formatNumber(additionalDebtorFunding) + " in additional debtor funding" + (inventoryDays > 0 ? " and " + formatNumber(additionalInventoryFunding) + " in additional inventory" : "") + "). Total growth investment including fixed cost step-up is " + formatNumber(totalGrowthInvestment) + " against available cash and facility of " + formatNumber(availableCash) + ". " +
      (isCashPositive ? "Available resources exceed the funding requirement by " + formatNumber(Math.abs(cashGap)) + "." : "There is a funding gap of " + formatNumber(cashGap) + " that requires resolution before growth can proceed.") +
      (paybackMonths !== null ? " At the incremental operating profit rate, the total growth investment recovers in approximately " + paybackMonths + " month" + (paybackMonths !== 1 ? "s" : "") + "." : "") +
      "</p>" +

      "<p><strong>Operational Interpretation</strong></p>" +
      "<p>Growth readiness analysis separates the profitability of growth from the fundability of growth. A business can identify a growth opportunity with attractive incremental margins and still be unable to pursue it because the working capital required to fund the debtor cycle and inventory build absorbs more cash than the business holds. This is particularly relevant for businesses with long DSO profiles: at " + debtorDays + " days, each unit of revenue growth requires funding for " + debtorDays + " days before cash is received, and this funding requirement scales linearly with the revenue increase.</p>" +

      "<p><strong>Structural Risk Observation</strong></p>" +
      "<p>The most common growth failure mode is not bad strategy — it is inadequate financial structure to fund execution. Businesses that grow rapidly through their available cash and credit facility often find themselves operationally committed to serving new customers or fulfilling larger contracts before the cash from that activity has been collected. The resulting cash pressure forces reactive decisions about creditor payments, staff headcount, or capital investment that damage the quality of the growth rather than enabling it. At the target growth rate, the binding constraint is " + (isCashPositive ? "not cash — the margin structure and cost step-up are the primary risks" : "cash — the working capital requirement exceeds available resources and must be resolved before execution begins") + ".</p>" +

      "<p><strong>Management Questions</strong></p>" +
      "<p>Is the growth margin assumption realistic, or does the target growth require price concessions or access to lower-margin customer segments that would compress the incremental return?</p>" +
      "<p>Can debtor days be reduced through changed payment terms or invoicing discipline before growth begins, which would reduce the working capital requirement without requiring additional capital?</p>" +
      "<p>Has the fixed cost step-up been costed at the level of specific commitments rather than estimated as a percentage, and are those commitments reversible if growth underperforms the target?</p>" +

      "<p><strong>Selective Engagement Note</strong></p>" +
      "<p>This calculator tests the financial fundability of a growth target under defined assumptions. Deeper diagnostic work examines the margin quality of the revenue being pursued, the specific working capital drivers that could be tightened before growth commences, the realistic options for growth funding given the current balance sheet, and whether the target growth rate is consistent with the operational capacity to deliver. MJB Strategic works with a limited number of businesses at any time because growth readiness analysis requires understanding the specific commercial opportunities and operational constraints driving the growth decision. If this diagnostic thinking resonates, the contact page provides a route to explore whether a deeper engagement would be appropriate.</p>";

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
