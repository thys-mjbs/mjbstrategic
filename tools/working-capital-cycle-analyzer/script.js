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

  ["monthlyRevenue","annualRevenue"].forEach(attachNumFormat);

  function runDiagnostic() {

    resultContainer.innerHTML = "";

    /* INPUT COLLECTION */

    const debtorDays = Number(document.getElementById("debtorDays").value);
    const creditorDays = Number(document.getElementById("creditorDays").value);
    const inventoryDays = Number(document.getElementById("inventoryDays").value);
    const monthlyRevenue = parseNum(document.getElementById("monthlyRevenue").value);
    const grossMarginPct = Number(document.getElementById("grossMarginPct").value);
    const annualRevenue = parseNum(document.getElementById("annualRevenue").value);
    const overdraftRatePct = Number(document.getElementById("overdraftRatePct").value);
    const targetDebtorDays = Number(document.getElementById("targetDebtorDays").value);
    const targetInventoryDays = Number(document.getElementById("targetInventoryDays").value);

    /* VALIDATION */

    if (!debtorDays || debtorDays < 0) {
      showError("Enter a valid debtor days figure.");
      return;
    }
    if (!creditorDays || creditorDays < 0) {
      showError("Enter a valid creditor days figure.");
      return;
    }
    if (isNaN(inventoryDays) || inventoryDays < 0) {
      showError("Enter a valid inventory holding days figure.");
      return;
    }
    if (!monthlyRevenue || monthlyRevenue <= 0) {
      showError("Enter a valid monthly revenue figure.");
      return;
    }
    if (isNaN(grossMarginPct) || grossMarginPct <= 0 || grossMarginPct >= 100) {
      showError("Enter a gross margin percentage between 1 and 99.");
      return;
    }
    if (!annualRevenue || annualRevenue <= 0) {
      showError("Enter a valid annual revenue figure.");
      return;
    }

    /* BASELINE CALCULATION */

    const dailyRevenue = annualRevenue / 365;
    const grossMarginDecimal = grossMarginPct / 100;
    const cogs = annualRevenue * (1 - grossMarginDecimal);
    const dailyCOGS = cogs / 365;

    const cashConversionCycle = debtorDays + inventoryDays - creditorDays;
    const receivablesTied = debtorDays * dailyRevenue;
    const inventoryTied = inventoryDays * dailyCOGS;
    const payablesFunding = creditorDays * dailyCOGS;
    const netWorkingCapital = receivablesTied + inventoryTied - payablesFunding;

    let interestCost = 0;
    let interestNote = "";
    if (overdraftRatePct > 0) {
      interestCost = netWorkingCapital * (overdraftRatePct / 100);
      interestNote =
        " At an overdraft rate of " + overdraftRatePct +
        "%, the annual financing cost of carrying this working capital is approximately " +
        formatNumber(interestCost) + ".";
    }

    /* SCENARIO CALCULATION */

    let scenarioCCC = cashConversionCycle;
    let scenarioWC = netWorkingCapital;
    let scenarioNote = "";

    if (targetDebtorDays > 0 || targetInventoryDays > 0) {
      const scenarioDebtor = targetDebtorDays > 0 ? targetDebtorDays : debtorDays;
      const scenarioInventory = targetInventoryDays > 0 ? targetInventoryDays : inventoryDays;
      scenarioCCC = scenarioDebtor + scenarioInventory - creditorDays;
      const scenarioReceivables = scenarioDebtor * dailyRevenue;
      const scenarioInventoryTied = scenarioInventory * dailyCOGS;
      scenarioWC = scenarioReceivables + scenarioInventoryTied - payablesFunding;
      const wcRelease = netWorkingCapital - scenarioWC;
      scenarioNote =
        "Improving debtor days to " + scenarioDebtor +
        " and inventory days to " + scenarioInventory +
        " would reduce the cash conversion cycle from " + cashConversionCycle +
        " to " + scenarioCCC +
        " days, releasing approximately " + formatNumber(wcRelease) +
        " in working capital.";
    } else {
      const improvedDebtor = Math.max(debtorDays - 10, 0);
      const improvedWC = (improvedDebtor * dailyRevenue) + inventoryTied - payablesFunding;
      const wcRelease = netWorkingCapital - improvedWC;
      scenarioNote =
        "Reducing debtor days by 10 days to " + improvedDebtor +
        " days would release approximately " + formatNumber(wcRelease) +
        " in working capital tied up in customer receivables.";
    }

    /* SENSITIVITY CALCULATION */

    const sensitivityPerDay = dailyRevenue;

    /* REPORT TEXT VARIABLES */

    const cccLabel = cashConversionCycle + " days";
    const receivablesFormatted = formatNumber(receivablesTied);
    const inventoryFormatted = formatNumber(inventoryTied);
    const payablesFormatted = formatNumber(payablesFunding);
    const netWCFormatted = formatNumber(netWorkingCapital);

    let cccBand = "";
    if (cashConversionCycle < 20) {
      cccBand = "short and cash-generative";
    } else if (cashConversionCycle < 45) {
      cccBand = "moderate";
    } else if (cashConversionCycle < 70) {
      cccBand = "extended";
    } else {
      cccBand = "long and capital-intensive";
    }

    /* REPORT RENDER */

    const report =
      "<p><strong>Diagnostic Summary</strong></p>" +
      "<p>The cash conversion cycle is " + cccLabel +
      " (" + debtorDays + " debtor days + " + inventoryDays + " inventory days − " + creditorDays +
      " creditor days). This cycle is " + cccBand +
      ". Total net working capital tied up in operations is approximately " + netWCFormatted +
      "." + interestNote + "</p>" +

      "<p><strong>Key Mechanics</strong></p>" +
      "<table><thead><tr><th>Component</th><th>Days</th><th>Capital Tied Up</th></tr></thead><tbody>" +
      "<tr><td>Receivables (debtors)</td><td>" + debtorDays + "</td><td>" + receivablesFormatted + "</td></tr>" +
      "<tr><td>Inventory</td><td>" + inventoryDays + "</td><td>" + inventoryFormatted + "</td></tr>" +
      "<tr><td>Payables (creditors, offset)</td><td>(" + creditorDays + ")</td><td>(" + payablesFormatted + ")</td></tr>" +
      "<tr><td><strong>Net working capital</strong></td><td><strong>" + cashConversionCycle + "</strong></td><td><strong>" + netWCFormatted + "</strong></td></tr>" +
      "</tbody></table>" +
      "<p>" + scenarioNote +
      " Each additional day of debtor collection shifts the receivables balance by approximately " +
      formatNumber(sensitivityPerDay) + ".</p>" +

      "<p><strong>Operational Interpretation</strong></p>" +
      "<p>A cash conversion cycle of " + cashConversionCycle +
      " days means the business must continuously fund " + netWCFormatted +
      " of working capital to sustain current operations. Receivables represent the largest capital outflow at " +
      receivablesFormatted +
      ". Creditor terms offset " + payablesFormatted +
      " of that requirement. Any revenue growth will proportionally increase all three components, amplifying the total working capital requirement and the financing burden associated with it.</p>" +

      "<p><strong>Structural Risk Observation</strong></p>" +
      "<p>Businesses with extended cash conversion cycles are vulnerable to liquidity pressure during periods of growth or revenue softness. When sales grow, the working capital tied up in receivables and inventory increases before cash is collected, creating a gap that must be funded through overdraft, owner capital, or deferred payments. A " +
      cashConversionCycle + "-day cycle means cash is committed for approximately " +
      Math.round(cashConversionCycle / 30 * 10) / 10 +
      " months before it returns, requiring consistent working capital availability throughout that period.</p>" +

      "<p><strong>Management Questions</strong></p>" +
      "<p>Which customer categories or contract types are driving the longest debtor days, and is the credit risk associated with those customers priced into the margin?</p>" +
      "<p>Can inventory holding days be reduced through tighter ordering cycles or consignment arrangements without disrupting service levels or supplier relationships?</p>" +
      "<p>Are current supplier payment terms the most that could be negotiated given the volume and relationship strength, and has that been tested recently?</p>" +

      "<p><strong>Selective Engagement Note</strong></p>" +
      "<p>This calculator evaluates only one narrow dimension of business structure: the timing of cash flows through the operating cycle. Deeper diagnostic work examines how working capital interacts with revenue growth rates, margin concentration, financing structure, seasonal patterns, and the actual cash conversion performance at the customer and product level. MJB Strategic works with a limited number of businesses at any time because this level of cash flow analysis requires a detailed understanding of operational and commercial terms. If this diagnostic thinking resonates, the contact page provides a route to explore whether a deeper engagement would be appropriate.</p>";

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
