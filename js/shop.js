/* Fairmark Motors — Shop page: instant client-side filter/sort (demo data) */
(function () {
  "use strict";
  if (!window.FM) return;

  var all = FM.inventory();
  var grid = document.getElementById("vehGrid");
  var state = {
    q: "", makes: [], bodies: [], drives: [],
    priceMin: null, priceMax: null, yearMin: null, kmMax: null,
    sort: "featured"
  };

  var PRICE_FLOOR = Math.floor(Math.min.apply(null, all.map(function (v) { return v.price; })) / 1000) * 1000;
  var PRICE_CEIL  = Math.ceil(Math.max.apply(null, all.map(function (v) { return v.price; })) / 1000) * 1000;

  /* ---------- build filter options from the data ---------- */
  function uniq(arr) { return arr.filter(function (v, i) { return arr.indexOf(v) === i; }); }

  function buildChecks(elId, values, key) {
    var wrap = document.getElementById(elId);
    values.forEach(function (val) {
      var lab = document.createElement("label");
      lab.className = "f-check";
      var cb = document.createElement("input");
      cb.type = "checkbox"; cb.value = val;
      cb.addEventListener("change", function () {
        var list = state[key];
        if (cb.checked) list.push(val);
        else list.splice(list.indexOf(val), 1);
        apply();
      });
      lab.appendChild(cb);
      lab.appendChild(document.createTextNode(val));
      wrap.appendChild(lab);
    });
  }

  buildChecks("fMake",  uniq(all.map(function (v) { return v.make; })).sort(), "makes");
  buildChecks("fBody",  uniq(all.map(function (v) { return v.bodyType; })).sort(), "bodies");
  buildChecks("fDrive", uniq(all.map(function (v) { return v.drivetrain; })).sort(), "drives");

  var yearSel = document.getElementById("fYear");
  uniq(all.map(function (v) { return v.year; })).sort().reverse().forEach(function (y) {
    var o = document.createElement("option");
    o.value = y; o.textContent = y + " or newer";
    yearSel.appendChild(o);
  });
  yearSel.addEventListener("change", function () { state.yearMin = yearSel.value ? +yearSel.value : null; apply(); });

  var kmSel = document.getElementById("fKm");
  kmSel.addEventListener("change", function () { state.kmMax = kmSel.value ? +kmSel.value : null; apply(); });

  var qInput = document.getElementById("fSearch");
  qInput.addEventListener("input", function () { state.q = qInput.value.trim().toLowerCase(); apply(); });

  /* ---------- dual price slider ---------- */
  var minR = document.getElementById("priceMin");
  var maxR = document.getElementById("priceMax");
  minR.min = maxR.min = PRICE_FLOOR; minR.max = maxR.max = PRICE_CEIL;
  minR.value = PRICE_FLOOR; maxR.value = PRICE_CEIL;
  state.priceMin = PRICE_FLOOR; state.priceMax = PRICE_CEIL;

  function syncPrice(fromMin) {
    var lo = +minR.value, hi = +maxR.value;
    if (lo > hi) { if (fromMin) { maxR.value = lo; hi = lo; } else { minR.value = hi; lo = hi; } }
    state.priceMin = lo; state.priceMax = hi;
    document.getElementById("priceMinLbl").textContent = FM.fmtMoney(lo);
    document.getElementById("priceMaxLbl").textContent = FM.fmtMoney(hi);
  }
  minR.addEventListener("input", function () { syncPrice(true);  apply(); });
  maxR.addEventListener("input", function () { syncPrice(false); apply(); });
  syncPrice(true);

  /* ---------- sort ---------- */
  var sortSel = document.getElementById("sortSel");
  sortSel.addEventListener("change", function () { state.sort = sortSel.value; apply(); });

  /* ---------- clear ---------- */
  function clearAll() {
    state.q = ""; state.makes = []; state.bodies = []; state.drives = [];
    state.yearMin = null; state.kmMax = null;
    qInput.value = ""; yearSel.value = ""; kmSel.value = "";
    minR.value = PRICE_FLOOR; maxR.value = PRICE_CEIL; syncPrice(true);
    document.querySelectorAll(".f-check input").forEach(function (cb) { cb.checked = false; });
    apply();
  }
  document.getElementById("clearFilters").addEventListener("click", clearAll);
  document.getElementById("emptyClear").addEventListener("click", clearAll);

  /* ---------- URL params from the homepage quick search ---------- */
  (function initFromURL() {
    var p = new URLSearchParams(location.search);
    var make = p.get("make"), body = p.get("body"), max = p.get("max");
    if (make) {
      var cb = document.querySelector('#fMake input[value="' + make + '"]');
      if (cb) { cb.checked = true; state.makes.push(make); }
    }
    if (body) {
      var cb2 = document.querySelector('#fBody input[value="' + body + '"]');
      if (cb2) { cb2.checked = true; state.bodies.push(body); }
    }
    if (max && +max >= PRICE_FLOOR) {
      maxR.value = Math.min(+max, PRICE_CEIL); syncPrice(false);
    }
  })();

  /* ---------- filtering ---------- */
  function matches(v) {
    if (state.q) {
      var hay = (v.year + " " + v.make + " " + v.model + " " + v.trim + " " + v.exteriorColour + " " + v.bodyType + " " + v.fuel).toLowerCase();
      if (hay.indexOf(state.q) === -1) return false;
    }
    if (state.makes.length  && state.makes.indexOf(v.make) === -1) return false;
    if (state.bodies.length && state.bodies.indexOf(v.bodyType) === -1) return false;
    if (state.drives.length && state.drives.indexOf(v.drivetrain) === -1) return false;
    if (v.price < state.priceMin || v.price > state.priceMax) return false;
    if (state.yearMin && v.year < state.yearMin) return false;
    if (state.kmMax && v.mileage_km > state.kmMax) return false;
    return true;
  }
  function sortList(list) {
    var s = state.sort;
    if (s === "featured") return list;
    return list.slice().sort(function (a, b) {
      if (s === "price-asc")  return a.price - b.price;
      if (s === "price-desc") return b.price - a.price;
      if (s === "year-desc")  return b.year - a.year;
      if (s === "km-asc")     return a.mileage_km - b.mileage_km;
      return 0;
    });
  }

  /* ---------- render ---------- */
  function cardHTML(v) {
    var badge = v.certified ? '<span class="v-badge"><svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M12 2l8 3.5V11c0 5-3.4 8.8-8 11-4.6-2.2-8-6-8-11V5.5L12 2z" fill="currentColor"/><path d="M8.5 12l2.5 2.5L15.5 9.5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Certified</span>' : "";
    var pill = "";
    if (v.status === "reserved") pill = '<span class="v-pill v-pill--reserved">Reserved</span>';
    if (v.status === "sold")     pill = '<span class="v-pill v-pill--sold">Sold</span>';
    return '' +
      '<a class="v-card' + (v.status !== "available" ? " is-" + v.status : "") + '" href="vehicle.html?id=' + v.id + '">' +
        '<div class="v-photo">' +
          '<img src="' + v.photos[0] + '" alt="' + v.year + " " + v.make + " " + v.model + '" loading="lazy">' +
          badge + pill +
        '</div>' +
        '<div class="v-info">' +
          '<h3 class="v-title">' + v.year + " " + v.make + " " + v.model + '</h3>' +
          '<p class="v-trim">' + v.trim + " · " + v.exteriorColour + '</p>' +
          '<p class="v-price num">' + FM.fmtMoney(v.price) + ' <em>· from ' + FM.fmtMoney(v.monthlyFrom) + '/mo</em></p>' +
          '<p class="v-specs num">' + FM.fmtKm(v.mileage_km) + " · " + v.drivetrain + " · " + v.transmission + " · " + v.fuel + '</p>' +
        '</div>' +
      '</a>';
  }

  function apply() {
    var list = sortList(all.filter(matches));
    grid.innerHTML = list.map(cardHTML).join("");
    var n = list.length;
    document.getElementById("resultCount").textContent = n;
    document.getElementById("resultWord").textContent = n === 1 ? "vehicle" : "vehicles";
    document.getElementById("emptyState").hidden = n !== 0;
  }

  document.getElementById("headCount").textContent = all.length + " in stock this week";
  apply();

  /* ---------- mobile filter drawer ---------- */
  var rail = document.getElementById("filterRail");
  var overlay = document.getElementById("filterOverlay");
  var toggle = document.getElementById("filterToggle");
  function openRail(open) {
    rail.classList.toggle("open", open);
    overlay.hidden = !open;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("no-scroll", open);
  }
  toggle.addEventListener("click", function () { openRail(!rail.classList.contains("open")); });
  document.getElementById("filterClose").addEventListener("click", function () { openRail(false); });
  document.getElementById("filterApply").addEventListener("click", function () { openRail(false); });
  overlay.addEventListener("click", function () { openRail(false); });
})();
