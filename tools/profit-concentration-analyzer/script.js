document.addEventListener("DOMContentLoaded", function() {

  const calculateButton = document.getElementById("calculateButton");
  const shareButton = document.getElementById("shareWhatsAppButton");
  const resultContainer = document.getElementById("result");

  calculateButton.addEventListener("click", function() {

    resultContainer.innerHTML = "";

    const segments = [];

    function readSegment(revId, marginId, index, required) {
      const revenueField = document.getElementById(revId);
      const marginField = document.getElementById(marginId);

      const revenueValue = revenueField.value.trim();
      const marginValue = marginField.value.trim();

      if (required) {
        if (revenueValue === "") {
          throw new Error("Segment " + index + " revenue is required.");
        }
        if (marginValue === "") {
          throw new Error("Segment " + index + " gross margin is required.");
        }
      }

      if (revenueValue === "" || marginValue === "") {
        return null;
      }

      const revenue = parseFloat(revenueValue);
      const margin = parseFloat(marginValue) / 100;

      const profit = revenue * margin;

      return {
        segment: index,
        revenue: revenue,
        margin: margin,
        profit: profit
      };
    }

    try {

      const s1 = readSegment("revenue1", "margin1", 1, true);
      const s2 = readSegment("revenue2", "margin2", 2, true);
      const s3 = readSegment("revenue3", "margin3", 3, false);
      const s4 = readSegment("revenue4", "margin4", 4, false);
      const s5 = readSegment("revenue5", "margin5", 5, false);
      const s6 = readSegment("revenue6", "margin6", 6, false);

      [s1, s2, s3, s4, s5, s6].forEach(function(item) {
        if (item !== null) {
          segments.push(item);
        }
      });

      let totalProfit = 0;

      segments.forEach(function(seg) {
        totalProfit += seg.profit;
      });

      segments.sort(function(a, b) {
        return b.profit - a.profit;
      });

      const topSegmentShare = (segments[0].profit / totalProfit) * 100;

      let topTwoShare = topSegmentShare;

      if (segments.length > 1) {
        const secondShare = (segments[1].profit / totalProfit) * 100;
        topTwoShare = topSegmentShare + secondShare;
      }

      let concentrationInterpretation = "";
      let structuralImplication = "";

      if (topTwoShare < 50) {
        concentrationInterpretation = "Profit appears broadly distributed across multiple revenue segments.";
        structuralImplication = "The business profit engine appears diversified with multiple activities contributing meaningful economic value.";
      } else if (topTwoShare >= 50 && topTwoShare < 75) {
        concentrationInterpretation = "Profit appears moderately concentrated within a limited number of segments.";
        structuralImplication = "Operational performance depends meaningfully on a smaller group of activities which may deserve closer monitoring.";
      } else {
        concentrationInterpretation = "Profit appears highly concentrated within a very small number of segments.";
        structuralImplication = "A narrow profit base increases exposure to disruption if those specific activities weaken.";
      }

      const strategicObservation = "Operators often discover that revenue distribution and profit distribution differ materially. Segments generating high revenue do not always produce proportional profit contribution.";

      let output = "";

      output += "<h3>Diagnostic Results</h3>";
      output += "<p>Total estimated profit across segments: " + totalProfit.toFixed(2) + "</p>";
      output += "<p>Top segment profit share: " + topSegmentShare.toFixed(2) + "%</p>";
      output += "<p>Top two segments combined profit share: " + topTwoShare.toFixed(2) + "%</p>";

      output += "<h3>Interpretation</h3>";
      output += "<p>" + concentrationInterpretation + "</p>";

      output += "<h3>Structural Implications</h3>";
      output += "<p>" + structuralImplication + "</p>";

      output += "<h3>Strategic Observation</h3>";
      output += "<p>" + strategicObservation + "</p>";

      output += "<p>This tool evaluates only one narrow dimension of a business structure. Full diagnostic engagements examine the interaction between profit drivers, cost structure, capital deployment, cash flow timing, revenue concentration, supplier leverage, and forward scenario modelling.</p>";

      output += "<p>The calculator therefore acts only as a simplified preview of the analytical framework used inside those engagements.</p>";

      output += "<p>Because this work requires detailed modelling and careful interpretation MJB Strategic intentionally works with a limited number of companies at any given time.</p>";

      output += "<p>If the thinking behind this tool resonates with how you evaluate your business you are welcome to reach out to determine whether there may be a sensible fit to work together.</p>";

      resultContainer.innerHTML = output;

    } catch (error) {
      resultContainer.innerHTML = "<p>" + error.message + "</p>";
    }

  });

  shareButton.addEventListener("click", function() {
    const url = window.location.href;
    const shareUrl = "https://api.whatsapp.com/send?text=" + encodeURIComponent(url);
    window.open(shareUrl, "_blank");
  });

});