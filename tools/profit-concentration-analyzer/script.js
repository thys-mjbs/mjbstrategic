document.addEventListener("DOMContentLoaded", function () {
  const calculateButton = document.getElementById("calculateButton");
  const shareButton = document.getElementById("shareWhatsAppButton");
  const resultContainer = document.getElementById("result");

  function showError(message) {
    resultContainer.innerHTML = "<p style='color:#b91c1c;font-weight:600'>" + message + "</p>";
  }

  function formatCurrency(value) {
    const absValue = Math.abs(value);
    let formatted = absValue.toFixed(0);
    const parts = formatted.split("");
    let withCommas = "";
    for (let i = 0; i < parts.length; i++) {
      const idxFromEnd = parts.length - i;
      withCommas += parts[i];
      if (idxFromEnd > 1 && idxFromEnd % 3 === 1) {
        withCommas += ",";
      }
    }
    return (value < 0 ? "-" : "") + withCommas;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function runDiagnostic() {
    resultContainer.innerHTML = "";

    const segments = [];
    for (let i = 1; i <= 6; i++) {
      const nameRaw = (document.getElementById("segmentName" + i).value || "").trim();
      const revenueRaw = document.getElementById("segmentRevenue" + i).value;
      const marginRaw = document.getElementById("segmentMargin" + i).value;

      const revenue = revenueRaw === "" ? null : Number(revenueRaw);
      const marginPct = marginRaw === "" ? null : Number(marginRaw);

      const hasRevenue = revenue !== null && !Number.isNaN(revenue) && revenue > 0;
      const hasMargin = marginPct !== null && !Number.isNaN(marginPct);

      if (hasRevenue || hasMargin || nameRaw !== "") {
        if (!hasRevenue || !hasMargin) {
          showError("For any segment used, enter both annual revenue and gross margin percentage.");
          return;
        }
        if (marginPct < 0 || marginPct > 100) {
          showError("Gross margin percentage must be between 0 and 100.");
          return;
        }

        const name = nameRaw !== "" ? nameRaw : "Segment " + i;
        const profit = revenue * (marginPct / 100);

        segments.push({
          index: i,
          name: name,
          revenue: revenue,
          marginPct: marginPct,
          profit: profit
        });
      }
    }

    const completedCount = segments.length;

    if (completedCount === 0) {
      showError("Enter at least one segment with revenue and gross margin percentage.");
      return;
    }

    let totalProfit = 0;
    for (let i = 0; i < segments.length; i++) {
      totalProfit += segments[i].profit;
    }

    if (totalProfit <= 0) {
      showError("Total estimated profit must be greater than zero to run this diagnostic.");
      return;
    }

    segments.sort(function (a, b) {
      return b.profit - a.profit;
    });

    const top1 = segments[0];
    const top2 = completedCount >= 2 ? segments[1] : null;

    const top1Share = top1.profit / totalProfit;
    const top2Share = top2 ? (top1.profit + top2.profit) / totalProfit : null;

    let concentrationLabel = "moderate";
    if (top1Share >= 0.65) {
      concentrationLabel = "very high";
    } else if (top1Share >= 0.45) {
      concentrationLabel = "high";
    } else if (top1Share <= 0.30 && (top2Share === null || top2Share <= 0.55)) {
      concentrationLabel = "low";
    }

    let summaryText = "";
    if (completedCount === 1) {
      summaryText =
        "You have only one segment in scope, which generates 100% of estimated profit. " +
        "This is a single-engine profit structure and the business outcome is tied to that one activity.";
    } else if (completedCount === 2) {
      const top1Pct = Math.round(top1Share * 100);
      const top2Pct = Math.round(top2Share * 100);
      summaryText =
        "Estimated profit is concentrated in two segments, with the top segment generating about " +
        top1Pct +
        "% of total profit and the two combined generating about " +
        top2Pct +
        "%. " +
        "This indicates a profit structure that may be stable, but is exposed if one segment weakens.";
    } else {
      const top1Pct = Math.round(top1Share * 100);
      const top2Pct = Math.round(top2Share * 100);
      summaryText =
        "Estimated profit is spread across " +
        completedCount +
        " segments, but the top segment still generates about " +
        top1Pct +
        "% of total profit and the top two generate about " +
        top2Pct +
        "%. " +
        "This shows how much the profit engine depends on the leading activities.";
    }

    let mechanicsText = "";
    if (completedCount === 1) {
      mechanicsText =
        "Profit contribution is estimated as revenue multiplied by gross margin percentage for the single segment. " +
        "Because only one segment exists, its profit share is 100% by definition.";
    } else if (completedCount === 2) {
      mechanicsText =
        "Each segment profit is estimated as revenue multiplied by gross margin percentage. " +
        "The tool totals profit across both segments, then computes the profit share of the top segment and the combined share of both segments.";
    } else {
      mechanicsText =
        "Each segment profit is estimated as revenue multiplied by gross margin percentage. " +
        "Segments are ranked by profit contribution, then the tool calculates the profit share of the top segment and the combined share of the top two.";
    }

    let interpretationText = "";
    if (completedCount === 1) {
      interpretationText =
        "In operational terms, pricing, cost control, supplier terms, and capacity decisions all point back to the same segment. " +
        "If that segment relies on a narrow customer set, a single supplier, or a fragile pricing position, management has limited room to absorb shocks.";
    } else if (concentrationLabel === "very high" || concentrationLabel === "high") {
      if (completedCount === 2) {
        interpretationText =
          "The operating reality is that one segment is doing most of the cash generation through margin, even if orders are busy elsewhere. " +
          "Management attention should prioritise protecting pricing power, controlling direct costs, and defending supplier terms in the top segment while reviewing why the other segment under-contributes.";
      } else {
        interpretationText =
          "The operating reality is that the top segment is doing most of the cash generation through margin, even if orders are spread across the business. " +
          "Management attention should prioritise protecting pricing power, controlling direct costs, and defending supplier terms in the top segment while reducing reliance through deliberate margin improvement elsewhere.";
      }
    } else if (concentrationLabel === "low") {
      if (completedCount === 2) {
        interpretationText =
          "Profit contribution is more balanced across the two segments, which usually indicates more stable pricing and cost structure across the business. " +
          "This gives management more flexibility to allocate capacity and capital without being forced to protect a single dominant profit stream.";
      } else {
        interpretationText =
          "Profit contribution is more broadly distributed, which usually indicates multiple viable pricing and margin engines. " +
          "This creates operational resilience because decisions on capacity, staffing, and capital allocation are not dependent on one narrow activity.";
      }
    } else {
      if (completedCount === 2) {
        interpretationText =
          "The structure is neither fully concentrated nor fully diversified, which often indicates mixed pricing power and cost structure between segments. " +
          "Operators should ensure the leading segment is protected, while building repeatable margin in the other segment to reduce dependency over time.";
      } else {
        interpretationText =
          "The structure is moderately concentrated, which often indicates that a few segments have better pricing or cost control than the rest. " +
          "Operators should protect the top segment while building margin quality in the remaining segments so growth improves profit, not just revenue.";
      }
    }

    let riskText = "";
    if (completedCount === 1) {
      riskText =
        "A single-segment profit base creates direct dependency risk: any pricing pressure, customer loss, supplier cost shock, or capacity disruption hits profit immediately. " +
        "If the segment is also operationally complex or supplier-dependent, the risk compounds because there is no second profit engine to absorb volatility.";
    } else if (concentrationLabel === "very high") {
      if (completedCount === 2) {
        riskText =
          "Profit dependency is extreme: the top segment dominates margin and effectively subsidises the rest of the activity. " +
          "If that segment experiences price erosion, discounting pressure, or supplier cost increases, total profit can fall rapidly even if revenue holds.";
      } else {
        riskText =
          "Profit dependency is extreme: the top segment dominates margin and can silently subsidise the rest of the activity. " +
          "If that segment experiences price erosion, discounting pressure, or supplier cost increases, total profit can fall rapidly even if overall revenue looks stable.";
      }
    } else if (concentrationLabel === "high") {
      riskText =
        "Profit is meaningfully dependent on the leading segment, so the business is exposed to shocks that target that segment specifically. " +
        "Common triggers include a key customer changing buying behaviour, a competitor forcing price cuts, or supplier terms tightening and compressing margin.";
    } else if (concentrationLabel === "low") {
      riskText =
        "Lower profit concentration reduces single-point dependency, but it can still hide weak segments that consume capacity with low margin. " +
        "If too many segments are marginal, overhead absorption becomes fragile and cash generation can remain weaker than expected.";
    } else {
      riskText =
        "Moderate concentration indicates that the business has a leading profit engine but still relies on secondary segments for stability. " +
        "If the leading segment weakens, the remaining segments may not be strong enough in margin to protect cash generation without rapid operational changes.";
    }

    let questionsText = "";
    if (completedCount === 1) {
      questionsText =
        "<ol style='margin:8px 0 0 18px'>" +
        "<li>What are the top three drivers of margin in this segment: pricing, direct costs, or supplier terms?</li>" +
        "<li>If volume drops by 20%, what cost structure changes protect profit and cash?</li>" +
        "<li>What second profit engine could be built using existing capacity and customer access?</li>" +
        "</ol>";
    } else if (completedCount === 2) {
      questionsText =
        "<ol style='margin:8px 0 0 18px'>" +
        "<li>What makes the top segment structurally higher margin than the other segment?</li>" +
        "<li>Which customer, order type, or supplier term is most critical to the top segment profit?</li>" +
        "<li>What operational changes would raise the weaker segment margin by five points?</li>" +
        "</ol>";
    } else {
      questionsText =
        "<ol style='margin:8px 0 0 18px'>" +
        "<li>Which pricing and cost structure assumptions make the top segment the profit anchor?</li>" +
        "<li>Which segments consume the most capacity relative to their profit contribution?</li>" +
        "<li>What specific actions would increase profit contribution from the non-top segments this quarter?</li>" +
        "</ol>";
    }

    let entityLine = "";
    if (completedCount === 1) {
      entityLine =
        "<p style='margin:8px 0 0 0'><strong>Segment in scope:</strong> " +
        top1.name +
        " generates 100% of estimated profit.</p>";
    } else if (completedCount === 2) {
      entityLine =
        "<p style='margin:8px 0 0 0'><strong>Profit shares:</strong> " +
        top1.name +
        " contributes " +
        Math.round(top1Share * 100) +
        "% of profit, and both segments combined contribute 100%.</p>";
    } else {
      const remainingShare = clamp(1 - (top1.profit + top2.profit) / totalProfit, 0, 1);
      entityLine =
        "<p style='margin:8px 0 0 0'><strong>Profit shares:</strong> " +
        top1.name +
        " contributes " +
        Math.round(top1Share * 100) +
        "%, " +
        top2.name +
        " contributes " +
        Math.round((top2.profit / totalProfit) * 100) +
        "%, and remaining segments contribute " +
        Math.round(remainingShare * 100) +
        "%.</p>";
    }

    let detailTable = "";
    let rows = "";
    for (let i = 0; i < segments.length; i++) {
      const s = segments[i];
      const sharePct = Math.round((s.profit / totalProfit) * 100);
      rows +=
        "<tr>" +
        "<td style='padding:8px 10px;border-top:1px solid rgba(15,23,42,0.12)'>" +
        s.name +
        "</td>" +
        "<td style='padding:8px 10px;border-top:1px solid rgba(15,23,42,0.12);text-align:right'>" +
        formatCurrency(s.revenue) +
        "</td>" +
        "<td style='padding:8px 10px;border-top:1px solid rgba(15,23,42,0.12);text-align:right'>" +
        s.marginPct.toFixed(2) +
        "%</td>" +
        "<td style='padding:8px 10px;border-top:1px solid rgba(15,23,42,0.12);text-align:right'>" +
        formatCurrency(s.profit) +
        "</td>" +
        "<td style='padding:8px 10px;border-top:1px solid rgba(15,23,42,0.12);text-align:right'>" +
        sharePct +
        "%</td>" +
        "</tr>";
    }

    detailTable =
      "<div style='margin-top:12px;overflow-x:auto'>" +
      "<table style='border-collapse:collapse;width:100%;min-width:680px'>" +
      "<thead>" +
      "<tr>" +
      "<th style='text-align:left;padding:8px 10px;border-bottom:1px solid rgba(15,23,42,0.18)'>Segment</th>" +
      "<th style='text-align:right;padding:8px 10px;border-bottom:1px solid rgba(15,23,42,0.18)'>Revenue</th>" +
      "<th style='text-align:right;padding:8px 10px;border-bottom:1px solid rgba(15,23,42,0.18)'>Gross margin</th>" +
      "<th style='text-align:right;padding:8px 10px;border-bottom:1px solid rgba(15,23,42,0.18)'>Est. profit</th>" +
      "<th style='text-align:right;padding:8px 10px;border-bottom:1px solid rgba(15,23,42,0.18)'>Profit share</th>" +
      "</tr>" +
      "</thead>" +
      "<tbody>" +
      rows +
      "</tbody>" +
      "</table>" +
      "</div>";

    let headlineMetrics = "";
    if (completedCount === 1) {
      headlineMetrics =
        "<p style='margin:8px 0 0 0'><strong>Total estimated profit:</strong> " +
        formatCurrency(totalProfit) +
        "</p>";
    } else if (completedCount === 2) {
      headlineMetrics =
        "<p style='margin:8px 0 0 0'><strong>Total estimated profit:</strong> " +
        formatCurrency(totalProfit) +
        ". <strong>Top segment share:</strong> " +
        Math.round(top1Share * 100) +
        "%.</p>";
    } else {
      headlineMetrics =
        "<p style='margin:8px 0 0 0'><strong>Total estimated profit:</strong> " +
        formatCurrency(totalProfit) +
        ". <strong>Top segment share:</strong> " +
        Math.round(top1Share * 100) +
        "%. <strong>Top two share:</strong> " +
        Math.round(top2Share * 100) +
        "%.</p>";
    }

    const selectiveEngagementNote =
      "<p style='margin:14px 0 0 0'>" +
      "This calculator evaluates one narrow dimension of business structure: where profit is generated across revenue segments. " +
      "Deeper diagnostic work examines how profit drivers interact with cost structure, capital deployment, cash flow timing, revenue concentration, supplier dynamics, and forward operating scenarios. " +
      "Only a limited number of businesses are worked with at any given time because the analysis requires detailed operational understanding. " +
      "If this style of thinking matches how you analyse your business, use the Contact page to discuss scope and fit." +
      "</p>";

    resultContainer.innerHTML =
      "<div class='tool-report'>" +
      "<p><strong>Diagnostic Summary</strong></p>" +
      "<p>" +
      summaryText +
      "</p>" +
      headlineMetrics +
      entityLine +
      "<p style='margin-top:12px'><strong>Key Mechanics</strong></p>" +
      "<p>" +
      mechanicsText +
      "</p>" +
      detailTable +
      "<p style='margin-top:12px'><strong>Operational Interpretation</strong></p>" +
      "<p>" +
      interpretationText +
      "</p>" +
      "<p style='margin-top:12px'><strong>Structural Risk Observation</strong></p>" +
      "<p>" +
      riskText +
      "</p>" +
      "<p style='margin-top:12px'><strong>Management Questions</strong></p>" +
      questionsText +
      "<p style='margin-top:12px'><strong>Selective Engagement Note</strong></p>" +
      selectiveEngagementNote +
      "</div>";
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