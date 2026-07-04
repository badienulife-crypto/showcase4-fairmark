/* ==========================================================================
   Fairmark Motors — mock data layer (Showcase Build #4, SimpliTechPro demo)
   ALL DATA IS FICTIONAL. VINs are fake. Nothing here is a real listing.
   window.FM = inventory + finance math + shared session store
   (sessionStorage-backed so storefront actions appear in the admin demo).
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- finance math (shared by cards, calculator, wizards) ---------- */
  var FINANCE_DEFAULTS = { apr: 7.99, term: 84, down: 0 };

  // standard amortization: P * r / (1 - (1+r)^-n), rounded to the dollar
  function monthlyPayment(principal, aprPct, termMonths) {
    if (principal <= 0) return 0;
    var r = (aprPct / 100) / 12;
    if (r === 0) return Math.round(principal / termMonths);
    return Math.round(principal * r / (1 - Math.pow(1 + r, -termMonths)));
  }
  function monthlyFrom(price) {
    return monthlyPayment(price - FINANCE_DEFAULTS.down, FINANCE_DEFAULTS.apr, FINANCE_DEFAULTS.term);
  }
  function fmtMoney(n) {
    return "$" + Math.round(n).toLocaleString("en-CA");
  }
  function fmtKm(n) {
    return n.toLocaleString("en-CA") + " km";
  }

  /* ---------- inventory (14 vehicles — fictional Ontario CPO stock) ---------- */
  var INVENTORY = [
    { id: "FM-1001", year: 2021, make: "Tesla", model: "Model 3", trim: "Standard Range Plus",
      price: 33450, mileage_km: 48120, bodyType: "Sedan", drivetrain: "RWD", fuel: "Electric",
      transmission: "Automatic", exteriorColour: "Pearl White", photos: ["images/inventory/model3.webp"],
      certified: true, status: "available", vin: "DEMO5YJ3E1EA0MF01",
      features: ["Autopilot", "Heated seats", "Glass roof", "One owner"] },

    { id: "FM-1002", year: 2022, make: "Tesla", model: "Model Y", trim: "Long Range AWD",
      price: 46900, mileage_km: 31240, bodyType: "SUV", drivetrain: "AWD", fuel: "Electric",
      transmission: "Automatic", exteriorColour: "Pearl White", photos: ["images/inventory/modely.webp"],
      certified: true, status: "available", vin: "DEMO7SAYGDEE5NF02",
      features: ["Dual motor AWD", "Tow package", "Premium interior", "Clean history"] },

    { id: "FM-1003", year: 2019, make: "BMW", model: "M5", trim: "Competition",
      price: 71800, mileage_km: 52780, bodyType: "Sedan", drivetrain: "AWD", fuel: "Gas",
      transmission: "Automatic", exteriorColour: "Alpine White", photos: ["images/inventory/m5.webp"],
      certified: true, status: "available", vin: "DEMOWBSJF0C50KB03",
      features: ["617 hp V8", "M carbon brakes", "Executive package", "Full service records"] },

    { id: "FM-1004", year: 2018, make: "BMW", model: "430i", trim: "xDrive Coupe",
      price: 27900, mileage_km: 74350, bodyType: "Coupe", drivetrain: "AWD", fuel: "Gas",
      transmission: "Automatic", exteriorColour: "Estoril Blue", photos: ["images/inventory/430i.webp"],
      certified: true, status: "available", vin: "DEMOWBA4Z3C58JE04",
      features: ["M Sport package", "Navigation", "Sunroof", "Two sets of tires"] },

    { id: "FM-1005", year: 2017, make: "Chevrolet", model: "Camaro", trim: "2SS",
      price: 34500, mileage_km: 61200, bodyType: "Coupe", drivetrain: "RWD", fuel: "Gas",
      transmission: "Manual", exteriorColour: "Hyper Blue", photos: ["images/inventory/camaro.webp"],
      certified: true, status: "reserved", vin: "DEMO1G1FH1R70H0F05",
      features: ["6.2L V8", "Magnetic ride", "Recaro seats", "Accident-free"] },

    { id: "FM-1006", year: 2019, make: "Mercedes-Benz", model: "GLE 43 AMG", trim: "Coupe",
      price: 43900, mileage_km: 68900, bodyType: "SUV", drivetrain: "AWD", fuel: "Gas",
      transmission: "Automatic", exteriorColour: "Polar White", photos: ["images/inventory/gle.webp"],
      certified: true, status: "available", vin: "DEMO4JGED6EB1KA06",
      features: ["385 hp biturbo", "Air suspension", "360 camera", "New brakes all around"] },

    { id: "FM-1007", year: 2018, make: "Ford", model: "Expedition", trim: "Limited Max",
      price: 38900, mileage_km: 89400, bodyType: "SUV", drivetrain: "4x4", fuel: "Gas",
      transmission: "Automatic", exteriorColour: "Oxford White", photos: ["images/inventory/expedition.webp"],
      certified: true, status: "available", vin: "DEMO1FMJK2AT1JE07",
      features: ["8 seats", "Tow package 9,300 lb", "Panoramic roof", "One owner"] },

    { id: "FM-1008", year: 2020, make: "Hyundai", model: "Elantra GT", trim: "N Line",
      price: 19450, mileage_km: 55600, bodyType: "Hatchback", drivetrain: "FWD", fuel: "Gas",
      transmission: "Manual", exteriorColour: "Scarlet Red", photos: ["images/inventory/elantra.webp"],
      certified: true, status: "available", vin: "DEMOKMHH55LC0LU08",
      features: ["201 hp turbo", "Sport suspension", "Apple CarPlay", "Balance of warranty"] },

    { id: "FM-1009", year: 2016, make: "BMW", model: "M4", trim: "Coupe",
      price: 47900, mileage_km: 71850, bodyType: "Coupe", drivetrain: "RWD", fuel: "Gas",
      transmission: "Manual", exteriorColour: "Mineral Grey", photos: ["images/inventory/m4.webp"],
      certified: true, status: "available", vin: "DEMOWBS3R9C54GK09",
      features: ["425 hp twin-turbo", "Carbon roof", "Harman Kardon", "Enthusiast-owned"] },

    { id: "FM-1010", year: 2016, make: "Audi", model: "RS 6 Avant", trim: "Performance",
      price: 89900, mileage_km: 64300, bodyType: "Wagon", drivetrain: "AWD", fuel: "Gas",
      transmission: "Automatic", exteriorColour: "Daytona Grey", photos: ["images/inventory/rs6.webp"],
      certified: true, status: "available", vin: "DEMOWUAW2AFC0GN10",
      features: ["605 hp V8", "Dynamic package", "Rare import", "Full documentation"] },

    { id: "FM-1011", year: 2017, make: "Ford", model: "Mustang", trim: "GT Premium",
      price: 31900, mileage_km: 58700, bodyType: "Coupe", drivetrain: "RWD", fuel: "Gas",
      transmission: "Manual", exteriorColour: "Magnetic Grey", photos: ["images/inventory/mustang.webp"],
      certified: true, status: "available", vin: "DEMO1FA6P8CF0H5K11",
      features: ["5.0L V8", "Performance package", "Track apps", "Adult-owned"] },

    { id: "FM-1012", year: 2018, make: "Mercedes-AMG", model: "GT R", trim: "Coupe",
      price: 139900, mileage_km: 28400, bodyType: "Coupe", drivetrain: "RWD", fuel: "Gas",
      transmission: "Automatic", exteriorColour: "Jupiter Red", photos: ["images/inventory/amggtr.webp"],
      certified: true, status: "available", vin: "DEMOWDDYJ7KA1JA12",
      features: ["577 hp V8", "Track package", "Carbon ceramics", "Collector grade"] },

    { id: "FM-1013", year: 2016, make: "Mercedes-AMG", model: "GT S", trim: "Coupe",
      price: 84900, mileage_km: 41900, bodyType: "Coupe", drivetrain: "RWD", fuel: "Gas",
      transmission: "Automatic", exteriorColour: "Solarbeam Yellow", photos: ["images/inventory/amggts.webp"],
      certified: true, status: "available", vin: "DEMOWDDYJ7JA0GA13",
      features: ["503 hp biturbo", "Performance seats", "Burmester audio", "No stories"] },

    { id: "FM-1014", year: 2016, make: "Fiat", model: "500", trim: "1957 Edition",
      price: 11900, mileage_km: 66200, bodyType: "Hatchback", drivetrain: "FWD", fuel: "Gas",
      transmission: "Automatic", exteriorColour: "Retro Blue", photos: ["images/inventory/fiat500.webp"],
      certified: true, status: "available", vin: "DEMO3C3CFFKR1GT14",
      features: ["Retro package", "Low insurance", "City-perfect", "New all-seasons"] }
  ];

  // attach computed monthly
  INVENTORY.forEach(function (v) { v.monthlyFrom = monthlyFrom(v.price); });

  /* ---------- session store (leads / bookings land in the admin demo) ---------- */
  var STORE_KEY = "fm-demo-store-v1";
  function blankStore() { return { leads: [], bookings: [], inventoryOverrides: {}, customVehicles: [] }; }
  function loadStore() {
    var s;
    try { s = JSON.parse(sessionStorage.getItem(STORE_KEY)); } catch (e) { s = null; }
    if (!s) return blankStore();
    // older sessions may predate customVehicles
    if (!s.customVehicles) s.customVehicles = [];
    return s;
  }
  function saveStore(s) {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) { /* demo only */ }
  }
  function addLead(lead) {
    var s = loadStore();
    lead.id = "L-" + String(1000 + s.leads.length + 1);
    lead.date = new Date().toISOString();
    lead.status = "new";
    s.leads.push(lead); saveStore(s); return lead;
  }
  function addBooking(b) {
    var s = loadStore();
    b.id = "B-" + String(1000 + s.bookings.length + 1);
    b.createdAt = new Date().toISOString();
    s.bookings.push(b); saveStore(s); return b;
  }
  function getInventory() { // admin overrides + admin-added vehicles applied
    var s = loadStore();
    return INVENTORY.map(function (v) {
      var o = s.inventoryOverrides[v.id];
      return o ? Object.assign({}, v, o) : v;
    }).concat(s.customVehicles.map(function (v) {
      var withMonthly = Object.assign({}, v, { monthlyFrom: monthlyFrom(v.price) });
      var o = s.inventoryOverrides[v.id];
      return o ? Object.assign(withMonthly, o) : withMonthly;
    }));
  }
  function overrideVehicle(id, patch) {
    var s = loadStore();
    s.inventoryOverrides[id] = Object.assign({}, s.inventoryOverrides[id] || {}, patch);
    saveStore(s);
  }
  function addVehicle(v) { // admin "Add vehicle" (demo) — lives only in this session
    var s = loadStore();
    v.id = "FM-2" + String(100 + s.customVehicles.length + 1).slice(-3);
    v.certified = true;
    v.status = v.status || "available";
    v.vin = "DEMOADMIN" + Date.now().toString().slice(-8);
    // neutral "photos being taken" placeholder so an added car never wears another car's photo
    if (!v.photos || !v.photos.length) v.photos = [
      "data:image/svg+xml," + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400">' +
        '<rect width="640" height="400" fill="#EEF1F6"/>' +
        '<g fill="none" stroke="#B9C2CF" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M170 240l28-62c6-13 18-21 32-21h180c14 0 26 8 32 21l28 62"/>' +
        '<path d="M150 240h340v52a12 12 0 01-12 12H162a12 12 0 01-12-12v-52z"/>' +
        '<circle cx="225" cy="304" r="24"/><circle cx="415" cy="304" r="24"/></g>' +
        '<text x="320" y="368" text-anchor="middle" font-family="Arial" font-size="24" fill="#8A94A2">Photos being taken</text></svg>')
    ];
    if (!v.features || !v.features.length) v.features = ["Added via staff demo"];
    s.customVehicles.push(v); saveStore(s); return v;
  }
  function updateLead(id, patch) {
    var s = loadStore();
    s.leads.forEach(function (l) { if (l.id === id) Object.assign(l, patch); });
    saveStore(s);
  }
  function resetStore() { try { sessionStorage.removeItem(STORE_KEY); } catch (e) { /* demo only */ } }

  window.FM = {
    inventory: getInventory,
    raw: INVENTORY,
    financeDefaults: FINANCE_DEFAULTS,
    monthlyPayment: monthlyPayment,
    monthlyFrom: monthlyFrom,
    fmtMoney: fmtMoney,
    fmtKm: fmtKm,
    store: { load: loadStore, addLead: addLead, addBooking: addBooking, overrideVehicle: overrideVehicle,
             addVehicle: addVehicle, updateLead: updateLead, reset: resetStore }
  };
})();
