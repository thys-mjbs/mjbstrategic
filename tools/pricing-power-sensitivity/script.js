document.addEventListener("DOMContentLoaded", function () {

  const calculateButton = document.getElementById("calculateButton");
  const shareButton = document.getElementById("shareWhatsAppButton");
  const resultContainer = document.getElementById("result");

  function showError(message) {
    resultContainer.innerHTML =
      "<p style='color:#b91c1c;font-weight:600'>" + message + "</p>";
  }

  function runDiagnostic() {

    const annualRevenue = Number(document.getElementById("annualRevenue").value);
    const grossMarginPct = Number(document.getElementById("grossMarginPct").value);
    const demandChangePer1Pct = Number(document.getElementById("demandChangePer1Pct").value);

    if (!Number.isFinite(annualRevenue) || !Number.isFinite(grossMarginPct) || !Number.isFinite(demandChangePer1Pct)) {
      showError("Enter valid numeric values in all required fields.");
      return;
    }

    if (annualRevenue <= 0) {
      showError("Annual revenue must be greater than zero.");
      return;
    }

    if (grossMarginPct <= 0 || grossMarginPct > 100) {
      showError("Gross margin must be between 1 and 100.");
      return;
    }

    if (demandChangePer1Pct < -100 || demandChangePer1Pct > 100) {
      showError("Demand change must be between -100 and 100.");
      return;
    }

    const marginDecimal = grossMarginPct / 100;
    const baseProfit = annualRevenue * marginDecimal;

    const demandPer1Decimal = demandChangePer1Pct / 100;

    const scenarioPercents = [2, 3, 5];
    const scenarios = [];

    for (let i = 0; i < scenarioPercents.length; i += 1) {

      const priceIncreasePct = scenarioPercents[i];
      const priceIncreaseDecimal = priceIncreasePct / 100;

      const demandTotalDecimal = demandPer1Decimal * priceIncreasePct;
      const demandMultiplier = 1 + demandTotalDecimal;

      const newRevenue = annualRevenue * (1 + priceIncreaseDecimal) * demandMultiplier;
      const newProfit = newRevenue * marginDecimal;

      const profitDelta = newProfit - baseProfit;

      const breakEvenDemandMultiplier = 1 / (1 + priceIncreaseDecimal);
      const breakEvenDemandTotalDecimal = breakEvenDemandMultiplier - 1;

      scenarios.push({
        priceIncreaseDecimal: priceIncreaseDecimal,
        demandTotalDecimal: demandTotalDecimal,
        newRevenue: newRevenue,
        newProfit: newProfit,
        profitDelta: profitDelta,
        breakEvenDemandTotalDecimal: breakEvenDemandTotalDecimal
      });

    }

    let completedCount = 0;

    for (let j = 0; j < scenarios.length; j += 1) {
      completedCount += 1;
    }

    const scenariosSorted = scenarios.slice().sort(function (a, b) {
      return b.profitDelta - a.profitDelta;
    });

    const best = scenariosSorted[0];
    const second = scenariosSorted.length > 1 ? scenariosSorted[1] : null;

    let positiveCount = 0;

    for (let k = 0; k < scenarios.length; k += 1) {
      if (scenarios[k].profitDelta > 0) {
        positiveCount += 1;
      }
    }

    let pricingPowerLabel = "Unclear pricing power";
    let pricingPowerReason = "Your demand response assumption makes outcomes mixed across small price changes.";

    if (positiveCount === scenarios.length) {
      pricingPowerLabel = "Pricing power present";
      pricingPowerReason = "All tested price increases improve estimated profit under your demand response assumption.";
    }

    if (positiveCount === 0) {
      pricingPowerLabel = "Low pricing power";
      pricingPowerReason = "All tested price increases reduce estimated profit under your demand response assumption.";
    }

    const baseProfitRounded = Math.round(baseProfit);
    const marginPctRounded = Math.round(marginDecimal * 100);

    let entitySentence = "";

    if (completedCount === 1) {
      entitySentence =
        "Only one scenario is evaluated.";
    } else if (completedCount === 2) {
      entitySentence =
        "Both scenarios are evaluated side by side.";
    } else {
      const remainder = completedCount - 2;
      entitySentence =
        "Top two scenarios are highlighted, with " + remainder + " additional scenario" + (remainder === 1 ? "" : "s") + " included.";
    }

    function formatScenarioRow(s) {

      const priceIncPct = Math.round(s.priceIncreaseDecimal * 100);
      const demandTotalPct = Math.round(s.demandTotalDecimal * 100);
      const revenueRounded = Math.round(s.newRevenue);
      const profitRounded = Math.round(s.newProfit);
      const deltaRounded = Math.round(s.profitDelta);
      const breakEvenDemandPct = Math.round(s.breakEvenDemandTotalDecimal * 100);

      const deltaText = deltaRounded >= 0 ? "+" + deltaRounded : String(deltaRounded);

      return (
        "<tr>" +
          "<td style='padding:10px 8px;border-bottom:1px solid rgba(148,163,184,0.35)'>" + priceIncPct + "%</td>" +
          "<td style='padding:10px 8px;border-bottom:1px solid rgba(148,163,184,0.35)'>" + demandTotalPct + "%</td>" +
          "<td style='padding:10px 8px;border-bottom:1px solid rgba(148,163,184,0.35)'>" + breakEvenDemandPct + "%</td>" +
          "<td style='padding:10px 8px;border-bottom:1px solid rgba(148,163,184,0.35)'>" + revenueRounded + "</td>" +
          "<td style='padding:10px 8px;border-bottom:1px solid rgba(148,163,184,0.35)'>" + profitRounded + "</td>" +
          "<td style='padding:10px 8px;border-bottom:1px solid rgba(148,163,184,0.35)'>" + deltaText + "</td>" +
        "</tr>"
      );

    }

    let mechanicsHighlight = "";

    if (completedCount >= 3 && second) {

      const bestPriceIncPct = Math.round(best.priceIncreaseDecimal * 100);
      const bestDeltaRounded = Math.round(best.profitDelta);

      const secondPriceIncPct = Math.round(second.priceIncreaseDecimal * 100);
      const secondDeltaRounded = Math.round(second.profitDelta);

      mechanicsHighlight =
        "Best scenario is a " + bestPriceIncPct + "% increase with profit change of " +
        (bestDeltaRounded >= 0 ? "+" + bestDeltaRounded : String(bestDeltaRounded)) +
        ". Second best is " + secondPriceIncPct + "% with profit change of " +
        (secondDeltaRounded >= 0 ? "+" + secondDeltaRounded : String(secondDeltaRounded)) + ".";

    } else if (completedCount === 2 && second) {

      mechanicsHighlight =
        "Two scenarios were compared and ranked by profit change.";

    } else {

      mechanicsHighlight =
        "Scenario outcomes are computed from revenue, margin, and demand response.";

    }

    let structuralRisk = "";

    if (positiveCount === 0) {
      structuralRisk =
        "Your assumed demand sensitivity overwhelms the price uplift, so profit falls even when pricing increases. If this is accurate, discount control, retention, and product mix matter more than list price moves.";
    } else if (positiveCount < scenarios.length) {
      structuralRisk =
        "Profit gains depend on keeping demand loss below the break-even threshold. If discounting, churn, or competitor responses are not tracked tightly, the business can misread pricing as a win while orders and margin quality deteriorate.";
    } else {
      structuralRisk =
        "The model suggests pricing uplift can improve profit without more volume, but the risk is execution drift. If your sales team offsets increases with discounts or longer terms, the realised pricing power will be lower than the scenario.";
    }

    const managementQuestions =
      "<ol style='margin:10px 0 0 18px'>" +
        "<li>Where can pricing tighten first without triggering customer churn by segment or channel?</li>" +
        "<li>What discount rules and approvals stop price increases being given back in negotiations?</li>" +
        "<li>Do supplier terms, delivery capacity, or service levels constrain a clean price change rollout?</li>" +
      "</ol>";

    const tableHeader =
      "<table style='width:100%;border-collapse:collapse;margin-top:10px'>" +
        "<thead>" +
          "<tr>" +
            "<th style='text-align:left;padding:10px 8px;border-bottom:1px solid rgba(148,163,184,0.6)'>Price increase</th>" +
            "<th style='text-align:left;padding:10px 8px;border-bottom:1px solid rgba(148,163,184,0.6)'>Demand change</th>" +
            "<th style='text-align:left;padding:10px 8px;border-bottom:1px solid rgba(148,163,184,0.6)'>Break-even demand</th>" +
            "<th style='text-align:left;padding:10px 8px;border-bottom:1px solid rgba(148,163,184,0.6)'>New revenue</th>" +
            "<th style='text-align:left;padding:10px 8px;border-bottom:1px solid rgba(148,163,184,0.6)'>New profit</th>" +
            "<th style='text-align:left;padding:10px 8px;border-bottom:1px solid rgba(148,163,184,0.6)'>Profit change</th>" +
          "</tr>" +
        "</thead>" +
        "<tbody>";

    let rows = "";

    for (let t = 0; t < scenarios.length; t += 1) {
      rows += formatScenarioRow(scenarios[t]);
    }

    const tableFooter =
        "</tbody>" +
      "</table>";

    const selectiveEngagementNote =
      "This calculator evaluates one narrow dimension of business structure: how price changes interact with demand assumptions to shift profit. Deeper diagnostics examine profit drivers, cost structure, capital deployment, cash flow timing, revenue concentration, supplier dynamics, and forward operating scenarios. If this diagnostic thinking resonates, use the Contact page to discuss fit and scope.";

    resultContainer.innerHTML =
      "<div class='tool-result'>" +
        "<p><strong>Diagnostic Summary</strong></p>" +
        "<p>Base profit is " + baseProfitRounded + " at a " + marginPctRounded + "% gross margin. " +
        pricingPowerLabel + ": " + pricingPowerReason + " " + entitySentence + "</p>" +

        "<p><strong>Key Mechanics</strong></p>" +
        "<p>Profit moves in this model are driven by the price uplift multiplied by the demand response you supplied, with gross margin held constant. " +
        "Break-even demand shows the total demand drop that would cancel the revenue uplift for each price move. " + mechanicsHighlight + "</p>" +

        "<p><strong>Operational Interpretation</strong></p>" +
        "<p>If orders are steady and discounts are controlled, a small price increase lifts profit across every invoice with no extra capacity load. " +
        "If demand falls faster than expected or sales concessions increase, the price move can look positive in headline revenue but weaken margin quality and customer retention.</p>" +

        "<p><strong>Structural Risk Observation</strong></p>" +
        "<p>" + structuralRisk + "</p>" +

        "<p><strong>Management Questions</strong></p>" +
        managementQuestions +

        "<p><strong>Selective Engagement Note</strong></p>" +
        "<p>" + selectiveEngagementNote + "</p>" +

        tableHeader +
        rows +
        tableFooter +
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