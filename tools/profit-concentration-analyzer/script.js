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

  ["rev1","rev2","rev3","rev4","rev5","rev6"].forEach(attachNumFormat);
  
  function runDiagnostic() {
  
  resultContainer.innerHTML = "";
  
  /* INPUT COLLECTION */
  
  const revenues = [
  parseNum(document.getElementById("rev1").value),
  parseNum(document.getElementById("rev2").value),
  parseNum(document.getElementById("rev3").value),
  parseNum(document.getElementById("rev4").value),
  parseNum(document.getElementById("rev5").value),
  parseNum(document.getElementById("rev6").value)
  ];
  
  const margins = [
  Number(document.getElementById("margin1").value),
  Number(document.getElementById("margin2").value),
  Number(document.getElementById("margin3").value),
  Number(document.getElementById("margin4").value),
  Number(document.getElementById("margin5").value),
  Number(document.getElementById("margin6").value)
  ];
  
  /* VALIDATION */
  
  for (let i = 0; i < 4; i++) {
  if (isNaN(revenues[i]) || isNaN(margins[i])) {
  showError("Enter valid numeric values in all required fields.");
  return;
  }
  }
  
  for (let i = 0; i < margins.length; i++) {
  if (!isNaN(margins[i]) && (margins[i] < 0 || margins[i] > 100)) {
  showError("Margin percentages must fall between 0 and 100.");
  return;
  }
  }
  
  /* BASELINE CALCULATION */
  
  const profits = [];
  let totalProfit = 0;
  
  for (let i = 0; i < revenues.length; i++) {
  
  if (!isNaN(revenues[i]) && revenues[i] > 0 && !isNaN(margins[i])) {
  
  const marginDecimal = margins[i] / 100;
  const profit = revenues[i] * marginDecimal;
  
  profits.push({
  index: i + 1,
  revenue: revenues[i],
  margin: margins[i],
  profit: profit
  });
  
  totalProfit += profit;
  
  }
  
  }
  
  const completedCount = profits.length;
  
  if (completedCount === 0) {
  showError("At least one valid segment must be entered.");
  return;
  }
  
  profits.sort(function(a, b) {
  return b.profit - a.profit;
  });
  
  const topProfit = profits[0].profit;
  const topTwoProfit = completedCount >= 2 ? profits[0].profit + profits[1].profit : profits[0].profit;
  
  const topShare = topProfit / totalProfit;
  const topTwoShare = topTwoProfit / totalProfit;
  
  /* SCENARIO CALCULATION */
  
  const marginShock = 0.05;
  
  const scenarioTopProfit = topProfit * (1 - marginShock);
  
  let scenarioTotalProfit = scenarioTopProfit;
  
  for (let i = 1; i < profits.length; i++) {
  scenarioTotalProfit += profits[i].profit;
  }
  
  const baselineProfitRounded = formatNumber(totalProfit);
  const scenarioProfitRounded = formatNumber(scenarioTotalProfit);
  
  const deltaProfit = scenarioTotalProfit - totalProfit;
  const deltaProfitRounded = formatNumber(deltaProfit);
  
  const percentDelta = (deltaProfit / totalProfit) * 100;
  const percentDeltaRounded = Math.round(percentDelta);
  
  /* SENSITIVITY CALCULATION */
  
  const sensitivityMargin = 0.01;
  const sensitivityImpact = profits[0].revenue * sensitivityMargin;
  const sensitivityImpactRounded = formatNumber(sensitivityImpact);
  
  /* REPORT TEXT VARIABLES */
  
  const topProfitRounded = formatNumber(topProfit);
  const topTwoProfitRounded = formatNumber(topTwoProfit);
  
  const topSharePercent = Math.round(topShare * 100);
  const topTwoSharePercent = Math.round(topTwoShare * 100);
  
  let tableRows = "";
  
  profits.slice(0, 6).forEach(function(seg) {
  
  const rev = formatNumber(seg.revenue);
  const prof = formatNumber(seg.profit);
  
  tableRows +=
  "<tr><td>Segment " +
  seg.index +
  "</td><td>" +
  rev +
  "</td><td>" +
  seg.margin +
  "%</td><td>" +
  prof +
  "</td></tr>";
  
  });
  
  /* REPORT RENDER */
  
  const report =
  "<p><strong>Diagnostic Summary</strong></p>" +
  "<p>Total estimated gross profit across the analysed segments is " +
  baselineProfitRounded +
  ". The largest segment contributes " +
  topProfitRounded +
  ", representing " +
  topSharePercent +
  "% of total profit. The top two segments together generate " +
  topTwoProfitRounded +
  ", or " +
  topTwoSharePercent +
  "% of total profit, indicating the degree of concentration inside the profit engine.</p>" +
  
  "<p><strong>Key Mechanics</strong></p>" +
  "<table><thead><tr><th>Segment</th><th>Revenue</th><th>Margin</th><th>Profit</th></tr></thead><tbody>" +
  tableRows +
  "</tbody></table>" +
  "<p>If the margin of the largest segment declined by 5%, total profit would move from " +
  baselineProfitRounded +
  " to " +
  scenarioProfitRounded +
  ", a change of " +
  deltaProfitRounded +
  " (" +
  percentDeltaRounded +
  "%). A 1% margin movement on the largest segment alone shifts profit by approximately " +
  sensitivityImpactRounded +
  ".</p>" +
  
  "<p><strong>Operational Interpretation</strong></p>" +
  "<p>Where one or two segments generate the majority of margin, operational exposure increases. Pricing pressure, supplier cost changes, or customer demand shifts affecting those areas will influence overall profit more than revenue distribution alone would suggest.</p>" +
  
  "<p><strong>Structural Risk Observation</strong></p>" +
  "<p>The largest segment currently produces " +
  topSharePercent +
  "% of total profit. Businesses where the top two segments exceed roughly 60% of profit often rely on a narrow economic engine, which can amplify volatility if demand, cost structure, or supplier dynamics change.</p>" +
  
  "<p><strong>Management Questions</strong></p>" +
  "<p>Which specific products, services, or customers sit inside the highest margin segment generating " +
  topProfitRounded +
  " of profit?</p>" +
  "<p>If pricing pressure reduced margin in that segment by 3–5%, how quickly would total profit compress?</p>" +
  "<p>Which operational initiatives could shift margin into currently smaller segments to rebalance the profit base?</p>" +
  
  "<p><strong>Selective Engagement Note</strong></p>" +
  "<p>This calculator evaluates only one narrow dimension of business structure: how profit is distributed across revenue segments. In practice, deeper diagnostic work examines interactions between profit drivers, cost structure, capital deployment, cash flow timing, revenue concentration, supplier dynamics, and forward operating scenarios. MJB Strategic works with a limited number of businesses at any time because this analysis requires detailed operational understanding of pricing, supplier terms, capacity, and cash generation. If this type of structural diagnostic thinking resonates, the contact page provides a route to explore whether a deeper engagement would be appropriate.</p>";
  
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