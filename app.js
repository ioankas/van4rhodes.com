
(function(){
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  // Year in footer
  $("#year") && ($("#year").textContent = new Date().getFullYear());

  // I18N
  let currentLang = localStorage.getItem("lang") || "en";
  const dictionaries = {};
  function applyI18n(){
    $$("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const dict = dictionaries[currentLang] || {};
      if(dict[key]) el.innerHTML = dict[key];
    });
    document.documentElement.lang = currentLang;
  }
  async function loadLang(lang){
    if(!dictionaries[lang]){
      try {
        const res = await fetch(`/assets/js/i18n/${lang}.json`);
        dictionaries[lang] = await res.json();
      } catch(e){ console.warn("i18n load failed", e); }
    }
    currentLang = lang;
    localStorage.setItem("lang", lang);
    applyI18n();
  }
  $("#lang-en")?.addEventListener("click", () => loadLang("en"));
  $("#lang-gr")?.addEventListener("click", () => loadLang("gr"));
  loadLang(currentLang);

  // Pricing sample (editable)
  const PRICES = [
    { route: "RHO → Rhodes Town", price: 35 },
    { route: "RHO → Ixia / Ialyssos", price: 40 },
    { route: "RHO → Kallithea / Faliraki", price: 50 },
    { route: "RHO → Lindos", price: 95 },
    { route: "Hourly hire (min 3h)", price: 40, suffix: " / hour" }
  ];

  // Build services price rows
  const tbody = $("#price-rows");
  if(tbody){
    PRICES.forEach(p => {
      const tr = document.createElement("tr");
      const td1 = document.createElement("td"); td1.textContent = p.route;
      const td2 = document.createElement("td"); td2.textContent = "€" + p.price + (p.suffix || "");
      tr.append(td1, td2); tbody.appendChild(tr);
    });
  }

  // Estimate fare (very simple demo estimator)
  function estimateFare(pickup, dropoff, pax){
    // Base fare + per pax (demo values)
    const base = 30;
    const perPax = 5;
    return Math.max(30, base + perPax * (Number(pax)||1));
  }

  const bookingForm = $("#booking-form");
  if(bookingForm){
    const fareEl = $("#fare");
    const recompute = () => {
      const data = Object.fromEntries(new FormData(bookingForm).entries());
      const fare = estimateFare(data.pickup, data.dropoff, data.pax);
      fareEl.textContent = "€" + fare;
      return {fare, data};
    };
    bookingForm.addEventListener("input", recompute);
    recompute();

    bookingForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const {fare, data} = recompute();
      data.estimatedFare = fare;
      data.timestamp = new Date().toISOString();

      // Send to Google Apps Script (replace with your deployment URL)
      const APPS_SCRIPT_URL = window.APPS_SCRIPT_URL || "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
      try{
        await fetch(APPS_SCRIPT_URL, { method:"POST", mode:"cors", headers:{"Content-Type":"application/json"}, body: JSON.stringify(data) });
        alert((dictionaries[currentLang]?.["booking.submitted"]) || "Booking submitted! We will confirm shortly.");
      }catch(err){
        alert("Could not submit booking. Please try again or contact us.");
        console.error(err);
      }

      // Show payment widget if needed
      if(data.payment === "stripe") $("#stripe-widget")?.classList.remove("hidden");
      if(data.payment === "viva") $("#viva-widget")?.classList.remove("hidden");
    });

    // Stripe demo
    const STRIPE_PUBLISHABLE_KEY = window.STRIPE_PUBLISHABLE_KEY || "pk_test_xxxxx";
    $("#stripe-checkout")?.addEventListener("click", async () => {
      alert("Stripe demo: create a Checkout Session on your server and redirect to it.");
      // Example: fetch('/.netlify/functions/create-checkout', { method:'POST' }) ...
    });

    // Viva demo
    const VIVA_PUBLIC_KEY = window.VIVA_PUBLIC_KEY || "pk_viva_xxxxx";
    $("#viva-checkout")?.addEventListener("click", async () => {
      alert("Viva demo: create an order and open Smart Checkout.");
    });
  }

  // Contact form handler (sends to same Apps Script)
  const contactForm = $("#contact-form");
  if(contactForm){
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(contactForm).entries());
      data.type = "contact";
      data.timestamp = new Date().toISOString();
      const APPS_SCRIPT_URL = window.APPS_SCRIPT_URL || "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
      try{
        await fetch(APPS_SCRIPT_URL, { method:"POST", mode:"cors", headers:{"Content-Type":"application/json"}, body: JSON.stringify(data) });
        alert("Message sent. Thank you!");
        contactForm.reset();
      }catch(err){
        alert("Could not send message. Please email info@van4rhodes.com");
      }
    });
  }
})();
