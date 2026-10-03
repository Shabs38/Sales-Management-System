document.addEventListener("DOMContentLoaded", () => {

    const notifications =
        document.getElementById("notifications");

    const emailNotifications =
        document.getElementById("emailNotifications");

    const lowStockAlerts =
        document.getElementById("lowStockAlerts");

    const saleAlerts =
        document.getElementById("saleAlerts");

    const theme =
        document.getElementById("theme");

    const language =
        document.getElementById("language");

    const saveSettingsButton =
        document.getElementById("saveSettingsButton");

    const settingsMessage =
        document.getElementById("settingsMessage");

    const profileName =
        document.getElementById("profileName");

    const profileRole =
        document.getElementById("profileRole");

    const profileAvatar =
        document.getElementById("profileAvatar");

    const menuButton =
        document.getElementById("menuButton");

    const sidebar =
        document.getElementById("sidebar");

    const sidebarOverlay =
        document.getElementById("sidebarOverlay");

    const notificationButton =
        document.getElementById("notificationButton");

    const notificationPanel =
        document.getElementById("notificationPanel");

    const closeNotificationButton =
        document.getElementById(
            "closeNotificationButton"
        );

    const logoutButton =
        document.getElementById("logoutButton");


    /* =========================================
       API HELPER
       ========================================= */

    async function apiRequest(
        url,
        options = {}
    ) {
        const response = await fetch(
            url,
            {
                credentials: "include",
                headers: {
                    "Content-Type":
                        "application/json",
                    "Accept":
                        "application/json",
                    ...(options.headers || {})
                },
                ...options
            }
        );

        let data;

        try {
            data = await response.json();
        } catch {
            data = {
                success: false,
                message:
                    "Invalid server response."
            };
        }

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Request failed."
            );
        }

        return data;
    }


    /* =========================================
       LOAD USER PROFILE
       ========================================= */

    async function loadUserProfile() {

        try {

            const data =
                await apiRequest(
                    "/api/auth/me"
                );

            if (
                !data.success ||
                !data.user
            ) {
                return;
            }

            const user = data.user;

            if (profileName) {
                profileName.textContent =
                    user.full_name;
            }

            if (profileRole) {
                profileRole.textContent =
                    formatRole(user.role);
            }

            if (profileAvatar) {
                profileAvatar.textContent =
                    getInitials(
                        user.full_name
                    );
            }

        } catch (error) {

            console.error(
                "Profile loading error:",
                error
            );
        }
    }


    /* =========================================
       LOAD SETTINGS
       ========================================= */

    async function loadSettings() {

        try {

            const data =
                await apiRequest(
                    "/api/settings"
                );

            if (
                !data.success ||
                !data.settings
            ) {
                throw new Error(
                    "Settings could not be loaded."
                );
            }

            const settings =
                data.settings;

            notifications.checked =
                Boolean(
                    settings.notifications
                );

            emailNotifications.checked =
                Boolean(
                    settings.emailNotifications
                );

            lowStockAlerts.checked =
                Boolean(
                    settings.lowStockAlerts
                );

            saleAlerts.checked =
                Boolean(
                    settings.saleAlerts
                );

            theme.value =
                settings.theme || "light";

            language.value =
                settings.language ||
                "English";

            applyTheme(
                settings.theme
            );

        } catch (error) {

            console.error(
                "Settings loading error:",
                error
            );

            showMessage(
                error.message,
                "error"
            );
        }
    }


    /* =========================================
       SAVE SETTINGS
       ========================================= */

    async function saveSettings() {

        saveSettingsButton.disabled =
            true;

        saveSettingsButton.textContent =
            "Saving...";

        clearMessage();

        try {

            const payload = {
                notifications:
                    notifications.checked,

                emailNotifications:
                    emailNotifications.checked,

                lowStockAlerts:
                    lowStockAlerts.checked,

                saleAlerts:
                    saleAlerts.checked,

                theme:
                    theme.value,

                language:
                    language.value
            };

            const data =
                await apiRequest(
                    "/api/settings",
                    {
                        method: "PUT",
                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );

            if (!data.success) {
                throw new Error(
                    data.message ||
                    "Unable to save settings."
                );
            }

            applyTheme(
                data.settings.theme
            );

            showMessage(
                data.message ||
                "Settings updated successfully.",
                "success"
            );

        } catch (error) {

            console.error(
                "Save settings error:",
                error
            );

            showMessage(
                error.message,
                "error"
            );

        } finally {

            saveSettingsButton.disabled =
                false;

            saveSettingsButton.textContent =
                "Save Changes";
        }
    }


    /* =========================================
       THEME
       ========================================= */

    function applyTheme(selectedTheme) {

        if (
            selectedTheme === "dark"
        ) {
            document.body.classList.add(
                "dark-theme"
            );
        } else {
            document.body.classList.remove(
                "dark-theme"
            );
        }
    }


    theme.addEventListener(
        "change",
        () => {
            applyTheme(
                theme.value
            );
        }
    );


    /* =========================================
       SAVE BUTTON
       ========================================= */

    saveSettingsButton.addEventListener(
        "click",
        saveSettings
    );


    /* =========================================
       SIDEBAR
       ========================================= */

    function openSidebar() {

        sidebar.classList.add(
            "open"
        );

        sidebarOverlay.classList.add(
            "show"
        );
    }

    function closeSidebar() {

        sidebar.classList.remove(
            "open"
        );

        sidebarOverlay.classList.remove(
            "show"
        );
    }

    menuButton.addEventListener(
        "click",
        openSidebar
    );

    sidebarOverlay.addEventListener(
        "click",
        closeSidebar
    );


    /* =========================================
       NOTIFICATIONS
       ========================================= */

    notificationButton.addEventListener(
        "click",
        () => {

            notificationPanel.classList.toggle(
                "show"
            );
        }
    );

    closeNotificationButton.addEventListener(
        "click",
        () => {

            notificationPanel.classList.remove(
                "show"
            );
        }
    );


    /* =========================================
       LOGOUT
       ========================================= */

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await apiRequest(
                    "/api/auth/logout",
                    {
                        method: "POST"
                    }
                );

                window.location.href =
                    "../pages/index.html";

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

                window.location.href =
                    "../pages/index.html";
            }
        }
    );


    /* =========================================
       HELPERS
       ========================================= */

    function getInitials(name) {

        if (!name) {
            return "U";
        }

        return name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(
                word =>
                    word
                        .charAt(0)
                        .toUpperCase()
            )
            .join("");
    }


    function formatRole(role) {

        if (!role) {
            return "";
        }

        return role.charAt(0).toUpperCase() +
            role.slice(1);
    }


    function showMessage(
        message,
        type
    ) {

        settingsMessage.textContent =
            message;

        settingsMessage.className =
            "message-box " + type;
    }


    function clearMessage() {

        settingsMessage.textContent =
            "";

        settingsMessage.className =
            "message-box";
    }


    /* =========================================
       INITIALIZE
       ========================================= */

    loadUserProfile();
    loadSettings();

});