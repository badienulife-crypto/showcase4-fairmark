/* Fairmark Motors — demo wizards: test-drive booking + pre-qualify/reserve
   ALL MOCKED. Nothing is sent anywhere; payments are simulated (test mode).
   Bookings/leads land in FM.store so the staff-view demo shows them live. */
(function () {
  "use strict";
  if (!window.FM) return;

  var overlay, modal, vehicle, flow;

  /* ---------- schedule generation (real upcoming dates) ---------- */
  var SLOT_TIMES = ["9:30 AM", "11:00 AM", "1:30 PM", "3:00 PM", "4:30 PM"];
  function nextDays(n) {
    var out = [], d = new Date();
    while (out.length < n) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() === 0) continue; // closed Sundays
      out.push({
        key: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })
      });
    }
    return out;
  }
  // one deterministic FULL slot so the schedule feels real
  function isFull(dayIdx, timeIdx) { return (dayIdx === 1 && timeIdx === 1) || (dayIdx === 3 && timeIdx === 4); }

  function ref(prefix) { return prefix + "-" + Math.floor(10000 + Math.random() * 90000); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---------- modal shell ---------- */
  function openModal(title, bodyHTML) {
    closeModal();
    overlay = document.createElement("div");
    overlay.className = "wz-overlay";
    overlay.innerHTML =
      '<div class="wz" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' +
        '<div class="wz-top">' +
          '<strong>' + esc(title) + '</strong>' +
          '<button class="wz-x" type="button" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="wz-body">' + bodyHTML + '</div>' +
        '<div class="wz-banner">DEMO FORM — NOTHING IS SENT · PAYMENTS IN TEST MODE</div>' +
      '</div>';
    document.body.appendChild(overlay);
    document.body.classList.add("no-scroll");
    modal = overlay.querySelector(".wz");
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });
    overlay.querySelector(".wz-x").addEventListener("click", closeModal);
    document.addEventListener("keydown", escClose);
    var f = modal.querySelector("input, select, button.slot");
    if (f) f.focus();
  }
  function escClose(e) { if (e.key === "Escape") closeModal(); }
  function closeModal() {
    if (overlay) { overlay.remove(); overlay = null; document.body.classList.remove("no-scroll"); }
    document.removeEventListener("keydown", escClose);
  }
  function setBody(html) { modal.querySelector(".wz-body").innerHTML = html; }

  function vehLine() {
    return '<div class="wz-veh">' +
      '<img src="' + vehicle.photos[0] + '" alt="">' +
      '<div><strong>' + vehicle.year + " " + vehicle.make + " " + vehicle.model + '</strong>' +
      '<span class="num">' + FM.fmtMoney(vehicle.price) + ' · from ' + FM.fmtMoney(vehicle.monthlyFrom) + '/mo</span></div>' +
    '</div>';
  }
  function dots(step, total) {
    var h = '<div class="wz-dots" aria-hidden="true">';
    for (var i = 1; i <= total; i++) h += '<i class="' + (i <= step ? "on" : "") + '"></i>';
    return h + "</div>";
  }

  /* ==========================================================
     FLOW 1 — TEST DRIVE
     ========================================================== */
  var td = {};
  function tdStep1() {
    var days = nextDays(6);
    var html = dots(1, 3) + vehLine() +
      '<h3>Pick a date &amp; time</h3><div class="wz-days">' +
      days.map(function (d, i) {
        return '<button type="button" class="slot day" data-day="' + i + '" data-key="' + d.key + '">' + d.label + '</button>';
      }).join("") + '</div>' +
      '<div class="wz-times" id="wzTimes"><p class="wz-hint">Choose a date first</p></div>' +
      '<button class="btn btn-primary wz-next" id="tdNext" disabled>Continue</button>';
    setBody(html);

    var dayBtns = modal.querySelectorAll(".slot.day");
    dayBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        dayBtns.forEach(function (x) { x.classList.remove("sel"); });
        b.classList.add("sel");
        td.dayIdx = +b.dataset.day; td.dateKey = b.dataset.key; td.dateLabel = b.textContent;
        td.time = null; document.getElementById("tdNext").disabled = true;
        var times = modal.querySelector("#wzTimes");
        times.innerHTML = SLOT_TIMES.map(function (t, ti) {
          var full = isFull(td.dayIdx, ti);
          return '<button type="button" class="slot time" ' + (full ? "disabled" : "") + ' data-t="' + t + '">' +
            t + (full ? ' <em>Full</em>' : "") + '</button>';
        }).join("");
        times.querySelectorAll(".slot.time:not([disabled])").forEach(function (tb) {
          tb.addEventListener("click", function () {
            times.querySelectorAll(".slot.time").forEach(function (x) { x.classList.remove("sel"); });
            tb.classList.add("sel");
            td.time = tb.dataset.t;
            document.getElementById("tdNext").disabled = false;
          });
        });
      });
    });
    document.getElementById("tdNext").addEventListener("click", tdStep2);
  }

  function tdStep2() {
    setBody(dots(2, 3) + vehLine() +
      '<h3>Your details</h3>' +
      '<div class="wz-fields">' +
        '<label>Full name<input id="wName" type="text" autocomplete="off" placeholder="Alex Morgan"></label>' +
        '<label>Email<input id="wEmail" type="email" autocomplete="off" placeholder="alex@example.com"></label>' +
        '<label>Phone<input id="wPhone" type="tel" autocomplete="off" placeholder="(647) 555-0000"></label>' +
      '</div>' +
      '<p class="wz-err" id="wzErr" hidden></p>' +
      '<div class="wz-row"><button class="btn btn-ghost" id="tdBack">Back</button>' +
      '<button class="btn btn-primary" id="tdConfirm">Confirm booking</button></div>');
    document.getElementById("tdBack").addEventListener("click", tdStep1);
    document.getElementById("tdConfirm").addEventListener("click", function () {
      var name = val("wName"), email = val("wEmail"), phone = val("wPhone");
      var err = validContact(name, email, phone);
      if (err) return showErr(err);
      td.name = name; td.email = email; td.phone = phone;
      FM.store.addBooking({ type: "test-drive", vehicleId: vehicle.id,
        vehicle: vehicle.year + " " + vehicle.make + " " + vehicle.model,
        date: td.dateLabel, time: td.time, name: name, email: email, phone: phone, status: "confirmed" });
      FM.store.addLead({ name: name, email: email, phone: phone,
        vehicle: vehicle.year + " " + vehicle.make + " " + vehicle.model, vehicleId: vehicle.id, source: "Test drive" });
      tdStep3();
    });
  }

  function tdStep3() {
    setBody(dots(3, 3) +
      '<div class="wz-done">' +
        '<span class="wz-check" aria-hidden="true"><svg viewBox="0 0 24 24" width="30" height="30"><path d="M4 12.5l5.5 5.5L20 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
        '<h3>Test drive booked</h3>' +
        '<p class="wz-ref num">Ref ' + ref("FMT") + ' · DEMO</p>' +
        '<div class="wz-summary">' +
          '<div><span>Vehicle</span><strong>' + vehicle.year + " " + vehicle.make + " " + vehicle.model + '</strong></div>' +
          '<div><span>When</span><strong>' + esc(td.dateLabel) + " · " + esc(td.time) + '</strong></div>' +
          '<div><span>Where</span><strong>Fairmark Motors, Toronto (demo)</strong></div>' +
        '</div>' +
        '<p class="wz-note">In the real system you’d get an email + calendar invite. This booking just appeared in the <strong>staff dashboard demo</strong> — take a look.</p>' +
        '<button class="btn btn-primary" id="wzClose">Done</button>' +
      '</div>');
    document.getElementById("wzClose").addEventListener("click", closeModal);
  }

  /* ==========================================================
     FLOW 2 — PRE-QUALIFY & RESERVE (test-mode deposit)
     ========================================================== */
  var pq = {};
  function pqStep1() {
    setBody(dots(1, 3) + vehLine() +
      '<h3>Quick pre-qualification</h3>' +
      '<div class="wz-fields">' +
        '<label>Full name<input id="wName" type="text" autocomplete="off" placeholder="Alex Morgan"></label>' +
        '<label>Email<input id="wEmail" type="email" autocomplete="off" placeholder="alex@example.com"></label>' +
        '<label>Employment<select id="wJob">' +
          '<option>Employed full-time</option><option>Self-employed</option><option>Employed part-time</option><option>Retired</option>' +
        '</select></label>' +
        '<label>Annual income<select id="wIncome">' +
          '<option value="45000">Under $50k</option><option value="65000" selected>$50k – $80k</option>' +
          '<option value="95000">$80k – $110k</option><option value="130000">$110k+</option>' +
        '</select></label>' +
      '</div>' +
      '<p class="wz-err" id="wzErr" hidden></p>' +
      '<button class="btn btn-primary wz-next" id="pqNext">See what I qualify for</button>');
    document.getElementById("pqNext").addEventListener("click", function () {
      var name = val("wName"), email = val("wEmail");
      var err = validContact(name, email, "000");
      if (err) return showErr(err);
      pq.name = name; pq.email = email;
      pq.amount = Math.round(+val("wIncome") * 0.55 / 1000) * 1000;
      pqStep2();
    });
  }

  function pqStep2() {
    var enough = pq.amount >= vehicle.price;
    setBody(dots(2, 3) +
      '<div class="wz-qualify">' +
        '<p class="co-label">Illustrative pre-qualification (demo)</p>' +
        '<p class="wz-amount num">' + FM.fmtMoney(pq.amount) + '</p>' +
        '<p class="wz-note">' + (enough
          ? "That comfortably covers this vehicle."
          : "Below this car’s price — in the real system we’d suggest terms or other vehicles. For the demo, carry on.") + '</p>' +
      '</div>' + vehLine() +
      '<div class="wz-reserve"><strong>Reserve this car for 48 hours</strong>' +
      '<p>A <strong class="num">$500</strong> fully-refundable deposit takes it off the market while you decide.</p></div>' +
      '<div class="wz-row"><button class="btn btn-ghost" id="pqBack">Back</button>' +
      '<button class="btn btn-primary" id="pqPay">Reserve — pay $500 deposit</button></div>');
    document.getElementById("pqBack").addEventListener("click", pqStep1);
    document.getElementById("pqPay").addEventListener("click", pqStep3);
  }

  function pqStep3() {
    setBody(dots(3, 3) +
      '<h3>Deposit — <span class="wz-test">TEST MODE</span></h3>' +
      '<div class="wz-fields">' +
        '<label>Name on card<input id="pcName" type="text" autocomplete="off" placeholder="Alex Morgan" value="' + esc(pq.name) + '"></label>' +
        '<label>Card number<input id="pcNum" type="text" inputmode="numeric" autocomplete="off" placeholder="4242 4242 4242 4242" maxlength="19"></label>' +
        '<div class="wz-half">' +
          '<label>Expiry<input id="pcExp" type="text" inputmode="numeric" autocomplete="off" placeholder="MM/YY" maxlength="5"></label>' +
          '<label>CVC<input id="pcCvc" type="text" inputmode="numeric" autocomplete="off" placeholder="123" maxlength="4"></label>' +
        '</div>' +
      '</div>' +
      '<button type="button" class="wz-fill" id="pcFill">Fill with demo card</button>' +
      '<p class="wz-err" id="wzErr" hidden></p>' +
      '<div class="wz-row"><button class="btn btn-ghost" id="pcBack">Back</button>' +
      '<button class="btn btn-primary" id="pcSubmit">Pay <span class="num">$500</span> deposit</button></div>');

    var num = document.getElementById("pcNum"), exp = document.getElementById("pcExp");
    num.addEventListener("input", function () {
      var d = num.value.replace(/\D/g, "").slice(0, 16);
      num.value = d.replace(/(.{4})/g, "$1 ").trim();
    });
    exp.addEventListener("input", function () {
      var d = exp.value.replace(/\D/g, "").slice(0, 4);
      exp.value = d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
    });
    document.getElementById("pcFill").addEventListener("click", function () {
      num.value = "4242 4242 4242 4242"; exp.value = "12/28";
      document.getElementById("pcCvc").value = "123";
      if (!val("pcName")) document.getElementById("pcName").value = pq.name || "Alex Demo";
      var e = document.getElementById("wzErr"); if (e) e.hidden = true;
    });
    document.getElementById("pcBack").addEventListener("click", pqStep2);
    document.getElementById("pcSubmit").addEventListener("click", function () {
      var cn = val("pcName"), cd = val("pcNum").replace(/\s/g, ""), ce = val("pcExp"), cv = val("pcCvc");
      if (!cn) return showErr("Enter the name on the card.");
      if (cd.length !== 16) return showErr("Card number should be 16 digits (use the demo card).");
      if (!/^\d{2}\/\d{2}$/.test(ce) || +ce.slice(0, 2) < 1 || +ce.slice(0, 2) > 12) return showErr("Expiry should be MM/YY.");
      if (cv.length < 3) return showErr("CVC should be 3–4 digits.");
      setBody('<div class="wz-processing"><span class="wz-spin" aria-hidden="true"></span><p>Processing test payment…</p></div>');
      setTimeout(pqDone, 1600);
    });
  }

  function pqDone() {
    FM.store.addLead({ name: pq.name, email: pq.email, phone: "",
      vehicle: vehicle.year + " " + vehicle.make + " " + vehicle.model, vehicleId: vehicle.id,
      source: "Reserved · $500 deposit (TEST)" });
    FM.store.addBooking({ type: "reservation", vehicleId: vehicle.id,
      vehicle: vehicle.year + " " + vehicle.make + " " + vehicle.model,
      name: pq.name, email: pq.email, deposit: 500, status: "reserved" });
    FM.store.overrideVehicle(vehicle.id, { status: "reserved" });
    setBody(
      '<div class="wz-done">' +
        '<span class="wz-check" aria-hidden="true"><svg viewBox="0 0 24 24" width="30" height="30"><path d="M4 12.5l5.5 5.5L20 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
        '<h3>Reserved <span class="wz-test">TEST</span></h3>' +
        '<p class="wz-ref num">Ref ' + ref("FMR") + ' · $500.00 deposit (simulated)</p>' +
        '<div class="wz-summary">' +
          '<div><span>Vehicle</span><strong>' + vehicle.year + " " + vehicle.make + " " + vehicle.model + '</strong></div>' +
          '<div><span>Held for</span><strong>48 hours (demo)</strong></div>' +
          '<div><span>Card</span><strong class="num">•••• 4242</strong></div>' +
        '</div>' +
        '<p class="wz-note">This car now shows <strong>Reserved</strong> across the storefront, and the deposit landed in the <strong>staff dashboard demo</strong>. No real payment happened.</p>' +
        '<button class="btn btn-primary" id="wzClose">Done</button>' +
      '</div>');
    document.getElementById("wzClose").addEventListener("click", function () { closeModal(); location.reload(); });
  }

  /* ---------- shared helpers ---------- */
  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; }
  function showErr(msg) {
    var e = document.getElementById("wzErr");
    if (e) { e.textContent = msg; e.hidden = false; }
  }
  function validContact(name, email, phone) {
    if (!name || name.length < 2) return "Please enter your name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return "That email doesn't look right.";
    if (!phone || phone.replace(/\D/g, "").length < 3) return "Please enter a phone number.";
    return null;
  }

  window.FMWizards = {
    open: function (which, v) {
      vehicle = v; flow = which;
      if (which === "testdrive") { td = {}; openModal("Book a test drive", ""); tdStep1(); }
      else { pq = {}; openModal("Pre-qualify & reserve", ""); pqStep1(); }
    }
  };
})();
