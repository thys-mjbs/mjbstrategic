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

      const revenue = parseFloat(document.getElementById("revenue" + i).value);
      const margin = parseFloat(document.getElementById("margin" + i).value);

      if (!isNaN(revenue) && !isNaN(margin) && revenue > 0) {

        const profit = revenue * (margin / 100);

        segments.push({
          revenue: revenue,
          margin: margin,
          profit: profit
        });

      }

    }

    const completedCount = segments.length;

    if (completedCount === 0) {
      showError("Please enter at least one complete revenue segment.");
      return;
    }

    let totalProfit = 0;

    segments.forEach(function (s) {
      totalProfit += s.profit;
    });

    segments.sort(function (a, b) {
      return b.profit - a.profit;
    });

    const topProfit = segments[0].profit;
    const topShare = (topProfit / totalProfit) * 100;

    let topTwoShare = null;

    if (segments.length >= 2) {
      topTwoShare = ((segments[0].profit + segments[1].profit) / totalProfit) * 100;
    }

    let summary = "";
    let interpretation = "";
    let risk = "";
    let questions = "";

    if (completedCount === 1) {

      summary = "The analysis shows that the single revenue segment entered generates 100 percent of the profit measured in this exercise. The business therefore relies entirely on one activity for its gross profit generation.";

      interpretation = "When a business operates with only one measurable profit engine management attention naturally concentrates on protecting pricing power, supplier relationships, and operational efficiency within that activity.";

      risk = "A structure built on a single profit driver can perform well if the underlying activity remains stable, but the business becomes exposed to disruption if market demand, supplier pricing, or cost conditions change.";

      questions = "<ul><li>How stable is the demand and pricing environment for this core revenue segment?</li><li>Which operational factors most strongly influence the margin earned in this activity?</li></ul>";

    }

    if (completedCount === 2) {

      summary = "The analysis shows that profit is generated across two revenue segments. The leading segment contributes approximately " + topShare.toFixed(1) + " percent of total profit, while both segments together account for the entire profit base.";

      interpretation = "A structure with two primary profit sources can provide a degree of operational balance if the activities rely on different customers, pricing dynamics, or cost structures.";

      risk = "If one of the two segments weakens due to pricing pressure, supplier cost changes, or demand shifts the remaining segment must carry a larger share of the profit burden.";

      questions = "<ul><li>Which segment currently has the strongest margin stability?</li><li>If one segment weakened, could the other realistically absorb the profit shortfall?</li></ul>";

    }

    if (completedCount >= 3) {

      summary = "The analysis estimates that the most profitable segment generates approximately " + topShare.toFixed(1) + " percent of total profit. The two most profitable segments together generate approximately " + topTwoShare.toFixed(1) + " percent of total profit.";

      interpretation = "This pattern reveals how strongly the profit engine of the business depends on a small number of activities rather than the overall revenue footprint.";

      if (topTwoShare > 70) {

        risk = "A large share of profit appears to be concentrated in a narrow set of activities. If those segments experience demand volatility, margin compression, or supplier disruption the overall business may experience a disproportionate profit impact.";

      } else {

        risk = "Profit appears to be distributed across several segments. This broader distribution often provides operational resilience because weakness in one area can be partially offset by performance elsewhere.";

      }

      questions = "<ul><li>Are management attention and resources aligned with the segments generating the largest share of profit?</li><li>How sensitive are these high profit segments to supplier pricing or demand shifts?</li><li>Are there emerging segments that could gradually diversify the profit base?</li></ul>";

    }

    const selectiveNote = "<p>This calculator evaluates only one narrow dimension of business structure. In practice the broader diagnostic work performed by MJB Strategic examines the interaction between profit drivers, cost structure, capital deployment, cash flow timing, revenue concentration, supplier dynamics, and forward operating scenarios. This type of analysis requires structured financial data and careful modelling. Because the work requires detailed operational understanding only a limited number of businesses are engaged with at any given time. If the thinking behind this diagnostic resonates with how you view your business you are welcome to explore whether there may be scope to work together by using the Contact page to request a deeper structural diagnostic review.</p>";

    resultContainer.innerHTML =
      "<h3>Diagnostic Summary</h3><p>" + summary + "</p>" +
      "<h3>Operational Interpretation</h3><p>" + interpretation + "</p>" +
      "<h3>Structural Risk Observation</h3><p>" + risk + "</p>" +
      "<h3>Management Questions</h3>" + questions +
      selectiveNote;

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