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

    const segPcts = [
      Number(document.getElementById("seg1Pct").value),
      Number(document.getElementById("seg2Pct").value),
      Number(document.getElementById("seg3Pct").value),
      Number(document.getElementById("seg4Pct").value),
      Number(document.getElementById("seg5Pct").value)
    ];
    const segMargins = [
      Number(document.getElementById("seg1Margin").value),
      Number(document.getElementById("seg2Margin").value),
      Number(document.getElementById("seg3Margin").value),
      Number(document.getElementById("seg4Margin").value),
      Number(document.getElementById("seg5Margin").value)
    ];
    const annualRevenue = Number(document.getElementById("annualRevenue").value);

    /* VALIDATION */

    if (!segPcts[0] || segPcts[0] <= 0 || !segPcts[1] || segPcts[1] <= 0 || !segPcts[2] || segPcts[2] <= 0) {
      showError("Enter revenue percentages for at least three segments.");
      return;
    }
    if (!segMargins[0] || !segMargins[1] || !segMargins[2]) {
      showError("Enter gross margin percentages for at least three segments.");
      return;
    }
    if (!annualRevenue || annualRevenue <= 0) {
      showError("Enter a valid annual revenue figure.");
      return;
    }

    /* COLLECT VALID SEGMENTS */

    const segments = [];
    for (let i = 0; i < 5; i++) {
      if (segPcts[i] > 0 && segMargins[i] > 0) {
        segments.push({
          index: i + 1,
          pct: segPcts[i],
          margin: segMargins[i],
          revenue: annualRevenue * (segPcts[i] / 100),
          grossProfit: annualRevenue * (segPcts[i] / 100) * (segMargins[i] / 100)
        });
      }
    }

    const completedCount = segments.length;
    const totalPct = segments.reduce(function (s, seg) { return s + seg.pct; }, 0);

    if (totalPct > 103 || totalPct < 50) {
      showError("Segment percentages total " + Math.round(totalPct) + "%. Ensure segments represent the majority of revenue.");
      return;
    }

    /* BASELINE CALCULATION */

    const totalGrossProfit = segments.reduce(function (s, seg) { return s + seg.grossProfit; }, 0);
    const blendedMargin = (totalGrossProfit / annualRevenue) * 100;

    /* HHI CONCENTRATION INDEX */

    let hhi = 0;
    segments.forEach(function (seg) {
      hhi += seg.pct * seg.pct;
    });

    const maxHHI = 10000;
    const minHHI = completedCount > 0 ? maxHHI / completedCount : maxHHI;
    const normalizedScore = Math.round(100 - ((hhi - minHHI) / (maxHHI - minHHI)) * 100);
    const diversificationScore = Math.max(0, Math.min(100, normalizedScore));

    /* SORT BY PROFIT */

    const sortedByProfit = segments.slice().sort(function (a, b) { return b.grossProfit - a.grossProfit; });
    const top1ProfitShare = (sortedByProfit[0].grossProfit / totalGrossProfit) * 100;
    const top2ProfitShare = completedCount >= 2 ?
      ((sortedByProfit[0].grossProfit + sortedByProfit[1].grossProfit) / totalGrossProfit) * 100 : top1ProfitShare;

    /* SCENARIO — remove top segment */

    const remainingRevenue = annualRevenue * ((100 - sortedByProfit[0].pct) / 100);
    const remainingProfit = totalGrossProfit - sortedByProfit[0].grossProfit;

    /* SENSITIVITY CALCULATION */

    const sensitivityShift = annualRevenue * 0.05;

    /* REPORT TEXT VARIABLES */

    let scoreLabel = "";
    if (diversificationScore >= 70) {
      scoreLabel = "well diversified";
    } else if (diversificationScore >= 45) {
      scoreLabel = "moderately diversified";
    } else if (diversificationScore >= 25) {
      scoreLabel = "concentrated";
    } else {
      scoreLabel = "highly concentrated";
    }

    let tableRows = "";
    segments.forEach(function (seg) {
      const profitShare = Math.round((seg.grossProfit / totalGrossProfit) * 100);
      tableRows +=
        "<tr><td>Segment " + seg.index + "</td><td>" +
        seg.pct + "%</td><td>" +
        formatNumber(seg.revenue) + "</td><td>" +
        seg.margin + "%</td><td>" +
        formatNumber(seg.grossProfit) + "</td><td>" +
        profitShare + "%</td></tr>";
    });

    /* REPORT RENDER */

    const report =
      "<p><strong>Diagnostic Summary</strong></p>" +
      "<p>The revenue base across " + completedCount +
      " segments generates total gross profit of " + formatNumber(totalGrossProfit) +
      " at a blended margin of " + Math.round(blendedMargin * 10) / 10 +
      "%. The diversification score is " + diversificationScore + " out of 100, indicating a " +
      scoreLabel + " revenue structure. The highest-profit segment generates " +
      Math.round(top1ProfitShare) + "% of total gross profit, and the top two combined generate " +
      Math.round(top2ProfitShare) + "%.</p>" +

      "<p><strong>Key Mechanics</strong></p>" +
      "<table><thead><tr><th>Segment</th><th>Rev %</th><th>Revenue</th><th>Margin</th><th>Gross Profit</th><th>Profit %</th></tr></thead><tbody>" +
      tableRows +
      "</tbody></table>" +
      "<p>If the largest segment by revenue (" + sortedByProfit[0].pct +
      "%) were to be removed or disrupted, annual revenue would fall to " +
      formatNumber(remainingRevenue) + " and gross profit to " + formatNumber(remainingProfit) +
      ". A 5% revenue shift between segments changes the gross profit pool by approximately " +
      formatNumber(sensitivityShift * (Math.max(...segMargins.slice(0, completedCount)) - Math.min(...segMargins.slice(0, completedCount))) / 100) +
      " depending on the margin differential between segments.</p>" +

      "<p><strong>Operational Interpretation</strong></p>" +
      "<p>A diversification score of " + diversificationScore +
      " reflects that revenue is " + scoreLabel +
      ". Revenue diversification is distinct from customer diversification: a business can serve many customers but earn most of its profit from one segment. The margin distribution across segments is as important as the revenue share, because uneven margins mean the profit concentration can be significantly more pronounced than the revenue concentration suggests.</p>" +

      "<p><strong>Structural Risk Observation</strong></p>" +
      "<p>Businesses with concentrated revenue structures are exposed to segment-level disruption from substitution, competition, regulatory change, or demand shifts. Where the highest-margin segment is also the most concentrated, the business carries a compounded risk: the loss of the segment damages both the revenue base and the margin rate simultaneously. The top segment here generates " +
      Math.round(top1ProfitShare) + "% of gross profit despite representing " +
      sortedByProfit[0].pct + "% of revenue.</p>" +

      "<p><strong>Management Questions</strong></p>" +
      "<p>Which segments have the highest growth potential, and is the current capital and management attention allocation proportional to that potential?</p>" +
      "<p>Are there lower-margin segments that receive disproportionate operational attention, and could that resource be redeployed toward higher-margin activities?</p>" +
      "<p>What would it take to shift the revenue mix so that no single segment exceeds 30% of total gross profit, and is that a realistic objective over a 24-month horizon?</p>" +

      "<p><strong>Selective Engagement Note</strong></p>" +
      "<p>This calculator evaluates only one narrow dimension of business structure: how evenly revenue and profit are distributed across segments. Deeper diagnostic work examines how segment diversification interacts with pricing power, capacity constraints, customer concentration within segments, supplier dependency by segment, and the operational cost of serving each segment relative to its contribution. MJB Strategic works with a limited number of businesses at any time because diversification analysis requires understanding both the financial structure and the strategic options available. If this diagnostic thinking resonates, the contact page provides a route to explore whether a deeper engagement would be appropriate.</p>";

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
