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

  ["currentMonthlyRevenue","existingCash","overdraftLimit"].forEach(attachNumFormat);

  function runDiagnostic() {

    resultContainer.innerHTML = "";

    /* INPUT COLLECTION */

    const currentMonthlyRevenue = parseNum(document.getElementById("currentMonthlyRevenue").value);
    const revenueGrowthPct = Number(document.getElementById("revenueGrowthPct").value);
    const grossMarginPct = Number(document.getElementById("grossMarginPct").value);
    const debtorDays = Number(document.getElementById("debtorDays").value);
    const creditorDays = Number(document.getElementById("creditorDays").value);
    const projectionMonths = Number(document.getElementById("projectionMonths").value);
    const inventoryDays = Number(document.getElementById("inventoryDays").value) || 0;
    const existingCash = parseNum(document.getElementById("existingCash").value) || 0;
    const overdraftLimit = parseNum(document.getElementById("overdraftLimit").value) || 0;

    /* VALIDATION */

    if (!currentMonthlyRevenue || currentMonthlyRevenue <= 0) {
      showError("Enter a valid current monthly revenue figure.");
      return;
    }
    if (isNaN(revenueGrowthPct) || revenueGrowthPct <= 0) {
      showError("Enter a valid monthly revenue growth percentage.");
      return;
    }
    if (isNaN(grossMarginPct) || grossMarginPct <= 0 || grossMarginPct >= 100) {
      showError("Enter a gross margin percentage between 1 and 99.");
      return;
    }
    if (!debtorDays || debtorDays < 0) {
      showError("Enter a valid debtor days figure.");
      return;
    }
    if (!creditorDays || creditorDays < 0) {
      showError("Enter a valid creditor days figure.");
      return;
    }
    if (!projectionMonths || projectionMonths < 1 || projectionMonths > 24) {
      showError("Enter a projection period between 1 and 24 months.");
      return;
    }

    /* BASELINE CALCULATION */

    const grossMarginDecimal = grossMarginPct / 100;
    const growthDecimal = revenueGrowthPct / 100;
    const cogsRatio = 1 - grossMarginDecimal;

    const baselineMonthlyRevenue = currentMonthlyRevenue;
    const baselineAnnualRevenue = currentMonthlyRevenue * 12;
    const baselineDailyRevenue = baselineAnnualRevenue / 365;
    const baselineDailyCOGS = baselineAnnualRevenue * cogsRatio / 365;

    const baselineReceivables = debtorDays * baselineDailyRevenue;
    const baselineInventory = inventoryDays * baselineDailyCOGS;
    const baselinePayables = creditorDays * baselineDailyCOGS;
    const baselineWC = baselineReceivables + baselineInventory - baselinePayables;

    /* SCENARIO CALCULATION */

    const finalMonthlyRevenue = currentMonthlyRevenue * Math.pow(1 + growthDecimal, projectionMonths);
    const finalAnnualRevenue = finalMonthlyRevenue * 12;
    const finalDailyRevenue = finalAnnualRevenue / 365;
    const finalDailyCOGS = finalAnnualRevenue * cogsRatio / 365;

    const finalReceivables = debtorDays * finalDailyRevenue;
    const finalInventory = inventoryDays * finalDailyCOGS;
    const finalPayables = creditorDays * finalDailyCOGS;
    const finalWC = finalReceivables + finalInventory - finalPayables;

    const additionalWC = finalWC - baselineWC;
    const totalCashRequired = additionalWC;
    const availableFunding = existingCash + overdraftLimit;
    const fundingGap = totalCashRequired - availableFunding;

    /* SENSITIVITY CALCULATION */

    const sensitivityPerGrowthPoint = (currentMonthlyRevenue * 12 * growthDecimal * debtorDays) / 365;

    /* REPORT TEXT VARIABLES */

    const revenueGrowthAmount = finalMonthlyRevenue - currentMonthlyRevenue;
    const totalRevenueGrowthPct = Math.round(((finalMonthlyRevenue / currentMonthlyRevenue) - 1) * 100);

    /* REPORT RENDER */

    const report =
      "<p><strong>Diagnostic Summary</strong></p>" +
      "<p>Growing monthly revenue from " + formatNumber(currentMonthlyRevenue) +
      " to " + formatNumber(finalMonthlyRevenue) +
      " (" + totalRevenueGrowthPct + "% over " + projectionMonths +
      " months at " + revenueGrowthPct + "% per month) requires an additional " +
      formatNumber(totalCashRequired) +
      " in working capital. Current working capital requirement is " +
      formatNumber(baselineWC) +
      ", rising to " + formatNumber(finalWC) +
      " at the projected revenue level." +
      (availableFunding > 0 ?
        " Available funding (cash plus facility) of " + formatNumber(availableFunding) +
        " covers " + Math.min(100, Math.round((availableFunding / totalCashRequired) * 100)) +
        "% of the requirement, leaving a funding gap of " +
        (fundingGap > 0 ? formatNumber(fundingGap) : "nil") + "." : "") +
      "</p>" +

      "<p><strong>Key Mechanics</strong></p>" +
      "<table><thead><tr><th>Component</th><th>Baseline</th><th>At Target Revenue</th><th>Change</th></tr></thead><tbody>" +
      "<tr><td>Monthly revenue</td><td>" + formatNumber(currentMonthlyRevenue) + "</td><td>" + formatNumber(finalMonthlyRevenue) + "</td><td>+" + formatNumber(revenueGrowthAmount) + "</td></tr>" +
      "<tr><td>Receivables tied up</td><td>" + formatNumber(baselineReceivables) + "</td><td>" + formatNumber(finalReceivables) + "</td><td>+" + formatNumber(finalReceivables - baselineReceivables) + "</td></tr>" +
      "<tr><td>Inventory tied up</td><td>" + formatNumber(baselineInventory) + "</td><td>" + formatNumber(finalInventory) + "</td><td>+" + formatNumber(finalInventory - baselineInventory) + "</td></tr>" +
      "<tr><td>Payables offset</td><td>(" + formatNumber(baselinePayables) + ")</td><td>(" + formatNumber(finalPayables) + ")</td><td>(" + formatNumber(finalPayables - baselinePayables) + ")</td></tr>" +
      "<tr><td>Net working capital</td><td>" + formatNumber(baselineWC) + "</td><td>" + formatNumber(finalWC) + "</td><td>+" + formatNumber(additionalWC) + "</td></tr>" +
      "</tbody></table>" +
      "<p>Each additional 1% per month of revenue growth increases the additional working capital requirement by approximately " +
      formatNumber(sensitivityPerGrowthPoint) +
      " over this period. At the target revenue level, the business must continuously fund " +
      formatNumber(finalWC) + " in working capital before any profit distributions.</p>" +

      "<p><strong>Operational Interpretation</strong></p>" +
      "<p>The additional working capital of " + formatNumber(additionalWC) +
      " does not represent a loss. It represents cash that is committed inside the operating cycle, funding receivables and inventory that will eventually convert back to cash. However, until that conversion occurs, the business must source that capital from existing reserves, credit facilities, or owner funding. During rapid growth, this demand accelerates faster than profit accumulates.</p>" +

      "<p><strong>Structural Risk Observation</strong></p>" +
      "<p>Businesses that grow without modelling working capital requirements frequently face a cash crisis at the point of maximum operational momentum. Revenue is rising, orders are strong, but cash is being absorbed by the expanding cycle. Debtor days of " + debtorDays +
      " mean that approximately " + Math.round(debtorDays / 30 * 10) / 10 +
      " months of revenue sits uncollected at any time. As revenue grows, that uncollected balance grows proportionally, requiring continuous funding.</p>" +

      "<p><strong>Management Questions</strong></p>" +
      "<p>At the projected revenue level, what combination of cash reserves, facility headroom, and operating profit is available to fund the working capital gap, and has that been stress-tested?</p>" +
      "<p>If debtor days were reduced by 10 days through tighter collections, how much of the growth-driven working capital requirement would be self-funded?</p>" +
      "<p>Is the projected growth rate achievable without a corresponding commitment to funding. If not, what is the maximum growth rate that can be supported within current liquidity constraints?</p>" +

      "<p><strong>Selective Engagement Note</strong></p>" +
      "<p>This calculator evaluates only one narrow dimension of business structure: the working capital cost of revenue growth. Deeper diagnostic work examines how growth interacts with margin behaviour, overhead absorption, supplier capacity, customer concentration, and the structural sustainability of the business model at higher revenue levels. MJB Strategic works with a limited number of businesses at any time because growth capital planning requires understanding both the financial structure and the operational constraints of the specific business. If this diagnostic thinking resonates, the contact page provides a route to explore whether a deeper engagement would be appropriate.</p>";

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
