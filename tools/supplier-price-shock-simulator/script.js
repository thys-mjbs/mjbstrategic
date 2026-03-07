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

  ["annualCOGS","annualRevenue","operatingProfit","annualFixedCosts"].forEach(attachNumFormat);

  function runDiagnostic() {

    resultContainer.innerHTML = "";

    /* INPUT COLLECTION */

    const annualCOGS = parseNum(document.getElementById("annualCOGS").value);
    const annualRevenue = parseNum(document.getElementById("annualRevenue").value);
    const operatingProfit = parseNum(document.getElementById("operatingProfit").value);
    const dominantSupplierPct = Number(document.getElementById("dominantSupplierPct").value);
    const priceIncreasePct = Number(document.getElementById("priceIncreasePct").value);
    const annualFixedCosts = parseNum(document.getElementById("annualFixedCosts").value);
    const passThroughPct = Number(document.getElementById("passThroughPct").value) || 0;
    const alternativeSourcePct = Number(document.getElementById("alternativeSourcePct").value) || 0;
    const volumeChangePct = Number(document.getElementById("volumeChangePct").value) || 0;

    /* VALIDATION */

    if (!annualCOGS || annualCOGS <= 0) {
      showError("Enter a valid annual cost of goods sold figure.");
      return;
    }
    if (!annualRevenue || annualRevenue <= 0) {
      showError("Enter a valid annual revenue figure.");
      return;
    }
    if (annualCOGS >= annualRevenue) {
      showError("Annual COGS must be less than annual revenue.");
      return;
    }
    if (!operatingProfit) {
      showError("Enter a valid current annual operating profit.");
      return;
    }
    if (!dominantSupplierPct || dominantSupplierPct <= 0 || dominantSupplierPct > 100) {
      showError("Enter the dominant supplier percentage of COGS between 1 and 100.");
      return;
    }
    if (!priceIncreasePct || priceIncreasePct <= 0) {
      showError("Enter the expected price increase percentage.");
      return;
    }
    if (!annualFixedCosts || annualFixedCosts <= 0) {
      showError("Enter a valid annual fixed costs figure.");
      return;
    }

    /* BASELINE CALCULATION */

    const grossProfit = annualRevenue - annualCOGS;
    const grossMarginPct = (grossProfit / annualRevenue) * 100;
    const operatingMarginPct = (operatingProfit / annualRevenue) * 100;

    const dominantSupplierSpend = annualCOGS * (dominantSupplierPct / 100);
    const costIncrease = dominantSupplierSpend * (priceIncreasePct / 100);
    const costIncreaseAsRevenuePct = (costIncrease / annualRevenue) * 100;

    /* FULL SHOCK SCENARIO (no mitigation) */

    const shockGrossProfit = grossProfit - costIncrease;
    const shockGrossMarginPct = (shockGrossProfit / annualRevenue) * 100;
    const shockOperatingProfit = operatingProfit - costIncrease;
    const shockOperatingMarginPct = (shockOperatingProfit / annualRevenue) * 100;
    const marginPointsLost = grossMarginPct - shockGrossMarginPct;

    /* PASS-THROUGH SCENARIO */

    let passThroughNote = "";
    let passThroughOperatingProfit = shockOperatingProfit;
    let passThroughRevenue = annualRevenue;

    if (passThroughPct > 0) {
      const costRecovered = costIncrease * (passThroughPct / 100);
      const revenueIncrease = costRecovered;
      passThroughRevenue = annualRevenue + revenueIncrease;
      passThroughOperatingProfit = shockOperatingProfit + costRecovered;

      let volumeNote = "";
      if (volumeChangePct !== 0) {
        const volumeImpact = annualRevenue * (Math.abs(volumeChangePct) / 100);
        const volumeMarginImpact = volumeImpact * (grossMarginPct / 100);
        if (volumeChangePct < 0) {
          passThroughOperatingProfit -= volumeMarginImpact;
          volumeNote = " A " + Math.abs(volumeChangePct) + "% volume reduction from the price increase reduces operating profit by a further " + formatNumber(volumeMarginImpact) + ".";
        } else {
          passThroughOperatingProfit += volumeMarginImpact;
          volumeNote = " A " + volumeChangePct + "% volume gain from competitive pricing reduces net cost impact by " + formatNumber(volumeMarginImpact) + ".";
        }
      }

      passThroughNote = " A " + passThroughPct + "% pass-through to customers recovers " + formatNumber(costRecovered) + " of the cost increase, leaving operating profit at " + formatNumber(passThroughOperatingProfit) + "." + volumeNote;
    }

    /* ALTERNATIVE SOURCING SCENARIO */

    let alternativeNote = "";
    if (alternativeSourcePct > 0) {
      const volumeMitigated = dominantSupplierSpend * (alternativeSourcePct / 100);
      const costIncreaseOnMitigated = volumeMitigated * (priceIncreasePct / 100);
      const residualCostIncrease = costIncrease - costIncreaseOnMitigated;
      const mitigatedOperatingProfit = operatingProfit - residualCostIncrease;
      alternativeNote = " If " + alternativeSourcePct + "% of the dominant supplier volume could be sourced alternatively at current pricing, the cost increase exposure falls to " + formatNumber(residualCostIncrease) + " and operating profit stabilises at " + formatNumber(mitigatedOperatingProfit) + ".";
    }

    /* SENSITIVITY CALCULATION */

    const sensitivityPer1Pct = dominantSupplierSpend * 0.01;
    const revenueNeededToRecover = costIncrease / (grossMarginPct / 100);

    /* REPORT TEXT VARIABLES */

    let shockSeverity = "";
    const profitImpactPct = operatingProfit !== 0 ? (costIncrease / Math.abs(operatingProfit)) * 100 : 0;
    if (profitImpactPct < 10) {
      shockSeverity = "manageable";
    } else if (profitImpactPct < 30) {
      shockSeverity = "significant";
    } else if (profitImpactPct < 70) {
      shockSeverity = "severe";
    } else {
      shockSeverity = "critical";
    }

    /* REPORT RENDER */

    const report =
      "<p><strong>Diagnostic Summary</strong></p>" +
      "<p>The dominant supplier represents " + dominantSupplierPct + "% of COGS, equivalent to " + formatNumber(dominantSupplierSpend) + " in annual spend. A " + priceIncreasePct + "% price increase from this supplier adds " + formatNumber(costIncrease) + " to the annual cost base, representing " + Math.round(costIncreaseAsRevenuePct * 10) / 10 + "% of revenue. Without mitigation, this reduces gross margin from " + Math.round(grossMarginPct * 10) / 10 + "% to " + Math.round(shockGrossMarginPct * 10) / 10 + "%, a loss of " + Math.round(marginPointsLost * 10) / 10 + " percentage points. The operating profit impact is " + shockSeverity + "." + "</p>" +

      "<p><strong>Key Mechanics</strong></p>" +
      "<table><thead><tr><th>Metric</th><th>Before shock</th><th>After shock</th></tr></thead><tbody>" +
      "<tr><td>Annual revenue</td><td>" + formatNumber(annualRevenue) + "</td><td>" + formatNumber(annualRevenue) + "</td></tr>" +
      "<tr><td>Annual COGS</td><td>" + formatNumber(annualCOGS) + "</td><td>" + formatNumber(annualCOGS + costIncrease) + "</td></tr>" +
      "<tr><td>Gross profit</td><td>" + formatNumber(grossProfit) + "</td><td>" + formatNumber(shockGrossProfit) + "</td></tr>" +
      "<tr><td>Gross margin %</td><td>" + Math.round(grossMarginPct * 10) / 10 + "%</td><td>" + Math.round(shockGrossMarginPct * 10) / 10 + "%</td></tr>" +
      "<tr><td>Operating profit</td><td>" + formatNumber(operatingProfit) + "</td><td>" + formatNumber(shockOperatingProfit) + "</td></tr>" +
      "<tr><td>Operating margin %</td><td>" + Math.round(operatingMarginPct * 10) / 10 + "%</td><td>" + Math.round(shockOperatingMarginPct * 10) / 10 + "%</td></tr>" +
      "</tbody></table>" +
      "<p>Each 1% price movement from the dominant supplier shifts the annual cost base by " + formatNumber(sensitivityPer1Pct) + ". To recover the full cost increase through volume growth at the current gross margin, the business would need to generate " + formatNumber(revenueNeededToRecover) + " in additional revenue." +
      (passThroughNote ? passThroughNote : "") +
      (alternativeNote ? alternativeNote : "") +
      "</p>" +

      "<p><strong>Operational Interpretation</strong></p>" +
      "<p>When a single supplier controls " + dominantSupplierPct + "% of the cost base, their pricing decisions carry outsized influence over business profitability. A " + priceIncreasePct + "% increase is within the range of commercially plausible requests at contract renewal, particularly when commodity prices, logistics costs, or currency movements provide justification. The gross margin impact of " + Math.round(marginPointsLost * 10) / 10 + " percentage points may appear modest in isolation but translates directly into operating profit compression that requires significant incremental revenue to neutralise.</p>" +

      "<p><strong>Structural Risk Observation</strong></p>" +
      "<p>Supplier price shock risk is fundamentally a function of concentration. The higher the dominant supplier's share of COGS, the larger the cost base exposed to their unilateral pricing decisions. Businesses with high gross margins can absorb cost increases more readily because the contribution per unit of revenue is higher. Businesses with thin gross margins are structurally more vulnerable because the same absolute cost increase represents a larger fraction of the profit buffer available. At the current gross margin of " + Math.round(grossMarginPct * 10) / 10 + "%, the cost increase of " + formatNumber(costIncrease) + " must be matched by approximately " + formatNumber(revenueNeededToRecover) + " in additional revenue to restore the pre-shock profit position.</p>" +

      "<p><strong>Management Questions</strong></p>" +
      "<p>Has the dominant supplier's pricing been validated against alternative sources in the last 12 months, or has the concentration deepened without a corresponding review of the commercial terms?</p>" +
      "<p>What is the realistic lead time to qualify and onboard an alternative supplier for a meaningful portion of the dominant supplier's volume, and has that process been initiated or scoped?</p>" +
      "<p>If the full cost increase cannot be passed to customers, which specific cost lines in the fixed or variable structure could absorb part of the impact, and on what timeline?</p>" +

      "<p><strong>Selective Engagement Note</strong></p>" +
      "<p>This calculator evaluates one specific financial exposure: the margin impact of a price increase from a dominant supplier. Deeper diagnostic work examines how supplier concentration interacts with contract structure, sourcing alternatives, the realistic pace of diversification given operational switching costs, and the pricing power available on the customer side to absorb cost increases. MJB Strategic works with a limited number of businesses at any time because supplier risk analysis requires understanding the commercial relationships and market dynamics that determine whether the business is a price taker or has genuine leverage in its supply chain. If this diagnostic thinking resonates, the contact page provides a route to explore whether a deeper engagement would be appropriate.</p>";

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
