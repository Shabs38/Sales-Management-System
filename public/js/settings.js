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

// =========================================
// BUSINESS BRANDING
// =========================================
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("businessBrandingForm");
    if (!form) return;

    const nameInput = document.getElementById("businessName");
    const addressInput = document.getElementById("businessAddress");
    const phoneInput = document.getElementById("businessPhone");
    const emailInput = document.getElementById("businessEmail");
    const logoInput = document.getElementById("businessLogoUrl");
    const saveButton = document.getElementById("saveBusinessBrandingButton");
    const message = document.getElementById("businessBrandingMessage");
   const logoFileInput = document.getElementById("businessLogoFile");
const uploadLogoButton = document.getElementById("uploadBusinessLogoButton");
const logoPreview = document.getElementById("businessLogoPreview");

function setLogoPreview(url) {
    logoPreview.style.display = url ? "block" : "none";

    if (url) {
        logoPreview.src = url;
    } else {
        logoPreview.removeAttribute("src");
    }
}

logoPreview.addEventListener("error", () => {
    logoPreview.style.display = "none";
});




    function showBrandingMessage(text, isError = false) {
        message.textContent = text;
        message.style.color = isError ? "#b42318" : "#08717d";
        message.style.marginTop = "12px";
    }

    async function brandingRequest(url, options = {}) {
        const response = await fetch(url, {
            credentials: "include",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                ...(options.headers || {})
            },
            ...options
        });

        let data;
        try {
            data = await response.json();
        } catch {
            throw new Error("The server returned an invalid response.");
        }

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Business branding request failed.");
        }

        return data;
    }

    async function loadBusinessBranding() {
        try {
            const data = await brandingRequest("/api/business/branding");
            const branding = data.branding || {};

            nameInput.value = branding.name || "";
            addressInput.value = branding.address || "";
            phoneInput.value = branding.phone || "";
            emailInput.value = branding.email || "";
            logoInput.value = branding.logoUrl || "";
           setLogoPreview(logoInput.value);

        } catch (error) {
            showBrandingMessage(
                error.message || "Could not load business branding.",
                true
            );
        }
    }


uploadLogoButton.addEventListener("click", async () => {
    const file = logoFileInput.files[0];

    if (!file) {
        showBrandingMessage("Please choose a logo image first.", true);
        return;
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        showBrandingMessage("Choose a JPG, PNG or WEBP image.", true);
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showBrandingMessage("The logo must not exceed 5 MB.", true);
        return;
    }

    const formData = new FormData();
    formData.append("businessLogo", file);

    uploadLogoButton.disabled = true;
    uploadLogoButton.textContent = "Uploading...";
    showBrandingMessage("");

    try {
        const response = await fetch("/api/business/branding/logo", {
            method: "POST",
            credentials: "include",
            headers: {
                Accept: "application/json"
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Logo upload failed.");
        }

        logoInput.value = data.logoUrl;
        setLogoPreview(data.logoUrl);

        showBrandingMessage(
            data.message || "Business logo uploaded successfully."
        );
    } catch (error) {
        showBrandingMessage(
            error.message || "Could not upload the business logo.",
            true
        );
    } finally {
        uploadLogoButton.disabled = false;
        uploadLogoButton.textContent = "Upload Logo";
    }
});


    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        saveButton.disabled = true;
        saveButton.textContent = "Saving...";
        showBrandingMessage("");

        try {
            const payload = {
                name: nameInput.value.trim(),
                address: addressInput.value.trim(),
                phone: phoneInput.value.trim(),
                email: emailInput.value.trim(),
                logoUrl: logoInput.value.trim()
            };

            const data = await brandingRequest("/api/business/branding", {
                method: "PUT",
                body: JSON.stringify(payload)
            });

            showBrandingMessage(
                data.message || "Business branding saved successfully."
            );
        } catch (error) {
            showBrandingMessage(
                error.message || "Could not save business branding.",
                true
            );
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = "Save Business Branding";
        }
    });

    loadBusinessBranding();
});
