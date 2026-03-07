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

  function parseNum(str) {
    return Number(String(str).replace(/,/g, ""));
  }

  function attachNumFormat(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.type = "text";
    el.inputMode = "numeric";
    el.addEventListener("blur", function () {
      var raw = this.value.replace(/[^0-9.-]/g, "");
      if (raw === "" || raw === "-") return;
      var parts = raw.split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      this.value = parts.join(".");
    });
    el.addEventListener("focus", function () {
      this.value = this.value.replace(/,/g, "");
    });
  }

  ["annualPurchasingSpend","annualRevenue"].forEach(attachNumFormat);

  function runDiagnostic() {

    resultContainer.innerHTML = "";

    /* INPUT COLLECTION */

    const annualPurchasingSpend = parseNum(document.getElementById("annualPurchasingSpend").value);
    const annualRevenue = parseNum(document.getElementById("annualRevenue").value);
    const grossMarginPct = Number(document.getElementById("grossMarginPct").value);
    const supplier1Pct = Number(document.getElementById("supplier1Pct").value);
    const supplier2Pct = Number(document.getElementById("supplier2Pct").value);
    const supplier3Pct = Number(document.getElementById("supplier3Pct").value);
    const totalSupplierCount = Number(document.getElementById("totalSupplierCount").value);
    const top1ContractMonths = Number(document.getElementById("top1ContractMonths").value) || 0;
    const switchingCostPct = Number(document.getElementById("switchingCostPct").value) || 0;

    /* VALIDATION */

    if (!annualPurchasingSpend || annualPurchasingSpend <= 0) {
      showError("Enter a valid annual purchasing spend figure.");
      return;
    }
    if (!annualRevenue || annualRevenue <= 0) {
      showError("Enter a valid annual revenue figure.");
      return;
    }
    if (isNaN(grossMarginPct) || grossMarginPct <= 0 || grossMarginPct >= 100) {
      showError("Enter a gross margin percentage between 1 and 99.");
      return;
    }
    if (!supplier1Pct || supplier1Pct <= 0 || supplier1Pct > 100) {
      showError("Enter the top supplier spend percentage.");
      return;
    }
    if (!supplier2Pct || supplier2Pct <= 0) {
      showError("Enter the second supplier spend percentage.");
      return;
    }
    if (!supplier3Pct || supplier3Pct <= 0) {
      showError("Enter the third supplier spend percentage.");
      return;
    }
    if (!totalSupplierCount || totalSupplierCount <= 0) {
      showError("Enter the total supplier count.");
      return;
    }

    /* BASELINE CALCULATION */

    const grossMarginDecimal = grossMarginPct / 100;
    const grossProfit = annualRevenue * grossMarginDecimal;
    const purchasingIntensity = (annualPurchasingSpend / annualRevenue) * 100;

    const top3Pct = supplier1Pct + supplier2Pct + supplier3Pct;
    const remainingPct = 100 - top3Pct;
    const remainingSuppliers = totalSupplierCount - 3;

    const supplier1Spend = annualPurchasingSpend * (supplier1Pct / 100);
    const supplier2Spend = annualPurchasingSpend * (supplier2Pct / 100);
    const supplier3Spend = annualPurchasingSpend * (supplier3Pct / 100);

    /* HHI CONCENTRATION INDEX */

    const avgRemainingPct = remainingSuppliers > 0 ? remainingPct / remainingSuppliers : 0;
    let hhi = (supplier1Pct * supplier1Pct) + (supplier2Pct * supplier2Pct) + (supplier3Pct * supplier3Pct);
    if (remainingSuppliers > 0) {
      hhi += remainingSuppliers * (avgRemainingPct * avgRemainingPct);
    }

    /* SCENARIO: 5% price increase from top supplier */

    const priceIncreasePct = 5;
    const top1CostIncrease = supplier1Spend * (priceIncreasePct / 100);
    const scenarioGrossProfit = grossProfit - top1CostIncrease;
    const scenarioMarginPct = (scenarioGrossProfit / annualRevenue) * 100;
    const marginDelta = scenarioMarginPct - grossMarginPct;

    /* SWITCHING COST */

    let switchingNote = "";
    if (switchingCostPct > 0) {
      const switchingCost = supplier1Spend * (switchingCostPct / 100);
      switchingNote = " The estimated switching cost to replace the top supplier is " +
        formatNumber(switchingCost) +
        " (" + switchingCostPct + "% of their annual spend), which creates a meaningful barrier to changing sourcing.";
    }

    let contractNote = "";
    if (top1ContractMonths > 0) {
      contractNote = " The top supplier agreement has " + top1ContractMonths +
        " month" + (top1ContractMonths !== 1 ? "s" : "") + " remaining.";
    }

    /* SENSITIVITY CALCULATION */

    const sensitivityPer1Pct = supplier1Spend * 0.01;

    /* REPORT TEXT VARIABLES */

    let dependencyBand = "";
    if (supplier1Pct < 20) {
      dependencyBand = "low";
    } else if (supplier1Pct < 40) {
      dependencyBand = "moderate";
    } else if (supplier1Pct < 60) {
      dependencyBand = "high";
    } else {
      dependencyBand = "critically high";
    }

    /* REPORT RENDER */

    const report =
      "<p><strong>Diagnostic Summary</strong></p>" +
      "<p>Total annual purchasing spend of " + formatNumber(annualPurchasingSpend) +
      " represents " + Math.round(purchasingIntensity) +
      "% of revenue. The top three suppliers account for " + Math.round(top3Pct) +
      "% of total spend. The largest supplier alone represents " + supplier1Pct +
      "% of spend (" + formatNumber(supplier1Spend) +
      " annually), a " + dependencyBand + " dependency level. The concentration index is " +
      Math.round(hhi) + "." + contractNote + "</p>" +

      "<p><strong>Key Mechanics</strong></p>" +
      "<table><thead><tr><th>Supplier</th><th>Spend %</th><th>Annual Spend</th></tr></thead><tbody>" +
      "<tr><td>Top supplier</td><td>" + supplier1Pct + "%</td><td>" + formatNumber(supplier1Spend) + "</td></tr>" +
      "<tr><td>Second supplier</td><td>" + supplier2Pct + "%</td><td>" + formatNumber(supplier2Spend) + "</td></tr>" +
      "<tr><td>Third supplier</td><td>" + supplier3Pct + "%</td><td>" + formatNumber(supplier3Spend) + "</td></tr>" +
      "<tr><td>Remaining " + remainingSuppliers + " suppliers</td><td>" + Math.round(remainingPct) + "%</td><td>" + formatNumber(annualPurchasingSpend * remainingPct / 100) + "</td></tr>" +
      "</tbody></table>" +
      "<p>A 5% price increase from the top supplier would increase annual costs by " +
      formatNumber(top1CostIncrease) + ", reducing gross margin from " +
      grossMarginPct + "% to " + Math.round(scenarioMarginPct * 10) / 10 +
      "% (" + Math.round(Math.abs(marginDelta) * 10) / 10 + " percentage points)." +
      switchingNote +
      " Each 1% price change from the top supplier shifts the cost base by " +
      formatNumber(sensitivityPer1Pct) + " annually.</p>" +

      "<p><strong>Operational Interpretation</strong></p>" +
      "<p>When the top supplier represents " + supplier1Pct +
      "% of purchasing spend, their pricing decisions directly affect a material portion of the cost structure. A 5% increase is not an unusual commercial request at contract renewal, and the gross margin impact of " +
      Math.round(Math.abs(marginDelta) * 10) / 10 +
      " percentage points may be difficult to recover through pricing if customers resist corresponding increases. The business's negotiating position is structurally weaker than it would be if spend were more distributed.</p>" +

      "<p><strong>Structural Risk Observation</strong></p>" +
      "<p>Supplier dependency risk operates through two separate channels. The first is price: a concentrated supplier can impose cost increases that compress margin without a corresponding ability to pass them through. The second is supply continuity: a concentrated supplier experiencing capacity or financial difficulties can disrupt operations with limited immediate alternatives. Both channels are more acute when dependency is " + dependencyBand + ".</p>" +

      "<p><strong>Management Questions</strong></p>" +
      "<p>Has the top supplier's pricing been tested against market alternatives in the last 12 months, and if not, is there an assumption of competitive pricing that may not be warranted?</p>" +
      "<p>What is the minimum viable alternative sourcing structure that could be established within 60 days if the top supplier relationship deteriorated?</p>" +
      "<p>Does the current volume commitment to the top supplier reflect a deliberate strategic choice or a historical accumulation that was never formally reviewed?</p>" +

      "<p><strong>Selective Engagement Note</strong></p>" +
      "<p>This calculator evaluates only one narrow dimension of business structure: the concentration of purchasing spend across the supplier base. Deeper diagnostic work examines how supplier dependency interacts with pricing power, contract structure, margin by product category, working capital terms, and the realistic sourcing alternatives available in the specific market. MJB Strategic works with a limited number of businesses at any time because supplier dependency analysis requires understanding the commercial relationships and the operational realities behind each sourcing decision. If this diagnostic thinking resonates, the contact page provides a route to explore whether a deeper engagement would be appropriate.</p>";

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
