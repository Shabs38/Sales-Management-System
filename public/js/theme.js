(() => {
    "use strict";

    async function loadPersonalTheme() {
        try {
            const response = await fetch("/api/settings/theme", {
                method: "GET",
                credentials: "include",
                headers: {
                    "Accept": "application/json"
                }
            });

            if (!response.ok) return;

            const data = await response.json();

            if (!data.success || !["light", "dark"].includes(data.theme)) {
                return;
            }

            document.body.classList.toggle(
                "dark-theme",
                data.theme === "dark"
            );

            document.documentElement.dataset.userTheme = data.theme;
        } catch (error) {
            console.warn("Personal theme could not be loaded:", error);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadPersonalTheme, {
            once: true
        });
    } else {
        loadPersonalTheme();
    }
})();
