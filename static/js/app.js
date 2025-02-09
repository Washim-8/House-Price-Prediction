(() => {
  const qs = (sel) => document.querySelector(sel);

  const sidebar = qs("#sidebar");
  const sidebarToggle = qs("#sidebarToggle");
  const form = qs("#predictForm");
  const statusEl = qs("#formStatus");
  const modelPill = qs("#modelPill");

  const areaEl = qs("#area");
  const bedsEl = qs("#bedrooms");
  const bathsEl = qs("#bathrooms");
  const locationEl = qs("#location");

  const predictBtn = qs("#predictBtn");
  const fillExampleBtn = qs("#fillExample");

  const resultValue = qs("#resultValue");
  const resultMeta = qs("#resultMeta");
  const resultConfidence = qs("#resultConfidence");

  const historyBody = qs("#historyBody");
  const clearHistoryBtn = qs("#clearHistory");
  const clearHistoryTopBtn = qs("#clearHistoryTop");
  const exportCsvBtn = qs("#exportCsvBtn");
  const globalSearch = qs("#globalSearch");
  const themeButtons = Array.from(document.querySelectorAll(".theme-dot"));
  const themeLabel = qs("#themeLabel");
  const statLatest = qs("#statLatest");
  const statLatestMeta = qs("#statLatestMeta");
  const statAvg = qs("#statAvg");
  const statAvgMeta = qs("#statAvgMeta");
  const statRange = qs("#statRange");
  const statCount = qs("#statCount");

  const activityFeed = qs("#activityFeed");

  const profileBtn = qs("#profileBtn");
  const profileDropdown = qs("#profileDropdown");

  const HISTORY_KEY = "houseiq_history_v1";
  const THEME_KEY = "houseiq_theme_v1";

  let chart = null;
  const activeCurrency = "INR";
  let chartRangeValue = 7;

  function formatMoney(value) {
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: activeCurrency,
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      const rounded = Math.round(value);
      return `₹${rounded.toLocaleString("en-IN")}`;
    }
  }

  function setStatus(message, tone = "neutral") {
    statusEl.textContent = message || "";
    statusEl.style.color =
      tone === "error"
        ? "#B91C1C"
        : tone === "success"
          ? "#065F46"
          : "";
  }

  function setLoading(isLoading) {
    if (isLoading) {
      predictBtn.classList.add("is-loading");
      predictBtn.disabled = true;
    } else {
      predictBtn.classList.remove("is-loading");
      predictBtn.disabled = false;
    }
  }

  function applyTheme(theme) {
    const validThemes = new Set(["teal", "indigo", "rose", "amber"]);
    const next = validThemes.has(theme) ? theme : "teal";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
    themeButtons.forEach((btn) => btn.classList.toggle("is-active", btn.getAttribute("data-theme") === next));
    if (themeLabel) {
      themeLabel.textContent = `${next.charAt(0).toUpperCase()}${next.slice(1)}`;
    }
  }

  function readHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeHistory(items) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 25)));
  }

  function addHistoryItem(item) {
    const items = readHistory();
    items.unshift(item);
    writeHistory(items);
    renderAll();
  }

  function classifyPriceBandINR(price) {
    if (!isFinite(price)) return { key: "mid", label: "Normal" };
    if (price < 50_00_000) return { key: "low", label: "Affordable" };
    if (price < 1_50_00_000) return { key: "mid", label: "Mid-market" };
    return { key: "high", label: "Premium" };
  }

  function renderTable(items, query) {
    const filtered = applySearch(items, query);
    if (!filtered.length) {
      historyBody.innerHTML =
        '<tr><td colspan="7" class="subtle">No matching predictions.</td></tr>';
      return;
    }

    historyBody.innerHTML = filtered
      .slice(0, 12)
      .map((it) => {
        const dt = new Date(it.ts);
        const time = isNaN(dt.getTime()) ? "—" : dt.toLocaleString("en-IN");
        const band = classifyPriceBandINR(Number(it.predicted_price));
        const badgeClass =
          band.key === "low" ? "badge--low" : band.key === "high" ? "badge--high" : "badge--mid";
        return `<tr>
          <td>${escapeHtml(time)}</td>
          <td>${escapeHtml(String(it.area))}</td>
          <td>${escapeHtml(String(it.bedrooms))}</td>
          <td>${escapeHtml(String(it.bathrooms))}</td>
          <td>${escapeHtml(String(it.location))}</td>
          <td><span class="badge ${badgeClass}"><span class="badge__dot" aria-hidden="true"></span>${escapeHtml(band.label)}</span></td>
          <td class="t-right">${escapeHtml(formatMoney(Number(it.predicted_price)))}</td>
        </tr>`;
      })
      .join("");
  }

  function renderStats(items) {
    const count = items.length;
    statCount.textContent = String(count);

    if (!count) {
      statLatest.textContent = "₹—";
      statLatestMeta.textContent = "No predictions yet";
      statAvg.textContent = "₹—";
      statAvgMeta.textContent = "—";
      statRange.textContent = "₹—";
      return;
    }

    const latest = items[0];
    const latestDt = new Date(latest.ts);
    statLatest.textContent = formatMoney(Number(latest.predicted_price));
    statLatestMeta.textContent = isNaN(latestDt.getTime())
      ? `${latest.location || "—"} • ${latest.area || "—"} sq ft`
      : `${latest.location || "—"} • ${latest.area || "—"} sq ft • ${latestDt.toLocaleString("en-IN")}`;

    const last10 = items.slice(0, 10);
    const prices = last10.map((x) => Number(x.predicted_price)).filter((n) => isFinite(n));
    if (!prices.length) return;

    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    statAvg.textContent = formatMoney(avg);
    statAvgMeta.textContent = `Based on ${prices.length} prediction${prices.length === 1 ? "" : "s"}`;
    statRange.textContent = `${formatMoney(min)} – ${formatMoney(max)}`;
  }

  function renderActivity(items, query) {
    const filtered = applySearch(items, query);
    if (!filtered.length) {
      activityFeed.innerHTML = '<div class="feed__empty subtle">No activity yet.</div>';
      return;
    }

    activityFeed.innerHTML = filtered
      .slice(0, 6)
      .map((it) => {
        const dt = new Date(it.ts);
        const time = isNaN(dt.getTime()) ? "—" : dt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
        const title = `Prediction created • ${it.location || "—"}`;
        const meta = `${it.area || "—"} sq ft • ${it.bedrooms || "—"} bed • ${it.bathrooms || "—"} bath • ${formatMoney(
          Number(it.predicted_price)
        )} • ${time}`;
        return `<div class="feed-item">
          <div class="feed-item__dot" aria-hidden="true"></div>
          <div class="feed-item__main">
            <div class="feed-item__title">${escapeHtml(title)}</div>
            <div class="feed-item__meta">${escapeHtml(meta)}</div>
          </div>
        </div>`;
      })
      .join("");
  }

  function renderHistoryChart(items) {
    const n = Math.max(1, Math.min(30, Number(chartRangeValue) || 7));
    renderChart(items.slice(0, n).reverse());
  }

  function renderAll() {
    const items = readHistory();
    const query = (globalSearch?.value || "").trim();
    renderStats(items);
    renderHistoryChart(items);
    renderTable(items, query);
    renderActivity(items, query);
  }

  function escapeHtml(str) {
    return str
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function applySearch(items, query) {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter((it) => {
      const hay = `${it.location || ""} ${it.area || ""} ${it.bedrooms || ""} ${it.bathrooms || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }

  function renderChart(items) {
    const canvas = qs("#historyChart");
    if (!canvas || !window.Chart) return;

    const ctx = canvas.getContext("2d");
    const labels = items.map((it) => {
      const dt = new Date(it.ts);
      return isNaN(dt.getTime()) ? "" : dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    });
    const data = items.map((it) => Number(it.predicted_price));
    const avgData = data.map((_, idx) => {
      const start = Math.max(0, idx - 2);
      const slice = data.slice(start, idx + 1).filter((n) => isFinite(n));
      if (!slice.length) return null;
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      return avg;
    });

    const bandColors = data.map((p) => {
      const band = classifyPriceBandINR(p);
      if (band.key === "low") return "rgba(16,185,129,0.95)";
      if (band.key === "high") return "rgba(249,115,22,0.95)";
      return "rgba(245,158,11,0.95)";
    });

    const fill = ctx.createLinearGradient(0, 0, 0, canvas.height);
    fill.addColorStop(0, "rgba(15,118,110,0.16)");
    fill.addColorStop(1, "rgba(15,118,110,0.02)");

    const cfg = {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Predicted price",
            data,
            borderColor: "rgb(15,118,110)",
            backgroundColor: fill,
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: bandColors,
            pointBorderColor: "#FFFFFF",
            pointBorderWidth: 2,
          },
          {
            label: "3-point avg",
            data: avgData,
            borderColor: "rgba(37,99,235,0.65)",
            borderDash: [6, 6],
            pointRadius: 0,
            tension: 0.35,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => formatMoney(ctx.parsed.y),
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true } },
          y: {
            grid: { color: "rgba(229,231,235,.8)" },
            ticks: {
              callback: (v) => {
                const n = Number(v);
                if (!isFinite(n)) return v;
                return n >= 1_00_00_000
                  ? `${Math.round(n / 1_00_00_000)}Cr`
                  : n >= 1_00_000
                    ? `${Math.round(n / 1_00_000)}L`
                    : n >= 1000
                      ? `${Math.round(n / 1000)}k`
                      : n;
              },
            },
          },
        },
      },
    };

    if (chart) {
      chart.destroy();
    }
    chart = new window.Chart(canvas, cfg);
  }

  function validateInputs(payload) {
    const area = Number(payload.area);
    const bedrooms = Number(payload.bedrooms);
    const bathrooms = Number(payload.bathrooms);
    const location = String(payload.location || "").trim();

    if (!isFinite(area) || area <= 0) return "Area must be a valid number greater than 0.";
    if (!isFinite(bedrooms) || bedrooms <= 0) return "Bedrooms must be a valid number greater than 0.";
    if (!isFinite(bathrooms) || bathrooms <= 0) return "Bathrooms must be a valid number greater than 0.";
    if (!location) return "Location is required.";
    return null;
  }

  async function callPredict(payload) {
    const res = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Prediction failed.");
    }
    return data;
  }

  sidebarToggle?.addEventListener("click", () => {
    sidebar?.classList.toggle("is-open");
  });

  // Smooth scroll + scrollspy
  const navLinks = Array.from(document.querySelectorAll('.sidebar__item[href^="#"]'));
  navLinks.forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      const el = document.querySelector(href);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // Close sidebar on mobile after navigation
      sidebar?.classList.remove("is-open");
      history.replaceState(null, "", href);
    });
  });

  const sections = ["#overview", "#analytics", "#projects", "#activity", "#settings"]
    .map((id) => document.querySelector(id))
    .filter(Boolean);

  const setActiveNav = (id) => {
    navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === id));
  };

  if ("IntersectionObserver" in window && sections.length) {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];
        if (visible?.target?.id) {
          setActiveNav(`#${visible.target.id}`);
        }
      },
      { root: null, threshold: [0.2, 0.35, 0.5], rootMargin: "-10% 0px -70% 0px" }
    );
    sections.forEach((s) => io.observe(s));
  }

  fillExampleBtn?.addEventListener("click", () => {
    areaEl.value = "1200";
    bedsEl.value = "2";
    bathsEl.value = "2";
    locationEl.value = "Bengaluru";
    setStatus("Example values filled.", "neutral");
  });

  function clearHistory() {
    writeHistory([]);
    renderAll();
    setStatus("History cleared.", "neutral");
  }
  clearHistoryBtn?.addEventListener("click", clearHistory);
  clearHistoryTopBtn?.addEventListener("click", () => {
    profileDropdown?.classList.remove("is-open");
    profileBtn?.setAttribute("aria-expanded", "false");
    clearHistory();
  });

  globalSearch?.addEventListener("input", () => {
    renderAll();
  });

  exportCsvBtn?.addEventListener("click", () => {
    const items = readHistory();
    if (!items.length) {
      setStatus("No history to export.", "neutral");
      return;
    }
    const header = ["ts", "area", "bedrooms", "bathrooms", "location", "predicted_price"];
    const rows = items.map((it) => [
      it.ts,
      it.area,
      it.bedrooms,
      it.bathrooms,
      it.location,
      it.predicted_price,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "houseiq_predictions.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus("Exported CSV.", "success");
  });

  // Click row to refill form
  historyBody?.addEventListener("click", (e) => {
    const t = e.target;
    if (!t || !(t instanceof HTMLElement)) return;
    const tr = t.closest("tr");
    if (!tr) return;
    const tds = Array.from(tr.querySelectorAll("td"));
    if (tds.length < 7) return;
    const area = tds[1]?.textContent?.trim();
    const beds = tds[2]?.textContent?.trim();
    const baths = tds[3]?.textContent?.trim();
    const loc = tds[4]?.textContent?.trim();
    if (area) areaEl.value = area;
    if (beds) bedsEl.value = beds;
    if (baths) bathsEl.value = baths;
    if (loc) locationEl.value = loc;
    document.querySelector("#settings")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setStatus("Form filled from selected row. Click Predict to run again.", "neutral");
  });

  function toggleProfile(open) {
    const isOpen = open ?? !profileDropdown?.classList.contains("is-open");
    profileDropdown?.classList.toggle("is-open", Boolean(isOpen));
    profileBtn?.setAttribute("aria-expanded", String(Boolean(isOpen)));
  }
  profileBtn?.addEventListener("click", () => toggleProfile());
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!t || !(t instanceof HTMLElement)) return;
    if (t.closest("#profileMenu")) return;
    profileDropdown?.classList.remove("is-open");
    profileBtn?.setAttribute("aria-expanded", "false");
  });

  themeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      applyTheme(String(btn.getAttribute("data-theme") || "teal"));
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== globalSearch) {
      e.preventDefault();
      globalSearch?.focus();
    }
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("");

    const payload = {
      area: areaEl.value,
      bedrooms: bedsEl.value,
      bathrooms: bathsEl.value,
      location: locationEl.value,
    };

    const err = validateInputs(payload);
    if (err) {
      setStatus(err, "error");
      return;
    }

    setLoading(true);
    try {
      const data = await callPredict(payload);
      const p = Number(data.predicted_price);
      resultValue.textContent = formatMoney(p);
      resultMeta.textContent = `Model: ${data.model_name} • v${data.model_version}`;
      modelPill.textContent = data.model_name ? `Model: ${data.model_name}` : "Model ready";
      resultValue.closest(".card--result")?.classList.add("is-flash");
      setTimeout(() => resultValue.closest(".card--result")?.classList.remove("is-flash"), 600);
      if (typeof data.confidence === "number") {
        const pct = Math.round(data.confidence * 100);
        const pi = data.prediction_interval;
        const band = pi && typeof pi.low === "number" && typeof pi.high === "number"
          ? ` • Range: ${formatMoney(pi.low)}–${formatMoney(pi.high)}`
          : "";
        resultConfidence.textContent = `Confidence: ${pct}%${band}`;
      } else {
        resultConfidence.textContent = "Confidence: —";
      }

      addHistoryItem({
        ts: new Date().toISOString(),
        area: Number(payload.area),
        bedrooms: Number(payload.bedrooms),
        bathrooms: Number(payload.bathrooms),
        location: String(payload.location),
        predicted_price: p,
      });

      setStatus("Prediction ready.", "success");
    } catch (ex) {
      setStatus(ex?.message || "Prediction failed.", "error");
    } finally {
      setLoading(false);
    }
  });

  // initial render
  applyTheme(localStorage.getItem(THEME_KEY) || "teal");
  renderAll();
})();

