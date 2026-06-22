// iView RF Power Monitor theme switcher.
// UI-only: stores user preference in localStorage and toggles CSS variables.
// Icons are inline SVG, so this works fully offline with no CDN dependency.
(function () {
  "use strict";

  var STORAGE_KEY = "iviewRfPowerMonitor.theme";
  var root = document.documentElement;

  var SUN_ICON = ''
    + '<svg class="rf-theme-icon rf-theme-icon-sun" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
    + '<circle cx="12" cy="12" r="4.2"></circle>'
    + '<path d="M12 2.6v2.2M12 19.2v2.2M4.8 4.8l1.55 1.55M17.65 17.65l1.55 1.55M2.6 12h2.2M19.2 12h2.2M4.8 19.2l1.55-1.55M17.65 6.35l1.55-1.55"></path>'
    + '</svg>';

  var MOON_ICON = ''
    + '<svg class="rf-theme-icon rf-theme-icon-moon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
    + '<path d="M20.2 14.4A7.7 7.7 0 0 1 9.6 3.8A8.4 8.4 0 1 0 20.2 14.4Z"></path>'
    + '</svg>';

  function safeGetTheme() {
    try {
      var stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        return stored;
      }
    }
    catch (error) {
      // localStorage may be unavailable; keep default dark theme.
    }
    return "dark";
  }

  function safeSetTheme(theme) {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
    catch (error) {
      // Ignore storage failure; the visual theme can still change for this page.
    }
  }

  function applyTheme(theme) {
    var selectedTheme = (theme === "light") ? "light" : "dark";
    root.setAttribute("data-rf-theme", selectedTheme);
    root.style.colorScheme = selectedTheme;
    updateToggle(selectedTheme);
  }

  function updateToggle(theme) {
    var button = document.getElementById("rfThemeToggle");
    if (!button) {
      return;
    }

    var nextTheme = (theme === "light") ? "dark" : "light";
    var label = (theme === "light") ? "Switch to night mode" : "Switch to day mode";

    // Current dark theme shows a sun icon because clicking changes to day mode.
    // Current light theme shows a moon icon because clicking changes to night mode.
    button.innerHTML = (theme === "light") ? MOON_ICON : SUN_ICON;
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    button.setAttribute("data-theme", theme);
    button.setAttribute("data-next-theme", nextTheme);
  }

  function toggleTheme() {
    var currentTheme = root.getAttribute("data-rf-theme") || safeGetTheme();
    var nextTheme = (currentTheme === "light") ? "dark" : "light";
    safeSetTheme(nextTheme);
    applyTheme(nextTheme);

    try {
      window.dispatchEvent(new CustomEvent("rf-theme-change", {
        detail: { theme: nextTheme }
      }));
    }
    catch (error) {
      // CustomEvent is only a convenience for future UI-only listeners.
    }
  }

  function createToggle() {
    if (!document.body || !document.body.classList.contains("rf-console")) {
      return;
    }

    if (document.getElementById("rfThemeToggle")) {
      updateToggle(root.getAttribute("data-rf-theme") || safeGetTheme());
      return;
    }

    var button = document.createElement("button");
    button.type = "button";
    button.id = "rfThemeToggle";
    button.className = "rf-theme-toggle";
    button.addEventListener("click", toggleTheme);

    var menubar = document.getElementById("menubar");
    if (menubar) {
      menubar.appendChild(button);
    }
    else {
      button.classList.add("rf-theme-toggle-floating");
      document.body.appendChild(button);
    }

    updateToggle(root.getAttribute("data-rf-theme") || safeGetTheme());
  }

  applyTheme(safeGetTheme());

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createToggle);
  }
  else {
    createToggle();
  }
})();
