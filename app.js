(() => {
  const C = window.CAFE;
  const $ = (s) => document.querySelector(s);
  const money = (n) => C.currency + n.toLocaleString();
  const byId = Object.fromEntries(C.items.map((i) => [i.id, i]));
  const hasSizes = (i) => i.sizes !== false && ["coffee", "cold", "tea"].includes(i.cat);
  const extrasFor = (i) => C.extras.filter((e) => e.for.includes(i.cat));

  let cart = [];
  try { cart = JSON.parse(localStorage.getItem("cafe-cart") || "[]"); } catch {}
  const save = () => { try { localStorage.setItem("cafe-cart", JSON.stringify(cart)); } catch {} };

  let query = "", vegOnly = false;

  $("#cafe-name").textContent = C.name;
  $("#cafe-tagline").textContent = C.tagline;
  document.title = C.name + " · Menu";
  if (!C.table) $("#table-wrap").hidden = true;

  // Categories
  $("#cats").innerHTML = C.categories
    .map((c) => `<button class="cat" data-cat="${c.id}"><span>${c.emoji}</span>${c.label}</button>`)
    .join("");
  $("#cats").addEventListener("click", (e) => {
    const b = e.target.closest(".cat");
    if (b) document.getElementById("sec-" + b.dataset.cat)?.scrollIntoView();
  });

  $("#search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); renderMenu(); });
  $("#veg-toggle").addEventListener("click", (e) => {
    vegOnly = !vegOnly;
    e.currentTarget.setAttribute("aria-pressed", vegOnly);
    renderMenu();
  });

  const qtyOf = (id) => cart.filter((l) => l.id === id).reduce((s, l) => s + l.qty, 0);

  function renderMenu() {
    const visible = C.items.filter((i) =>
      (!vegOnly || i.veg) &&
      (!query || (i.name + " " + i.desc).toLowerCase().includes(query)));
    $("#empty").hidden = visible.length > 0;
    $("#menu").innerHTML = C.categories.map((c) => {
      const items = visible.filter((i) => i.cat === c.id);
      if (!items.length) return "";
      return `<section class="section" id="sec-${c.id}" data-cat="${c.id}">
        <h2>${c.emoji} ${c.label}</h2>
        <div class="grid">${items.map(card).join("")}</div>
      </section>`;
    }).join("");
    observe();
  }

  function card(i, n) {
    const q = qtyOf(i.id);
    return `<button class="card" data-id="${i.id}" style="--h:${i.hue};animation-delay:${Math.min(n, 8) * 40}ms">
      <div class="art">${i.emoji}</div>
      <div class="info">
        <div class="top"><span class="${i.veg ? "veg-dot" : "nonveg-dot"}" title="${i.veg ? "Veg" : "Non-veg"}"></span>
          ${(i.tags || []).map((t) => `<span class="tag">${t}</span>`).join("")}</div>
        <h3>${i.name}</h3>
        <p>${i.desc}</p>
        <div class="bottom"><span class="price">${money(i.price)}</span>
          <span class="add ${q ? "has" : ""}">${q ? q + " added" : "Add +"}</span></div>
      </div>
    </button>`;
  }

  $("#menu").addEventListener("click", (e) => {
    const c = e.target.closest(".card");
    if (c) openItem(byId[c.dataset.id]);
  });

  // Highlight active category while scrolling
  let io;
  function observe() {
    io?.disconnect();
    io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        document.querySelectorAll(".cat").forEach((b) => {
          const on = b.dataset.cat === en.target.dataset.cat;
          b.classList.toggle("active", on);
          if (on) b.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    document.querySelectorAll(".section").forEach((s) => io.observe(s));
  }

  // Overlays
  const open = (el) => { el.hidden = false; document.body.style.overflow = "hidden"; };
  const close = (el) => { el.hidden = true; document.body.style.overflow = ""; };
  document.querySelectorAll(".overlay").forEach((o) =>
    o.addEventListener("click", (e) => { if (e.target === o || e.target.closest("[data-close]")) close(o); }));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") document.querySelectorAll(".overlay:not([hidden])").forEach(close);
  });

  // Item sheet
  let cur, size, extras, qty;
  function openItem(i) {
    cur = i; size = hasSizes(i) ? C.sizes[0].id : null; extras = new Set(); qty = 1;
    $("#item-art").style.setProperty("--h", i.hue);
    $("#item-art").textContent = i.emoji;
    $("#item-title").textContent = i.name;
    $("#item-price").textContent = money(i.price);
    $("#item-desc").textContent = i.desc;
    $("#item-note").value = "";
    $("#item-sizes").innerHTML = size ? `<h4>Size</h4><div class="opts">${C.sizes.map((s) =>
      `<button class="opt" data-size="${s.id}">${s.label}${s.add ? `<small>+${money(s.add)}</small>` : ""}</button>`).join("")}</div>` : "";
    const ex = extrasFor(i);
    $("#item-extras").innerHTML = ex.length ? `<h4>Add-ons</h4><div class="opts">${ex.map((x) =>
      `<button class="opt" data-extra="${x.id}">${x.label}<small>+${money(x.add)}</small></button>`).join("")}</div>` : "";
    updateItem();
    open($("#item-overlay"));
  }
  const unitPrice = (i, s, ex) =>
    i.price + (s ? C.sizes.find((z) => z.id === s).add : 0) +
    [...ex].reduce((t, id) => t + C.extras.find((x) => x.id === id).add, 0);
  function updateItem() {
    document.querySelectorAll("[data-size]").forEach((b) => b.classList.toggle("on", b.dataset.size === size));
    document.querySelectorAll("[data-extra]").forEach((b) => b.classList.toggle("on", extras.has(b.dataset.extra)));
    $("#qty").textContent = qty;
    $("#add-total").textContent = money(unitPrice(cur, size, extras) * qty);
  }
  $("#item-sizes").addEventListener("click", (e) => { const b = e.target.closest("[data-size]"); if (b) { size = b.dataset.size; updateItem(); } });
  $("#item-extras").addEventListener("click", (e) => {
    const b = e.target.closest("[data-extra]"); if (!b) return;
    extras.has(b.dataset.extra) ? extras.delete(b.dataset.extra) : extras.add(b.dataset.extra); updateItem();
  });
  $("#qty-minus").onclick = () => { qty = Math.max(1, qty - 1); updateItem(); };
  $("#qty-plus").onclick = () => { qty = Math.min(20, qty + 1); updateItem(); };
  $("#add-btn").onclick = () => {
    const ex = [...extras].sort();
    const note = $("#item-note").value.trim();
    const key = [cur.id, size, ex.join(","), note].join("|");
    const line = cart.find((l) => l.key === key);
    if (line) line.qty += qty;
    else cart.push({ key, id: cur.id, size, extras: ex, note, qty, unit: unitPrice(cur, size, ex) });
    close($("#item-overlay"));
    toast(`${qty} × ${cur.name} added`);
    refresh(true);
  };

  // Cart
  const subtotal = () => cart.reduce((s, l) => s + l.unit * l.qty, 0);
  function refresh(bump) {
    save();
    const count = cart.reduce((s, l) => s + l.qty, 0);
    const bar = $("#cart-bar");
    bar.hidden = count === 0;
    $("#cart-count").textContent = count;
    $("#cart-total").textContent = money(subtotal());
    if (bump) { bar.classList.remove("bump"); void bar.offsetWidth; bar.classList.add("bump"); }
    renderMenu();
  }
  $("#cart-bar").onclick = () => { renderCart(); open($("#cart-overlay")); };
  function renderCart() {
    $("#cart-list").innerHTML = cart.map((l, idx) => {
      const i = byId[l.id];
      const bits = [l.size && C.sizes.find((s) => s.id === l.size).label,
        ...l.extras.map((x) => C.extras.find((e) => e.id === x).label), l.note && `“${l.note}”`].filter(Boolean);
      return `<li><div class="art" style="--h:${i.hue}">${i.emoji}</div>
        <div class="meta"><b>${i.name}</b><small>${bits.join(" · ") || "&nbsp;"}</small><br><small>${money(l.unit * l.qty)}</small></div>
        <div class="stepper"><button data-dec="${idx}" aria-label="Decrease">−</button><span>${l.qty}</span><button data-inc="${idx}" aria-label="Increase">+</button></div></li>`;
    }).join("");
    const sub = subtotal(), tax = Math.round(sub * 0.05);
    $("#sub").textContent = money(sub);
    $("#tax").textContent = money(tax);
    $("#grand").textContent = money(sub + tax);
    $("#place-btn").disabled = !cart.length;
  }
  $("#cart-list").addEventListener("click", (e) => {
    const inc = e.target.closest("[data-inc]"), dec = e.target.closest("[data-dec]");
    if (inc) cart[inc.dataset.inc].qty++;
    else if (dec) { const l = cart[dec.dataset.dec]; if (--l.qty <= 0) cart.splice(dec.dataset.dec, 1); }
    else return;
    refresh(); renderCart();
    if (!cart.length) close($("#cart-overlay"));
  });
  $("#place-btn").onclick = () => {
    const table = $("#table").value.trim();
    if (C.table && !table) { $("#table").focus(); toast("Please enter your table number"); return; }
    const total = subtotal() + Math.round(subtotal() * 0.05);
    const orderNo = Math.floor(1000 + Math.random() * 9000);
    $("#done-msg").textContent = `Order #${orderNo}${table ? ` for table ${table}` : ""} · ${money(total)}. We'll bring it right over!`;
    cart = []; refresh();
    close($("#cart-overlay"));
    open($("#done-overlay"));
  };

  let tt;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(tt); tt = setTimeout(() => (t.hidden = true), 1800);
  }

  refresh();
})();
