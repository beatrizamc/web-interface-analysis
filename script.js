document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const searchInput = $("#searchInput");
  const cards = $$(".comic-column");
  const quickFilters = $$(".filter-btn");
  const typeFilter = $("#typeFilter");
  const genreFilter = $("#genreFilter");
  const chapterFilter = $("#chapterFilter");
  const ratingFilter = $("#ratingFilter");
  const statusFilter = $("#statusFilter");
  const emptyState = $("#emptyState");
  const resultsCount = $("#resultsCount");
  let activeType = "all";
  let authMode = "signin";

  function updateCards() {
    const query = (searchInput?.value || "").trim().toLowerCase();
    let visible = 0;

    cards.forEach(card => {
      const title = (card.dataset.title || "").toLowerCase();
      const type = card.dataset.type;
      const genres = (card.dataset.genres || "").split(",");
      const chapters = Number(card.dataset.chapters || 0);
      const rating = Number(card.dataset.rating || 0);
      const status = card.dataset.status;

      const chapterValue = chapterFilter?.value || "all";
      const matchesChapters =
        chapterValue === "all" ||
        (chapterValue === "short" && chapters <= 25) ||
        (chapterValue === "medium" && chapters >= 26 && chapters <= 50) ||
        (chapterValue === "long" && chapters >= 51);
      const matches = title.includes(query) &&
        (activeType === "all" || type === activeType) &&
        ((genreFilter?.value || "all") === "all" || genres.includes(genreFilter.value)) &&
        matchesChapters &&
        rating >= Number(ratingFilter?.value || 0) &&
        ((statusFilter?.value || "all") === "all" || status === statusFilter.value);

      card.classList.toggle("d-none", !matches);
      if (matches) visible++;
    });

    emptyState?.classList.toggle("d-none", visible !== 0);
    if (resultsCount) resultsCount.textContent = `${visible} ${visible === 1 ? "story" : "stories"}`;
  }

  searchInput?.addEventListener("input", updateCards);
  [typeFilter, genreFilter, chapterFilter, ratingFilter, statusFilter].forEach(select => {
    select?.addEventListener("change", () => {
      if (select === typeFilter) {
        activeType = typeFilter.value;
        quickFilters.forEach(btn => btn.classList.toggle("active", btn.dataset.filter === activeType));
      }
      updateCards();
    });
  });

  quickFilters.forEach(button => button.addEventListener("click", () => {
    activeType = button.dataset.filter;
    if (typeFilter) typeFilter.value = activeType;
    quickFilters.forEach(item => item.classList.toggle("active", item === button));
    updateCards();
  }));

  function clearFilters() {
    if (searchInput) searchInput.value = "";
    if (typeFilter) typeFilter.value = "all";
    if (genreFilter) genreFilter.value = "all";
    if (chapterFilter) chapterFilter.value = "all";
    if (ratingFilter) ratingFilter.value = "0";
    if (statusFilter) statusFilter.value = "all";
    activeType = "all";
    quickFilters.forEach(btn => btn.classList.toggle("active", btn.dataset.filter === "all"));
    updateCards();
  }
  $("#clearFilters")?.addEventListener("click", clearFilters);
  $("#emptyReset")?.addEventListener("click", clearFilters);

  let favorites = [];
  try { favorites = JSON.parse(localStorage.getItem("novelune-favorites") || "[]"); } catch { favorites = []; }
  function syncBookmark(button, isSaved) {
    button.classList.toggle("active", isSaved);
    button.setAttribute("aria-pressed", String(isSaved));
    const icon = $("i", button);
    if (icon) icon.className = isSaved ? "bi bi-bookmark-fill" : "bi bi-bookmark";
  }
  $$(".bookmark").forEach(button => {
    const card = button.closest(".comic-column");
    const title = card?.dataset.title;
    syncBookmark(button, favorites.includes(title));
    button.addEventListener("click", () => {
      if (!title) return;
      favorites = favorites.includes(title) ? favorites.filter(item => item !== title) : [...favorites, title];
      try { localStorage.setItem("novelune-favorites", JSON.stringify(favorites)); } catch {}
      syncBookmark(button, favorites.includes(title));
      showToast(favorites.includes(title) ? `${title} added to your favorites.` : `${title} removed from your favorites.`);
    });
  });

  const themeToggle = $("#themeToggle");
  let savedTheme = "light";
  try { savedTheme = localStorage.getItem("novelune-theme") || "light"; } catch {}
  if (savedTheme === "dark") document.body.classList.add("dark");
  updateThemeIcon();
  themeToggle?.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    try { localStorage.setItem("novelune-theme", document.body.classList.contains("dark") ? "dark" : "light"); } catch {}
    updateThemeIcon();
  });
  function updateThemeIcon() {
    const icon = $("i", themeToggle);
    if (!icon) return;
    const dark = document.body.classList.contains("dark");
    icon.className = dark ? "bi bi-sun" : "bi bi-moon-stars";
    themeToggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  }

  function scrollToLibrary() {
    $("#library")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  $("#exploreBtn")?.addEventListener("click", scrollToLibrary);
  $("#myLibraryBtn")?.addEventListener("click", () => $("#myReading")?.scrollIntoView({ behavior: "smooth" }));
  $("#heroLibraryBtn")?.addEventListener("click", () => $("#myReading")?.scrollIntoView({ behavior: "smooth" }));

  document.addEventListener("keydown", event => {
    if (event.key === "/" && document.activeElement !== searchInput && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
      event.preventDefault();
      searchInput?.focus();
    }
    if (event.key === "Escape" && document.activeElement === searchInput && searchInput.value) {
      searchInput.value = "";
      updateCards();
    }
  });

  const authModalElement = $("#authModal");
  const authModal = authModalElement && window.bootstrap ? new bootstrap.Modal(authModalElement) : null;
  $("#signInBtn")?.addEventListener("click", () => {
    setAuthMode("signin");
    $("#authMessage")?.classList.add("d-none");
    authModal?.show();
  });

  $$(".auth-tab").forEach(tab => tab.addEventListener("click", () => setAuthMode(tab.dataset.mode)));
  function setAuthMode(mode) {
    authMode = mode === "signup" ? "signup" : "signin";
    $$(".auth-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.mode === authMode));
    $("#nameField").hidden = authMode !== "signup";
    $("#authName").required = authMode === "signup";
    $("#authTitle").textContent = authMode === "signup" ? "Create your account" : "Welcome back";
    $("#authSubtitle").textContent = authMode === "signup" ? "Start building your own reading shelf." : "Sign in to keep your stories close.";
    $("#authSubmit").innerHTML = authMode === "signup" ? 'Create account <i class="bi bi-arrow-right ms-1"></i>' : 'Sign in <i class="bi bi-arrow-right ms-1"></i>';
    $("#authPassword").autocomplete = authMode === "signup" ? "new-password" : "current-password";
    $("#authMessage").classList.add("d-none");
  }

  $("#togglePassword")?.addEventListener("click", () => {
    const input = $("#authPassword");
    const icon = $("#togglePassword i");
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    icon.className = showing ? "bi bi-eye" : "bi bi-eye-slash";
    $("#togglePassword").setAttribute("aria-label", showing ? "Show password" : "Hide password");
  });

  $("#forgotPassword")?.addEventListener("click", () => {
    showAuthMessage("Password recovery is a demo feature. Connect a backend to send a real recovery email.", "info");
  });

  $("#authForm")?.addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = $("#authEmail").value.trim();
    const password = $("#authPassword").value;
    const name = $("#authName").value.trim();
    if (!form.reportValidity()) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showAuthMessage("Please enter a valid email address.", "danger");
      return;
    }
    if (password.length < 6) {
      showAuthMessage("Your password must contain at least 6 characters.", "danger");
      return;
    }
    if (authMode === "signup" && !name) {
      showAuthMessage("Please enter a display name.", "danger");
      return;
    }
    showAuthMessage(authMode === "signup"
      ? `Demo account form validated. Welcome, ${name}! No account was created because this site has no backend.`
      : "Your sign-in form is valid, but authentication is not connected to a server yet.", "success");
  });

  function showAuthMessage(message, type) {
    const element = $("#authMessage");
    element.className = `alert alert-${type} mt-3`;
    element.textContent = message;
  }

  let toastInstance;
  function showToast(message) {
    const toastElement = $("#siteToast");
    if (!toastElement || !window.bootstrap) return;
    $("#toastMessage").textContent = message;
    toastInstance ||= new bootstrap.Toast(toastElement, { delay: 2600 });
    toastInstance.show();
  }

  $$(".continue-btn").forEach(button => button.addEventListener("click", () => {
    showToast(`“${button.dataset.title}” reading view is a demo. A chapter reader can be added next.`);
  }));

  $$(".cover img").forEach(img => img.addEventListener("error", () => {
    img.style.display = "none";
    img.parentElement.classList.add("cover-fallback");
  }));

  updateCards();
});
