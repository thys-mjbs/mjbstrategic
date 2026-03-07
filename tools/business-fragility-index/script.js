document.addEventListener("DOMContentLoaded", function () {

  const calculateButton = document.getElementById("calculateButton");
  const shareButton = document.getElementById("shareWhatsAppButton");
  const resultContainer = document.getElementById("result");

  function showError(message) {
    resultContainer.innerHTML =
      "<p style='color:#b91c1c;font-weight:600'>" + message + "</p>";
  }

  function runDiagnostic() {

    resultContainer.innerHTML = "";

    /* INPUT COLLECTION */

    const topCustomerPct = Number(document.getElementById("topCustomerPct").value);
    const top3CustomerPct = Number(document.getElementById("top3CustomerPct").value);
    const topSupplierPct = Number(document.getElementById("topSupplierPct").value);
    const top3SupplierPct = Number(document.getElementById("top3SupplierPct").value);
    const debtorDays = Number(document.getElementById("debtorDays").value);
    const creditorDays = Number(document.getElementById("creditorDays").value);
    const inventoryDays = Number(document.getElementById("inventoryDays").value) || 0;
    const fixedCostPct = Number(document.getElementById("fixedCostPct").value);
    const grossMarginPct = Number(document.getElementById("grossMarginPct").value);
    const operatingMarginPct = Number(document.getElementById("operatingMarginPct").value);

    /* VALIDATION */

    if (!topCustomerPct || topCustomerPct <= 0 || topCustomerPct > 100) {
      showError("Enter the top customer revenue percentage.");
      return;
    }
    if (!top3CustomerPct || top3CustomerPct <= 0 || top3CustomerPct > 100) {
      showError("Enter the top 3 customers combined revenue percentage.");
      return;
    }
    if (top3CustomerPct < topCustomerPct) {
      showError("Top 3 customers combined percentage must be at least as large as the top customer percentage.");
      return;
    }
    if (!topSupplierPct || topSupplierPct <= 0 || topSupplierPct > 100) {
      showError("Enter the top supplier COGS percentage.");
      return;
    }
    if (!top3SupplierPct || top3SupplierPct <= 0 || top3SupplierPct > 100) {
      showError("Enter the top 3 suppliers combined COGS percentage.");
      return;
    }
    if (!debtorDays || debtorDays <= 0) {
      showError("Enter a valid debtor days figure.");
      return;
    }
    if (!creditorDays || creditorDays <= 0) {
      showError("Enter a valid creditor days figure.");
      return;
    }
    if (!fixedCostPct || fixedCostPct <= 0 || fixedCostPct >= 100) {
      showError("Enter fixed costs as a percentage of revenue between 1 and 99.");
      return;
    }
    if (!grossMarginPct || grossMarginPct <= 0 || grossMarginPct >= 100) {
      showError("Enter a gross margin percentage between 1 and 99.");
      return;
    }
    if (isNaN(operatingMarginPct)) {
      showError("Enter a valid operating margin percentage.");
      return;
    }

    /* SCORING: each dimension scored 0 to 25, total out of 100 */
    /* Higher score = higher fragility */

    /* DIMENSION 1: Customer concentration (0–25) */
    /* Top customer >50% = max; 30–50% = moderate; <20% = low */
    let customerScore = 0;
    if (topCustomerPct >= 50) {
      customerScore = 25;
    } else if (topCustomerPct >= 35) {
      customerScore = 20;
    } else if (topCustomerPct >= 25) {
      customerScore = 15;
    } else if (topCustomerPct >= 15) {
      customerScore = 10;
    } else {
      customerScore = 5;
    }
    /* Adjust for top3 concentration */
    if (top3CustomerPct >= 80) customerScore = Math.min(25, customerScore + 4);
    else if (top3CustomerPct >= 60) customerScore = Math.min(25, customerScore + 2);

    /* DIMENSION 2: Supplier dependency (0–25) */
    let supplierScore = 0;
    if (topSupplierPct >= 60) {
      supplierScore = 25;
    } else if (topSupplierPct >= 45) {
      supplierScore = 20;
    } else if (topSupplierPct >= 30) {
      supplierScore = 15;
    } else if (topSupplierPct >= 20) {
      supplierScore = 10;
    } else {
      supplierScore = 5;
    }
    if (top3SupplierPct >= 90) supplierScore = Math.min(25, supplierScore + 4);
    else if (top3SupplierPct >= 75) supplierScore = Math.min(25, supplierScore + 2);

    /* DIMENSION 3: Working capital cycle (0–25) */
    const ccc = debtorDays + inventoryDays - creditorDays;
    let wcScore = 0;
    if (ccc >= 90) {
      wcScore = 25;
    } else if (ccc >= 60) {
      wcScore = 20;
    } else if (ccc >= 40) {
      wcScore = 15;
    } else if (ccc >= 20) {
      wcScore = 10;
    } else if (ccc >= 0) {
      wcScore = 5;
    } else {
      wcScore = 0; /* Negative CCC = cash is collected before payment (low fragility) */
    }

    /* DIMENSION 4: Fixed cost exposure and margin buffer (0–25) */
    /* Fixed cost ratio relative to gross margin determines operating leverage */
    const fixedCostCoverage = grossMarginPct - fixedCostPct; /* operating margin proxy */
    let fixedCostScore = 0;
    if (fixedCostCoverage <= 0) {
      fixedCostScore = 25;
    } else if (fixedCostCoverage <= 3) {
      fixedCostScore = 22;
    } else if (fixedCostCoverage <= 6) {
      fixedCostScore = 17;
    } else if (fixedCostCoverage <= 10) {
      fixedCostScore = 12;
    } else if (fixedCostCoverage <= 15) {
      fixedCostScore = 7;
    } else {
      fixedCostScore = 3;
    }

    const totalScore = customerScore + supplierScore + wcScore + fixedCostScore;

    /* SCORE LABEL */

    let scoreLabel = "";
    let scoreSummary = "";
    if (totalScore >= 80) {
      scoreLabel = "critically fragile";
      scoreSummary = "The business carries multiple severe structural vulnerabilities that interact under stress. An adverse event in any one dimension is likely to cascade through the others.";
    } else if (totalScore >= 60) {
      scoreLabel = "highly fragile";
      scoreSummary = "Significant structural vulnerabilities exist across multiple dimensions. The business is sensitive to disruption in customer relationships, supplier pricing, and cash cycle performance simultaneously.";
    } else if (totalScore >= 40) {
      scoreLabel = "moderately fragile";
      scoreSummary = "Material fragility exists in one or two dimensions that warrants active monitoring and targeted structural improvement.";
    } else if (totalScore >= 20) {
      scoreLabel = "low fragility";
      scoreSummary = "The structural profile is reasonably resilient with limited concentrated vulnerabilities. Continued monitoring is appropriate as conditions and relationships evolve.";
    } else {
      scoreLabel = "resilient";
      scoreSummary = "The business carries a structurally resilient profile across all four dimensions. Risk management focus should shift to protecting the current structural advantages.";
    }

    /* IDENTIFY PRIMARY DRIVER */

    const scores = [
      { name: "Customer concentration", score: customerScore, max: 25 },
      { name: "Supplier dependency", score: supplierScore, max: 25 },
      { name: "Working capital cycle", score: wcScore, max: 25 },
      { name: "Fixed cost exposure", score: fixedCostScore, max: 25 }
    ];
    const sorted = scores.slice().sort(function (a, b) { return b.score - a.score; });
    const primaryDriver = sorted[0].name;
    const secondaryDriver = sorted[1].name;

    /* REPORT RENDER */

    const report =
      "<p><strong>Diagnostic Summary</strong></p>" +
      "<p>The composite fragility score is " + totalScore + " out of 100, indicating the business is " + scoreLabel + ". " + scoreSummary + " The primary driver of fragility is " + primaryDriver + " (score: " + sorted[0].score + "/25), followed by " + secondaryDriver + " (score: " + sorted[1].score + "/25).</p>" +

      "<p><strong>Key Mechanics</strong></p>" +
      "<table><thead><tr><th>Dimension</th><th>Score</th><th>Max</th><th>Input basis</th></tr></thead><tbody>" +
      "<tr><td>Customer concentration</td><td>" + customerScore + "</td><td>25</td><td>Top customer: " + topCustomerPct + "%, top 3: " + top3CustomerPct + "%</td></tr>" +
      "<tr><td>Supplier dependency</td><td>" + supplierScore + "</td><td>25</td><td>Top supplier: " + topSupplierPct + "%, top 3: " + top3SupplierPct + "%</td></tr>" +
      "<tr><td>Working capital cycle</td><td>" + wcScore + "</td><td>25</td><td>CCC: " + ccc + " days (DSO " + debtorDays + ", inv " + inventoryDays + ", DPO " + creditorDays + ")</td></tr>" +
      "<tr><td>Fixed cost exposure</td><td>" + fixedCostScore + "</td><td>25</td><td>Fixed costs: " + fixedCostPct + "% of revenue, gross margin: " + grossMarginPct + "%</td></tr>" +
      "<tr><td><strong>Total fragility score</strong></td><td><strong>" + totalScore + "</strong></td><td><strong>100</strong></td><td>Operating margin: " + operatingMarginPct + "%</td></tr>" +
      "</tbody></table>" +

      "<p><strong>Operational Interpretation</strong></p>" +
      "<p>A fragility score of " + totalScore + " reflects that the business is " + scoreLabel + " at the structural level. Fragility is not the same as poor performance: a business can carry a high fragility score while reporting strong current results. What the score captures is the degree to which the current performance is structurally exposed to concentrated risk, and how limited the buffer is between current conditions and a position where one adverse event triggers a cascade. The working capital cycle of " + ccc + " days means the business is funding " + ccc + " days of operations before receiving payment, which constrains the cash available to absorb other shocks simultaneously.</p>" +

      "<p><strong>Structural Risk Observation</strong></p>" +
      "<p>The most dangerous form of business fragility is not visible in the income statement. A business generating strong operating margins while carrying concentrated customer and supplier relationships, a long cash conversion cycle, and high fixed overhead is structurally more fragile than its profitability suggests. The margin buffer between current gross margin (" + grossMarginPct + "%) and fixed cost obligations (" + fixedCostPct + "% of revenue) leaves " + Math.round(grossMarginPct - fixedCostPct) + " percentage points before operations become cash-negative at the gross level. Under customer or supplier disruption, this buffer is consumed faster than it appears because fixed costs do not reduce proportionally with revenue.</p>" +

      "<p><strong>Management Questions</strong></p>" +
      "<p>Which of the four fragility dimensions could realistically be improved within 12 months, and what is the specific action that would move that score, not a general improvement in relationships?</p>" +
      "<p>Is the current operating margin sufficient to absorb the simultaneous materialisation of two fragility dimensions, for example, the loss of the top customer at the same time as a supplier price increase?</p>" +
      "<p>Has the board or senior management explicitly reviewed the fragility profile and made a deliberate decision about the acceptable level of structural risk, or has concentration accumulated without formal review?</p>" +

      "<p><strong>Selective Engagement Note</strong></p>" +
      "<p>This calculator aggregates four structural risk dimensions into a composite indicator. Deeper diagnostic work examines how each dimension interacts with the others under specific stress scenarios, what the realistic timeline and cost is for reducing each risk, and which structural improvements would produce the highest return in reduced fragility per unit of management effort. MJB Strategic works with a limited number of businesses at any time because fragility analysis requires understanding the operational realities and commercial relationships that sit behind each score. If this diagnostic thinking resonates, the contact page provides a route to explore whether a deeper engagement would be appropriate.</p>";

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
