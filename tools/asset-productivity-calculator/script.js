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

  ["totalAssets","operatingProfit","annualRevenue","fixedAssets","cashAndEquivalents","receivables","totalDebt","annualDepreciation"].forEach(attachNumFormat);

  function runDiagnostic() {

    resultContainer.innerHTML = "";

    /* INPUT COLLECTION */

    const totalAssets = parseNum(document.getElementById("totalAssets").value);
    const operatingProfit = parseNum(document.getElementById("operatingProfit").value);
    const annualRevenue = parseNum(document.getElementById("annualRevenue").value);
    const fixedAssets = parseNum(document.getElementById("fixedAssets").value);
    const cashAndEquivalents = parseNum(document.getElementById("cashAndEquivalents").value);
    const receivables = parseNum(document.getElementById("receivables").value);
    const totalDebt = parseNum(document.getElementById("totalDebt").value);
    const annualDepreciation = parseNum(document.getElementById("annualDepreciation").value);
    const industryROABenchmark = Number(document.getElementById("industryROABenchmark").value);

    /* VALIDATION */

    if (!totalAssets || totalAssets <= 0) {
      showError("Enter a valid total assets figure.");
      return;
    }
    if (isNaN(operatingProfit)) {
      showError("Enter a valid operating profit figure.");
      return;
    }
    if (!annualRevenue || annualRevenue <= 0) {
      showError("Enter a valid annual revenue figure.");
      return;
    }
    if (!fixedAssets || fixedAssets < 0) {
      showError("Enter a valid fixed assets figure.");
      return;
    }
    if (isNaN(cashAndEquivalents) || cashAndEquivalents < 0) {
      showError("Enter a valid cash and liquid assets figure.");
      return;
    }
    if (isNaN(receivables) || receivables < 0) {
      showError("Enter a valid receivables figure.");
      return;
    }

    /* BASELINE CALCULATION */

    const roaPct = (operatingProfit / totalAssets) * 100;
    const operatingMarginPct = (operatingProfit / annualRevenue) * 100;
    const assetTurnover = annualRevenue / totalAssets;
    const netOperatingAssets = totalAssets - cashAndEquivalents;
    const ronaPct = netOperatingAssets > 0 ? (operatingProfit / netOperatingAssets) * 100 : 0;
    const receivablesToAssets = (receivables / totalAssets) * 100;
    const fixedAssetsToTotal = (fixedAssets / totalAssets) * 100;

    /* SCENARIO CALCULATION */

    const assetReductionPct = 0.15;
    const scenarioAssets = totalAssets * (1 - assetReductionPct);
    const scenarioROA = (operatingProfit / scenarioAssets) * 100;
    const roaDelta = scenarioROA - roaPct;

    /* SENSITIVITY CALCULATION */

    const sensitivityProfitChange = totalAssets * 0.01;

    /* EBITDA ADJUSTED */

    let ebitdaROA = 0;
    let ebitdaNote = "";
    if (annualDepreciation > 0) {
      const ebitda = operatingProfit + annualDepreciation;
      ebitdaROA = (ebitda / totalAssets) * 100;
      ebitdaNote = " On an EBITDA-adjusted basis, asset productivity rises to " +
        Math.round(ebitdaROA * 10) / 10 + "%.";
    }

    /* BENCHMARK COMPARISON */

    let benchmarkNote = "";
    if (industryROABenchmark > 0) {
      const gap = roaPct - industryROABenchmark;
      if (gap >= 0) {
        benchmarkNote = " Against the supplied industry benchmark of " + industryROABenchmark +
          "%, the business is producing " + Math.round(gap * 10) / 10 +
          " percentage points above benchmark.";
      } else {
        const profitGap = (industryROABenchmark / 100 - roaPct / 100) * totalAssets;
        benchmarkNote = " Against the supplied industry benchmark of " + industryROABenchmark +
          "%, the business is generating " + Math.round(Math.abs(gap) * 10) / 10 +
          " percentage points below benchmark, representing an annual profit gap of approximately " +
          formatNumber(profitGap) + ".";
      }
    }

    /* REPORT TEXT VARIABLES */

    const roaRounded = Math.round(roaPct * 10) / 10;
    const ronaRounded = Math.round(ronaPct * 10) / 10;
    const operatingMarginRounded = Math.round(operatingMarginPct * 10) / 10;
    const assetTurnoverRounded = Math.round(assetTurnover * 100) / 100;
    const scenarioROARounded = Math.round(scenarioROA * 10) / 10;
    const roaDeltaRounded = Math.round(roaDelta * 10) / 10;

    let roaBand = "";
    if (roaPct < 5) {
      roaBand = "low (below 5%)";
    } else if (roaPct < 12) {
      roaBand = "moderate (5–12%)";
    } else if (roaPct < 20) {
      roaBand = "strong (12–20%)";
    } else {
      roaBand = "high (above 20%)";
    }

    /* REPORT RENDER */

    const report =
      "<p><strong>Diagnostic Summary</strong></p>" +
      "<p>Total assets of " + formatNumber(totalAssets) +
      " generate annual operating profit of " + formatNumber(operatingProfit) +
      ", producing a return on assets of " + roaRounded +
      "%. Asset turnover is " + assetTurnoverRounded +
      "x, meaning each unit of assets generates " + assetTurnoverRounded +
      " units of revenue. Operating margin stands at " + operatingMarginRounded +
      "%. The current ROA is " + roaBand + "." + benchmarkNote + "</p>" +

      "<p><strong>Key Mechanics</strong></p>" +
      "<table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>" +
      "<tr><td>Return on assets (ROA)</td><td>" + roaRounded + "%</td></tr>" +
      "<tr><td>Return on net operating assets (RONA)</td><td>" + ronaRounded + "%</td></tr>" +
      "<tr><td>Asset turnover</td><td>" + assetTurnoverRounded + "x</td></tr>" +
      "<tr><td>Fixed assets as % of total</td><td>" + Math.round(fixedAssetsToTotal) + "%</td></tr>" +
      "<tr><td>Receivables as % of total</td><td>" + Math.round(receivablesToAssets) + "%</td></tr>" +
      "</tbody></table>" +
      "<p>If the asset base were reduced by 15% through disposal or write-down to " +
      formatNumber(scenarioAssets) +
      ", ROA would improve from " + roaRounded + "% to " + scenarioROARounded +
      "%, a gain of " + roaDeltaRounded + " percentage points." + ebitdaNote +
      " A 1% improvement in operating margin on the current asset base would increase the ROA by approximately " +
      formatNumber(sensitivityProfitChange) + " in absolute profit terms.</p>" +

      "<p><strong>Operational Interpretation</strong></p>" +
      "<p>Fixed assets represent " + Math.round(fixedAssetsToTotal) +
      "% of the total asset base, while receivables represent " + Math.round(receivablesToAssets) +
      "%. High fixed asset concentration typically creates operating leverage where volume increases profit disproportionately, but volume declines damage profit equally fast. Receivable concentration indicates capital tied up in customer payment cycles rather than productive deployment.</p>" +

      "<p><strong>Structural Risk Observation</strong></p>" +
      "<p>A return on assets of " + roaRounded +
      "% means the business earns " + roaRounded +
      " cents of operating profit for every dollar of assets deployed. Where this falls below the cost of capital or financing rate, the asset base is economically dilutive. Capital tied up in low-return fixed assets or slow receivables suppresses this ratio and may be masking the true productivity of the core operating activities.</p>" +

      "<p><strong>Management Questions</strong></p>" +
      "<p>Which individual assets within the fixed asset base are generating disproportionately low revenue or profit relative to their carrying value?</p>" +
      "<p>If receivables could be reduced by 20 days, how much additional cash would be freed, and what would that capital earn if redeployed into the business?</p>" +
      "<p>Is the current asset base the minimum needed to generate this revenue and profit, or does it contain surplus capacity that is absorbing capital without contributing return?</p>" +

      "<p><strong>Selective Engagement Note</strong></p>" +
      "<p>This calculator evaluates only one narrow dimension of business structure: the productivity of the total asset base relative to operating profit. Deeper diagnostic work examines how individual asset categories interact with working capital cycles, financing structure, operating leverage, and capital redeployment opportunities. MJB Strategic works with a limited number of businesses at any time because this level of asset analysis requires understanding the operational logic behind each category. If this diagnostic thinking resonates, the contact page provides a route to explore whether a deeper engagement would be appropriate.</p>";

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
