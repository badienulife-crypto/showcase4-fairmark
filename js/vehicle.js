/* Fairmark Motors — Vehicle Detail page + financing calculator (demo) */
(function () {
  "use strict";
  if (!window.FM) return;

  var main = document.getElementById("vehMain");
  var id = new URLSearchParams(location.search).get("id");
  var all = FM.inventory();
  var v = null;
  for (var i = 0; i < all.length; i++) if (all[i].id === id) { v = all[i]; break; }
  if (!v) v = all[0]; // direct visits without an id land on the first car

  if (!v) { document.getElementById("vehNotFound").hidden = false; return; }

  document.title = v.year + " " + v.make + " " + v.model + " — Fairmark Motors";

  var statusPill = "";
  if (v.status === "reserved") statusPill = '<span class="v-pill v-pill--reserved">Reserved</span>';
  if (v.status === "sold")     statusPill = '<span class="v-pill v-pill--sold">Sold</span>';

  var specs = [
    ["Mileage", FM.fmtKm(v.mileage_km)], ["Year", v.year],
    ["Body", v.bodyType], ["Drivetrain", v.drivetrain],
    ["Transmission", v.transmission], ["Fuel", v.fuel],
    ["Colour", v.exteriorColour], ["VIN (demo)", v.vin]
  ];

  var html =
    '<nav class="crumbs" aria-label="Breadcrumb"><a href="shop.html">← Inventory</a></nav>' +

    '<section class="veh-top">' +
      '<div class="veh-photo">' +
        '<img src="' + v.photos[0] + '" alt="' + v.year + " " + v.make + " " + v.model + '">' +
        '<span class="v-badge"><svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M12 2l8 3.5V11c0 5-3.4 8.8-8 11-4.6-2.2-8-6-8-11V5.5L12 2z" fill="currentColor"/><path d="M8.5 12l2.5 2.5L15.5 9.5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Certified</span>' +
        statusPill +
      '</div>' +
      '<div class="veh-summary">' +
        '<h1>' + v.year + " " + v.make + " " + v.model + '</h1>' +
        '<p class="veh-trim">' + v.trim + " · " + v.exteriorColour + '</p>' +
        '<p class="veh-price num">' + FM.fmtMoney(v.price) +
          ' <em>· from <span id="fromMo">' + FM.fmtMoney(v.monthlyFrom) + '</span>/mo</em></p>' +
        '<p class="veh-price-note">Fair no-haggle price · taxes &amp; licensing extra</p>' +
        '<div class="veh-actions">' +
          '<button class="btn btn-primary" type="button" data-flow="testdrive">Book a test drive</button>' +
          '<button class="btn btn-ghost" type="button" data-flow="reserve">Pre-qualify &amp; reserve</button>' +
        '</div>' +
        '<ul class="veh-assure">' +
          '<li>172-point certification</li><li>Full history report</li><li>7-day / 750 km return</li>' +
        '</ul>' +
        '<div class="veh-specs">' +
          specs.map(function (s) {
            return '<div class="spec"><span class="spec-k">' + s[0] + '</span><span class="spec-v num">' + s[1] + '</span></div>';
          }).join("") +
        '</div>' +
        '<ul class="veh-features">' +
          v.features.map(function (f) { return "<li>" + f + "</li>"; }).join("") +
        '</ul>' +
      '</div>' +
    '</section>' +

    '<section class="calc" id="calc" aria-label="Financing calculator">' +
      '<div class="calc-head">' +
        '<h2>Know your payment before you visit</h2>' +
        '<p>Live math, no obligation — adjust anything. <span class="calc-demo">Illustration only (demo)</span></p>' +
      '</div>' +
      '<div class="calc-body">' +
        '<div class="calc-inputs">' +
          '<label class="c-field"><span>Vehicle price</span><input type="number" id="cPrice" class="num" min="0" step="500" value="' + v.price + '"></label>' +
          '<label class="c-field"><span>Down payment</span><input type="number" id="cDown" class="num" min="0" step="500" value="2500"></label>' +
          '<label class="c-field"><span>Trade-in value</span><input type="number" id="cTrade" class="num" min="0" step="500" value="0"></label>' +
          '<label class="c-field"><span>Term</span><select id="cTerm">' +
            [36, 48, 60, 72, 84].map(function (t) {
              return '<option value="' + t + '"' + (t === 72 ? " selected" : "") + '>' + t + " months</option>";
            }).join("") +
          '</select></label>' +
          '<label class="c-field"><span>APR %</span><input type="number" id="cApr" class="num" min="0" max="30" step="0.1" value="7.99"></label>' +
        '</div>' +
        '<div class="calc-out">' +
          '<p class="co-label">Estimated payment</p>' +
          '<p class="co-monthly"><span class="num" id="coMonthly">$0</span><em>/month</em></p>' +
          '<div class="co-bar" id="coBar" role="img" aria-label="Loan cost breakdown">' +
            '<span class="co-seg co-seg--p" id="segP"></span>' +
            '<span class="co-seg co-seg--i" id="segI"></span>' +
          '</div>' +
          '<div class="co-legend">' +
            '<span class="co-key"><i class="co-dot co-dot--p"></i>Amount financed <strong class="num" id="coPrincipal"></strong></span>' +
            '<span class="co-key"><i class="co-dot co-dot--i"></i>Total interest <strong class="num" id="coInterest"></strong></span>' +
          '</div>' +
          '<div class="co-rows">' +
            '<div class="co-row"><span>Total of payments</span><strong class="num" id="coTotalPay"></strong></div>' +
            '<div class="co-row"><span>Total cost incl. down &amp; trade</span><strong class="num" id="coTotal"></strong></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</section>' +

    '<section class="more">' +
      '<div class="more-head"><h2>More from the showroom</h2><a href="shop.html">View all →</a></div>' +
      '<div class="veh-grid" id="moreGrid"></div>' +
    '</section>';

  main.insertAdjacentHTML("afterbegin", html);

  /* ---------- similar vehicles (same body type first, then price-adjacent) ---------- */
  var others = all.filter(function (o) { return o.id !== v.id && o.status !== "sold"; });
  others.sort(function (a, b) {
    var sameA = a.bodyType === v.bodyType ? 0 : 1;
    var sameB = b.bodyType === v.bodyType ? 0 : 1;
    if (sameA !== sameB) return sameA - sameB;
    return Math.abs(a.price - v.price) - Math.abs(b.price - v.price);
  });
  document.getElementById("moreGrid").innerHTML = others.slice(0, 3).map(function (o) {
    return '<a class="v-card" href="vehicle.html?id=' + o.id + '">' +
      '<div class="v-photo"><img src="' + o.photos[0] + '" alt="' + o.year + " " + o.make + " " + o.model + '" loading="lazy"></div>' +
      '<div class="v-info">' +
        '<h3 class="v-title">' + o.year + " " + o.make + " " + o.model + '</h3>' +
        '<p class="v-trim">' + o.trim + '</p>' +
        '<p class="v-price num">' + FM.fmtMoney(o.price) + ' <em>· from ' + FM.fmtMoney(o.monthlyFrom) + '/mo</em></p>' +
      '</div></a>';
  }).join("");

  /* ---------- financing calculator ---------- */
  var els = {
    price: document.getElementById("cPrice"), down: document.getElementById("cDown"),
    trade: document.getElementById("cTrade"), term: document.getElementById("cTerm"),
    apr: document.getElementById("cApr"),
    monthly: document.getElementById("coMonthly"), segP: document.getElementById("segP"),
    segI: document.getElementById("segI"), principal: document.getElementById("coPrincipal"),
    interest: document.getElementById("coInterest"), totalPay: document.getElementById("coTotalPay"),
    total: document.getElementById("coTotal"), bar: document.getElementById("coBar")
  };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var shownMonthly = 0, animId = null;

  function num(el) { var n = parseFloat(el.value); return isNaN(n) || n < 0 ? 0 : n; }

  function recalc() {
    var price = num(els.price), down = num(els.down), trade = num(els.trade);
    var term = +els.term.value, apr = Math.min(num(els.apr), 30);
    var principal = Math.max(price - down - trade, 0);
    var monthly = FM.monthlyPayment(principal, apr, term);
    var totalPay = monthly * term;
    var interest = Math.max(totalPay - principal, 0);
    var total = totalPay + down + trade;

    // hero number counts up/down briefly
    if (animId) cancelAnimationFrame(animId);
    if (reduceMotion || shownMonthly === 0) {
      shownMonthly = monthly;
      els.monthly.textContent = FM.fmtMoney(monthly);
    } else {
      var from = shownMonthly, start = null;
      (function step(ts) {
        if (!start) start = ts;
        var t = Math.min((ts - start) / 260, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        els.monthly.textContent = FM.fmtMoney(from + (monthly - from) * eased);
        if (t < 1) animId = requestAnimationFrame(step);
        else { shownMonthly = monthly; animId = null; }
      })(performance.now());
      shownMonthly = monthly;
    }

    // proportion bar (principal vs interest of total paid)
    var denom = principal + interest;
    var pShare = denom > 0 ? principal / denom : 1;
    els.segP.style.width = (pShare * 100).toFixed(1) + "%";
    els.segI.style.width = ((1 - pShare) * 100).toFixed(1) + "%";
    els.segI.style.display = interest > 0 ? "" : "none";
    els.bar.setAttribute("aria-label",
      "Loan cost breakdown: amount financed " + FM.fmtMoney(principal) + ", total interest " + FM.fmtMoney(interest));

    els.principal.textContent = FM.fmtMoney(principal);
    els.interest.textContent = FM.fmtMoney(interest);
    els.totalPay.textContent = FM.fmtMoney(totalPay);
    els.total.textContent = FM.fmtMoney(total);
    document.getElementById("fromMo").textContent = FM.fmtMoney(monthly);
  }
  ["input", "change"].forEach(function (evt) {
    [els.price, els.down, els.trade, els.term, els.apr].forEach(function (el) {
      el.addEventListener(evt, recalc);
    });
  });
  recalc();

  /* ---------- action buttons (wizards arrive in the next build step) ---------- */
  document.querySelectorAll("[data-flow]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (window.FMWizards) { FMWizards.open(btn.getAttribute("data-flow"), v); return; }
      var t = document.createElement("div");
      t.className = "toast";
      t.textContent = "This demo flow is being wired up next — the calculator below is live.";
      document.body.appendChild(t);
      setTimeout(function () { t.classList.add("show"); }, 10);
      setTimeout(function () { t.classList.remove("show"); setTimeout(function () { t.remove(); }, 300); }, 3200);
    });
  });
})();
