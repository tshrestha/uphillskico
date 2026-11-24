// About page: only the shared theme handling. The page itself is static.
import { initTheme, toggleTheme, setupThemeListener } from "./utils.js";

initTheme();
setupThemeListener();
document.getElementById("themeToggle").addEventListener("click", toggleTheme);
