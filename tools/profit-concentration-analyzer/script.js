document.addEventListener("DOMContentLoaded", function () {
  const calculateButton = document.getElementById("calculateButton");
  const shareButton = document.getElementById("shareWhatsAppButton");
  const resultContainer = document.getElementById("result");

  function showError(message) {
    resultContainer.innerHTML = "<p style='color:#b91c1c;font-weight:600'>" + message + "</p>";
  }

  function formatMoney(value) {
    const rounded = Math.round(value);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function toNumber(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return null;
    }
    return n;
  }

  function getTrimmed(value) {
    return String(value || "").trim();
  }

  function computeSegmentProfit(revenue, marginPercent) {
    return revenue * (marginPercent / 100);
  }

  function runDiagnostic() {
    resultContainer.innerHTML = "";

    const segments = [
      {
        name: getTrimmed(document.getElementById("segment1Name").value),
        revenueRaw: document.getElementById("segment1Revenue").value,
        marginRaw: document.getElementById("segment1Margin").value,
        required: true
      },
      {
        name: getTrimmed(document.getElementById("segment2Name").value),
        revenueRaw: document.getElementById("segment2Revenue").value,
        marginRaw: document.getElementById("segment2Margin").value,
        required: false
      },
      {
        name: getTrimmed(document.getElementById("segment3Name").value),
        revenueRaw: document.getElementById("segment3Revenue").value,
        marginRaw: document.getElementById("segment3Margin").value,
        required: false
      },
      {
        name: getTrimmed(document.getElementById("segment4Name").value),
        revenueRaw: document.getElementById("segment4Revenue").value,
        marginRaw: document.getElementById("segment4Margin").value,
        required: false
      },
      {
        name: getTrimmed(document.getElementById("segment5Name").value),
        revenueRaw: document.getElementById("segment5Revenue").value,
        marginRaw: document.getElementById("segment5Margin").value,
        required: false
      },
      {
        name: getTrimmed(document.getElementById("segment6Name").value),
        revenueRaw: document.getElementById("segment6Revenue").value,
        marginRaw: document.getElementById("segment6Margin").value,
        required: false
      }
    ];

    const validSegments = [];
    let missingRequired = false;

    for (let i = 0; i < segments.length; i += 1) {
      const s = segments[i];
      const revenue = toNumber(s.revenueRaw);
      const margin = toNumber(s.marginRaw);

      if (s.required) {
        if (!s.name || revenue === null || margin === null) {
          missingRequired = true;
        }
      }

      const hasAny = Boolean(s.name) || s.revenueRaw !== "" || s.marginRaw !== "";
      if (!hasAny) {
        continue;
      }

      if (!s.name || revenue === null || margin === null) {
        showError("Complete each entered segment with name, revenue, and gross margin percentage.");
        return;
      }

      if (revenue < 0) {
        showError("Revenue values must be zero or greater.");
        return;
      }

      if (margin < 0 || margin > 100) {
        showError("Gross margin percentage must be between 0 and 100.");
        return;
      }

      const profit = computeSegmentProfit(revenue, margin);

      validSegments.push({
        name: s.name,
        revenue: revenue,
        margin: margin,
        profit: profit
      });
    }

    if (missingRequired) {
      showError("Segment 1 is required. Enter a name, annual revenue, and gross margin percentage.");
      return;
    }

    if (validSegments.length === 0) {
      showError("Enter at least one complete segment to run the diagnostic.");
      return;
    }

    const completedCount = validSegments.length;

    let totalProfit = 0;
    for (let i = 0; i < validSegments.length; i += 1) {
      totalProfit += validSegments[i].profit;
    }

    if (totalProfit <= 0) {
      showError("Total estimated gross profit must be greater than zero to assess profit concentration.");
      return;
    }

    const sorted = validSegments.slice().sort(function (a, b) {
      return b.profit - a.profit;
    });

    const top1 = sorted[0];
    const top1Share = top1.profit / totalProfit;

    let top2 = null;
    let top2CombinedProfit = top1.profit;
    let top2CombinedShare = top1Share;

    if (completedCount >= 2) {
      top2 = sorted[1];
      top2CombinedProfit = top1.profit + top2.profit;
      top2CombinedShare = top2CombinedProfit / totalProfit;
    }

    function pct(value) {
      return Math.round(value * 1000) / 10;
    }

    function classifyConcentrationTop1(share) {
      if (share >= 0.7) {
        return "very high";
      }
      if (share >= 0.55) {
        return "high";
      }
      if (share >= 0.4) {
        return "moderate";
      }
      return "low";
    }

    function classifyConcentrationTop2(share) {
      if (share >= 0.85) {
        return "very high";
      }
      if (share >= 0.7) {
        return "high";
      }
      if (share >= 0.55) {
        return "moderate";
      }
      return "low";
    }

    const top1Level = classifyConcentrationTop1(top1Share);
    const top2Level = completedCount >= 2 ? classifyConcentrationTop2(top2CombinedShare) : null;

    let summaryLine = "";
    if (completedCount === 1) {
      summaryLine =
        "Based on the inputs provided, estimated total gross profit is " +
        formatMoney(totalProfit) +
        ", generated entirely by " +
        top1.name +
        ".";
    } else if (completedCount === 2) {
      summaryLine =
        "Estimated total gross profit is " +
        formatMoney(totalProfit) +
        ". " +
        top1.name +
        " generates " +
        pct(top1Share) +
        "% of total profit and both segments together generate " +
        pct(top2CombinedShare) +
        "%.";
    } else {
      summaryLine =
        "Estimated total gross profit is " +
        formatMoney(totalProfit) +
        ". " +
        top1.name +
        " generates " +
        pct(top1Share) +
        "% of total profit and the top two segments together generate " +
        pct(top2CombinedShare) +
        "%.";
    }

    function buildDistributionSentence() {
      if (completedCount <= 2) {
        return "";
      }

      const remainderShare = 1 - top2CombinedShare;
      const remainderPct = pct(remainderShare);

      if (remainderShare <= 0.15) {
        return "The remaining segments contribute only " + remainderPct + "% of profit, indicating a narrow profit base.";
      }

      if (remainderShare <= 0.35) {
        return "The remaining segments contribute " + remainderPct + "% of profit, providing limited diversification.";
      }

      return "The remaining segments contribute " + remainderPct + "% of profit, indicating a broader profit engine.";
    }

    function buildOperationalInterpretation() {
      if (completedCount === 1) {
        return (
          "When profit is generated by a single segment, day to day decisions tend to default to protecting that activity. " +
          "Pricing pressure, delivery issues, or supplier cost movement in that segment will disproportionately affect performance. " +
          "This structure can be efficient, but it concentrates management attention and reduces flexibility in planning."
        );
      }

      if (completedCount === 2) {
        if (top2CombinedShare >= 0.75) {
          return (
            "When most profit is produced by two segments, operational focus naturally concentrates around the drivers of those segments. " +
            "This often improves clarity on where to invest management time, but it can also hide weaker segments that consume capacity. " +
            "Margin management becomes more important than volume because profit is being carried by a limited set of activities."
          );
        }

        return (
          "With profit shared more evenly across two segments, pricing power and operational focus are not dependent on a single engine. " +
          "This typically creates more room to adjust pricing, renegotiate supplier terms, and shift operational capacity if conditions change. " +
          "The key is to keep visibility on which segment is actually carrying incremental profit at current margins."
        );
      }

      if (top2CombinedShare >= 0.85) {
        return (
          "A structure where the top two segments generate most profit usually means pricing discipline and cost control in those segments matter more than broad growth. " +
          "Management time should be aligned to the operational drivers that protect margin in those segments, not only to revenue volume. " +
          "If overhead is being built to support low profit segments, the effective profit engine can weaken without being obvious in headline revenue."
        );
      }

      if (top2CombinedShare >= 0.7) {
        return (
          "When the top two segments produce a large share of profit, capital allocation and senior attention typically need to follow those segments. " +
          "Operational planning should treat those segments as the core profit engine and ensure capacity, pricing controls, and supplier terms are managed tightly. " +
          "At the same time, the remaining segments should be tested for whether they are strategically useful or simply consuming resources."
        );
      }

      return (
        "When profit is distributed across several segments, performance is less dependent on any single revenue stream. " +
        "This tends to improve resilience because a pricing shock or supplier disruption in one area does not automatically collapse total profit. " +
        "The operational requirement is disciplined reporting so each segment remains visible and margin drift is detected early."
      );
    }

    function buildRiskObservation() {
      if (completedCount === 1) {
        return (
          "This result implies maximum profit concentration. If " +
          top1.name +
          " weakens due to competitor pricing, supplier cost increases, demand shifts, or execution issues, the business has limited internal profit buffers. " +
          "The practical risk is that management may misread overall stability because revenue can remain visible while margin deteriorates. " +
          "A concentrated profit base also increases dependency on the specific capabilities and suppliers that support that segment."
        );
      }

      if (completedCount === 2) {
        const level = top2Level;
        if (level === "very high" || level === "high") {
          return (
            "This shows " +
            level +
            " concentration across two segments. The business is exposed to disruption in either of those areas, including margin compression from supplier pricing, customer churn, or service delivery constraints. " +
            "If one segment deteriorates, the remaining segment must carry overhead and sustain cash generation, which can force reactive pricing decisions. " +
            "This structure benefits from scenario planning around margin sensitivity for both segments."
          );
        }

        return (
          "This shows a more balanced profit split across the two segments. The structural risk is lower because profit is not dependent on a single activity. " +
          "The main vulnerability is if one segment is actually more volatile and the other is implicitly subsidising overhead during downturns. " +
          "Management should track margin movement and volume dependence in each segment to avoid hidden concentration developing over time."
        );
      }

      if (top1Level === "very high" || top1Level === "high" || top2Level === "very high" || top2Level === "high") {
        return (
          "The profit structure indicates elevated concentration. A small number of segments are carrying most profit, which increases exposure to margin compression and operational disruption in those areas. " +
          "If the high profit segments face supplier price increases, customer renegotiations, or capacity constraints, the business can experience a rapid drop in total profit even if revenue looks stable. " +
          "This also creates a risk that low profit segments absorb operational time and working capital without materially supporting profit."
        );
      }

      return (
        "The profit structure indicates lower concentration. This reduces dependency risk because multiple segments contribute meaningful profit. " +
        "The primary risk in diversified structures is losing visibility and allowing margin drift across several segments without clear ownership. " +
        "Operators typically need segment level reporting that highlights profit contribution, not only revenue, to keep this resilience real."
      );
    }

    function buildManagementQuestions() {
      if (completedCount === 1) {
        return (
          "<ul style='margin:10px 0 0 18px'>" +
          "<li>What specific pricing and cost drivers determine the margin of " + top1.name + "?</li>" +
          "<li>If " + top1.name + " profit fell by 15%, what costs would become unaffordable?</li>" +
          "<li>Which suppliers or capabilities does " + top1.name + " depend on most?</li>" +
          "</ul>"
        );
      }

      if (completedCount === 2) {
        return (
          "<ul style='margin:10px 0 0 18px'>" +
          "<li>Which operational drivers explain why " + top1.name + " carries the largest profit share?</li>" +
          "<li>How sensitive is combined profit to margin compression in either segment?</li>" +
          "<li>Are we investing management time in the segments that actually generate profit?</li>" +
          "</ul>"
        );
      }

      return (
        "<ul style='margin:10px 0 0 18px'>" +
        "<li>Which drivers cause the top segments to generate most profit at current margins?</li>" +
        "<li>If the top segment margin compressed by 5 points, what would total profit become?</li>" +
        "<li>Are low profit segments consuming capacity or working capital without returns?</li>" +
        "</ul>"
      );
    }

    function buildSelectiveEngagementParagraph() {
      return (
        "This calculator evaluates only one narrow dimension of business structure: how gross profit is distributed across revenue segments. " +
        "Broader diagnostic work typically examines how profit drivers interact with cost structure, capital deployment, cash flow timing, revenue concentration, supplier dynamics, and forward operating scenarios. " +
        "That level of analysis requires structured financial data, consistent segment reporting, and careful modelling to test how results change under different assumptions. " +
        "Only a limited number of businesses are worked with at any given time because the work requires detailed operational understanding and direct engagement with management. " +
        "If the thinking behind this diagnostic matches how you view your business, use the Contact page to request a quote for a deeper structural diagnostic review."
      );
    }

    const distributionSentence = buildDistributionSentence();
    const tableRows = sorted
      .map(function (s) {
        const share = s.profit / totalProfit;
        return (
          "<tr>" +
          "<td style='padding:8px 10px;border-top:1px solid #e5e7eb'>" + s.name + "</td>" +
          "<td style='padding:8px 10px;border-top:1px solid #e5e7eb;text-align:right'>" + formatMoney(s.revenue) + "</td>" +
          "<td style='padding:8px 10px;border-top:1px solid #e5e7eb;text-align:right'>" + (Math.round(s.margin * 10) / 10) + "%</td>" +
          "<td style='padding:8px 10px;border-top:1px solid #e5e7eb;text-align:right'>" + formatMoney(s.profit) + "</td>" +
          "<td style='padding:8px 10px;border-top:1px solid #e5e7eb;text-align:right'>" + pct(share) + "%</td>" +
          "</tr>"
        );
      })
      .join("");

    let concentrationLine = "";
    if (completedCount === 1) {
      concentrationLine = "Concentration is necessarily maximal because only one segment is present.";
    } else if (completedCount === 2) {
      concentrationLine =
        "Profit concentration across the two segments is assessed as " +
        top2Level +
        " based on the combined share.";
    } else {
      concentrationLine =
        "Profit concentration is assessed as " +
        top1Level +
        " for the top segment and " +
        top2Level +
        " for the top two combined.";
    }

    const reportHtml =
      "<div style='margin-top:14px;padding:14px 16px;border:1px solid #e5e7eb;border-radius:10px;background:#ffffff'>" +
      "<p style='margin:0 0 10px 0;font-weight:700'>Diagnostic Summary</p>" +
      "<p style='margin:0 0 10px 0'>" + summaryLine + "</p>" +
      (distributionSentence ? "<p style='margin:0 0 10px 0'>" + distributionSentence + "</p>" : "") +
      "<p style='margin:0 0 10px 0'>" + concentrationLine + "</p>" +

      "<p style='margin:14px 0 10px 0;font-weight:700'>Operational Interpretation</p>" +
      "<p style='margin:0 0 10px 0'>" + buildOperationalInterpretation() + "</p>" +

      "<p style='margin:14px 0 10px 0;font-weight:700'>Structural Risk Observation</p>" +
      "<p style='margin:0 0 10px 0'>" + buildRiskObservation() + "</p>" +

      "<p style='margin:14px 0 10px 0;font-weight:700'>Management Questions</p>" +
      buildManagementQuestions() +

      "<p style='margin:14px 0 10px 0;font-weight:700'>Segment Profit Breakdown</p>" +
      "<div style='overflow-x:auto'>" +
      "<table style='width:100%;border-collapse:collapse'>" +
      "<thead>" +
      "<tr>" +
      "<th style='text-align:left;padding:8px 10px;border-bottom:1px solid #e5e7eb'>Segment</th>" +
      "<th style='text-align:right;padding:8px 10px;border-bottom:1px solid #e5e7eb'>Revenue</th>" +
      "<th style='text-align:right;padding:8px 10px;border-bottom:1px solid #e5e7eb'>Gross Margin</th>" +
      "<th style='text-align:right;padding:8px 10px;border-bottom:1px solid #e5e7eb'>Estimated Profit</th>" +
      "<th style='text-align:right;padding:8px 10px;border-bottom:1px solid #e5e7eb'>Share of Profit</th>" +
      "</tr>" +
      "</thead>" +
      "<tbody>" +
      tableRows +
      "</tbody>" +
      "</table>" +
      "</div>" +

      "<p style='margin:14px 0 0 0'>" + buildSelectiveEngagementParagraph() + "</p>" +
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