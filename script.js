let ws;
let digits = [];
let heat = Array(10).fill(0);

// ===============================
// START LIVE CONNECTION
// ===============================
function start() {

  ws = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");

  ws.onopen = () => {
    document.getElementById("status").innerText = "🟢 CONNECTED";

    ws.send(JSON.stringify({
      ticks: "R_25",
      subscribe: 1
    }));
  };

  ws.onmessage = (msg) => {
    let data = JSON.parse(msg.data);

    if (data.tick) {

      let price = data.tick.quote;
      let lastDigit = parseInt(price.toString().slice(-1));

      // store digits
      digits.push(lastDigit);
      if (digits.length > 50) digits.shift();

      // update heatmap
      heat[lastDigit]++;

      runEngine();
      renderHeatmap();
    }
  };

  ws.onclose = () => {
    document.getElementById("status").innerText = "🔴 DISCONNECTED";
  };
}

// ===============================
// STOP CONNECTION
// ===============================
function stop() {
  if (ws) ws.close();
}

// ===============================
// AI FUSION ENGINE
// ===============================
function runEngine() {

  let total = digits.length;

  let over = digits.filter(d => [1,2,3].includes(d)).length;
  let under = digits.filter(d => [6,7,8,9].includes(d)).length;

  let even = digits.filter(d => d % 2 === 0).length;
  let odd = digits.filter(d => d % 2 !== 0).length;

  let match = over - under;

  // momentum
  let momentum = 0;
  for (let i = 1; i < digits.length; i++) {
    momentum += (digits[i] > digits[i - 1]) ? 1 : -1;
  }

  momentum = momentum / (digits.length || 1);

  // scores
  let ou = (over - under) / (total || 1);
  let eo = (even - odd) / (total || 1);

  // heat strength
  let heatAvg = heat.reduce((a, b) => a + b, 0) / 10;

  // FINAL SCORE
  let score =
    (Math.abs(ou) * 30) +
    (Math.abs(eo) * 25) +
    (Math.abs(match) / 10 * 20) +
    (Math.abs(momentum) * 15) +
    (heatAvg * 10);

  score = Math.min(100, score * 100);

  // SIGNAL
  let signal = "WAIT ⏳";

  if (score >= 85) {
    signal = over > under ? "OVER 🟢 STRONG" : "UNDER 🔴 STRONG";
  } else if (score < 70) {
    signal = "BLOCK ❌";
  }

  // UI update
  document.getElementById("signal").innerText = signal;
  document.getElementById("score").innerText = score.toFixed(1);

  document.getElementById("ou").innerText = `${over} / ${under}`;
  document.getElementById("eo").innerText = `${even} / ${odd}`;
  document.getElementById("momentum").innerText = momentum.toFixed(2);
  document.getElementById("match").innerText = match;
}

// ===============================
// HEATMAP RENDER
// ===============================
function renderHeatmap() {

  let box = document.getElementById("heatmap");
  box.innerHTML = "";

  for (let i = 0; i < 10; i++) {

    let div = document.createElement("div");
    div.className = "cell";

    if (heat[i] > 8) div.style.background = "#ff4444";
    else if (heat[i] > 4) div.style.background = "#ffaa00";

    div.innerText = i + ":" + heat[i];

    box.appendChild(div);
  }
}
