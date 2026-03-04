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

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function readNumber(id) {
    const el = document.getElementById(id);
    if (!el) {
      return null;
    }
    const raw = String(el.value || "").trim();
    if (raw === "") {
      return null;
    }
    const num = Number(raw);
    if (!Number.isFinite(num)) {
      return null;
    }
    return num;
  }

  function runDiagnostic() {
    resultContainer.innerHTML = "";

    const segments = [];
    const issues = [];

    for (let i = 1; i <= 6; i++) {
      const revenue = readNumber("segment" + i + "Revenue");
      const margin = readNumber("segment" + i + "Margin");

      const revenueProvided = revenue !== null;
      const marginProvided = margin !== null;

      if (i === 1) {
        if (!revenueProvided || !marginProvided) {
          showError("Segment 1 requires both annual revenue and gross margin percentage.");
          return;
        }
      }

      if (revenueProvided !== marginProvided) {
        issues.push("Segment " + i + " must include both revenue and margin, or be left blank.");
        continue;
      }

      if (!revenueProvided && !marginProvided) {
        continue;
      }

      if (revenue <= 0) {
        issues.push("Segment " + i + " revenue must be greater than zero.");
        continue;
      }

      if (margin < 0 || margin > 100) {
        issues.push("Segment " + i + " margin must be between 0 and 100.");
        continue;
      }

      const marginRate = margin / 100;
      const profit = revenue * marginRate;

      segments.push({
        index: i,
        revenue: revenue,
        margin: margin,
        profit: profit
      });
    }

    if (issues.length > 0) {
      showError(issues[0]);
      return;
    }

    const completedCount = segments.length;

    if (completedCount < 1) {
      showError("Enter at least one complete segment to run the diagnostic.");
      return;
    }

    let totalProfit = 0;
    let totalRevenue = 0;

    for (let i = 0; i < segments.length; i++) {
      totalProfit += segments[i].profit;
      totalRevenue += segments[i].revenue;
    }

    if (!Number.isFinite(totalProfit) || totalProfit <= 0) {
      showError("Total estimated gross profit must be greater than zero to interpret concentration.");
      return;
    }

    const sortedByProfit = segments.slice().sort(function (a, b) {
      return b.profit - a.profit;
    });

    const top = sortedByProfit[0];
    const topShare = top.profit / totalProfit;

    let topTwoProfit = top.profit;
    if (completedCount >= 2) {
      topTwoProfit += sortedByProfit[1].profit;
    }
    const topTwoShare = topTwoProfit / totalProfit;

    let concentrationLabel = "moderate";
    if (completedCount === 1) {
      concentrationLabel = "absolute";
    } else if (topShare >= 0.65 || topTwoShare >= 0.85) {
      concentrationLabel = "high";
    } else if (topShare >= 0.45 || topTwoShare >= 0.70) {
      concentrationLabel = "moderate";
    } else {
      concentrationLabel = "low";
    }

    const topProfitMoney = formatMoney(top.profit);
    const totalProfitMoney = formatMoney(totalProfit);

    const topSharePct = Math.round(clamp(topShare * 100, 0, 100));
    const topTwoSharePct = Math.round(clamp(topTwoShare * 100, 0, 100));

    let summary = "";
    if (completedCount === 1) {
      summary =
        "Based on the single segment entered, 100% of estimated gross profit is produced by Segment " +
        top.index +
        ". This is not a diversification result, it is simply the structure you provided.";
    } else if (completedCount === 2) {
      summary =
        "Estimated gross profit is concentrated, with Segment " +
        top.index +
        " producing " +
        topSharePct +
        "% of total profit. Both segments together produce " +
        topTwoSharePct +
        "% of total profit.";
    } else {
      summary =
        "Estimated gross profit concentration shows Segment " +
        top.index +
        " produces " +
        topSharePct +
        "% of total profit. The top two segments together produce " +
        topTwoSharePct +
        "% of total profit.";
    }

    let interpretation = "";
    if (completedCount === 1) {
      interpretation =
        "Operationally, this means your profit engine is defined by one activity in the data entered. Any pricing pressure, cost shift, or volume decline in that activity will flow straight through to the business because there is no second profit source in the model.";
    } else if (concentrationLabel === "high") {
      if (completedCount === 2) {
        interpretation =
          "This structure usually means management attention, pricing decisions, and commercial energy should be anchored to the segments that actually generate profit. It also means supplier costs and discounting in the dominant segment can move total profit far more than changes elsewhere.";
      } else {
        interpretation =
          "This structure usually means management attention, pricing decisions, and commercial energy should be anchored to the segments that actually generate profit. It also means supplier costs, discounting, or operational disruption in the leading segments can move total profit far more than changes elsewhere.";
      }
    } else if (concentrationLabel === "low") {
      interpretation =
        "This structure suggests profit is more broadly distributed across the activities entered. In practice that often creates resilience because weakness in one area is less likely to collapse the total profit base, and it gives management more degrees of freedom when reallocating resources.";
    } else {
      interpretation =
        "This structure sits between resilience and dependency. Profit is not fully concentrated, but a limited set of segments still carry a disproportionate share, which means operators should understand which operational levers protect those margins and which decisions erode them.";
    }

    let risk = "";
    if (completedCount === 1) {
      risk =
        "The main structural risk is single-point dependency. If Segment " +
        top.index +
        " weakens, there is no secondary profit engine in the entered structure to stabilise the business, which can force reactive pricing, rushed cost cuts, or deferred maintenance and investment.";
    } else if (concentrationLabel === "high") {
      if (completedCount === 2) {
        risk =
          "High profit concentration increases exposure to disruption in the segment that funds the business. If pricing power deteriorates, a key customer reduces orders, or direct costs rise, the impact is amplified because there are limited alternative profit sources in the entered structure.";
      } else {
        risk =
          "High profit concentration increases exposure to disruption in the segments that fund the business. If pricing power deteriorates, a key customer group shifts, or direct costs rise in those areas, the impact is amplified because the remaining segments do not carry enough profit weight to stabilise outcomes.";
      }
    } else if (concentrationLabel === "low") {
      risk =
        "Lower concentration reduces dependency risk, but it can hide operational inefficiency if management does not know which segments deserve investment. The risk shifts from dependency to dilution, where capacity and attention are spread too evenly and the best profit drivers are not protected.";
    } else {
      risk =
        "Moderate concentration creates mixed risk. The business has more than one profit source, but profit is still sensitive to performance in a limited number of segments, so margin leakage or cost creep in those areas can quietly erode total results.";
    }

    const questionItems = [];
    if (completedCount === 1) {
      questionItems.push(
        "What specific pricing and direct cost drivers determine Segment " + top.index + " gross margin?"
      );
      questionItems.push(
        "If Segment " + top.index + " profit dropped by 20%, what costs or commitments become unaffordable?"
      );
      questionItems.push(
        "Which new segment could be built to create a second profit engine over time?"
      );
    } else if (concentrationLabel === "high") {
      if (completedCount === 2) {
        questionItems.push(
          "Which operational drivers most strongly influence profit in Segment " + top.index + "?"
        );
        questionItems.push(
          "Are discounting, rebates, or supplier price increases eroding the dominant segment margin?"
        );
        questionItems.push(
          "What would the business do if the leading segment weakened for two quarters?"
        );
      } else {
        questionItems.push(
          "Which operational drivers most strongly influence profit in the top segment and the next strongest segment?"
        );
        questionItems.push(
          "Are management time, service levels, and inventory aligned to protect those profit contributors?"
        );
        questionItems.push(
          "If the leading segments weakened, which remaining segments could realistically absorb capacity and sustain profit?"
        );
      }
    } else if (concentrationLabel === "low") {
      questionItems.push(
        "Which segments have the highest margins relative to their operational effort?"
      );
      questionItems.push(
        "Are there segments that generate revenue but consume capacity with weak profit contribution?"
      );
      questionItems.push(
        "Where should capital and management focus be increased based on profit contribution?"
      );
    } else {
      questionItems.push(
        "Which segments are most sensitive to small changes in margin percentage?"
      );
      questionItems.push(
        "Are any segments being prioritised operationally despite weak profit contribution?"
      );
      questionItems.push(
        "What decisions would materially increase profit share in the strongest segments without damaging cash flow?"
      );
    }

    const segmentLines = [];
    for (let i = 0; i < sortedByProfit.length; i++) {
      const s = sortedByProfit[i];
      const share = s.profit / totalProfit;
      const sharePct = Math.round(clamp(share * 100, 0, 100));
      segmentLines.push(
        "<li>Segment " +
          s.index +
          ": estimated gross profit " +
          formatMoney(s.profit) +
          " (" +
          sharePct +
          "% of total)</li>"
      );
    }

    const topDetailLine =
      "Segment " +
      top.index +
      " estimated gross profit is " +
      topProfitMoney +
      " out of total " +
      totalProfitMoney +
      ".";

    const questionsHtml =
      "<ul>" +
      "<li>" + questionItems[0] + "</li>" +
      "<li>" + questionItems[1] + "</li>" +
      "<li>" + questionItems[2] + "</li>" +
      "</ul>";

    const segmentBreakdownHtml = "<ul>" + segmentLines.join("") + "</ul>";

    let selectiveEngagement = "";
    selectiveEngagement =
      "This calculator tests only one narrow dimension of business structure: how gross profit is distributed across revenue segments. Broader diagnostic work performed by MJB Strategic examines how profit drivers interact with cost structure, capital deployment, cash flow timing, revenue concentration, supplier dynamics, and forward operating scenarios. That work requires structured financial data, careful modelling, and an accurate operational understanding of what drives margin and cash inside the business. Only a limited number of businesses are worked with at any given time because the analysis is detailed and execution-oriented. If the thinking behind this diagnostic matches how you view your business, you can explore whether there may be scope to work together by using the Contact page to request a quote for a deeper structural diagnostic review.";

    let html = "";
    html += "<div style='max-width:920px;margin:18px auto 0 auto'>";
    html += "<p><strong>Diagnostic Summary</strong></p>";
    html += "<p>" + summary + "</p>";
    html += "<p>" + topDetailLine + "</p>";
    html += "<p><strong>Operational Interpretation</strong></p>";
    html += "<p>" + interpretation + "</p>";
    html += "<p><strong>Structural Risk Observation</strong></p>";
    html += "<p>" + risk + "</p>";
    html += "<p><strong>Profit Contribution Breakdown</strong></p>";
    html += segmentBreakdownHtml;
    html += "<p><strong>Management Questions</strong></p>";
    html += questionsHtml;
    html += "<p>" + selectiveEngagement + "</p>";
    html += "</div>";

    resultContainer.innerHTML = html;
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