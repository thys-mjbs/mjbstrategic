document.addEventListener("DOMContentLoaded", function () {
  const calculateButton = document.getElementById("calculateButton");
  const shareButton = document.getElementById("shareWhatsAppButton");
  const resultContainer = document.getElementById("result");

  const avgPriceInput = document.getElementById("avgPrice");
  const unitCostInput = document.getElementById("unitCost");
  const discountPctInput = document.getElementById("discountPct");
  const volumeGrowthPctInput = document.getElementById("volumeGrowthPct");

  function showError(message) {
    resultContainer.innerHTML = "<p style='color:#b91c1c;font-weight:600'>" + message + "</p>";
  }

  function formatMoney(value) {
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatPct(value) {
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
  }

  function runDiagnostic() {
    const avgPrice = Number(avgPriceInput.value);
    const unitCost = Number(unitCostInput.value);
    const discountPct = Number(discountPctInput.value);
    const volumeGrowthPct = Number(volumeGrowthPctInput.value);

    const hasValidInputs =
      Number.isFinite(avgPrice) &&
      Number.isFinite(unitCost) &&
      Number.isFinite(discountPct) &&
      Number.isFinite(volumeGrowthPct) &&
      avgPrice > 0 &&
      unitCost >= 0 &&
      discountPct >= 0 &&
      discountPct < 100 &&
      volumeGrowthPct > -100;

    const completedCount = hasValidInputs ? 1 : 0;

    if (completedCount === 0) {
      showError("Enter valid values for price, cost, discount, and volume growth.");
      return;
    }

    const originalUnitMargin = avgPrice - unitCost;
    const discountedPrice = avgPrice * (1 - discountPct / 100);
    const discountedUnitMargin = discountedPrice - unitCost;

    const volumeFactor = 1 + volumeGrowthPct / 100;

    const baselineTotalMarginIndex = originalUnitMargin * 1;
    const newTotalMarginIndex = discountedUnitMargin * volumeFactor;

    const absoluteChange = newTotalMarginIndex - baselineTotalMarginIndex;

    let percentChange = null;
    if (originalUnitMargin !== 0) {
      percentChange = (absoluteChange / Math.abs(originalUnitMargin)) * 100;
    }

    let breakEvenVolumeGrowthPct = null;
    if (discountedUnitMargin > 0) {
      const breakEvenFactor = originalUnitMargin / discountedUnitMargin;
      breakEvenVolumeGrowthPct = (breakEvenFactor - 1) * 100;
    }

    const marginStatus =
      newTotalMarginIndex > baselineTotalMarginIndex
        ? "profit leverage"
        : newTotalMarginIndex < baselineTotalMarginIndex
        ? "margin dilution"
        : "neutral effect";

    const guardrails = [];
    if (originalUnitMargin <= 0) {
      guardrails.push(
        "Baseline unit margin is not positive at the stated price and cost, so growth cannot rescue profitability without structural change."
      );
    }
    if (discountedUnitMargin <= 0) {
      guardrails.push(
        "After discounting, unit margin is not positive, meaning each additional unit adds workload without contributing profit."
      );
    }

    let diagnosticSummary = "";
    if (marginStatus === "profit leverage") {
      diagnosticSummary =
        "At the stated discount and volume change, the business is generating more total gross profit per baseline unit volume. This indicates that increased activity is more than offsetting the unit margin loss created by discounting.";
    } else if (marginStatus === "margin dilution") {
      diagnosticSummary =
        "At the stated discount and volume change, the business is generating less total gross profit per baseline unit volume. This indicates that sales growth is being bought with unit margin and the volume increase is not compensating for the price concession.";
    } else {
      diagnosticSummary =
        "At the stated discount and volume change, the business is generating approximately the same total gross profit per baseline unit volume. This indicates that the volume increase is only just offsetting the unit margin loss created by discounting.";
    }

    const operationalInterpretation =
      "Operationally this shows how pricing decisions cascade into workload, supplier spend, and delivery capacity. When unit margin shrinks, more orders are required to produce the same profit, which increases operational strain and can reduce pricing power over time.";

    let riskObservation = "";
    if (discountedUnitMargin <= 0) {
      riskObservation =
        "The structural risk is severe because discounting has removed positive unit economics. This pattern typically leads to cash pressure, reactive cost cutting, and a dependence on continuous volume increases to mask weak margin structure.";
    } else if (breakEvenVolumeGrowthPct !== null && breakEvenVolumeGrowthPct > volumeGrowthPct + 0.0001) {
      riskObservation =
        "The structural risk is that discounting is setting a higher volume threshold to hold profit flat. If demand softens or capacity bottlenecks appear, total profit can fall quickly even if revenue remains stable.";
    } else if (breakEvenVolumeGrowthPct !== null && breakEvenVolumeGrowthPct <= 0) {
      riskObservation =
        "The structure is relatively resilient at these inputs because the post-discount unit margin remains strong enough that small volume changes do not destabilize profit. The main risk shifts to whether discounting becomes habitual and erodes future price discipline.";
    } else {
      riskObservation =
        "The structural risk is that the business may be training customers to expect concessions, which reduces future pricing room. Over time, supplier cost increases and operating overhead can absorb what appears to be growth on the surface.";
    }

    const questions = [];
    questions.push(
      "What discount levels trigger a break-even volume requirement that exceeds our realistic capacity?"
    );
    questions.push(
      "Which costs are truly variable per unit, and which rise stepwise with higher volume?"
    );
    questions.push(
      "Are we using discounting to compensate for a weak value proposition or slow sales process?"
    );

    let managementQuestionsHtml = "<ul style='margin:10px 0 0 18px'>";
    for (let i = 0; i < questions.length; i += 1) {
      managementQuestionsHtml += "<li>" + questions[i] + "</li>";
    }
    managementQuestionsHtml += "</ul>";

    let mechanicsBlock = "";
    mechanicsBlock += "<p><strong>Key Mechanics</strong></p>";
    mechanicsBlock +=
      "<p>Baseline unit margin: " +
      formatMoney(originalUnitMargin) +
      " per unit at the stated price and cost.</p>";
    mechanicsBlock +=
      "<p>Post-discount unit margin: " +
      formatMoney(discountedUnitMargin) +
      " per unit after applying the stated discount.</p>";
    mechanicsBlock +=
      "<p>Volume factor applied: " +
      formatPct(volumeGrowthPct) +
      " change in units sold relative to baseline.</p>";
    mechanicsBlock +=
      "<p>Indexed total margin impact: baseline " +
      formatMoney(baselineTotalMarginIndex) +
      " versus post-change " +
      formatMoney(newTotalMarginIndex) +
      " per baseline unit volume.</p>";

    if (percentChange !== null) {
      mechanicsBlock +=
        "<p>Indexed profit change: " +
        formatMoney(absoluteChange) +
        " (" +
        formatPct(percentChange) +
        ") relative to baseline.</p>";
    }

    if (breakEvenVolumeGrowthPct !== null && Number.isFinite(breakEvenVolumeGrowthPct)) {
      mechanicsBlock +=
        "<p>Break-even volume growth needed to hold profit flat: " +
        formatPct(breakEvenVolumeGrowthPct) +
        " at this discount.</p>";
    } else {
      mechanicsBlock +=
        "<p>Break-even volume growth cannot be computed because post-discount unit margin is not positive.</p>";
    }

    let guardrailHtml = "";
    if (guardrails.length > 0) {
      guardrailHtml += "<p><strong>Guardrails</strong></p>";
      for (let g = 0; g < guardrails.length; g += 1) {
        guardrailHtml += "<p>" + guardrails[g] + "</p>";
      }
    }

    const selectiveEngagement =
      "This calculator evaluates one narrow dimension of business structure by isolating the interaction between discounting and volume on unit margin and total profit. Broader diagnostic work performed by MJB Strategic tests how profit drivers, cost structure, capital deployment, cash flow timing, revenue concentration, supplier dynamics, and forward operating scenarios interact under realistic operating conditions. That type of analysis requires structured financial data, careful modelling, and detailed operational context to avoid false conclusions. Only a limited number of businesses are worked with at any given time because the work demands direct operational understanding and disciplined analysis. If the thinking behind this diagnostic resonates with how you view your business, use the Contact page to get in touch and request a quote for a deeper structural diagnostic review.";

    const reportHtml =
      "<p><strong>Diagnostic Summary</strong></p>" +
      "<p>" +
      diagnosticSummary +
      "</p>" +
      mechanicsBlock +
      "<p><strong>Operational Interpretation</strong></p>" +
      "<p>" +
      operationalInterpretation +
      "</p>" +
      "<p><strong>Structural Risk Observation</strong></p>" +
      "<p>" +
      riskObservation +
      "</p>" +
      guardrailHtml +
      "<p><strong>Management Questions</strong></p>" +
      "<p>Use the result to pressure test how growth is being generated and what it costs structurally.</p>" +
      managementQuestionsHtml +
      "<p>" +
      selectiveEngagement +
      "</p>";

    resultContainer.innerHTML = reportHtml;
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