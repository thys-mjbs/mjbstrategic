document.addEventListener("DOMContentLoaded", function () {

  const calculateButton = document.getElementById("calculateButton");
  const shareButton = document.getElementById("shareWhatsAppButton");
  const resultContainer = document.getElementById("result");

  function showError(message) {
    resultContainer.innerHTML = "<p style='color:#b91c1c;font-weight:600'>" + message + "</p>";
  }

  function runDiagnostic() {

    const price = parseFloat(document.getElementById("price").value);
    const cost = parseFloat(document.getElementById("cost").value);
    const discount = parseFloat(document.getElementById("discount").value);
    const growth = parseFloat(document.getElementById("growth").value);

    if (isNaN(price) || isNaN(cost) || isNaN(discount) || isNaN(growth)) {
      showError("Please complete all required inputs before running the diagnostic.");
      return;
    }

    if (price <= 0 || cost < 0) {
      showError("Selling price and cost must be valid positive numbers.");
      return;
    }

    const discountRate = discount / 100;
    const growthRate = growth / 100;

    const originalMarginPerUnit = price - cost;
    const discountedPrice = price * (1 - discountRate);
    const discountedMarginPerUnit = discountedPrice - cost;

    const baselineVolume = 1;
    const newVolume = baselineVolume * (1 + growthRate);

    const baselineProfit = originalMarginPerUnit * baselineVolume;
    const newProfit = discountedMarginPerUnit * newVolume;

    const profitChange = newProfit - baselineProfit;
    const marginChangePercent = ((discountedMarginPerUnit - originalMarginPerUnit) / originalMarginPerUnit) * 100;

    let diagnosticSummary = "";
    let operationalInterpretation = "";
    let structuralRisk = "";
    let managementQuestions = "";

    diagnosticSummary += "<h3>Diagnostic Summary</h3>";

    if (newProfit > baselineProfit) {
      diagnosticSummary += "<p>";
      diagnosticSummary += "The comparison indicates that the additional sales volume generated through discounting still produces more profit than the original pricing structure. Although margin per unit declines due to the discount, the increase in units sold compensates for that reduction. In this scenario the business is gaining profit leverage from higher sales volume despite lower pricing.";
      diagnosticSummary += "</p>";
    } else if (newProfit < baselineProfit) {
      diagnosticSummary += "<p>";
      diagnosticSummary += "The comparison indicates that the increase in sales volume does not offset the margin lost through discounting. Even though revenue may appear to be expanding, the profit produced by those sales is lower than the profit generated at the original price level. This pattern suggests margin dilution rather than genuine profit growth.";
      diagnosticSummary += "</p>";
    } else {
      diagnosticSummary += "<p>";
      diagnosticSummary += "The calculation indicates that the increase in sales volume almost exactly offsets the reduction in unit margin caused by discounting. In this situation the business is effectively trading margin for volume without materially changing the overall profit generated from the activity.";
      diagnosticSummary += "</p>";
    }

    operationalInterpretation += "<h3>Operational Interpretation</h3>";
    operationalInterpretation += "<p>";
    operationalInterpretation += "Discounting changes the economic structure of each sale by lowering the contribution margin generated per unit. When this reduction is combined with higher sales volume, the overall effect depends on whether additional units can replace the lost margin. Businesses that rely heavily on discounting often experience rising revenue while the economic productivity of each sale declines.";
    operationalInterpretation += "</p>";

    structuralRisk += "<h3>Structural Risk Observation</h3>";

    if (marginChangePercent < 0) {
      structuralRisk += "<p>";
      structuralRisk += "The discount applied reduces margin per unit by approximately " + Math.abs(marginChangePercent).toFixed(2) + "% relative to the original structure. If this pattern becomes embedded in pricing behaviour it can gradually compress profitability across the revenue base. Over time management may observe strong top line growth while underlying profit generation weakens.";
      structuralRisk += "</p>";
    } else {
      structuralRisk += "<p>";
      structuralRisk += "The calculation suggests that pricing remains structurally capable of supporting the additional sales volume. Even with the applied discount the margin structure continues to generate sufficient contribution from each unit sold.";
      structuralRisk += "</p>";
    }

    managementQuestions += "<h3>Management Questions</h3>";
    managementQuestions += "<p>Which operational drivers are pushing the business toward discounting rather than price stability?</p>";
    managementQuestions += "<p>If sales growth slowed, would the current discount structure still support healthy margin?</p>";
    managementQuestions += "<p>How sensitive is overall profit to further discounting required to maintain growth?</p>";

    let engagementNote = "";
    engagementNote += "<p>";
    engagementNote += "This calculator evaluates only one narrow dimension of business structure. In practice the broader diagnostic work performed by MJB Strategic examines the interaction between profit drivers, cost structure, capital deployment, cash flow timing, revenue concentration, supplier dynamics, and forward operating scenarios. That type of analysis requires structured financial data and careful modelling rather than isolated metrics. Only a limited number of businesses are worked with at any given time because developing a clear operational understanding requires detailed examination of the underlying economics of the company. If the thinking behind this diagnostic resonates with how you view your business you are welcome to explore whether there may be scope to work together. Use the Contact page on the website to request a quote for a deeper structural diagnostic review.";
    engagementNote += "</p>";

    resultContainer.innerHTML =
      diagnosticSummary +
      operationalInterpretation +
      structuralRisk +
      managementQuestions +
      engagementNote;

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