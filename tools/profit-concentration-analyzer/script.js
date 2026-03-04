document.addEventListener("DOMContentLoaded", function () {
  const calculateButton = document.getElementById("calculateButton");
  const shareButton = document.getElementById("shareWhatsAppButton");
  const resultContainer = document.getElementById("result");

  function showError(message) {
    resultContainer.innerHTML = "<p style='color:#b91c1c;font-weight:600'>" + message + "</p>";
  }

  function formatCurrency(value) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  function formatPercent(value) {
    return (value * 100).toFixed(1) + "%";
  }

  function getTextValue(id) {
    const el = document.getElementById(id);
    return (el && el.value ? el.value.trim() : "");
  }

  function getNumberValue(id) {
    const el = document.getElementById(id);
    if (!el) {
      return null;
    }
    const raw = (el.value || "").trim();
    if (!raw) {
      return null;
    }
    const num = Number(raw);
    if (!Number.isFinite(num)) {
      return null;
    }
    return num;
  }

  function buildSegment(index, isRequired) {
    const name = getTextValue("segment" + index + "Name");
    const revenue = getNumberValue("segment" + index + "Revenue");
    const margin = getNumberValue("segment" + index + "Margin");

    const anyProvided = Boolean(name) || revenue !== null || margin !== null;

    if (isRequired) {
      if (!name) {
        return { error: "Segment 1 Name is required." };
      }
      if (revenue === null || revenue <= 0) {
        return { error: "Segment 1 Annual Revenue must be greater than zero." };
      }
      if (margin === null || margin < 0 || margin > 100) {
        return { error: "Segment 1 Gross Margin % must be between 0 and 100." };
      }
      return {
        ok: true,
        name: name,
        revenue: revenue,
        margin: margin,
        profit: revenue * (margin / 100)
      };
    }

    if (!anyProvided) {
      return { ok: false };
    }

    if (!name) {
      return { error: "Each optional segment must include a name if used." };
    }
    if (revenue === null || revenue <= 0) {
      return { error: "Each optional segment must include revenue greater than zero if used." };
    }
    if (margin === null || margin < 0 || margin > 100) {
      return { error: "Each optional segment must include a gross margin % between 0 and 100 if used." };
    }

    return {
      ok: true,
      name: name,
      revenue: revenue,
      margin: margin,
      profit: revenue * (margin / 100)
    };
  }

  function runDiagnostic() {
    resultContainer.innerHTML = "";

    const segments = [];
    const first = buildSegment(1, true);
    if (first.error) {
      showError(first.error);
      return;
    }
    segments.push(first);

    for (let i = 2; i <= 6; i += 1) {
      const seg = buildSegment(i, false);
      if (seg.error) {
        showError(seg.error);
        return;
      }
      if (seg.ok) {
        segments.push(seg);
      }
    }

    const completedCount = segments.length;

    let totalProfit = 0;
    for (let i = 0; i < segments.length; i += 1) {
      totalProfit += segments[i].profit;
    }

    if (!Number.isFinite(totalProfit) || totalProfit <= 0) {
      showError("Total estimated profit must be greater than zero to evaluate concentration.");
      return;
    }

    segments.sort(function (a, b) {
      return b.profit - a.profit;
    });

    const top1 = segments[0];
    const top1Share = top1.profit / totalProfit;

    let top2Share = null;
    let top2CombinedProfit = null;
    let second = null;

    if (completedCount >= 2) {
      second = segments[1];
      top2CombinedProfit = top1.profit + second.profit;
      top2Share = top2CombinedProfit / totalProfit;
    }

    let summaryLine = "";
    if (completedCount === 1) {
      summaryLine =
        "Only one segment is included, so 100% of estimated profit is attributed to " + top1.name + ".";
    } else if (completedCount === 2) {
      summaryLine =
        top1.name +
        " contributes " +
        formatPercent(top1Share) +
        " of total estimated profit. Both segments together account for 100% by definition.";
    } else {
      summaryLine =
        top1.name +
        " contributes " +
        formatPercent(top1Share) +
        " of total estimated profit, and the top two segments combined contribute " +
        formatPercent(top2Share) +
        ".";
    }

    let interpretation = "";
    if (completedCount === 1) {
      interpretation =
        "With a single profit engine, management attention, pricing discipline, and delivery quality are all concentrated on one activity. This can be efficient, but it also means there is no internal offset if margin weakens or volume falls in that activity.";
    } else if (completedCount === 2) {
      interpretation =
        "When profit is split across two segments, operational focus is often pulled between two different pricing logics, delivery constraints, and customer expectations. The higher profit segment usually sets the pace for cash generation and management attention.";
    } else {
      interpretation =
        "When one or two segments generate a large share of profit, the business tends to optimise around those activities, often shaping pricing power, supplier leverage, and where management time is spent. A broader spread usually supports steadier decision making because performance is not hostage to one segment’s margin.";
    }

    const highConcentrationThreshold = 0.6;
    const moderateConcentrationThreshold = 0.4;

    let risk = "";
    let concentrationLabel = "";

    if (completedCount === 1) {
      concentrationLabel = "fully concentrated";
      risk =
        "The structural risk is dependency. If the margin in " +
        top1.name +
        " compresses due to input cost increases or discounting pressure, total profit declines immediately with no internal buffer.";
    } else if (completedCount === 2) {
      if (top1Share >= highConcentrationThreshold) {
        concentrationLabel = "highly concentrated";
        risk =
          "The structural risk is that " +
          top1.name +
          " is carrying most of the profit burden. If that segment weakens, the remaining segment is unlikely to absorb the shock without pricing changes or cost reductions.";
      } else if (top1Share >= moderateConcentrationThreshold) {
        concentrationLabel = "moderately concentrated";
        risk =
          "The structure suggests a clear lead segment, but not a single point of failure. Risk still exists if " +
          top1.name +
          " has volatile pricing, supplier exposure, or delivery capacity constraints.";
      } else {
        concentrationLabel = "broadly distributed";
        risk =
          "The structure appears more resilient because profit is not dominated by one segment. The main risk shifts to execution: maintaining consistent margin discipline across multiple segments without hidden cross-subsidies.";
      }
    } else {
      if (top2Share >= 0.75 || top1Share >= highConcentrationThreshold) {
        concentrationLabel = "highly concentrated";
        risk =
          "High concentration increases vulnerability to disruption. If the leading segment weakens, the profit base can drop faster than revenue, forcing reactive pricing decisions, rushed cost cuts, or deferred investment.";
      } else if (top2Share >= 0.55 || top1Share >= moderateConcentrationThreshold) {
        concentrationLabel = "moderately concentrated";
        risk =
          "Moderate concentration can be healthy if the leading segments are well defended, but it still creates exposure to supplier pricing moves, customer churn, or capacity constraints in the segments doing most of the profit work.";
      } else {
        concentrationLabel = "broadly distributed";
        risk =
          "Lower concentration generally improves resilience because multiple segments contribute meaningful profit. The trade-off is that management must maintain discipline across a wider set of pricing and delivery decisions.";
      }
    }

    let questions = [];
    if (completedCount === 1) {
      questions = [
        "Which operational drivers most directly move gross margin in " + top1.name + "?",
        "If gross margin fell by five points, what cost or pricing actions are available?",
        "What early-warning signals would show this segment is weakening?"
      ];
    } else if (completedCount === 2) {
      questions = [
        "What protects the gross margin of " + top1.name + " from discounting or cost pressure?",
        "Are overhead and management attention aligned with where profit is actually generated?",
        "If " + top1.name + " weakened, which actions would stabilise profit fastest?"
      ];
    } else {
      questions = [
        "Are the segments generating most profit also receiving the most management attention?",
        "Which supplier or input costs most threaten gross margin in the top profit segments?",
        "If the top segment weakened, which other segments could realistically carry more profit?"
      ];
    }

    let segmentTableRows = "";
    for (let i = 0; i < segments.length; i += 1) {
      const s = segments[i];
      const share = s.profit / totalProfit;
      segmentTableRows +=
        "<tr>" +
        "<td style='padding:8px 10px;border-bottom:1px solid #e5e7eb'>" +
        s.name +
        "</td>" +
        "<td style='padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right'>" +
        formatCurrency(s.revenue) +
        "</td>" +
        "<td style='padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right'>" +
        s.margin.toFixed(1) +
        "%</td>" +
        "<td style='padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right'>" +
        formatCurrency(s.profit) +
        "</td>" +
        "<td style='padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right'>" +
        formatPercent(share) +
        "</td>" +
        "</tr>";
    }

    let concentrationSentence = "";
    if (completedCount === 1) {
      concentrationSentence =
        "Based on the segments provided, the profit structure is " + concentrationLabel + ".";
    } else if (completedCount === 2) {
      concentrationSentence =
        "Based on the segments provided, the profit structure is " + concentrationLabel + " around the leading segment.";
    } else {
      concentrationSentence =
        "Based on the segments provided, the profit structure is " + concentrationLabel + " across the segment set.";
    }

    const reportHtml =
      "<div style='margin-top:14px'>" +
      "<h3 style='margin:0 0 8px 0'>Diagnostic Summary</h3>" +
      "<p style='margin:0 0 10px 0'>" +
      summaryLine +
      "</p>" +
      "<p style='margin:0 0 10px 0'>" +
      concentrationSentence +
      "</p>" +
      "<div style='overflow-x:auto;margin:10px 0 14px 0'>" +
      "<table style='width:100%;border-collapse:collapse;min-width:620px'>" +
      "<thead>" +
      "<tr>" +
      "<th style='text-align:left;padding:8px 10px;border-bottom:1px solid #e5e7eb'>Segment</th>" +
      "<th style='text-align:right;padding:8px 10px;border-bottom:1px solid #e5e7eb'>Revenue</th>" +
      "<th style='text-align:right;padding:8px 10px;border-bottom:1px solid #e5e7eb'>Gross Margin</th>" +
      "<th style='text-align:right;padding:8px 10px;border-bottom:1px solid #e5e7eb'>Estimated Profit</th>" +
      "<th style='text-align:right;padding:8px 10px;border-bottom:1px solid #e5e7eb'>Profit Share</th>" +
      "</tr>" +
      "</thead>" +
      "<tbody>" +
      segmentTableRows +
      "</tbody>" +
      "</table>" +
      "</div>" +
      "<h3 style='margin:0 0 8px 0'>Operational Interpretation</h3>" +
      "<p style='margin:0 0 12px 0'>" +
      interpretation +
      "</p>" +
      "<h3 style='margin:0 0 8px 0'>Structural Risk Observation</h3>" +
      "<p style='margin:0 0 12px 0'>" +
      risk +
      "</p>" +
      "<h3 style='margin:0 0 8px 0'>Management Questions</h3>" +
      "<ul style='margin:0 0 14px 18px'>" +
      "<li style='margin:6px 0'>" + questions[0] + "</li>" +
      "<li style='margin:6px 0'>" + questions[1] + "</li>" +
      "<li style='margin:6px 0'>" + questions[2] + "</li>" +
      "</ul>" +
      "<p style='margin:0'>" +
      "This calculator evaluates only one narrow dimension of business structure: how gross profit is distributed across revenue segments. The broader diagnostic work performed by MJB Strategic examines the interaction between profit drivers, cost structure, capital deployment, cash flow timing, revenue concentration, supplier dynamics, and forward operating scenarios. That work requires structured financial data and careful modelling. Only a limited number of businesses are worked with at any given time because the analysis requires detailed operational understanding. If the thinking behind this diagnostic matches how you view your business, use the Contact page to get in touch and request a quote for a deeper structural diagnostic review." +
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