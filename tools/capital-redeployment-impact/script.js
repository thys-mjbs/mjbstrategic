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

  function parseNum(str) {
    return Number(String(str).replace(/,/g, ""));
  }

  function attachNumFormat(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.type = "text";
    el.inputMode = "numeric";
    el.addEventListener("blur", function () {
      var raw = this.value.replace(/[^0-9.-]/g, "");
      if (raw === "" || raw === "-") return;
      var parts = raw.split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      this.value = parts.join(".");
    });
    el.addEventListener("focus", function () {
      this.value = this.value.replace(/,/g, "");
    });
  }

  ["assetValue","currentOperatingProfit","annualRevenue"].forEach(attachNumFormat);

  function runDiagnostic() {

    resultContainer.innerHTML = "";

    /* INPUT COLLECTION */

    const assetValue = parseNum(document.getElementById("assetValue").value);
    const currentReturnPct = Number(document.getElementById("currentReturnPct").value);
    const alternativeReturnPct = Number(document.getElementById("alternativeReturnPct").value);
    const currentOperatingProfit = parseNum(document.getElementById("currentOperatingProfit").value);
    const annualRevenue = parseNum(document.getElementById("annualRevenue").value);
    const liquidationDiscountPct = Number(document.getElementById("liquidationDiscountPct").value);
    const transactionCostsPct = Number(document.getElementById("transactionCostsPct").value);
    const transitionMonths = Number(document.getElementById("transitionMonths").value);

    /* VALIDATION */

    if (!assetValue || assetValue <= 0) {
      showError("Enter a valid asset value.");
      return;
    }
    if (isNaN(currentReturnPct) || currentReturnPct < 0) {
      showError("Enter a valid current return percentage.");
      return;
    }
    if (!alternativeReturnPct || alternativeReturnPct <= 0) {
      showError("Enter a valid expected return from the alternative use.");
      return;
    }
    if (!currentOperatingProfit || currentOperatingProfit <= 0) {
      showError("Enter a valid current annual operating profit figure.");
      return;
    }
    if (!annualRevenue || annualRevenue <= 0) {
      showError("Enter a valid annual revenue figure.");
      return;
    }

    /* BASELINE CALCULATION */

    const currentReturnDecimal = currentReturnPct / 100;
    const alternativeReturnDecimal = alternativeReturnPct / 100;
    const currentAnnualReturn = assetValue * currentReturnDecimal;
    const operatingMarginPct = (currentOperatingProfit / annualRevenue) * 100;

    /* SCENARIO CALCULATION */

    const liquidationDiscount = liquidationDiscountPct > 0 ? liquidationDiscountPct / 100 : 0;
    const transactionCosts = transactionCostsPct > 0 ? transactionCostsPct / 100 : 0;
    const netProceeds = assetValue * (1 - liquidationDiscount - transactionCosts);
    const alternativeAnnualReturn = netProceeds * alternativeReturnDecimal;
    const annualUplift = alternativeAnnualReturn - currentAnnualReturn;
    const profitAfterRedeployment = currentOperatingProfit - currentAnnualReturn + alternativeAnnualReturn;
    const profitUpliftPct = (annualUplift / currentOperatingProfit) * 100;

    /* TRANSITION COST */

    let transitionNote = "";
    if (transitionMonths > 0) {
      const transitionCost = (alternativeAnnualReturn / 12) * transitionMonths;
      const paybackMonths = transitionMonths + Math.ceil((netProceeds * liquidationDiscount + netProceeds * transactionCosts) / (annualUplift / 12));
      transitionNote =
        " Accounting for a " + transitionMonths +
        "-month ramp period before full alternative returns are realised, the transition carries a deferred income cost of approximately " +
        formatNumber(transitionCost) + ".";
    }

    /* SENSITIVITY CALCULATION */

    const sensitivityImpact = netProceeds * 0.01;

    /* REPORT TEXT VARIABLES */

    const currentReturnFormatted = formatNumber(currentAnnualReturn);
    const alternativeReturnFormatted = formatNumber(alternativeAnnualReturn);
    const annualUpliftFormatted = formatNumber(annualUplift);
    const profitAfterFormatted = formatNumber(profitAfterRedeployment);
    const netProceedsFormatted = formatNumber(netProceeds);
    const upliftPctRounded = Math.round(profitUpliftPct * 10) / 10;
    const operatingMarginRounded = Math.round(operatingMarginPct * 10) / 10;

    const paybackYears = annualUplift > 0 ? Math.round((assetValue * (liquidationDiscount + transactionCosts)) / annualUplift * 10) / 10 : 0;

    /* REPORT RENDER */

    const report =
      "<p><strong>Diagnostic Summary</strong></p>" +
      "<p>The asset valued at " + formatNumber(assetValue) +
      " currently generates " + currentReturnFormatted +
      " annually at a " + currentReturnPct +
      "% return. If redeployed into the alternative use with net proceeds of " +
      netProceedsFormatted +
      " after disposal costs, the same capital would generate " +
      alternativeReturnFormatted +
      " annually at " + alternativeReturnPct +
      "%. The annual profit uplift from redeployment would be " +
      annualUpliftFormatted +
      ", representing a " + upliftPctRounded +
      "% increase in current operating profit.</p>" +

      "<p><strong>Key Mechanics</strong></p>" +
      "<table><thead><tr><th>Metric</th><th>Current</th><th>After Redeployment</th></tr></thead><tbody>" +
      "<tr><td>Capital deployed</td><td>" + formatNumber(assetValue) + "</td><td>" + netProceedsFormatted + "</td></tr>" +
      "<tr><td>Annual return rate</td><td>" + currentReturnPct + "%</td><td>" + alternativeReturnPct + "%</td></tr>" +
      "<tr><td>Annual return amount</td><td>" + currentReturnFormatted + "</td><td>" + alternativeReturnFormatted + "</td></tr>" +
      "<tr><td>Total operating profit</td><td>" + formatNumber(currentOperatingProfit) + "</td><td>" + profitAfterFormatted + "</td></tr>" +
      "</tbody></table>" +
      "<p>The annual uplift from redeployment is " + annualUpliftFormatted + "." +
      (paybackYears > 0 ? " Disposal costs are recovered in approximately " + paybackYears + " years at the uplift rate." : "") +
      transitionNote +
      " Each additional 1% achieved on the alternative return would generate a further " +
      formatNumber(sensitivityImpact) + " in annual profit.</p>" +

      "<p><strong>Operational Interpretation</strong></p>" +
      "<p>The business currently earns an operating margin of " + operatingMarginRounded +
      "% on its revenue base. The asset in question generates only " + currentReturnPct +
      "% on its capital. The gap between these rates quantifies the annual cost of keeping capital in a sub-optimal position. This cost is not visible in the profit and loss account but is present in the opportunity cost carried by the business each year the asset is retained.</p>" +

      "<p><strong>Structural Risk Observation</strong></p>" +
      "<p>Capital retained in underperforming assets compresses overall return on equity and reduces the capital available for growth, debt repayment, or distributions. Where the alternative return significantly exceeds the current return, the longer redeployment is deferred, the larger the cumulative economic cost. At the current uplift rate of " +
      annualUpliftFormatted + " per year, a three-year deferral costs approximately " +
      formatNumber(annualUplift * 3) + " in foregone profit.</p>" +

      "<p><strong>Management Questions</strong></p>" +
      "<p>What is the minimum net disposal value required for redeployment to make economic sense, and is the current market capable of achieving that value?</p>" +
      "<p>Does the alternative use have a demonstrated return track record inside this business, or is the expected return based on a projection that has not been stress-tested?</p>" +
      "<p>Are there other assets in the business generating a similar or lower return that should be evaluated in the same framework before capital allocation decisions are finalised?</p>" +

      "<p><strong>Selective Engagement Note</strong></p>" +
      "<p>This calculator evaluates only one narrow dimension of business structure: the differential return between holding an asset and redeploying its capital. Deeper diagnostic work examines how asset configuration interacts with cash flow timing, financing obligations, tax implications, operational capacity dependencies, and the strategic coherence of the alternative use. MJB Strategic works with a limited number of businesses at any time because capital redeployment decisions require detailed understanding of both the asset being exited and the opportunity being pursued. If this diagnostic thinking resonates, the contact page provides a route to explore whether a deeper engagement would be appropriate.</p>";

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
