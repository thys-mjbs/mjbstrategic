document.addEventListener("DOMContentLoaded", function () {
  const calculateButton = document.getElementById("calculateButton");
  const shareButton = document.getElementById("shareWhatsAppButton");
  const resultContainer = document.getElementById("result");

  function showError(message) {
    resultContainer.innerHTML = "<p style='color:#b91c1c;font-weight:600'>" + message + "</p>";
  }

  function formatMoney(value) {
    if (!isFinite(value)) {
      return "n/a";
    }
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatPct(value) {
    if (!isFinite(value)) {
      return "n/a";
    }
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
  }

  function runDiagnostic() {
    const avgPrice = Number(document.getElementById("avgPrice").value);
    const unitCost = Number(document.getElementById("unitCost").value);
    const discountPct = Number(document.getElementById("discountPct").value);
    const volumeGrowthPct = Number(document.getElementById("volumeGrowthPct").value);
    const baselineUnitsRaw = document.getElementById("baselineUnits").value;

    if (!isFinite(avgPrice) || avgPrice <= 0) {
      showError("Enter a valid average selling price greater than zero.");
      return;
    }

    if (!isFinite(unitCost) || unitCost < 0) {
      showError("Enter a valid direct cost per unit that is zero or higher.");
      return;
    }

    if (!isFinite(discountPct) || discountPct < 0 || discountPct >= 100) {
      showError("Enter a valid discount percentage between 0 and 99.99.");
      return;
    }

    if (!isFinite(volumeGrowthPct) || volumeGrowthPct < 0) {
      showError("Enter a valid sales volume growth percentage that is zero or higher.");
      return;
    }

    const baselineUnits = baselineUnitsRaw ? Number(baselineUnitsRaw) : 1000;

    if (!isFinite(baselineUnits) || baselineUnits <= 0) {
      showError("Baseline units must be a whole number greater than zero.");
      return;
    }

    const completedCount = 1;

    const discountRate = discountPct / 100;
    const growthRate = volumeGrowthPct / 100;

    const originalPrice = avgPrice;
    const discountedPrice = avgPrice * (1 - discountRate);

    const originalUnitMargin = originalPrice - unitCost;
    const discountedUnitMargin = discountedPrice - unitCost;

    const originalUnitMarginPct = originalPrice === 0 ? 0 : (originalUnitMargin / originalPrice) * 100;
    const discountedUnitMarginPct = discountedPrice === 0 ? 0 : (discountedUnitMargin / discountedPrice) * 100;

    const originalUnits = baselineUnits;
    const newUnits = baselineUnits * (1 + growthRate);

    const originalTotalGrossProfit = originalUnitMargin * originalUnits;
    const discountedTotalGrossProfit = discountedUnitMargin * newUnits;

    const grossProfitDelta = discountedTotalGrossProfit - originalTotalGrossProfit;

    const originalRevenue = originalPrice * originalUnits;
    const discountedRevenue = discountedPrice * newUnits;

    const revenueDelta = discountedRevenue - originalRevenue;

    const profitLeverageRatio =
      originalTotalGrossProfit === 0 ? NaN : (discountedTotalGrossProfit / originalTotalGrossProfit - 1) * 100;

    const marginDilutionPctPoints = discountedUnitMarginPct - originalUnitMarginPct;

    let outcomeLabel = "";
    let outcomeDetail = "";
    let riskDetail = "";
    let interpretationDetail = "";
    let questions = [];

    const isOriginalMarginNegative = originalUnitMargin < 0;
    const isDiscountedMarginNegative = discountedUnitMargin < 0;

    if (isOriginalMarginNegative && isDiscountedMarginNegative) {
      outcomeLabel = "Loss-making unit economics remain loss-making after discounting.";
      outcomeDetail =
        "Both the original price and the discounted price sit below direct cost, so growth increases the total loss pool.";
      interpretationDetail =
        "Operationally this is usually a pricing architecture problem, a cost structure problem, or both. Volume growth under negative unit margins creates the appearance of momentum while capital and cash are consumed more quickly.";
      riskDetail =
        "The structural risk is that sales activity accelerates a loss mechanism. If credit terms are offered to win volume, cash pressure and bad debt exposure typically rise at the same time.";
      questions = [
        "Which direct cost components must change for unit margins to become positive?",
        "What pricing rules prevent sales from closing below direct cost?",
        "If volume continues to grow, how will cash and working capital absorb the loss?"
      ];
    } else if (!isOriginalMarginNegative && isDiscountedMarginNegative) {
      outcomeLabel = "Discounting flips unit margins from positive to negative.";
      outcomeDetail =
        "The discount is large enough that the discounted selling price drops below direct cost, which converts growth into losses.";
      interpretationDetail =
        "Operationally this often happens when discounting is treated as a sales lever rather than a structured pricing decision. Any additional volume won under these terms weakens profitability even if revenue rises.";
      riskDetail =
        "The structural risk is hidden margin compression that only becomes visible when cash tightens. This pattern can also distort sales incentives by rewarding volume while the profit engine deteriorates.";
      questions = [
        "What discount limits should exist to prevent selling below direct cost?",
        "Which customers or channels require discounting, and why?",
        "What would profitability look like if volume fell back to baseline?"
      ];
    } else {
      if (grossProfitDelta > 0 && marginDilutionPctPoints < 0) {
        outcomeLabel = "Gross profit increases, but unit margin is diluted by discounting.";
        outcomeDetail =
          "Total gross profit rises because additional volume offsets a lower margin per unit. The profit engine strengthens in absolute terms, but at a reduced margin quality.";
        interpretationDetail =
          "Operationally this can be acceptable when incremental volume is genuinely cheaper to serve or creates durable capacity utilization benefits. It becomes dangerous when discounting becomes habitual and the business trains customers to expect lower prices.";
        riskDetail =
          "The structural risk is dependency on continued volume growth to protect the gross profit pool. If growth slows, the business can be left with permanently lower pricing and weaker margin resilience.";
        questions = [
          "Which parts of the operating model get cheaper at higher volume, and by how much?",
          "If growth slows, do current prices still protect the gross profit pool?",
          "Are discount approvals linked to measurable margin trade-offs and payback?"
        ];
      } else if (grossProfitDelta > 0 && marginDilutionPctPoints >= 0) {
        outcomeLabel = "Gross profit increases without unit margin dilution.";
        outcomeDetail =
          "The discount does not materially degrade margin quality relative to the revenue base, and volume growth expands the gross profit pool.";
        interpretationDetail =
          "Operationally this is closer to profit leverage than margin dilution. The sales approach is increasing activity while still protecting the unit economics that fund overhead, reinvestment, and cash generation.";
        riskDetail =
          "The structural risk is lower than in a dilution pattern, but governance still matters. If discounting becomes the default route to growth, margin outcomes can drift without being noticed until profitability declines.";
        questions = [
          "What discount rules are currently protecting unit margins while growth increases?",
          "Which customer segments receive discounts, and what is the operational rationale?",
          "How often are unit margins reviewed against cost movements and supplier price changes?"
        ];
      } else if (grossProfitDelta === 0) {
        outcomeLabel = "Gross profit is broadly flat after discounting and growth.";
        outcomeDetail =
          "The additional volume does not translate into more gross profit because the discount gives back the profit that volume should have created.";
        interpretationDetail =
          "Operationally this usually indicates that the business is working harder for the same profit outcome. It often shows up as busier teams, higher throughput, and more operational complexity without a stronger gross profit pool.";
        riskDetail =
          "The structural risk is operating strain and hidden cost creep. If overhead rises to support higher volume, net profit can decline even when gross profit appears stable.";
        questions = [
          "Which discounts are being used most frequently, and what drives them?",
          "Are we measuring sales performance on revenue, volume, or gross profit contribution?",
          "What operational bottlenecks are created when volume rises without profit lift?"
        ];
      } else {
        outcomeLabel = "Margin dilution: growth reduces total gross profit.";
        outcomeDetail =
          "The discounting approach gives away more margin than the additional volume recovers, so total gross profit declines despite growth.";
        interpretationDetail =
          "Operationally this is a classic trap where revenue and units become the headline metric while the profit pool erodes. The business can look healthier in sales reports while becoming weaker in actual profitability.";
        riskDetail =
          "The structural risk is that the company becomes dependent on discounting to maintain volume, which reduces pricing power and increases vulnerability to supplier cost changes. This pattern often shows up alongside cash pressure because the business needs more activity to generate the same profit.";
        questions = [
          "What is the maximum discount we can offer without reducing total gross profit?",
          "Which customers are price-sensitive versus value-sensitive in practice?",
          "If supplier costs rise, how quickly can prices be reset without losing volume?"
        ];
      }
    }

    let summaryParagraph = "";
    let interpretationParagraph = "";
    let riskParagraph = "";
    let questionsHtml = "";

    if (completedCount === 1) {
      summaryParagraph =
        "This diagnostic compares gross profit at the original price level versus gross profit after discounting and volume growth. " +
        "It isolates whether the profit engine strengthens through growth or whether margin per unit is being traded away faster than volume can replace it.";

      interpretationParagraph =
        "The key operational mechanism is the interaction between selling price discipline and unit cost. " +
        "When discounting becomes the primary method for winning volume, management must confirm whether the incremental activity is producing additional gross profit or simply increasing operational load.";

      riskParagraph =
        "The structural risk is that growth targets can be achieved while profitability weakens. " +
        "When pricing power is eroded through routine discounts, the business becomes more exposed to cost increases and may require higher throughput just to stand still.";
    } else if (completedCount === 2) {
      summaryParagraph =
        "This diagnostic compares both scenarios together: the original unit economics and the discounted growth scenario. " +
        "It shows whether the combined effect of discounting and higher volume expands the gross profit pool or compresses it.";

      interpretationParagraph =
        "Operationally the comparison highlights whether sales growth is profit-led or concession-led. " +
        "If gross profit only increases when volume rises sharply, the business may be compensating for weakened pricing rather than improving its profit mechanism.";

      riskParagraph =
        "The structural risk is that the business can become locked into discounting to maintain sales momentum. " +
        "If volume slows or costs rise, the profit pool can contract quickly because pricing has already been given away.";
    } else {
      summaryParagraph =
        "This diagnostic evaluates multiple moving parts: the original unit economics, the discounted price level, and the volume growth effect. " +
        "It shows the leading driver of the outcome, whether that is volume leverage or margin dilution.";

      interpretationParagraph =
        "Operationally the result helps explain how pricing decisions interact with delivery cost and sales incentives. " +
        "When discounting is used broadly, it shifts management attention toward throughput and away from margin protection and cost control.";

      riskParagraph =
        "The structural risk is dependency on continued growth to protect profitability. " +
        "If discounting becomes embedded in the customer relationship, the business can lose pricing power and become more vulnerable to supplier and cost shocks.";
    }

    const questionItems = questions
      .map(function (q) {
        return "<li style='margin:6px 0'>" + q + "</li>";
      })
      .join("");

    questionsHtml =
      "<ul style='margin:10px 0 0 18px;padding:0'>" +
      questionItems +
      "</ul>";

    const detailsTable =
      "<div style='margin-top:12px;padding:12px 12px;border:1px solid #d1d5db;border-radius:10px;background:#ffffff'>" +
        "<div style='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;align-items:start'>" +
          "<div>" +
            "<p style='margin:0;font-weight:700'>Original price scenario</p>" +
            "<p style='margin:6px 0 0 0'>Price per unit: <strong>" + formatMoney(originalPrice) + "</strong></p>" +
            "<p style='margin:4px 0 0 0'>Unit margin: <strong>" + formatMoney(originalUnitMargin) + "</strong> (" + formatPct(originalUnitMarginPct) + ")</p>" +
            "<p style='margin:4px 0 0 0'>Baseline units: <strong>" + Math.round(originalUnits).toLocaleString() + "</strong></p>" +
            "<p style='margin:4px 0 0 0'>Revenue: <strong>" + formatMoney(originalRevenue) + "</strong></p>" +
            "<p style='margin:4px 0 0 0'>Total gross profit: <strong>" + formatMoney(originalTotalGrossProfit) + "</strong></p>" +
          "</div>" +
          "<div>" +
            "<p style='margin:0;font-weight:700'>Discounted growth scenario</p>" +
            "<p style='margin:6px 0 0 0'>Discounted price: <strong>" + formatMoney(discountedPrice) + "</strong></p>" +
            "<p style='margin:4px 0 0 0'>Unit margin: <strong>" + formatMoney(discountedUnitMargin) + "</strong> (" + formatPct(discountedUnitMarginPct) + ")</p>" +
            "<p style='margin:4px 0 0 0'>New units: <strong>" + Math.round(newUnits).toLocaleString() + "</strong></p>" +
            "<p style='margin:4px 0 0 0'>Revenue: <strong>" + formatMoney(discountedRevenue) + "</strong></p>" +
            "<p style='margin:4px 0 0 0'>Total gross profit: <strong>" + formatMoney(discountedTotalGrossProfit) + "</strong></p>" +
          "</div>" +
        "</div>" +
        "<div style='margin-top:10px;padding-top:10px;border-top:1px solid #e5e7eb'>" +
          "<p style='margin:0'>Change in total gross profit: <strong>" + formatMoney(grossProfitDelta) + "</strong></p>" +
          "<p style='margin:4px 0 0 0'>Change in revenue: <strong>" + formatMoney(revenueDelta) + "</strong></p>" +
          "<p style='margin:4px 0 0 0'>Unit margin change (percentage points): <strong>" + formatMoney(marginDilutionPctPoints) + "</strong></p>" +
          "<p style='margin:4px 0 0 0'>Gross profit leverage versus baseline: <strong>" + formatPct(profitLeverageRatio) + "</strong></p>" +
        "</div>" +
      "</div>";

    const reportHtml =
      "<div style='margin-top:10px'>" +
        "<p style='margin:0 0 10px 0;font-weight:800;font-size:16px'>" + outcomeLabel + "</p>" +
        "<p style='margin:0 0 12px 0'>" + outcomeDetail + "</p>" +

        detailsTable +

        "<h3 style='margin:16px 0 6px 0'>Diagnostic Summary</h3>" +
        "<p style='margin:0 0 10px 0'>" + summaryParagraph + "</p>" +

        "<h3 style='margin:14px 0 6px 0'>Operational Interpretation</h3>" +
        "<p style='margin:0 0 10px 0'>" + interpretationParagraph + "</p>" +
        "<p style='margin:0 0 10px 0'>" + interpretationDetail + "</p>" +

        "<h3 style='margin:14px 0 6px 0'>Structural Risk Observation</h3>" +
        "<p style='margin:0 0 10px 0'>" + riskParagraph + "</p>" +
        "<p style='margin:0 0 10px 0'>" + riskDetail + "</p>" +

        "<h3 style='margin:14px 0 6px 0'>Management Questions</h3>" +
        "<p style='margin:0 0 6px 0'>Use the result to pressure-test pricing discipline and growth assumptions.</p>" +
        questionsHtml +

        "<h3 style='margin:16px 0 6px 0'>Selective engagement note</h3>" +
        "<p style='margin:0'>" +
          "This calculator evaluates one narrow dimension of business structure: whether discount-driven volume growth is strengthening or weakening the gross profit mechanism. " +
          "Broader diagnostic work performed by MJB Strategic examines the interaction between profit drivers, cost structure, capital deployment, cash flow timing, revenue concentration, supplier dynamics, and forward operating scenarios. " +
          "That type of analysis requires structured financial data and careful modelling, because the operational reality sits in the links between pricing, delivery cost, working capital, and capacity constraints. " +
          "Only a limited number of businesses are worked with at any given time because the analysis requires detailed operational understanding. " +
          "If the thinking behind this diagnostic resonates with how you view your business, use the Contact page to get in touch and request a quote for a deeper structural diagnostic review." +
        "</p>" +
      "</div>";

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