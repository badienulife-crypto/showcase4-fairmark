/* Fairmark Motors — Showcase Build #4 (SimpliTechPro demo) */
(function () {
  "use strict";

  // mobile nav drawer
  var burger = document.getElementById("navBurger");
  var drawer = document.getElementById("navDrawer");
  if (burger && drawer) {
    burger.addEventListener("click", function () {
      var open = drawer.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    drawer.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        drawer.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  // live inventory count in the hero quick-search button
  var count = document.querySelector(".hs-count");
  if (count && window.FM) {
    count.textContent = FM.inventory().filter(function (v) { return v.status !== "sold"; }).length + " cars";
  }

  // scrolling inventory row (homepage) — content doubled for a seamless loop
  var row = document.getElementById("homeRow");
  if (row && window.FM) {
    var cars = FM.inventory().filter(function (v) { return v.status !== "sold"; });
    function hrCard(v, hidden) {
      return '<a class="hr-card" href="vehicle.html?id=' + v.id + '"' + (hidden ? ' tabindex="-1" aria-hidden="true"' : "") + '>' +
        '<div class="hr-photo"><img src="' + v.photos[0] + '" alt="' + (hidden ? "" : v.year + " " + v.make + " " + v.model) + '"></div>' +
        '<div class="hr-info">' +
          '<p class="hr-name">' + v.year + " " + v.make + " " + v.model + '</p>' +
          '<p class="hr-price num">' + FM.fmtMoney(v.price) + ' <em>· from ' + FM.fmtMoney(v.monthlyFrom) + '/mo</em></p>' +
        '</div></a>';
    }
    row.innerHTML =
      cars.map(function (v) { return hrCard(v, false); }).join("") +
      cars.map(function (v) { return hrCard(v, true); }).join("");
  }

  // homepage financing teaser — compact live estimate
  var fcMonthly = document.getElementById("fcMonthly");
  if (fcMonthly && window.FM) {
    var fcIds = ["fcPrice", "fcDown", "fcTerm", "fcApr"];
    function fcUpdate() {
      var price = +document.getElementById("fcPrice").value || 0;
      var down = +document.getElementById("fcDown").value || 0;
      var term = +document.getElementById("fcTerm").value || 84;
      var apr = +document.getElementById("fcApr").value || 0;
      fcMonthly.textContent = FM.fmtMoney(FM.monthlyPayment(Math.max(0, price - down), apr, term));
    }
    fcIds.forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener("input", fcUpdate);
      el.addEventListener("change", fcUpdate);
    });
    fcUpdate();
  }

  // sell/trade instant-estimate widget (demo — lands a lead in the staff view)
  var sellForm = document.querySelector(".sell-widget");
  if (sellForm && window.FM) {
    var yearSel = document.getElementById("soYear");
    var thisYear = new Date().getFullYear();
    for (var y = thisYear; y >= thisYear - 12; y--) {
      var opt = document.createElement("option");
      opt.value = y; opt.textContent = y;
      if (y === thisYear - 5) opt.selected = true;
      yearSel.appendChild(opt);
    }
    sellForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var year = +yearSel.value, km = +document.getElementById("soKm").value;
      var make = document.getElementById("soMake").value;
      // illustrative: base value decays with age + mileage (demo math, not a real appraisal)
      var age = Math.max(0, thisYear - year);
      var base = 34000 * Math.pow(0.88, age) * (1 - Math.min(0.35, km / 500000));
      var lo = Math.round(base * 0.92 / 100) * 100, hi = Math.round(base * 1.06 / 100) * 100;
      document.getElementById("soRange").textContent = FM.fmtMoney(lo) + " – " + FM.fmtMoney(hi);
      document.getElementById("soResult").hidden = false;
      FM.store.addLead({ name: "Sell/trade enquiry", email: "", phone: "",
        vehicle: year + " " + make + " (~" + km.toLocaleString("en-CA") + " km)",
        vehicleId: null, source: "Sell / trade form" });
    });
  }
})();
