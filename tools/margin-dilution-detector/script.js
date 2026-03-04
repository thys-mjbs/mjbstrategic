document.addEventListener("DOMContentLoaded", function () {
  const calculateButton = document.getElementById("calculateButton");
  const shareButton = document.getElementById("shareWhatsAppButton");
  const resultContainer = document.getElementById("result");

  const avgPriceInput = document.getElementById("avgPrice");
  const unitCostInput = document.getElementById("unitCost");
  const discountPctInput = document.getElementById("discountPct");
  const volumeGrowthPctInput = document.getElementById("volumeGrowthPct");
  const baselineUnitsInput = document.getElementById("baselineUnits");
  const fixedCostsInput = document.getElementById("fixedCosts");

  function showError(message) {
    resultContainer.innerHTML = "<p style='color:#b91c1c;font-weight:600'>" + message + "</p>";
  }

  function fmtNumber(value) {
    if (!isFinite(value)) {
      return "0";
    }
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  function fmtPercent(value) {
    if (!isFinite(value)) {
      return "0%";
    }
    return value.toFixed(2) + "%";
  }

  function readNumber(inputEl) {
    const raw = (inputEl && inputEl.value !== undefined) ? String(inputEl.value).trim() : "";
    if (raw === "") {
      return null;
    }
    const n = Number(raw);
    if (!isFinite(n)) {
      return null;
    }
    return n;
  }

  function runDiagnostic() {
    const avgPrice = readNumber(avgPriceInput);
    const unitCost = readNumber(unitCostInput);
    const discountPct = readNumber(discountPctInput);
    const volumeGrowthPct = readNumber(volumeGrowthPctInput);
    const baselineUnits = readNumber(baselineUnitsInput);
    const fixedCosts = readNumber(fixedCostsInput);

    if (avgPrice === null || unitCost === null || discountPct === null || volumeGrowthPct === null) {
      showError("Complete all required inputs before running the diagnostic.");
      return;
    }

    if (avgPrice <= 0) {
      showError("Average selling price must be greater than zero.");
      return;
    }

    if (unitCost < 0) {
      showError("Direct cost per unit cannot be negative.");
      return;
    }

    if (discountPct < 0 || discountPct > 100) {
      showError("Discount percentage must be between 0 and 100.");
      return;
    }

    if (volumeGrowthPct < 0) {
      showError("Sales volume growth must be zero or positive.");
      return;
    }

    const baseUnits = (baselineUnits !== null && baselineUnits > 0) ? baselineUnits : 1;
    const discountFactor = 1 - (discountPct / 100);
    const growthFactor = 1 + (volumeGrowthPct / 100);

    const originalPrice = avgPrice;
    const discountedPrice = avgPrice * discountFactor;

    const originalUnitMargin = originalPrice - unitCost;
    const discountedUnitMargin = discountedPrice - unitCost;

    const originalUnitMarginPct = (originalUnitMargin / originalPrice) * 100;
    const discountedUnitMarginPct = (discountedUnitMargin / discountedPrice) * 100;

    const originalRevenue = originalPrice * baseUnits;
    const discountedRevenue = discountedPrice * baseUnits * growthFactor;

    const originalGrossProfit = originalUnitMargin * baseUnits;
    const discountedGrossProfit = discountedUnitMargin * baseUnits * growthFactor;

    const grossProfitChange = discountedGrossProfit - originalGrossProfit;
    const grossProfitChangePct = (originalGrossProfit !== 0) ? (grossProfitChange / Math.abs(originalGrossProfit)) * 100 : null;

    const requiredGrowthToBreakEven = (originalUnitMargin > 0 && discountedUnitMargin > 0)
      ? (originalUnitMargin / discountedUnitMargin) - 1
      : null;

    const dilutionIndex = (originalUnitMargin !== 0)
      ? discountedUnitMargin / originalUnitMargin
      : null;

    const fixedCostValue = (fixedCosts !== null && fixedCosts >= 0) ? fixedCosts : null;
    const originalContribution = (fixedCostValue !== null) ? (originalGrossProfit - fixedCostValue) : null;
    const discountedContribution = (fixedCostValue !== null) ? (discountedGrossProfit - fixedCostValue) : null;
    const contributionChange = (fixedCostValue !== null) ? (discountedContribution - originalContribution) : null;

    let headline;
    if (discountedUnitMargin < 0 && originalUnitMargin >= 0) {
      headline = "Margin dilution is severe: discounting pushes unit margin below zero.";
    } else if (discountedGrossProfit > originalGrossProfit && discountedUnitMargin < originalUnitMargin) {
      headline = "Growth is increasing total profit, but the margin engine is weaker per unit.";
    } else if (discountedGrossProfit <= originalGrossProfit && discountedUnitMargin < originalUnitMargin) {
      headline = "Margin dilution is dominating: more volume is not producing more profit.";
    } else if (discountedGrossProfit > originalGrossProfit && discountedUnitMargin >= originalUnitMargin) {
      headline = "Profit leverage is strong: volume growth is translating into higher profit without margin damage.";
    } else {
      headline = "The growth and discount mix is not improving profit in a meaningful way.";
    }

    let breakEvenLine;
    if (requiredGrowthToBreakEven === null) {
      if (discountedUnitMargin <= 0) {
        breakEvenLine = "With the current discount level, additional volume does not recover margin because unit economics are non-positive.";
      } else {
        breakEvenLine = "Break-even growth cannot be derived reliably from the current unit margin relationship.";
      }
    } else {
      const bePct = requiredGrowthToBreakEven * 100;
      if (volumeGrowthPct >= bePct) {
        breakEvenLine = "Volume growth exceeds the break-even level needed to offset the discount-driven margin loss.";
      } else {
        breakEvenLine = "Volume growth is below the break-even level needed to offset the discount-driven margin loss.";
      }
    }

    let structureLine;
    if (dilutionIndex === null) {
      structureLine = "The relationship between discounted and original unit margin cannot be evaluated from the current inputs.";
    } else {
      const retained = dilutionIndex * 100;
      if (retained >= 100) {
        structureLine = "Discounting is not reducing unit margin relative to the current direct cost position.";
      } else if (retained >= 75) {
        structureLine = "Discounting retains most unit margin, but reduces headroom for volatility in costs.";
      } else if (retained >= 50) {
        structureLine = "Discounting removes a material portion of unit margin and increases reliance on volume to hold profit.";
      } else {
        structureLine = "Discounting strips most of the unit margin, forcing volume to carry the profit outcome.";
      }
    }

    let riskLine;
    if (discountedUnitMargin < 0) {
      riskLine = "This pricing behaviour converts growth into working effort without profit, increasing cash and capacity risk.";
    } else if (discountedUnitMarginPct < originalUnitMarginPct) {
      riskLine = "Lower margin percentage increases exposure to cost creep, supplier price increases, and service delivery inefficiency.";
    } else {
      riskLine = "The margin percentage is stable, so execution risk is more about capacity and delivery than pricing leakage.";
    }

    let questionsHtml = "";
    const q1 = "What discount level is actually required to win deals, and where is it applied?";
    const q2 = "Which direct cost components move when volume increases, and which do not?";
    let q3;
    if (requiredGrowthToBreakEven !== null) {
      q3 = "Is current volume growth sustainably above the break-even level implied by our discount strategy?";
    } else {
      q3 = "If pricing moved by 1%, how would gross profit change at current volumes?";
    }

    questionsHtml += "<ul style='margin:10px 0 0 18px'>";
    questionsHtml += "<li>" + q1 + "</li>";
    questionsHtml += "<li>" + q2 + "</li>";
    questionsHtml += "<li>" + q3 + "</li>";
    questionsHtml += "</ul>";

    const metricBlock = [
      "<div style='margin-top:12px'>",
      "<p style='margin:0 0 10px 0'><strong>Diagnostic Summary</strong></p>",
      "<p style='margin:0 0 10px 0'>" + headline + "</p>",
      "<p style='margin:0 0 10px 0'>Original unit margin is " + fmtNumber(originalUnitMargin) + " per unit (" + fmtPercent(originalUnitMarginPct) + " of price). Discounted unit margin is " + fmtNumber(discountedUnitMargin) + " per unit (" + fmtPercent(discountedUnitMarginPct) + " of price).</p>",
      "<p style='margin:0 0 10px 0'>At the baseline volume assumption, gross profit moves from " + fmtNumber(originalGrossProfit) + " to " + fmtNumber(discountedGrossProfit) + " when discounting and volume growth are applied.</p>",
      "<p style='margin:0 0 10px 0'>" + breakEvenLine + "</p>",
      "</div>"
    ].join("");

    let changeLine = "";
    if (grossProfitChangePct === null) {
      changeLine = "<p style='margin:0 0 10px 0'>Gross profit change is " + fmtNumber(grossProfitChange) + " in absolute terms under the current assumptions.</p>";
    } else {
      changeLine = "<p style='margin:0 0 10px 0'>Gross profit changes by " + fmtNumber(grossProfitChange) + " (" + fmtPercent(grossProfitChangePct) + ") under the current assumptions.</p>";
    }

    let contributionLine = "";
    if (fixedCostValue !== null) {
      contributionLine = "<p style='margin:0 0 10px 0'>After the fixed cost input, contribution moves from " + fmtNumber(originalContribution) + " to " + fmtNumber(discountedContribution) + ", a change of " + fmtNumber(contributionChange) + ".</p>";
    }

    const interpretationBlock = [
      "<div style='margin-top:12px'>",
      "<p style='margin:0 0 10px 0'><strong>Operational Interpretation</strong></p>",
      "<p style='margin:0 0 10px 0'>" + structureLine + "</p>",
      changeLine,
      contributionLine,
      "<p style='margin:0 0 10px 0'>When discounts become the main sales lever, operational focus often shifts to throughput and deal flow rather than price discipline and cost control.</p>",
      "</div>"
    ].join("");

    const riskBlock = [
      "<div style='margin-top:12px'>",
      "<p style='margin:0 0 10px 0'><strong>Structural Risk Observation</strong></p>",
      "<p style='margin:0 0 10px 0'>" + riskLine + "</p>",
      "<p style='margin:0 0 10px 0'>If discounting is habitual, suppliers and internal teams typically anchor to lower realised pricing, making margin recovery difficult without a deliberate reset.</p>",
      "</div>"
    ].join("");

    const questionsBlock = [
      "<div style='margin-top:12px'>",
      "<p style='margin:0 0 10px 0'><strong>Management Questions</strong></p>",
      "<p style='margin:0 0 10px 0'>Use the questions below to test whether growth is improving the profit structure or masking leakage.</p>",
      questionsHtml,
      "</div>"
    ].join("");

    const selectiveEngagement = [
      "<div style='margin-top:14px'>",
      "<p style='margin:0 0 10px 0'>This calculator evaluates one narrow dimension of business structure by testing whether discounting combined with volume growth strengthens or dilutes margin. The broader diagnostic work performed by MJB Strategic examines the interaction between profit drivers, cost structure, capital deployment, cash flow timing, revenue concentration, supplier dynamics, and forward operating scenarios. That level of analysis requires structured financial data and careful modelling, then validation against how the business actually operates. Only a limited number of businesses are worked with at any given time because the analysis depends on detailed operational understanding. If the thinking behind this diagnostic resonates with how you view your business, you are welcome to explore whether there may be scope to work together. Use the Contact page on the website to get in touch and request a quote for a deeper structural diagnostic review.</p>",
      "</div>"
    ].join("");

    const reportHtml = [
      "<div style='padding:14px 14px 6px 14px;border:1px solid rgba(30,58,95,0.22);border-radius:10px;background:#ffffff'>",
      metricBlock,
      interpretationBlock,
      riskBlock,
      questionsBlock,
      selectiveEngagement,
      "</div>"
    ].join("");

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