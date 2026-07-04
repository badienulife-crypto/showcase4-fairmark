/* Fairmark Motors — staff dashboard demo (Showcase Build #4, SimpliTechPro)
   ALL MOCKED. Fake login (demo/demo), sample data + this session's storefront
   activity from FM.store (sessionStorage). Nothing is real, nothing is sent. */
(function () {
  "use strict";
  if (!window.FM) return;

  var AUTH_KEY = "fm-demo-admin";

  /* ---------- sample back-office data (static, believable) ---------- */
  function daysAgo(n) { var d = new Date(); d.setDate(d.getDate() - n); return d; }
  function fmtDate(d) { return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" }); }

  var SAMPLE_LEADS = [
    { name: "Priya Raman", vehicle: "2022 Tesla Model Y LR", source: "Financing calculator", date: daysAgo(0), status: "new" },
    { name: "Marcus Bell", vehicle: "2019 BMW M5 Competition", source: "Test drive", date: daysAgo(1), status: "new" },
    { name: "Janet Kowalski", vehicle: "2018 Ford Expedition Max", source: "Sell / trade form", date: daysAgo(1), status: "contacted" },
    { name: "Dev Patel", vehicle: "2020 Hyundai Elantra GT", source: "Reserved · $500 deposit", date: daysAgo(2), status: "contacted" },
    { name: "Sofia Marino", vehicle: "2016 Fiat 500 1957 Edition", source: "Phone enquiry", date: daysAgo(3), status: "contacted" }
  ];
  var SAMPLE_BOOKINGS = [
    { type: "test-drive", vehicle: "2019 BMW M5 Competition", when: "Tomorrow · 11:00 AM", name: "Marcus Bell", status: "confirmed" },
    { type: "reservation", vehicle: "2017 Chevrolet Camaro 2SS", when: "48-hour hold · $500", name: "Dana Whitfield", status: "reserved" },
    { type: "test-drive", vehicle: "2021 Tesla Model 3 SR+", when: fmtDate(daysAgo(1)) + " · 3:00 PM", name: "Priya Raman", status: "completed" }
  ];
  var SOLD_WEEKS = [
    { label: "W1", sold: 4 }, { label: "W2", sold: 6 }, { label: "W3", sold: 5 }, { label: "W4", sold: 7 },
    { label: "W5", sold: 5 }, { label: "W6", sold: 8 }, { label: "W7", sold: 6 }, { label: "W8", sold: 9 }
  ];
  var AVG_DAYS_TO_SELL = 21;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function el(id) { return document.getElementById(id); }

  /* ---------- fake auth gate ---------- */
  var login = el("admLogin"), app = el("admApp"), signOut = el("admSignOut");
  function isAuthed() { try { return sessionStorage.getItem(AUTH_KEY) === "1"; } catch (e) { return false; } }
  function showConsole() {
    login.hidden = true; app.hidden = false; signOut.hidden = false;
    renderAll();
  }
  el("admFill").addEventListener("click", function () {
    el("admUser").value = "demo"; el("admPass").value = "demo";
    el("admLoginErr").hidden = true;
  });
  el("admLoginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var u = el("admUser").value.trim().toLowerCase(), p = el("admPass").value.trim().toLowerCase();
    if (u === "demo" && p === "demo") {
      try { sessionStorage.setItem(AUTH_KEY, "1"); } catch (err) { /* demo only */ }
      showConsole();
    } else {
      var msg = el("admLoginErr");
      msg.textContent = "Demo credentials are demo / demo — nothing else exists.";
      msg.hidden = false;
    }
  });
  signOut.addEventListener("click", function () {
    try { sessionStorage.removeItem(AUTH_KEY); } catch (e) { /* demo only */ }
    location.reload();
  });
  if (isAuthed()) showConsole();

  /* ---------- section tabs ---------- */
  var tabs = document.querySelectorAll(".adm-tab[data-panel]");
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      tabs.forEach(function (x) { x.classList.remove("is-on"); });
      t.classList.add("is-on");
      document.querySelectorAll(".adm-panel").forEach(function (p) { p.hidden = true; });
      el("panel-" + t.dataset.panel).hidden = false;
    });
  });

  el("admReset").addEventListener("click", function () {
    FM.store.reset();
    renderAll();
    toast("Demo data reset — storefront activity cleared.");
  });

  /* ---------- toast (matches storefront) ---------- */
  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove("show"); }, 2600);
  }

  /* ---------- renderers ---------- */
  function liveLeads() {
    return FM.store.load().leads.slice().reverse(); // newest first
  }
  function liveBookings() {
    return FM.store.load().bookings.slice().reverse();
  }

  function renderAll() {
    renderKPIs(); renderChart(); renderFeed();
    renderInventory(); renderLeads(); renderBookings();
    renderCounts();
  }

  function renderCounts() {
    var inv = FM.inventory();
    el("cInv").textContent = inv.length;
    el("cLeads").textContent = SAMPLE_LEADS.length + liveLeads().length;
    el("cBook").textContent = SAMPLE_BOOKINGS.length + liveBookings().length;
  }

  function renderKPIs() {
    var inv = FM.inventory();
    var avail = inv.filter(function (v) { return v.status === "available"; }).length;
    var reserved = inv.filter(function (v) { return v.status === "reserved"; }).length;
    var leadsWk = SAMPLE_LEADS.length + liveLeads().length;
    el("kpis").innerHTML =
      kpi("In stock", avail, "available now") +
      kpi("Reserved", reserved, "deposit holds") +
      kpi("Leads this week", leadsWk, "sample + live") +
      kpi("Avg. days to sell", AVG_DAYS_TO_SELL, "last 90 days");
  }
  function kpi(label, value, sub) {
    return '<div class="kpi"><span class="kpi-label">' + label + '</span>' +
      '<span class="kpi-value num">' + value + '</span>' +
      '<span class="kpi-sub">' + sub + '</span></div>';
  }

  // single-series bar sparkline — cobalt validated vs light surface (dataviz palette check PASS)
  function renderChart() {
    var max = Math.max.apply(null, SOLD_WEEKS.map(function (w) { return w.sold; }));
    var W = 320, H = 96, pad = 2, bw = W / SOLD_WEEKS.length;
    var bars = SOLD_WEEKS.map(function (w, i) {
      var h = Math.max(6, Math.round((w.sold / max) * (H - 34))); // headroom for the peak label
      var x = Math.round(i * bw) + pad, y = H - 18 - h;
      return '<g><title>' + w.label + ": " + w.sold + ' cars sold (sample)</title>' +
        '<rect x="' + x + '" y="' + y + '" width="' + Math.round(bw - pad * 2 - 2) + '" height="' + h + '" rx="4" fill="#1F5FFF"></rect>' +
        (w.sold === max ? '<text x="' + (x + (bw - pad * 2 - 2) / 2) + '" y="' + (y - 6) + '" text-anchor="middle" class="adm-spark-val">' + w.sold + '</text>' : "") +
        '<text x="' + (x + (bw - pad * 2 - 2) / 2) + '" y="' + (H - 4) + '" text-anchor="middle" class="adm-spark-lbl">' + w.label + '</text></g>';
    }).join("");
    el("soldChart").innerHTML =
      '<svg viewBox="0 0 ' + W + " " + H + '" class="adm-spark" role="img" aria-label="Cars sold per week, sample data: ' +
      SOLD_WEEKS.map(function (w) { return w.label + " " + w.sold; }).join(", ") + '">' +
      '<line x1="0" y1="' + (H - 18) + '" x2="' + W + '" y2="' + (H - 18) + '" stroke="#E4E8EE" stroke-width="1"></line>' + bars + "</svg>";
  }

  function renderFeed() {
    var items = [];
    liveBookings().forEach(function (b) {
      items.push({
        t: b.createdAt,
        html: b.type === "reservation"
          ? '<strong>' + esc(b.name) + '</strong> reserved the <strong>' + esc(b.vehicle) + '</strong> with a $500 test deposit'
          : '<strong>' + esc(b.name) + '</strong> booked a test drive — <strong>' + esc(b.vehicle) + '</strong> · ' + esc(b.date || "") + " " + esc(b.time || "")
      });
    });
    items.sort(function (a, b) { return a.t < b.t ? 1 : -1; });
    el("liveFeed").innerHTML = items.length
      ? items.map(function (i) { return '<li>' + i.html + '</li>'; }).join("")
      : '<li class="adm-feed-empty">Nothing yet this session. Open the <a href="shop.html">storefront</a>, book a test drive or reserve a car — it lands here instantly.</li>';
  }

  /* ---------- inventory table + CRUD ---------- */
  function statusPill(s) {
    var cls = s === "available" ? "adm-pill--ok" : s === "reserved" ? "adm-pill--hold" : "adm-pill--sold";
    return '<span class="adm-pill ' + cls + '">' + s + '</span>';
  }

  function renderInventory() {
    var inv = FM.inventory();
    el("invSub").textContent = inv.filter(function (v) { return v.status === "available"; }).length +
      " available · " + inv.filter(function (v) { return v.status === "reserved"; }).length +
      " reserved · " + inv.filter(function (v) { return v.status === "sold"; }).length + " sold";
    el("invTable").querySelector("tbody").innerHTML = inv.map(function (v) {
      return '<tr>' +
        '<td><div class="adm-veh"><img src="' + v.photos[0] + '" alt="" loading="lazy">' +
          '<div><strong>' + v.year + " " + esc(v.make) + " " + esc(v.model) + '</strong>' +
          '<span>' + esc(v.trim) + ' · <span class="num">' + esc(v.id) + '</span></span></div></div></td>' +
        '<td class="num">' + FM.fmtMoney(v.price) + '</td>' +
        '<td class="num">' + FM.fmtKm(v.mileage_km) + '</td>' +
        '<td>' + statusPill(v.status) + '</td>' +
        '<td class="adm-actions">' +
          '<button class="adm-act" data-edit="' + v.id + '">Edit</button>' +
          (v.status === "sold"
            ? '<button class="adm-act" data-status="' + v.id + '|available">Relist</button>'
            : '<button class="adm-act" data-status="' + v.id + '|sold">Mark sold</button>') +
          (v.status === "reserved" ? '<button class="adm-act" data-status="' + v.id + '|available">Release hold</button>' : "") +
        '</td></tr>';
    }).join("");

    el("invTable").querySelectorAll("[data-status]").forEach(function (b) {
      b.addEventListener("click", function () {
        var parts = b.dataset.status.split("|");
        FM.store.overrideVehicle(parts[0], { status: parts[1] });
        renderAll();
        toast(parts[0] + " → " + parts[1] + " (storefront updates too)");
      });
    });
    el("invTable").querySelectorAll("[data-edit]").forEach(function (b) {
      b.addEventListener("click", function () { openVehicleModal(b.dataset.edit); });
    });
  }

  el("admAdd").addEventListener("click", function () { openVehicleModal(null); });

  /* ---------- add / edit vehicle modal (reuses wizard shell styles) ---------- */
  var overlay;
  function closeModal() { if (overlay) { overlay.remove(); overlay = null; document.body.classList.remove("no-scroll"); } }
  function field(label, id, value, type) {
    return '<label>' + label + '<input id="' + id + '" type="' + (type || "text") + '" autocomplete="off" value="' + esc(value) + '"></label>';
  }
  function openVehicleModal(id) {
    closeModal();
    var v = id ? FM.inventory().filter(function (x) { return x.id === id; })[0] : null;
    var title = v ? "Edit " + v.year + " " + v.make + " " + v.model : "Add vehicle";
    overlay = document.createElement("div");
    overlay.className = "wz-overlay";
    overlay.innerHTML =
      '<div class="wz" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' +
        '<div class="wz-top"><strong>' + esc(title) + '</strong>' +
        '<button class="wz-x" type="button" aria-label="Close">&times;</button></div>' +
        '<div class="wz-body"><div class="wz-fields">' +
          (v ? "" :
            '<div class="wz-half">' + field("Year", "veYear", new Date().getFullYear() - 3, "number") + field("Make", "veMake", "") + '</div>' +
            '<div class="wz-half">' + field("Model", "veModel", "") + field("Trim", "veTrim", "") + '</div>') +
          '<div class="wz-half">' + field("Price (CAD)", "vePrice", v ? v.price : "", "number") +
            field("Mileage (km)", "veKm", v ? v.mileage_km : "", "number") + '</div>' +
          (v ? "" :
            '<div class="wz-half">' +
              '<label>Body type<select id="veBody"><option>SUV</option><option>Sedan</option><option>Coupe</option><option>Hatchback</option><option>Wagon</option><option>Truck</option></select></label>' +
              '<label>Drivetrain<select id="veDrive"><option>AWD</option><option>FWD</option><option>RWD</option><option>4x4</option></select></label></div>' +
            field("Exterior colour", "veColour", "")) +
          '<label>Status<select id="veStatus">' +
            ["available", "reserved", "sold"].map(function (s) {
              return '<option' + (v && v.status === s ? " selected" : "") + '>' + s + '</option>';
            }).join("") + '</select></label>' +
        '</div>' +
        '<p class="wz-err" id="veErr" hidden></p>' +
        '<div class="wz-row"><button class="btn btn-ghost" id="veCancel">Cancel</button>' +
        '<button class="btn btn-primary" id="veSave">' + (v ? "Save changes" : "Add to inventory") + '</button></div></div>' +
        '<div class="wz-banner">STAFF DEMO — CHANGES LIVE ONLY IN THIS BROWSER SESSION</div>' +
      '</div>';
    document.body.appendChild(overlay);
    document.body.classList.add("no-scroll");
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });
    overlay.querySelector(".wz-x").addEventListener("click", closeModal);
    el("veCancel").addEventListener("click", closeModal);
    el("veSave").addEventListener("click", function () {
      var price = +el("vePrice").value, km = +el("veKm").value, status = el("veStatus").value;
      var err = el("veErr");
      if (!(price > 0)) { err.textContent = "Enter a price."; err.hidden = false; return; }
      if (!(km >= 0)) { err.textContent = "Enter a mileage."; err.hidden = false; return; }
      if (v) {
        FM.store.overrideVehicle(v.id, { price: price, mileage_km: km, status: status });
        toast("Saved — the storefront shows the new price now.");
      } else {
        var make = el("veMake").value.trim(), model = el("veModel").value.trim();
        if (!make || !model) { err.textContent = "Enter a make and model."; err.hidden = false; return; }
        FM.store.addVehicle({
          year: +el("veYear").value || new Date().getFullYear() - 3,
          make: make, model: model, trim: el("veTrim").value.trim() || "—",
          price: price, mileage_km: km,
          bodyType: el("veBody").value, drivetrain: el("veDrive").value,
          fuel: "Gas", transmission: "Automatic",
          exteriorColour: el("veColour").value.trim() || "—",
          status: status
        });
        toast("Added — it's live in the shop grid for this session.");
      }
      closeModal(); renderAll();
    });
    var f = overlay.querySelector("input, select"); if (f) f.focus();
  }

  /* ---------- leads table ---------- */
  function renderLeads() {
    var live = liveLeads().map(function (l) {
      return { id: l.id, name: l.name, vehicle: l.vehicle, source: l.source,
        dateLabel: "Just now", status: l.status, live: true };
    });
    var rows = live.concat(SAMPLE_LEADS.map(function (l) {
      return { id: null, name: l.name, vehicle: l.vehicle, source: l.source,
        dateLabel: fmtDate(l.date), status: l.status, live: false };
    }));
    el("leadsTable").querySelector("tbody").innerHTML = rows.map(function (l) {
      return '<tr' + (l.live ? ' class="adm-row-live"' : "") + '>' +
        '<td><strong>' + esc(l.name) + '</strong>' + (l.live ? ' <span class="adm-chip-live">live</span>' : "") + '</td>' +
        '<td>' + esc(l.vehicle) + '</td>' +
        '<td>' + esc(l.source) + '</td>' +
        '<td>' + esc(l.dateLabel) + '</td>' +
        '<td><span class="adm-pill ' + (l.status === "new" ? "adm-pill--new" : "adm-pill--done") + '">' + esc(l.status) + '</span></td>' +
        '<td class="adm-actions">' + (l.status === "new" && l.id
          ? '<button class="adm-act" data-contact="' + l.id + '">Mark contacted</button>' : "") + '</td></tr>';
    }).join("");
    el("leadsTable").querySelectorAll("[data-contact]").forEach(function (b) {
      b.addEventListener("click", function () {
        FM.store.updateLead(b.dataset.contact, { status: "contacted" });
        renderAll();
        toast("Lead marked contacted.");
      });
    });
  }

  /* ---------- bookings table ---------- */
  function renderBookings() {
    var live = liveBookings().map(function (b) {
      return { type: b.type, vehicle: b.vehicle,
        when: b.type === "reservation" ? "48-hour hold · $500 (TEST)" : (b.date || "") + " · " + (b.time || ""),
        name: b.name, status: b.status, live: true };
    });
    var rows = live.concat(SAMPLE_BOOKINGS.map(function (b) {
      return { type: b.type, vehicle: b.vehicle, when: b.when, name: b.name, status: b.status, live: false };
    }));
    el("bookTable").querySelector("tbody").innerHTML = rows.map(function (b) {
      return '<tr' + (b.live ? ' class="adm-row-live"' : "") + '>' +
        '<td><span class="adm-pill ' + (b.type === "reservation" ? "adm-pill--hold" : "adm-pill--type") + '">' +
          (b.type === "reservation" ? "Reservation" : "Test drive") + '</span></td>' +
        '<td>' + esc(b.vehicle) + '</td>' +
        '<td>' + esc(b.when) + '</td>' +
        '<td><strong>' + esc(b.name) + '</strong>' + (b.live ? ' <span class="adm-chip-live">live</span>' : "") + '</td>' +
        '<td><span class="adm-pill ' + (b.status === "completed" ? "adm-pill--done" : "adm-pill--ok") + '">' + esc(b.status) + '</span></td></tr>';
    }).join("");
  }
})();
