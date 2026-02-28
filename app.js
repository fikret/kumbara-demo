(function () {
  // Rozet tanımları
  var BADGES = [
    { id: "first_saving", icon: "\u2B50", name: "Ilk Adim", desc: "Ilk birikimini yap",
      check: function (data) { return data.savings.length >= 1; } },
    { id: "regular_5", icon: "\uD83C\uDFAF", name: "Duzenli", desc: "5 birikim yap",
      check: function (data) { return data.savings.length >= 5; } },
    { id: "regular_10", icon: "\uD83D\uDCAA", name: "Azimli", desc: "10 birikim yap",
      check: function (data) { return data.savings.length >= 10; } },
    { id: "regular_25", icon: "\uD83C\uDFC6", name: "Veteran", desc: "25 birikim yap",
      check: function (data) { return data.savings.length >= 25; } },
    { id: "total_1k", icon: "\uD83D\uDCB0", name: "Birikmaya Basladi", desc: "Toplam 1.000'e ulas",
      check: function (data) { return getTotal(data.savings) >= 1000; } },
    { id: "total_5k", icon: "\uD83D\uDC8E", name: "Ciddi Birikimci", desc: "Toplam 5.000'e ulas",
      check: function (data) { return getTotal(data.savings) >= 5000; } },
    { id: "total_10k", icon: "\uD83D\uDC51", name: "Kral", desc: "Toplam 10.000'e ulas",
      check: function (data) { return getTotal(data.savings) >= 10000; } },
    { id: "big_save", icon: "\uD83D\uDE80", name: "Buyuk Hamle", desc: "Tek seferde 500+ ekle",
      check: function (data, lastAmount) { return lastAmount >= 500; } },
    { id: "goal_set", icon: "\uD83C\uDFAF", name: "Hedef Koyucu", desc: "Ilk hedefini belirle",
      check: function (data) { return data.goal && data.goal > 0; } },
    { id: "goal_reached", icon: "\uD83C\uDFC5", name: "Hedef Avcisi", desc: "Hedefe ulas",
      check: function (data) { return data.goal && data.goal > 0 && getTotal(data.savings) >= data.goal; } },
  ];

  var CONFETTI_COLORS = ["#0f3460", "#533483", "#e94560", "#f5a623", "#2ecc71", "#3498db", "#9b59b6", "#f1c40f"];

  // --- Auth DOM ---
  var authContainer = document.getElementById("authContainer");
  var appContainer = document.getElementById("appContainer");
  var loginForm = document.getElementById("loginForm");
  var signupForm = document.getElementById("signupForm");
  var authMessage = document.getElementById("authMessage");
  var authTabs = document.querySelectorAll(".auth-tab");
  var userEmailEl = document.getElementById("userEmail");
  var logoutBtn = document.getElementById("logoutBtn");

  // --- App DOM ---
  var totalAmountEl = document.getElementById("totalAmount");
  var totalSection = document.querySelector(".total-section");
  var addForm = document.getElementById("addForm");
  var amountInput = document.getElementById("amountInput");
  var noteInput = document.getElementById("noteInput");
  var historyList = document.getElementById("historyList");
  var emptyState = document.getElementById("emptyState");
  var goalAmountText = document.getElementById("goalAmountText");
  var editGoalBtn = document.getElementById("editGoalBtn");
  var goalForm = document.getElementById("goalForm");
  var goalInput = document.getElementById("goalInput");
  var saveGoalBtn = document.getElementById("saveGoalBtn");
  var removeGoalBtn = document.getElementById("removeGoalBtn");
  var progressContainer = document.getElementById("progressContainer");
  var progressBar = document.getElementById("progressBar");
  var progressText = document.getElementById("progressText");
  var badgesGrid = document.getElementById("badgesGrid");
  var badgesCount = document.getElementById("badgesCount");
  var toastContainer = document.getElementById("toastContainer");

  // --- Auth UI ---

  function showAuth() {
    authContainer.style.display = "flex";
    appContainer.style.display = "none";
    authMessage.className = "auth-message";
    authMessage.textContent = "";
  }

  function showApp(user) {
    authContainer.style.display = "none";
    appContainer.style.display = "block";
    userEmailEl.textContent = user.email;
    render();
  }

  function showAuthError(msg) {
    authMessage.className = "auth-message error";
    authMessage.textContent = msg;
  }

  function showAuthSuccess(msg) {
    authMessage.className = "auth-message success";
    authMessage.textContent = msg;
  }

  // Auth tabs
  authTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      authTabs.forEach(function (t) { t.classList.remove("active"); });
      tab.classList.add("active");
      var target = tab.getAttribute("data-tab");
      if (target === "login") {
        loginForm.style.display = "flex";
        signupForm.style.display = "none";
      } else {
        loginForm.style.display = "none";
        signupForm.style.display = "flex";
      }
      authMessage.className = "auth-message";
      authMessage.textContent = "";
    });
  });

  // Kayit
  signupForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    var email = document.getElementById("signupEmail").value.trim();
    var password = document.getElementById("signupPassword").value;
    var confirm = document.getElementById("signupPasswordConfirm").value;

    if (password !== confirm) {
      showAuthError("Sifreler eslesmiyor.");
      return;
    }

    try {
      await DB.signUp(email, password);
      showAuthSuccess("Onay e-postasi gonderildi! Lutfen e-postanizi kontrol edin ve onay linkine tiklayin.");
      signupForm.reset();
    } catch (err) {
      showAuthError(err.message || "Kayit sirasinda bir hata olustu.");
    }
  });

  // Giris
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    var email = document.getElementById("loginEmail").value.trim();
    var password = document.getElementById("loginPassword").value;

    try {
      await DB.signIn(email, password);
      // onAuthStateChange will handle the rest
    } catch (err) {
      var msg = err.message || "Giris sirasinda bir hata olustu.";
      if (msg.includes("Invalid login")) {
        msg = "E-posta veya sifre hatali.";
      } else if (msg.includes("Email not confirmed")) {
        msg = "E-posta adresiniz henuz onaylanmadi. Lutfen e-postanizi kontrol edin.";
      }
      showAuthError(msg);
    }
  });

  // Cikis
  logoutBtn.addEventListener("click", async function () {
    await DB.signOut();
  });

  // Auth state listener
  DB.onAuthStateChange(function (event, session) {
    if (session && session.user) {
      showApp(session.user);
    } else {
      showAuth();
    }
  });

  // --- Data ---

  async function loadData() {
    var results = await Promise.all([
      DB.fetchSavings(),
      DB.getGoal(),
      DB.getBadges(),
    ]);
    return {
      savings: results[0],
      goal: results[1],
      badges: results[2],
    };
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
    }).format(amount);
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr);
    return d.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getTotal(savings) {
    return savings.reduce(function (sum, s) {
      return sum + s.amount;
    }, 0);
  }

  // --- Animasyonlar ---

  function createConfetti(intensity) {
    var canvas = document.createElement("canvas");
    canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    var ctx = canvas.getContext("2d");

    var particleCount = intensity === "heavy" ? 80 : intensity === "medium" ? 45 : 20;
    var particles = [];
    for (var i = 0; i < particleCount; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height * 0.5,
        vx: (Math.random() - 0.5) * 12,
        vy: -(Math.random() * 12 + 4),
        size: Math.random() * 6 + 3,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        gravity: 0.25,
        opacity: 1,
      });
    }

    var startTime = Date.now();
    var duration = 2200;

    function animate() {
      var elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        document.body.removeChild(canvas);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var fadeRatio = elapsed > duration * 0.6 ? 1 - (elapsed - duration * 0.6) / (duration * 0.4) : 1;

      particles.forEach(function (p) {
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = fadeRatio * p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  function animateCountUp(from, to) {
    var duration = 800;
    var startTime = null;

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var easedProgress = easeOutCubic(progress);
      var current = from + (to - from) * easedProgress;
      totalAmountEl.textContent = formatCurrency(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  function triggerPulse() {
    totalSection.classList.remove("pulse");
    void totalSection.offsetWidth;
    totalSection.classList.add("pulse");
    totalSection.addEventListener("animationend", function handler() {
      totalSection.classList.remove("pulse");
      totalSection.removeEventListener("animationend", handler);
    });
  }

  // --- Rozetler ---

  function checkBadges(data, lastAmount) {
    var newlyUnlocked = [];
    BADGES.forEach(function (badge) {
      if (data.badges.indexOf(badge.id) === -1 && badge.check(data, lastAmount)) {
        data.badges.push(badge.id);
        newlyUnlocked.push(badge);
      }
    });
    return newlyUnlocked;
  }

  function showBadgeToast(badge) {
    var toast = document.createElement("div");
    toast.className = "badge-toast";
    toast.innerHTML =
      '<span class="badge-toast-icon">' + badge.icon + "</span>" +
      '<span class="badge-toast-text">Rozet acildi!<small>' + badge.name + "</small></span>";
    toastContainer.appendChild(toast);
    createConfetti("light");
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
  }

  function renderBadges(data) {
    badgesGrid.innerHTML = "";
    var unlocked = 0;
    BADGES.forEach(function (badge) {
      var isUnlocked = data.badges.indexOf(badge.id) !== -1;
      if (isUnlocked) unlocked++;
      var div = document.createElement("div");
      div.className = "badge-item " + (isUnlocked ? "unlocked" : "locked");
      div.title = badge.desc;
      div.innerHTML =
        '<div class="badge-icon">' + badge.icon + "</div>" +
        '<span class="badge-name">' + badge.name + "</span>";
      badgesGrid.appendChild(div);
    });
    badgesCount.textContent = unlocked + "/" + BADGES.length;
  }

  // --- Render ---

  async function render(options) {
    options = options || {};
    var data = await loadData();
    var total = getTotal(data.savings);

    if (options.animate && typeof options.previousTotal === "number") {
      animateCountUp(options.previousTotal, total);
    } else {
      totalAmountEl.textContent = formatCurrency(total);
    }

    if (data.goal && data.goal > 0) {
      goalAmountText.textContent = formatCurrency(data.goal);
      var pct = Math.min((total / data.goal) * 100, 100);
      progressContainer.style.display = "block";
      progressBar.style.width = pct + "%";
      progressText.style.display = "block";
      progressText.textContent =
        "%" + pct.toFixed(1) + " tamamlandi — " +
        formatCurrency(data.goal - total > 0 ? data.goal - total : 0) +
        " kaldi";
    } else {
      goalAmountText.textContent = "Belirlenmedi";
      progressContainer.style.display = "none";
      progressText.style.display = "none";
    }

    renderBadges(data);

    var items = data.savings.slice().reverse();
    var existingItems = historyList.querySelectorAll(".history-item");
    existingItems.forEach(function (el) { el.remove(); });

    if (items.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";
    items.forEach(function (item, index) {
      var div = document.createElement("div");
      div.className = "history-item";
      if (options.animate && index === 0) {
        div.className += " history-item-new";
      }
      div.innerHTML =
        '<div class="history-item-info">' +
        '<div class="history-item-amount">' +
        formatCurrency(item.amount) +
        "</div>" +
        (item.note
          ? '<div class="history-item-note">' + escapeHtml(item.note) + "</div>"
          : "") +
        '<div class="history-item-date">' +
        formatDate(item.date) +
        "</div>" +
        "</div>" +
        '<button class="history-item-delete" data-id="' +
        item.id +
        '" title="Sil">&times;</button>';
      historyList.appendChild(div);
    });
  }

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // --- App Event Handlers ---

  addForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    var amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount <= 0) return;

    var note = noteInput.value.trim();

    var currentData = await loadData();
    var previousTotal = getTotal(currentData.savings);

    await DB.addSaving(amount, note);

    var updatedData = await loadData();
    var newBadges = checkBadges(updatedData, amount);
    if (newBadges.length > 0) {
      await DB.saveBadges(updatedData.badges);
    }

    amountInput.value = "";
    noteInput.value = "";
    amountInput.focus();

    await render({ animate: true, previousTotal: previousTotal });

    triggerPulse();

    var intensity = amount >= 500 ? "heavy" : amount >= 100 ? "medium" : "light";
    createConfetti(intensity);

    newBadges.forEach(function (badge) {
      showBadgeToast(badge);
    });
  });

  historyList.addEventListener("click", async function (e) {
    var btn = e.target.closest(".history-item-delete");
    if (!btn) return;

    var id = parseInt(btn.getAttribute("data-id"), 10);
    await DB.deleteSaving(id);
    await render();
  });

  editGoalBtn.addEventListener("click", function () {
    var isVisible = goalForm.style.display !== "none";
    goalForm.style.display = isVisible ? "none" : "block";
    if (!isVisible) {
      DB.getGoal().then(function (goal) {
        goalInput.value = goal || "";
        goalInput.focus();
      });
    }
  });

  saveGoalBtn.addEventListener("click", async function () {
    var val = parseFloat(goalInput.value);
    if (isNaN(val) || val <= 0) return;

    await DB.setGoal(val);

    var data = await loadData();
    var newBadges = checkBadges(data, 0);
    if (newBadges.length > 0) {
      await DB.saveBadges(data.badges);
    }

    goalForm.style.display = "none";
    await render();

    newBadges.forEach(function (badge) {
      showBadgeToast(badge);
    });
  });

  removeGoalBtn.addEventListener("click", async function () {
    await DB.setGoal(null);
    goalForm.style.display = "none";
    await render();
  });
})();
