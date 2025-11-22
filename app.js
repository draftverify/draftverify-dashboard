// DraftVerify Brewery Dashboard Frontend

// TODO: paste your Apps Script deployment URL here:
const DASHBOARD_API_URL =
  "https://script.google.com/macros/s/AKfycbyCc1JhVIcDt-6x-8GmgQHE9Rsr9cFA_qyOmC86WlhWr0rhh6VStSk2-JWx2BaOW0UdLA/exec";

const DEFAULT_BREWERY = "Norris"; // change to your brewery name if you want

// DOM refs
const breweryInput = document.getElementById("dvdb-brewery-input");
const loadBtn = document.getElementById("dvdb-load-btn");
const linesBody = document.getElementById("dvdb-lines-body");
const eventsBody = document.getElementById("dvdb-events-body");
const linesCountEl = document.getElementById("dvdb-lines-count");
const eventsCountEl = document.getElementById("dvdb-events-count");
const statusText = document.getElementById("dvdb-status-text");

function setStatus(msg) {
  if (statusText) statusText.textContent = msg;
}

function formatDateTime(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return String(ts);
    return d.toLocaleString();
  } catch {
    return String(ts);
  }
}

function renderLines(lines) {
  linesBody.innerHTML = "";

  if (!lines || lines.length === 0) {
    linesBody.innerHTML =
      "<tr><td colspan='7' class='dvdb-empty'>No lines found for this brewery.</td></tr>";
    linesCountEl.textContent = "0 lines";
    return;
  }

  linesCountEl.textContent = `${lines.length} line${lines.length === 1 ? "" : "s"}`;

  const rows = lines
    .map((line) => {
      const status = line.lastResult || "";
      let badgeClass = "dvdb-status-none";
      let badgeText = "No checks";

      if (status === "OK") {
        badgeClass = "dvdb-status-ok";
        badgeText = "Verified";
      } else if (status === "Mismatch") {
        badgeClass = "dvdb-status-warn";
        badgeText = "Mismatch";
      }

      const okCount = line.okCount || 0;
      const mismatchCount = line.mismatchCount || 0;

      return `
        <tr>
          <td>${line.line || ""}</td>
          <td>${line.location || ""}</td>
          <td>${line.product || ""}</td>
          <td>${line.lastCheck ? formatDateTime(line.lastCheck) : ""}</td>
          <td>
            <span class="dvdb-status-badge ${badgeClass}">${badgeText}</span>
          </td>
          <td>${okCount}</td>
          <td>${mismatchCount}</td>
        </tr>
      `;
    })
    .join("");

  linesBody.innerHTML = rows;
}

function renderEvents(events) {
  eventsBody.innerHTML = "";

  if (!events || events.length === 0) {
    eventsBody.innerHTML =
      "<tr><td colspan='5' class='dvdb-empty'>No recent events for this brewery.</td></tr>";
    eventsCountEl.textContent = "0 events";
    return;
  }

  eventsCountEl.textContent = `${events.length} event${
    events.length === 1 ? "" : "s"
  }`;

  const rows = events
    .map((ev) => {
      const res = ev.result || "";
      let badgeClass = "dvdb-status-none";
      if (res === "OK") badgeClass = "dvdb-status-ok";
      else if (res === "Mismatch") badgeClass = "dvdb-status-warn";

      return `
        <tr>
          <td>${formatDateTime(ev.ts)}</td>
          <td>${ev.couplerId || ""}</td>
          <td>${ev.kegId || ""}</td>
          <td>${ev.product || ""}</td>
          <td><span class="dvdb-status-badge ${badgeClass}">${res || "—"}</span></td>
        </tr>
      `;
    })
    .join("");

  eventsBody.innerHTML = rows;
}

async function loadDashboard(brewery) {
  if (!brewery) {
    setStatus("Enter a brewery name to load data.");
    return;
  }

  setStatus("Loading…");

  try {
    const url =
      DASHBOARD_API_URL + "?brewery=" + encodeURIComponent(brewery.trim());
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error("Network error: " + res.status);
    }

    const data = await res.json();

    if (!data.ok) {
      throw new Error(data.error || "API error");
    }

    renderLines(data.lines || []);
    renderEvents(data.events || []);

    setStatus(
      `Showing data for “${brewery}”. Lines: ${data.lines.length}, events: ${data.events.length}.`
    );
  } catch (err) {
    console.error("Dashboard load error:", err);
    setStatus("Error loading dashboard. Check console for details.");

    linesBody.innerHTML =
      "<tr><td colspan='7' class='dvdb-empty'>Error loading lines.</td></tr>";
    eventsBody.innerHTML =
      "<tr><td colspan='5' class='dvdb-empty'>Error loading events.</td></tr>";
    linesCountEl.textContent = "0 lines";
    eventsCountEl.textContent = "0 events";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (breweryInput) {
    breweryInput.value = DEFAULT_BREWERY;
  }

  if (loadBtn) {
    loadBtn.addEventListener("click", () => {
      loadDashboard(breweryInput.value);
    });
  }

  // Auto-load default on page load
  if (DEFAULT_BREWERY) {
    loadDashboard(DEFAULT_BREWERY);
  }
});
