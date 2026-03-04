document.addEventListener("DOMContentLoaded", function () {

  const calculateButton = document.getElementById("calculateButton");
  const shareButton = document.getElementById("shareWhatsAppButton");
  const resultContainer = document.getElementById("result");

  function showError(message) {
    resultContainer.innerHTML = "<p style='color:#b91c1c;font-weight:600'>" + message + "</p>";
  }

  function runDiagnostic() {

    const sellingPrice = parseFloat(document.getElementById("sellingPrice").value);
    const directCost = parseFloat(document.getElementById("directCost").value);
    const discountPercent = parseFloat(document.getElementById("discountPercent").value);
    const volumeGrowth = parseFloat(document.getElementById("volumeGrowth").value);

    if (isNaN(sellingPrice) || isNaN(directCost) || isNaN(discountPercent) || isNaN(volumeGrowth)) {
      showError("Please complete all required fields using valid numeric values.");
      return;
    }

    if (sellingPrice <= 0 || directCost < 0) {
      showError("Selling price must be greater than zero and cost cannot be negative.");
      return;
    }

    const discountFactor = discountPercent / 100;
    const growthFactor = volumeGrowth / 100;

    const originalMargin = sellingPrice - directCost;

    const discountedPrice = sellingPrice * (1 - discountFactor);
    const discountedMargin = discountedPrice - directCost;

    const originalProfitIndex = originalMargin;
    const newProfitIndex = discountedMargin * (1 + growthFactor);

    const marginChange = ((discountedMargin - originalMargin) / originalMargin) * 100;

    let summaryText = "";
    let riskText = "";

    if (newProfitIndex > originalProfitIndex) {
      summaryText = "Higher sales volume appears to offset the margin lost through discounting. The profit engine is strengthening modestly under the current pricing structure.";
      riskText = "Even though profit leverage appears positive, sustained discounting can gradually anchor customer expectations at lower price levels.";
    } else if (newProfitIndex === originalProfitIndex) {
      summaryText = "The additional sales volume roughly offsets the margin reduction from discounting. Profit generation remains structurally unchanged.";
      riskText = "Neutral profit impact often masks pricing pressure that may intensify if discounts become standard commercial practice.";
    } else {
      summaryText = "The additional sales volume does not compensate for margin lost through discounting. Growth is likely diluting the profit engine.";
      riskText = "If discounting becomes embedded in sales behaviour, long term margin erosion may occur despite revenue growth.";
    }

    const completedCount = 1;

    let mechanicsText = "The diagnostic compares profit per unit before and after discounting. Original margin equals selling price minus direct cost.";

    mechanicsText += " After discounting the selling price is reduced by the discount percentage, producing a new margin per unit.";

    mechanicsText += " The model then applies the sales volume growth factor to determine whether the higher unit count offsets the reduced margin.";

    let interpretationText = "Pricing strategy directly influences how sales growth translates into profit. When discounts expand faster than operational efficiency improves, revenue may grow while profit generation weakens.";

    interpretationText += " Operators that monitor margin mechanics alongside sales growth typically maintain stronger pricing discipline and clearer cost control.";

    const managementQuestions = [
      "Are sales incentives encouraging discounting that reduces overall margin quality?",
      "What proportion of recent revenue growth has been driven by price reductions?",
      "Would tighter pricing discipline improve profit more than additional sales volume?"
    ];

    let report = "";

    report += "<p><strong>Diagnostic Summary</strong></p>";
    report += "<p>" + summaryText + "</p>";

    report += "<p><strong>Key Mechanics</strong></p>";
    report += "<p>" + mechanicsText + "</p>";

    report += "<p><strong>Operational Interpretation</strong></p>";
    report += "<p>" + interpretationText + "</p>";

    report += "<p><strong>Structural Risk Observation</strong></p>";
    report += "<p>" + riskText + "</p>";

    report += "<p><strong>Management Questions</strong></p>";
    report += "<ul>";
    for (let i = 0; i < managementQuestions.length; i++) {
      report += "<li>" + managementQuestions[i] + "</li>";
    }
    report += "</ul>";

    report += "<p><strong>Selective Engagement Note</strong></p>";
    report += "<p>This calculator evaluates only one narrow dimension of business structure. Deeper diagnostic work examines interactions between profit drivers, cost structure, capital deployment, cash flow timing, revenue concentration, supplier dynamics, and forward operating scenarios.</p>";

    report += "<p>Because meaningful analysis requires detailed operational understanding, only a limited number of businesses are worked with at any given time. If the thinking behind this diagnostic aligns with how you analyse your own business, you are invited to use the Contact page to continue the conversation.</p>";

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