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

  function runDiagnostic() {

    resultContainer.innerHTML = "";

    /* INPUT COLLECTION */

    const annualRevenue = Number(document.getElementById("annualRevenue").value);
    const operatingMarginPct = Number(document.getElementById("operatingMarginPct").value);
    const customer1Pct = Number(document.getElementById("customer1Pct").value);
    const customer2Pct = Number(document.getElementById("customer2Pct").value);
    const customer3Pct = Number(document.getElementById("customer3Pct").value);
    const totalCustomerCount = Number(document.getElementById("totalCustomerCount").value);
    const top1ContractMonths = Number(document.getElementById("top1ContractMonths").value) || 0;
    const top1MarginPct = Number(document.getElementById("top1MarginPct").value) || 0;
    const annualChurnRate = Number(document.getElementById("annualChurnRate").value) || 0;

    /* VALIDATION */

    if (!annualRevenue || annualRevenue <= 0) {
      showError("Enter a valid annual revenue figure.");
      return;
    }
    if (isNaN(operatingMarginPct) || operatingMarginPct <= 0) {
      showError("Enter a valid operating margin percentage.");
      return;
    }
    if (!customer1Pct || customer1Pct <= 0 || customer1Pct > 100) {
      showError("Enter the top customer revenue percentage between 1 and 100.");
      return;
    }
    if (!customer2Pct || customer2Pct <= 0) {
      showError("Enter the second customer revenue percentage.");
      return;
    }
    if (!customer3Pct || customer3Pct <= 0) {
      showError("Enter the third customer revenue percentage.");
      return;
    }
    if (!totalCustomerCount || totalCustomerCount <= 0) {
      showError("Enter the total customer count.");
      return;
    }
    const top3Total = customer1Pct + customer2Pct + customer3Pct;
    if (top3Total > 100) {
      showError("The combined top three customer percentages exceed 100%. Please check your inputs.");
      return;
    }

    /* BASELINE CALCULATION */

    const operatingMarginDecimal = operatingMarginPct / 100;
    const totalOperatingProfit = annualRevenue * operatingMarginDecimal;
    const top3RevenuePct = top3Total;
    const remainingRevenuePct = 100 - top3RevenuePct;
    const remainingCustomers = totalCustomerCount - 3;

    const customer1Revenue = annualRevenue * (customer1Pct / 100);
    const customer2Revenue = annualRevenue * (customer2Pct / 100);
    const customer3Revenue = annualRevenue * (customer3Pct / 100);

    const customer1Profit = customer1Revenue * operatingMarginDecimal;
    const customer2Profit = customer2Revenue * operatingMarginDecimal;
    const customer3Profit = customer3Revenue * operatingMarginDecimal;
    const top3Profit = customer1Profit + customer2Profit + customer3Profit;

    /* HHI-STYLE CONCENTRATION SCORE */

    const avgRemainingPct = remainingCustomers > 0 ? remainingRevenuePct / remainingCustomers : 0;
    let hhi = (customer1Pct * customer1Pct) + (customer2Pct * customer2Pct) + (customer3Pct * customer3Pct);
    if (remainingCustomers > 0) {
      hhi += remainingCustomers * (avgRemainingPct * avgRemainingPct);
    }
    const normalizedHHI = Math.round(hhi);

    /* SCENARIO CALCULATION */

    const scenarioProfit = totalOperatingProfit - customer1Profit;
    const profitDropPct = (customer1Profit / totalOperatingProfit) * 100;

    /* CONTRACT NOTE */

    let contractNote = "";
    if (top1ContractMonths > 0) {
      contractNote = " The top customer contract has " + top1ContractMonths +
        " month" + (top1ContractMonths !== 1 ? "s" : "") + " remaining.";
    }

    let marginNote = "";
    if (top1MarginPct > 0) {
      const top1GrossProfit = customer1Revenue * (top1MarginPct / 100);
      marginNote = " At a customer-specific gross margin of " + top1MarginPct +
        "%, the top customer generates approximately " + formatNumber(top1GrossProfit) + " in gross profit.";
    }

    let churnNote = "";
    if (annualChurnRate > 0) {
      const expectedChurnedRevenue = annualRevenue * (annualChurnRate / 100);
      churnNote = " At the prevailing churn rate of " + annualChurnRate +
        "% annually, the business loses approximately " + formatNumber(expectedChurnedRevenue) +
        " in revenue per year across the customer base through natural attrition.";
    }

    /* SENSITIVITY CALCULATION */

    const sensitivityPerPoint = annualRevenue * 0.01 * operatingMarginDecimal;

    /* REPORT TEXT VARIABLES */

    let concentrationBand = "";
    if (customer1Pct < 15) {
      concentrationBand = "low";
    } else if (customer1Pct < 30) {
      concentrationBand = "moderate";
    } else if (customer1Pct < 50) {
      concentrationBand = "high";
    } else {
      concentrationBand = "critically high";
    }

    /* REPORT RENDER */

    const report =
      "<p><strong>Diagnostic Summary</strong></p>" +
      "<p>The top three customers represent " + top3RevenuePct +
      "% of total revenue (" + customer1Pct + "%, " + customer2Pct + "%, " + customer3Pct +
      "%) generating a combined " + formatNumber(top3Profit) +
      " of the " + formatNumber(totalOperatingProfit) +
      " total operating profit. The largest customer alone represents " + customer1Pct +
      "% of revenue, a " + concentrationBand +
      " concentration level. The concentration index is " + normalizedHHI + " (higher indicates greater concentration)." +
      contractNote + marginNote + "</p>" +

      "<p><strong>Key Mechanics</strong></p>" +
      "<table><thead><tr><th>Customer</th><th>Revenue %</th><th>Annual Revenue</th><th>Profit Contribution</th></tr></thead><tbody>" +
      "<tr><td>Top customer</td><td>" + customer1Pct + "%</td><td>" + formatNumber(customer1Revenue) + "</td><td>" + formatNumber(customer1Profit) + "</td></tr>" +
      "<tr><td>Second customer</td><td>" + customer2Pct + "%</td><td>" + formatNumber(customer2Revenue) + "</td><td>" + formatNumber(customer2Profit) + "</td></tr>" +
      "<tr><td>Third customer</td><td>" + customer3Pct + "%</td><td>" + formatNumber(customer3Revenue) + "</td><td>" + formatNumber(customer3Profit) + "</td></tr>" +
      "<tr><td>Remaining " + remainingCustomers + " customers</td><td>" + Math.round(remainingRevenuePct) + "%</td><td>" + formatNumber(annualRevenue * remainingRevenuePct / 100) + "</td><td>" + formatNumber(totalOperatingProfit - top3Profit) + "</td></tr>" +
      "</tbody></table>" +
      "<p>If the top customer relationship were lost, operating profit would fall from " +
      formatNumber(totalOperatingProfit) + " to " + formatNumber(scenarioProfit) +
      ", a decline of " + Math.round(profitDropPct) + "%. Each 1 percentage point shift in top customer revenue share changes the operating profit exposure by approximately " +
      formatNumber(sensitivityPerPoint) + " annually." + churnNote + "</p>" +

      "<p><strong>Operational Interpretation</strong></p>" +
      "<p>A concentration index of " + normalizedHHI +
      " and a top customer revenue share of " + customer1Pct +
      "% means the commercial terms, renewal decisions, and pricing behaviour of that one relationship disproportionately shape business outcomes. Pricing pressure from a concentrated customer is structurally different from market pricing pressure because the counterparty has leverage that the business cannot easily replace or exit without a material revenue shock.</p>" +

      "<p><strong>Structural Risk Observation</strong></p>" +
      "<p>Businesses with high customer concentration often sacrifice pricing discipline to protect the dominant relationship. Over time, this erodes margin across the account while leaving the structural risk unchanged. The risk is not just the loss of the customer. It is the cumulative margin compression that occurs in the years before a concentrated relationship is eventually lost or reduced.</p>" +

      "<p><strong>Management Questions</strong></p>" +
      "<p>What would the top customer's response be to a 5% price increase, and has that question been tested or is it only assumed to be negative?</p>" +
      "<p>What is the plan for rebuilding revenue if the top customer reduces its share by 30% over 18 months, and does that plan have a realistic timeline?</p>" +
      "<p>How much of the business's operational capacity, headcount, and overhead was sized to serve the concentrated accounts, and how quickly could that structure be adjusted?</p>" +

      "<p><strong>Selective Engagement Note</strong></p>" +
      "<p>This calculator evaluates only one narrow dimension of business structure: revenue and profit dependence on key customers. Deeper diagnostic work examines how customer concentration interacts with pricing power, contract structure, margin by account, working capital dependency on large customers, and the realistic diversification paths available to the business. MJB Strategic works with a limited number of businesses at any time because customer concentration analysis requires understanding the commercial relationships, not just the numbers. If this diagnostic thinking resonates, the contact page provides a route to explore whether a deeper engagement would be appropriate.</p>";

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
