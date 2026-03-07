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

  ["totalBusinessProfit","asset1Value","asset2Value","asset3Value","asset4Value","asset1Profit","asset2Profit","asset3Profit","asset4Profit"].forEach(attachNumFormat);

  function runDiagnostic() {

    resultContainer.innerHTML = "";

    /* INPUT COLLECTION */

    const requiredReturn = Number(document.getElementById("requiredReturn").value);
    const totalBusinessProfit = parseNum(document.getElementById("totalBusinessProfit").value);

    const assetValues = [
      parseNum(document.getElementById("asset1Value").value),
      parseNum(document.getElementById("asset2Value").value),
      parseNum(document.getElementById("asset3Value").value),
      parseNum(document.getElementById("asset4Value").value)
    ];

    const assetProfits = [
      parseNum(document.getElementById("asset1Profit").value),
      parseNum(document.getElementById("asset2Profit").value),
      parseNum(document.getElementById("asset3Profit").value),
      parseNum(document.getElementById("asset4Profit").value)
    ];

    /* VALIDATION */

    if (!requiredReturn || requiredReturn <= 0 || requiredReturn > 100) {
      showError("Enter a required rate of return between 1 and 100.");
      return;
    }
    if (!totalBusinessProfit || totalBusinessProfit <= 0) {
      showError("Enter a valid total annual operating profit figure.");
      return;
    }
    if (!assetValues[0] || assetValues[0] <= 0 ||
        !assetValues[1] || assetValues[1] <= 0 ||
        !assetValues[2] || assetValues[2] <= 0) {
      showError("Enter values for at least three assets to run the diagnostic.");
      return;
    }
    if (isNaN(assetProfits[0]) || isNaN(assetProfits[1]) || isNaN(assetProfits[2])) {
      showError("Enter profit contributions for the first three assets.");
      return;
    }

    /* BASELINE CALCULATION */

    const assets = [];
    const requiredReturnDecimal = requiredReturn / 100;

    for (let i = 0; i < 4; i++) {
      if (assetValues[i] > 0) {
        const actualReturn = assetProfits[i] / assetValues[i];
        const actualReturnPct = actualReturn * 100;
        const requiredProfit = assetValues[i] * requiredReturnDecimal;
        const profitShortfall = requiredProfit - assetProfits[i];
        const isIdle = profitShortfall > 0;
        assets.push({
          index: i + 1,
          value: assetValues[i],
          profit: assetProfits[i],
          actualReturnPct: actualReturnPct,
          requiredProfit: requiredProfit,
          shortfall: profitShortfall,
          isIdle: isIdle
        });
      }
    }

    const completedCount = assets.length;
    const totalAssetValue = assets.reduce(function (s, a) { return s + a.value; }, 0);
    const totalActualProfit = assets.reduce(function (s, a) { return s + a.profit; }, 0);
    const totalRequiredProfit = totalAssetValue * requiredReturnDecimal;
    const totalShortfall = totalRequiredProfit - totalActualProfit;
    const totalIdleCount = assets.filter(function (a) { return a.isIdle; }).length;

    /* SCENARIO CALCULATION */

    const scenarioProfit = totalBusinessProfit + (totalShortfall > 0 ? totalShortfall : 0);

    /* SENSITIVITY CALCULATION */

    const sensitivityImpact = totalAssetValue * 0.01;

    /* REPORT TEXT VARIABLES */

    const overallReturnPct = Math.round((totalActualProfit / totalAssetValue) * 1000) / 10;

    let tableRows = "";
    assets.forEach(function (a) {
      const returnLabel = Math.round(a.actualReturnPct * 10) / 10 + "%";
      const shortfallLabel = a.isIdle ? formatNumber(a.shortfall) : "n/a";
      const status = a.isIdle ? "Below threshold" : "At or above threshold";
      tableRows +=
        "<tr><td>Asset " + a.index + "</td><td>" +
        formatNumber(a.value) + "</td><td>" +
        formatNumber(a.profit) + "</td><td>" +
        returnLabel + "</td><td>" +
        shortfallLabel + "</td><td>" +
        status + "</td></tr>";
    });

    /* REPORT RENDER */

    const report =
      "<p><strong>Diagnostic Summary</strong></p>" +
      "<p>Across " + completedCount + " analysed assets with a combined value of " +
      formatNumber(totalAssetValue) +
      ", total profit contribution is " + formatNumber(totalActualProfit) +
      ", representing an aggregate return of " + overallReturnPct +
      "% against a required rate of " + requiredReturn +
      "%. " + totalIdleCount + " of " + completedCount +
      " assets are generating below the required return threshold. The aggregate profit shortfall relative to the required return is " +
      formatNumber(totalShortfall > 0 ? totalShortfall : 0) + ".</p>" +

      "<p><strong>Key Mechanics</strong></p>" +
      "<table><thead><tr><th>Asset</th><th>Value</th><th>Profit</th><th>Return</th><th>Shortfall</th><th>Status</th></tr></thead><tbody>" +
      tableRows +
      "</tbody></table>" +
      "<p>If idle capital were redeployed at the required return of " + requiredReturn +
      "%, total annual profit could move from " + formatNumber(totalBusinessProfit) +
      " to approximately " + formatNumber(scenarioProfit) +
      ". A 1% shift in required return on this asset base changes the total shortfall threshold by " +
      formatNumber(sensitivityImpact) + ".</p>" +

      "<p><strong>Operational Interpretation</strong></p>" +
      "<p>Assets generating below the required return are consuming capital that is not earning its economic cost. This is not always visible in accounting statements because book depreciation does not capture the opportunity cost of holding the asset. The combined effect of " +
      totalIdleCount + " underperforming asset" + (totalIdleCount !== 1 ? "s" : "") +
      " is to reduce effective total return by suppressing aggregate profit relative to the capital base committed.</p>" +

      "<p><strong>Structural Risk Observation</strong></p>" +
      "<p>When a meaningful share of capital sits in assets generating below the required return, the business is implicitly cross-subsidising those holdings with profit generated elsewhere. Over time this suppresses the overall return available for growth, debt reduction, or owner distributions. It also masks the true profitability of the productive assets by averaging their returns down across the full asset base.</p>" +

      "<p><strong>Management Questions</strong></p>" +
      "<p>For each asset generating below the required return, what would it take to either improve its contribution to the threshold or realise its capital for redeployment?</p>" +
      "<p>If the lowest-returning asset were sold or decommissioned, how quickly could that capital be redeployed into an activity already generating above the required return?</p>" +
      "<p>Is the required return threshold used here consistent with what the business is actually earning in its most productive activities?</p>" +

      "<p><strong>Selective Engagement Note</strong></p>" +
      "<p>This calculator evaluates only one narrow dimension of business structure: the return generated by individual capital assets relative to a required threshold. Deeper diagnostic work examines how asset configuration interacts with cash flow timing, financing cost, operational capacity, revenue concentration, and the real opportunity cost of capital in the specific business context. MJB Strategic works with a limited number of businesses at any time because this level of capital analysis requires a detailed understanding of operating structure and strategic intent. If this diagnostic thinking resonates, the contact page provides a route to explore whether a deeper engagement would be appropriate.</p>";

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
