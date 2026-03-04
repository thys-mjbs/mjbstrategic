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

      const revenueField = document.getElementById("segment" + i + "Revenue");
      const marginField = document.getElementById("segment" + i + "Margin");

      if (!revenueField || !marginField) continue;

      const revenue = parseFloat(revenueField.value);
      const margin = parseFloat(marginField.value);

      if (i <= 2) {

        if (!revenueField.value) {
          showError("Segment " + i + " revenue is required.");
          return;
        }

        if (!marginField.value) {
          showError("Segment " + i + " gross margin is required.");
          return;
        }

      }

      if (!revenue || !margin) continue;

      const profit = revenue * (margin / 100);

      segments.push({
        revenue: revenue,
        margin: margin,
        profit: profit
      });

    }

    if (segments.length === 0) {
      showError("Enter valid revenue and margin data.");
      return;
    }

    let totalProfit = 0;

    segments.forEach(s => {
      totalProfit += s.profit;
    });

    segments.sort((a,b) => b.profit - a.profit);

    const topProfit = segments[0].profit;

    let topTwoProfit = topProfit;

    if (segments.length > 1) {
      topTwoProfit += segments[1].profit;
    }

    const topShare = (topProfit / totalProfit) * 100;
    const topTwoShare = (topTwoProfit / totalProfit) * 100;

    let interpretation = "";

    if (topShare < 40) {
      interpretation = "Profit appears broadly distributed across segments.";
    } else if (topShare < 70) {
      interpretation = "Profit appears moderately concentrated in a small number of segments.";
    } else {
      interpretation = "Profit appears highly concentrated in one dominant segment.";
    }

    resultContainer.innerHTML =
      "<h3>Diagnostic Results</h3>" +
      "<p><strong>Total Profit:</strong> " + totalProfit.toFixed(2) + "</p>" +
      "<p><strong>Top Segment Profit Share:</strong> " + topShare.toFixed(1) + "%</p>" +
      "<p><strong>Top Two Segments Profit Share:</strong> " + topTwoShare.toFixed(1) + "%</p>" +
      "<p>" + interpretation + "</p>";

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