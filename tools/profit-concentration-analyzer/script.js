document.addEventListener("DOMContentLoaded", function () {

  const calculateButton = document.getElementById("calculateButton");
  const shareButton = document.getElementById("shareWhatsAppButton");
  const resultContainer = document.getElementById("result");

  function showError(message) {
    resultContainer.innerHTML =
      "<p style='color:#b91c1c;font-weight:600'>" + message + "</p>";
  }

  function formatNumber(value) {
    return Math.round(value).toLocaleString();
  }

  function runDiagnostic() {

    const segments = [];

    const seg1Name = document.getElementById("seg1Name").value.trim();
    const seg1Revenue = Number(document.getElementById("seg1Revenue").value);
    const seg1Margin = Number(document.getElementById("seg1Margin").value);

    const seg2Name = document.getElementById("seg2Name").value.trim();
    const seg2Revenue = Number(document.getElementById("seg2Revenue").value);
    const seg2Margin = Number(document.getElementById("seg2Margin").value);

    const seg3Name = document.getElementById("seg3Name").value.trim();
    const seg3Revenue = Number(document.getElementById("seg3Revenue").value);
    const seg3Margin = Number(document.getElementById("seg3Margin").value);

    const seg4Name = document.getElementById("seg4Name").value.trim();
    const seg4Revenue = Number(document.getElementById("seg4Revenue").value);
    const seg4Margin = Number(document.getElementById("seg4Margin").value);

    const seg5Name = document.getElementById("seg5Name").value.trim();
    const seg5Revenue = Number(document.getElementById("seg5Revenue").value);
    const seg5Margin = Number(document.getElementById("seg5Margin").value);

    const seg6Name = document.getElementById("seg6Name").value.trim();
    const seg6Revenue = Number(document.getElementById("seg6Revenue").value);
    const seg6Margin = Number(document.getElementById("seg6Margin").value);

    const candidates = [
      { index: 1, name: seg1Name, revenue: seg1Revenue, marginPercent: seg1Margin },
      { index: 2, name: seg2Name, revenue: seg2Revenue, marginPercent: seg2Margin },
      { index: 3, name: seg3Name, revenue: seg3Revenue, marginPercent: seg3Margin },
      { index: 4, name: seg4Name, revenue: seg4Revenue, marginPercent: seg4Margin },
      { index: 5, name: seg5Name, revenue: seg5Revenue, marginPercent: seg5Margin },
      { index: 6, name: seg6Name, revenue: seg6Revenue, marginPercent: seg6Margin }
    ];

    let completedCount = 0;

    for (let i = 0; i < candidates.length; i += 1) {

      const entry = candidates[i];

      const hasAnyInput =
        entry.name !== "" ||
        document.getElementById("seg" + entry.index + "Revenue").value.trim() !== "" ||
        document.getElementById("seg" + entry.index + "Margin").value.trim() !== "";

      if (!hasAnyInput) {
        continue;
      }

      if (
        Number.isNaN(entry.revenue) ||
        Number.isNaN(entry.marginPercent)
      ) {
        showError("Enter valid numeric values in all required fields.");
        return;
      }

      if (entry.revenue < 0 || entry.marginPercent < 0) {
        showError("Values cannot be negative.");
        return;
      }

      if (entry.marginPercent > 100) {
        showError("Margin percent must be between 0 and 100.");
        return;
      }

      const marginDecimal = entry.marginPercent / 100;
      const profit = entry.revenue * marginDecimal;

      const safeName = entry.name !== "" ? entry.name : "Segment " + entry.index;

      segments.push({
        name: safeName,
        revenue: entry.revenue,
        marginPercent: entry.marginPercent,
        profit: profit
      });

      completedCount += 1;

    }

    if (completedCount === 0) {
      showError("Enter at least one segment with revenue and margin percent.");
      return;
    }

    let totalProfit = 0;

    for (let j = 0; j < segments.length; j += 1) {
      totalProfit += segments[j].profit;
    }

    if (totalProfit <= 0) {
      showError("Total estimated profit must be greater than zero.");
      return;
    }

    segments.sort(function (a, b) {
      return b.profit - a.profit;
    });

    const top1 = segments[0];
    const top2 = segments.length >= 2 ? segments[1] : null;

    const top1Share = top1.profit / totalProfit;
    const top2Share = top2 ? (top1.profit + top2.profit) / totalProfit : top1Share;

    const top1SharePct = Math.round(top1Share * 100);
    const top2SharePct = Math.round(top2Share * 100);

    let concentrationLabel = "";
    let concentrationComment = "";

    if (top1Share >= 0.60 || top2Share >= 0.80) {
      concentrationLabel = "High concentration";
      concentrationComment =
        "Most gross profit is carried by a narrow part of the business, which increases disruption risk.";
    } else if (top1Share >= 0.40 || top2Share >= 0.65) {
      concentrationLabel = "Moderate concentration";
      concentrationComment =
        "Profit is led by one or two segments, but the remainder still matters operationally.";
    } else {
      concentrationLabel = "Diversified profit base";
      concentrationComment =
        "Profit contribution is spread across segments, which supports resilience and optionality.";
    }

    let entityLine = "";

    if (completedCount === 1) {
      entityLine = "Only one segment was entered, so concentration cannot be compared across activities.";
    } else if (completedCount === 2) {
      entityLine =
        "Two segments were entered, so the comparison is between both profit engines directly.";
    } else {
      const remainderCount = completedCount - 2;
      if (remainderCount === 1) {
        entityLine =
          "Three segments were entered, so the top two can be compared to the remaining segment.";
      } else {
        entityLine =
          "Top two segments are compared to the remaining " + remainderCount + " segments combined.";
      }
    }

    const totalProfitRounded = formatNumber(totalProfit);
    const top1ProfitRounded = formatNumber(top1.profit);
    const top2ProfitRounded = top2 ? formatNumber(top2.profit) : 0;

    let keyMechanicsList = "<ul>";

    for (let k = 0; k < segments.length; k += 1) {
      const seg = segments[k];
      const segProfitRounded = formatNumber(seg.profit);
      const segShare = seg.profit / totalProfit;
      const segSharePct = Math.round(segShare * 100);
      keyMechanicsList +=
        "<li>" +
        seg.name +
        ": revenue " +
        formatNumber(seg.revenue) +
        ", margin " +
        Math.round((seg.marginPercent / 100) * 100) +
        "%, profit " +
        segProfitRounded +
        " (" +
        segSharePct +
        "% of total profit)" +
        "</li>";
    }

    keyMechanicsList += "</ul>";

    let operationalInterpretation = "";

    if (top1Share >= 0.60) {
      operationalInterpretation =
        "The leading segment is likely setting pricing norms and absorbing the best capacity. If supplier terms, input costs, or demand shift there, total cash generation will move quickly.";
    } else if (top2Share >= 0.70) {
      operationalInterpretation =
        "Two segments are carrying most of the profit, which usually means operations are optimised around them. Weakness in either one can force pricing concessions or overhead cuts elsewhere.";
    } else {
      operationalInterpretation =
        "Multiple segments contribute meaningful profit, which reduces reliance on one pricing or cost structure. This usually improves planning and reduces sensitivity to one customer or product cycle.";
    }

    let structuralRisk = "";

    if (completedCount === 1) {
      structuralRisk =
        "With a single segment entered, the structural risk is visibility rather than concentration. If your management accounts cannot split profit by line, you will misallocate capacity and capital.";
    } else if (top2Share >= 0.80) {
      structuralRisk =
        "If the top profit segments slow down, the business may still show revenue while profit collapses. This is where operators get surprised by margin compression and working capital stress.";
    } else if (top1Share >= 0.60) {
      structuralRisk =
        "A dominant segment can hide weak pricing discipline elsewhere and encourages cross-subsidy. If you lose that segment, overhead and asset utilisation become immediate problems.";
    } else {
      structuralRisk =
        "Diversification can still hide underperforming lines if cost allocation is weak. Resilience depends on clean segment reporting and active cost control by activity.";
    }

    const mq1 =
      "What pricing rules protect the top profit segment from discount creep and margin leakage?";
    const mq2 =
      "Which supplier terms or direct cost drivers would most quickly change gross margin by segment?";
    const mq3 =
      "Where are you allocating capacity and capital that does not return proportional profit?";

    const selectiveEngagementNote =
      "This calculator evaluates only profit concentration from segment gross margin. Deeper diagnostics examine profit drivers, cost structure, capital deployment, cash flow timing, revenue concentration, supplier dynamics, and forward operating scenarios. If this diagnostic thinking matches your situation, use the Contact page to discuss a fuller review.";

    const summaryHtml =
      "<p><strong>Diagnostic Summary</strong><br />" +
      concentrationLabel +
      ". Total estimated gross profit is " +
      totalProfitRounded +
      ". " +
      top1.name +
      " generates " +
      top1SharePct +
      "% of profit" +
      (top2 ? ", and the top two generate " + top2SharePct + "%." : ".") +
      "</p>" +
      "<p>" +
      concentrationComment +
      "</p>" +
      "<p>" +
      entityLine +
      "</p>";

    const mechanicsHtml =
      "<p><strong>Key Mechanics</strong><br />" +
      "Profit contribution is estimated as revenue multiplied by gross margin percent." +
      "</p>" +
      keyMechanicsList +
      (top2
        ? "<p>Top segment profit is " + top1ProfitRounded + ". Second segment profit is " + top2ProfitRounded + ".</p>"
        : "<p>Top segment profit is " + top1ProfitRounded + ".</p>");

    const operationalHtml =
      "<p><strong>Operational Interpretation</strong><br />" +
      operationalInterpretation +
      "</p>";

    const riskHtml =
      "<p><strong>Structural Risk Observation</strong><br />" +
      structuralRisk +
      "</p>";

    const questionsHtml =
      "<p><strong>Management Questions</strong><br />" +
      "</p>" +
      "<ol>" +
      "<li>" + mq1 + "</li>" +
      "<li>" + mq2 + "</li>" +
      "<li>" + mq3 + "</li>" +
      "</ol>";

    const selectiveHtml =
      "<p><strong>Selective Engagement Note</strong><br />" +
      selectiveEngagementNote +
      "</p>";

    resultContainer.innerHTML =
      summaryHtml +
      mechanicsHtml +
      operationalHtml +
      riskHtml +
      questionsHtml +
      selectiveHtml;

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