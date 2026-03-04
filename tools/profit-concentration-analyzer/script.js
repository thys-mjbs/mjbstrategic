document.addEventListener("DOMContentLoaded", function () {

  const calculateButton = document.getElementById("calculateButton");
  const shareButton = document.getElementById("shareWhatsAppButton");
  const resultContainer = document.getElementById("result");

  function showError(message) {
    resultContainer.innerHTML = "<p style='color:#b91c1c;font-weight:600'>" + message + "</p>";
  }

  function runDiagnostic() {

    const segments = [];

    for (let i = 1; i <= 6; i++) {

      const revenue = parseFloat(document.getElementById("rev" + i).value);
      const margin = parseFloat(document.getElementById("margin" + i).value);

      if (!isNaN(revenue) && !isNaN(margin)) {

        const profit = revenue * (margin / 100);

        segments.push({
          revenue: revenue,
          margin: margin,
          profit: profit
        });

      }

    }

    if (segments.length < 2) {
      showError("Please enter at least two revenue segments to evaluate profit concentration.");
      return;
    }

    let totalProfit = 0;

    segments.forEach(function (s) {
      totalProfit += s.profit;
    });

    segments.sort(function (a, b) {
      return b.profit - a.profit;
    });

    const top1Share = segments[0].profit / totalProfit;
    const top2Share = (segments[0].profit + (segments[1] ? segments[1].profit : 0)) / totalProfit;

    let interpretation = "";

    if (top1Share > 0.6 || top2Share > 0.8) {
      interpretation = "The profit engine of the business appears heavily concentrated. A small number of segments generate the majority of gross profit. This structure can create operational vulnerability if those activities weaken through pricing pressure, customer loss, supplier cost increases, or competitive disruption.";
    } else if (top1Share > 0.4 || top2Share > 0.6) {
      interpretation = "Profit generation appears moderately concentrated. While multiple activities contribute meaningfully to profitability, a limited number of segments still drive a large proportion of total profit. Management attention should remain focused on protecting the economic drivers of these areas.";
    } else {
      interpretation = "Profit contribution appears relatively diversified across segments. A broader distribution of profit generation can improve operational resilience because performance is not dependent on a narrow set of activities.";
    }

    const report =
      "<h3>Diagnostic Summary</h3>" +
      "<p>Total gross profit was estimated by combining the revenue and margin of each segment. The largest segment generates approximately " +
      (top1Share * 100).toFixed(1) +
      "% of total profit, while the two largest segments together generate roughly " +
      (top2Share * 100).toFixed(1) +
      "% of the profit base.</p>" +

      "<h3>Operational Interpretation</h3>" +
      "<p>" + interpretation + "</p>" +

      "<p>Understanding where profit is actually produced helps management allocate attention, pricing discipline, operational resources, and supplier negotiations toward the activities that truly sustain the business.</p>" +

      "<h3>Structural Risk Observation</h3>" +
      "<p>When profit is concentrated in a narrow set of activities the company becomes structurally exposed to disruption in those areas. Changes in customer demand, supplier pricing, competitive pressure, or operational constraints affecting those segments can disproportionately affect overall profitability.</p>" +

      "<h3>Management Questions</h3>" +
      "<p>Which revenue segments generate the majority of gross profit rather than simply the highest revenue?</p>" +
      "<p>If the most profitable segment weakened, how quickly could other activities compensate for the lost margin?</p>" +
      "<p>Are management attention and operational resources aligned with the segments that actually produce the largest share of profit?</p>" +

      "<h3>Selective Engagement</h3>" +
      "<p>This calculator evaluates only one narrow dimension of business structure. The broader diagnostic work performed by MJB Strategic examines how profit drivers interact with cost structure, capital deployment, cash flow timing, revenue concentration, supplier dynamics, and forward operating scenarios.</p>" +

      "<p>That type of analysis requires structured financial data and careful modelling across the operating model. Only a limited number of businesses are worked with at any given time because the work requires detailed operational understanding.</p>" +

      "<p>If the thinking behind this diagnostic reflects how you view your own business structure, you are welcome to explore whether there may be scope to work together. Use the Contact page to request a quote for a deeper structural diagnostic review.</p>";

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