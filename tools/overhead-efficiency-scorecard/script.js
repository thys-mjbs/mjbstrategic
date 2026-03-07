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

  ["annualRevenue","overheadCosts","rentAndFacilities","staffOverhead","priorYearRevenue","priorYearOverhead"].forEach(attachNumFormat);

  function runDiagnostic() {

    resultContainer.innerHTML = "";

    /* INPUT COLLECTION */

    const annualRevenue = parseNum(document.getElementById("annualRevenue").value);
    const grossMarginPct = Number(document.getElementById("grossMarginPct").value);
    const overheadCosts = parseNum(document.getElementById("overheadCosts").value);
    const headcount = Number(document.getElementById("headcount").value);
    const rentAndFacilities = parseNum(document.getElementById("rentAndFacilities").value);
    const staffOverhead = parseNum(document.getElementById("staffOverhead").value);
    const targetOverheadPct = Number(document.getElementById("targetOverheadPct").value);
    const priorYearRevenue = parseNum(document.getElementById("priorYearRevenue").value);
    const priorYearOverhead = parseNum(document.getElementById("priorYearOverhead").value);

    /* VALIDATION */

    if (!annualRevenue || annualRevenue <= 0) {
      showError("Enter a valid annual revenue figure.");
      return;
    }
    if (isNaN(grossMarginPct) || grossMarginPct <= 0 || grossMarginPct >= 100) {
      showError("Enter a gross margin percentage between 1 and 99.");
      return;
    }
    if (!overheadCosts || overheadCosts <= 0) {
      showError("Enter a valid overhead costs figure.");
      return;
    }
    if (!headcount || headcount <= 0) {
      showError("Enter a valid headcount.");
      return;
    }
    if (!rentAndFacilities || rentAndFacilities < 0) {
      showError("Enter a valid rent and facilities figure.");
      return;
    }
    if (!staffOverhead || staffOverhead <= 0) {
      showError("Enter a valid staff overhead figure.");
      return;
    }

    /* BASELINE CALCULATION */

    const grossMarginDecimal = grossMarginPct / 100;
    const grossProfit = annualRevenue * grossMarginDecimal;
    const overheadRatioPct = (overheadCosts / annualRevenue) * 100;
    const overheadAbsorptionOfGP = (overheadCosts / grossProfit) * 100;
    const operatingProfit = grossProfit - overheadCosts;
    const revenuePerEmployee = annualRevenue / headcount;
    const overheadPerEmployee = overheadCosts / headcount;
    const otherOverhead = overheadCosts - rentAndFacilities - staffOverhead;

    /* SCENARIO CALCULATION */

    let scenarioOverhead = overheadCosts;
    let scenarioNote = "";

    if (targetOverheadPct > 0 && targetOverheadPct < overheadRatioPct) {
      scenarioOverhead = annualRevenue * (targetOverheadPct / 100);
      const overheadSaving = overheadCosts - scenarioOverhead;
      const scenarioOperatingProfit = grossProfit - scenarioOverhead;
      scenarioNote =
        "If overhead were reduced to the target ratio of " + targetOverheadPct +
        "%, total overhead would fall from " + formatNumber(overheadCosts) +
        " to " + formatNumber(scenarioOverhead) +
        ", a reduction of " + formatNumber(overheadSaving) +
        ". Operating profit would rise from " + formatNumber(operatingProfit) +
        " to " + formatNumber(scenarioOperatingProfit) + ".";
    } else {
      const reducedOverhead = overheadCosts * 0.9;
      const overheadSaving = overheadCosts - reducedOverhead;
      const scenarioOperatingProfit = grossProfit - reducedOverhead;
      scenarioNote =
        "A 10% reduction in overhead from the current base would reduce overhead costs by " +
        formatNumber(overheadSaving) +
        ", lifting operating profit from " + formatNumber(operatingProfit) +
        " to " + formatNumber(scenarioOperatingProfit) + ".";
    }

    /* SENSITIVITY CALCULATION */

    const sensitivityImpact = annualRevenue * 0.01;

    /* YEAR ON YEAR COMPARISON */

    let yoyNote = "";
    if (priorYearRevenue > 0 && priorYearOverhead > 0) {
      const priorOverheadRatio = (priorYearOverhead / priorYearRevenue) * 100;
      const overheadRatioChange = overheadRatioPct - priorOverheadRatio;
      const direction = overheadRatioChange > 0 ? "increased" : "decreased";
      yoyNote =
        "Year-on-year, overhead as a share of revenue has " + direction +
        " by " + Math.abs(Math.round(overheadRatioChange * 10) / 10) +
        " percentage points, from " + Math.round(priorOverheadRatio * 10) / 10 +
        "% to " + Math.round(overheadRatioPct * 10) / 10 + "%.";
    }

    /* REPORT TEXT VARIABLES */

    const grossProfitFormatted = formatNumber(grossProfit);
    const overheadCostsFormatted = formatNumber(overheadCosts);
    const operatingProfitFormatted = formatNumber(operatingProfit);
    const overheadRatioRounded = Math.round(overheadRatioPct * 10) / 10;
    const overheadAbsorptionRounded = Math.round(overheadAbsorptionOfGP * 10) / 10;
    const revenuePerEmployeeFormatted = formatNumber(revenuePerEmployee);
    const overheadPerEmployeeFormatted = formatNumber(overheadPerEmployee);
    const sensitivityFormatted = formatNumber(sensitivityImpact);

    let overheadBand = "";
    if (overheadRatioPct < 15) {
      overheadBand = "lean (below 15%)";
    } else if (overheadRatioPct < 25) {
      overheadBand = "moderate (15–25%)";
    } else if (overheadRatioPct < 35) {
      overheadBand = "elevated (25–35%)";
    } else {
      overheadBand = "high (above 35%)";
    }

    /* REPORT RENDER */

    const report =
      "<p><strong>Diagnostic Summary</strong></p>" +
      "<p>Annual revenue of " + formatNumber(annualRevenue) +
      " generates gross profit of " + grossProfitFormatted +
      " at a " + grossMarginPct +
      "% margin. Total overhead of " + overheadCostsFormatted +
      " represents " + overheadRatioRounded +
      "% of revenue and absorbs " + overheadAbsorptionRounded +
      "% of gross profit, leaving operating profit of " + operatingProfitFormatted +
      ". The current overhead intensity is " + overheadBand + ".</p>" +

      "<p><strong>Key Mechanics</strong></p>" +
      "<table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>" +
      "<tr><td>Revenue per employee</td><td>" + revenuePerEmployeeFormatted + "</td></tr>" +
      "<tr><td>Overhead per employee</td><td>" + overheadPerEmployeeFormatted + "</td></tr>" +
      "<tr><td>Staff overhead share</td><td>" + Math.round((staffOverhead / overheadCosts) * 100) + "%</td></tr>" +
      "<tr><td>Facilities overhead share</td><td>" + Math.round((rentAndFacilities / overheadCosts) * 100) + "%</td></tr>" +
      "<tr><td>Other overhead share</td><td>" + Math.round((otherOverhead / overheadCosts) * 100) + "%</td></tr>" +
      "</tbody></table>" +
      "<p>" + scenarioNote + (yoyNote ? " " + yoyNote : "") +
      " A 1% reduction in overhead intensity frees approximately " + sensitivityFormatted +
      " in operating capacity relative to the current revenue base.</p>" +

      "<p><strong>Operational Interpretation</strong></p>" +
      "<p>Each employee generates " + revenuePerEmployeeFormatted +
      " in annual revenue against an overhead cost of " + overheadPerEmployeeFormatted +
      " per head. Staff and facilities together represent " +
      Math.round(((staffOverhead + rentAndFacilities) / overheadCosts) * 100) +
      "% of total overhead, which are the least flexible cost categories. Overhead absorbing " +
      overheadAbsorptionRounded +
      "% of gross profit indicates that " + (overheadAbsorptionRounded > 70 ? "a significant proportion" : "a portion") +
      " of margin is consumed before any operational surplus is reached.</p>" +

      "<p><strong>Structural Risk Observation</strong></p>" +
      "<p>When overhead intensity is " + overheadBand +
      ", the operating profit margin is disproportionately sensitive to revenue fluctuation. A 10% revenue decline would reduce gross profit by approximately " +
      formatNumber(grossProfit * 0.1) +
      " while overhead remains largely fixed, compressing operating profit by the same amount. At current overhead levels, break-even revenue sits at approximately " +
      formatNumber(overheadCosts / grossMarginDecimal) + ".</p>" +

      "<p><strong>Management Questions</strong></p>" +
      "<p>Which overhead categories have grown faster than revenue over the past two years, and what structural commitments would need to change to reverse that?</p>" +
      "<p>If revenue declined 15% from current levels, which overhead items could be reduced within 60 days and by how much?</p>" +
      "<p>Does the current revenue per employee figure reflect a capacity utilisation problem, a pricing problem, or a mix issue inside the workforce?</p>" +

      "<p><strong>Selective Engagement Note</strong></p>" +
      "<p>This calculator evaluates only one narrow dimension of business structure: the relationship between overhead cost and revenue generation. Deeper diagnostic work examines how overhead absorption interacts with margin concentration, pricing power, capacity utilisation, capital deployment, and cash conversion timing. MJB Strategic works with a limited number of businesses at any time because meaningful overhead analysis requires understanding the operational logic behind each cost category. If this type of structural diagnostic resonates, the contact page provides a route to explore whether a deeper engagement would be appropriate.</p>";

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
