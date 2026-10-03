// =====================================
// PROFILE PAGE
// =====================================

document.addEventListener("DOMContentLoaded", () => {

    // =====================================
    // DOM ELEMENTS
    // =====================================

    const profileForm =
        document.getElementById("profileForm");

    const passwordForm =
        document.getElementById("passwordForm");

    const fullName =
        document.getElementById("fullName");

    const username =
        document.getElementById("username");

    const email =
        document.getElementById("email");

    const currentPassword =
        document.getElementById("currentPassword");

    const newPassword =
        document.getElementById("newPassword");

    const confirmPassword =
        document.getElementById("confirmPassword");

    const saveProfileButton =
        document.getElementById("saveProfileButton");

    const changePasswordButton =
        document.getElementById("changePasswordButton");

    const profileMessage =
        document.getElementById("profileMessage");

    const passwordMessage =
        document.getElementById("passwordMessage");

    const profileImageInput =
        document.getElementById("profileImageInput");

    const changeProfileImageButton =
        document.getElementById(
            "changeProfileImageButton"
        );

    const profileImageMessage =
        document.getElementById(
            "profileImageMessage"
        );


    // =====================================
    // API REQUEST
    // =====================================

    async function apiRequest(
        url,
        options = {}
    ) {

        const response =
            await fetch(url, {
                credentials: "include",
                ...options,
                headers: {
                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json",

                    ...(options.headers || {})
                }
            });

        let data;

        try {

            data =
                await response.json();

        } catch {

            throw new Error(
                "Invalid server response."
            );
        }

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Request failed."
            );
        }

        return data;
    }


    // =====================================
    // LOAD PROFILE
    // =====================================

    async function loadProfile() {

        try {

            const data =
                await apiRequest(
                    "/api/profile"
                );

            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Unable to load profile."
                );
            }

            const profile =
                data.profile;


            // =================================
            // FORM VALUES
            // =================================

            if (fullName) {

                fullName.value =
                    profile.full_name || "";
            }

            if (username) {

                username.value =
                    profile.username || "";
            }

            if (email) {

                email.value =
                    profile.email || "";
            }


            // =================================
            // PROFILE HEADER
            // =================================

            setText(
                "headerProfileName",
                profile.full_name
            );

            setText(
                "headerProfileEmail",
                profile.email
            );

            setText(
                "headerProfileRole",
                capitalize(
                    profile.role
                )
            );


            // =================================
            // TOPBAR
            // =================================

            setText(
                "profileName",
                profile.full_name
            );

            setText(
                "profileRole",
                capitalize(
                    profile.role
                )
            );


            // =================================
            // AVATARS
            // =================================

            updateProfileAvatars(
                profile
            );


            // =================================
            // ACCOUNT DETAILS
            // =================================

            setText(
                "accountId",
                profile.id
            );

            setText(
                "accountRole",
                capitalize(
                    profile.role
                )
            );

            setText(
                "accountUsername",
                profile.username
            );

            setText(
                "accountCreated",
                formatDate(
                    profile.created_at
                )
            );


            const status =
                document.getElementById(
                    "accountStatus"
                );

            if (status) {

                status.textContent =
                    profile.is_active
                        ? "Active"
                        : "Inactive";

                status.className =
                    profile.is_active
                        ? "status-active"
                        : "status-inactive";
            }

        } catch (error) {

            console.error(
                "Profile loading error:",
                error
            );

            showMessage(
                profileMessage,
                error.message ||
                "Unable to load profile.",
                "error"
            );
        }
    }


    // =====================================
    // UPDATE PROFILE
    // =====================================

    if (profileForm) {

        profileForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                clearMessage(
                    profileMessage
                );


                const name =
                    fullName.value.trim();

                const user =
                    username.value.trim();

                const mail =
                    email.value.trim();


                if (
                    !name ||
                    !user ||
                    !mail
                ) {

                    showMessage(
                        profileMessage,
                        "All profile fields are required.",
                        "error"
                    );

                    return;
                }


                saveProfileButton.disabled =
                    true;

                saveProfileButton.textContent =
                    "Saving...";


                try {

                    const data =
                        await apiRequest(
                            "/api/profile",
                            {
                                method: "PUT",

                                body:
                                    JSON.stringify({
                                        full_name:
                                            name,

                                        username:
                                            user,

                                        email:
                                            mail
                                    })
                            }
                        );


                    if (!data.success) {

                        throw new Error(
                            data.message ||
                            "Unable to update profile."
                        );
                    }


                    showMessage(
                        profileMessage,
                        "Profile updated successfully.",
                        "success"
                    );


                    const profile =
                        data.profile;


                    setText(
                        "headerProfileName",
                        profile.full_name
                    );

                    setText(
                        "headerProfileEmail",
                        profile.email
                    );

                    setText(
                        "profileName",
                        profile.full_name
                    );

                    setText(
                        "profileRole",
                        capitalize(
                            profile.role
                        )
                    );


                    updateProfileAvatars(
                        profile
                    );


                } catch (error) {

                    console.error(
                        "Profile update error:",
                        error
                    );

                    showMessage(
                        profileMessage,
                        error.message ||
                        "Unable to update profile.",
                        "error"
                    );


                } finally {

                    saveProfileButton.disabled =
                        false;

                    saveProfileButton.textContent =
                        "Save Changes";
                }
            }
        );
    }


    // =====================================
    // CHANGE PASSWORD
    // =====================================

    if (passwordForm) {

        passwordForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                clearMessage(
                    passwordMessage
                );


                const current =
                    currentPassword.value;

                const newPass =
                    newPassword.value;

                const confirm =
                    confirmPassword.value;


                // =================================
                // VALIDATION
                // =================================

                if (
                    !current ||
                    !newPass ||
                    !confirm
                ) {

                    showMessage(
                        passwordMessage,
                        "All password fields are required.",
                        "error"
                    );

                    return;
                }


                if (
                    newPass.length < 6
                ) {

                    showMessage(
                        passwordMessage,
                        "New password must contain at least 6 characters.",
                        "error"
                    );

                    return;
                }


                if (
                    newPass !== confirm
                ) {

                    showMessage(
                        passwordMessage,
                        "New password and confirmation do not match.",
                        "error"
                    );

                    return;
                }


                if (
                    current === newPass
                ) {

                    showMessage(
                        passwordMessage,
                        "New password must be different from the current password.",
                        "error"
                    );

                    return;
                }


                changePasswordButton.disabled =
                    true;

                changePasswordButton.textContent =
                    "Changing...";


                try {

                    const data =
                        await apiRequest(
                            "/api/profile/password",
                            {
                                method: "PATCH",

                                body:
                                    JSON.stringify({
                                        currentPassword:
                                            current,

                                        newPassword:
                                            newPass
                                    })
                            }
                        );


                    if (!data.success) {

                        throw new Error(
                            data.message ||
                            "Unable to change password."
                        );
                    }


                    showMessage(
                        passwordMessage,
                        "Password changed successfully.",
                        "success"
                    );


                    passwordForm.reset();


                } catch (error) {

                    console.error(
                        "Password change error:",
                        error
                    );

                    showMessage(
                        passwordMessage,
                        error.message ||
                        "Unable to change password.",
                        "error"
                    );


                } finally {

                    changePasswordButton.disabled =
                        false;

                    changePasswordButton.textContent =
                        "Change Password";
                }
            }
        );
    }


    // =====================================
    // PROFILE IMAGE UPLOAD
    // =====================================

    if (
        profileImageInput &&
        changeProfileImageButton
    ) {

        changeProfileImageButton.addEventListener(
            "click",
            () => {

                profileImageInput.click();
            }
        );


        profileImageInput.addEventListener(
            "change",
            async () => {

                const file =
                    profileImageInput.files[0];


                if (!file) {
                    return;
                }


                // =================================
                // FILE TYPE VALIDATION
                // =================================

                const allowedTypes = [
                    "image/jpeg",
                    "image/png",
                    "image/webp"
                ];


                if (
                    !allowedTypes.includes(
                        file.type
                    )
                ) {

                    showMessage(
                        profileImageMessage,
                        "Only JPG, PNG and WEBP images are allowed.",
                        "error"
                    );

                    profileImageInput.value =
                        "";

                    return;
                }


                // =================================
                // FILE SIZE VALIDATION
                // =================================

                const maxSize =
                    5 * 1024 * 1024;


                if (
                    file.size > maxSize
                ) {

                    showMessage(
                        profileImageMessage,
                        "Image must be 5MB or smaller.",
                        "error"
                    );

                    profileImageInput.value =
                        "";

                    return;
                }


                showMessage(
                    profileImageMessage,
                    "Uploading...",
                    ""
                );


                try {

                    const formData =
                        new FormData();


                    formData.append(
                        "profileImage",
                        file
                    );


                    const response =
                        await fetch(
                            "/api/profile/image",
                            {
                                method: "POST",

                                credentials:
                                    "include",

                                headers: {
                                    "Accept":
                                        "application/json"
                                },

                                body:
                                    formData
                            }
                        );


                    let data;

                    try {

                        data =
                            await response.json();

                    } catch {

                        throw new Error(
                            "Invalid server response."
                        );
                    }


                    if (!response.ok) {

                        throw new Error(
                            data.message ||
                            "Unable to upload profile image."
                        );
                    }


                    if (
                        !data.success ||
                        !data.profile
                    ) {

                        throw new Error(
                            data.message ||
                            "Profile image upload failed."
                        );
                    }


                    // =================================
                    // UPDATE IMAGE IMMEDIATELY
                    // =================================

                    updateProfileAvatars(
                        data.profile
                    );


                    showMessage(
                        profileImageMessage,
                        "Profile picture updated successfully.",
                        "success"
                    );


                    profileImageInput.value =
                        "";


                } catch (error) {

                    console.error(
                        "Profile image upload error:",
                        error
                    );


                    showMessage(
                        profileImageMessage,
                        error.message ||
                        "Unable to upload profile image.",
                        "error"
                    );
                }
            }
        );
    }


    // =====================================
    // SIDEBAR
    // =====================================

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const menuButton =
        document.getElementById(
            "menuButton"
        );

    const sidebarOverlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (
        menuButton &&
        sidebar &&
        sidebarOverlay
    ) {

        menuButton.addEventListener(
            "click",
            () => {

                sidebar.classList.add(
                    "open"
                );

                sidebarOverlay.classList.add(
                    "show"
                );
            }
        );


        sidebarOverlay.addEventListener(
            "click",
            () => {

                sidebar.classList.remove(
                    "open"
                );

                sidebarOverlay.classList.remove(
                    "show"
                );
            }
        );
    }


    // =====================================
    // MOBILE NAVIGATION
    // =====================================

    const navLinks =
        document.querySelectorAll(
            ".nav-link"
        );


    navLinks.forEach(link => {

        link.addEventListener(
            "click",
            () => {

                if (
                    window.innerWidth <= 768 &&
                    sidebar &&
                    sidebarOverlay
                ) {

                    sidebar.classList.remove(
                        "open"
                    );

                    sidebarOverlay.classList.remove(
                        "show"
                    );
                }
            }
        );
    });


    // =====================================
    // NOTIFICATIONS
    // =====================================

    const notificationButton =
        document.getElementById(
            "notificationButton"
        );

    const notificationPanel =
        document.getElementById(
            "notificationPanel"
        );

    const closeNotificationButton =
        document.getElementById(
            "closeNotificationButton"
        );


    if (
        notificationButton &&
        notificationPanel
    ) {

        notificationButton.addEventListener(
            "click",
            () => {

                notificationPanel.classList.toggle(
                    "show"
                );
            }
        );
    }


    if (
        closeNotificationButton &&
        notificationPanel
    ) {

        closeNotificationButton.addEventListener(
            "click",
            () => {

                notificationPanel.classList.remove(
                    "show"
                );
            }
        );
    }


    // =====================================
    // LOGOUT
    // =====================================

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (logoutButton) {

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

                } catch (error) {

                    console.error(
                        "Logout error:",
                        error
                    );

                } finally {

                    window.location.href =
                        "../index.html";
                }
            }
        );
    }


    // =====================================
    // HELPER FUNCTIONS
    // =====================================

    function setText(
        elementId,
        value
    ) {

        const element =
            document.getElementById(
                elementId
            );


        if (element) {

            element.textContent =
                value ?? "-";
        }
    }


    function getInitials(name) {

        if (!name) {
            return "U";
        }


        const parts =
            name
                .trim()
                .split(/\s+/)
                .filter(Boolean);


        if (
            parts.length === 1
        ) {

            return parts[0]
                .substring(0, 2)
                .toUpperCase();
        }


        return (
            parts[0][0] +
            parts[parts.length - 1][0]
        ).toUpperCase();
    }


    // =====================================
    // UPDATE PROFILE AVATARS
    // =====================================

    function updateProfileAvatars(
        profile
    ) {

        const profileAvatar =
            document.getElementById(
                "profileAvatar"
            );

        const largeProfileAvatar =
            document.getElementById(
                "largeProfileAvatar"
            );

        const profileAvatarInitials =
            document.getElementById(
                "profileAvatarInitials"
            );

        const largeProfileAvatarInitials =
            document.getElementById(
                "largeProfileAvatarInitials"
            );


        const initials =
            getInitials(
                profile.full_name
            );


        if (
            profile.profile_image
        ) {

            const imageUrl =
                profile.profile_image +
                "?t=" +
                Date.now();


            if (profileAvatar) {

                profileAvatar.src =
                    imageUrl;

                profileAvatar.style.display =
                    "block";
            }


            if (
                largeProfileAvatar
            ) {

                largeProfileAvatar.src =
                    imageUrl;

                largeProfileAvatar.style.display =
                    "block";
            }


            if (
                profileAvatarInitials
            ) {

                profileAvatarInitials.style.display =
                    "none";
            }


            if (
                largeProfileAvatarInitials
            ) {

                largeProfileAvatarInitials.style.display =
                    "none";
            }

        } else {

            if (profileAvatar) {

                profileAvatar.style.display =
                    "none";
            }


            if (
                largeProfileAvatar
            ) {

                largeProfileAvatar.style.display =
                    "none";
            }


            if (
                profileAvatarInitials
            ) {

                profileAvatarInitials.textContent =
                    initials;

                profileAvatarInitials.style.display =
                    "flex";
            }


            if (
                largeProfileAvatarInitials
            ) {

                largeProfileAvatarInitials.textContent =
                    initials;

                largeProfileAvatarInitials.style.display =
                    "flex";
            }
        }
    }


    // =====================================
    // CAPITALIZE
    // =====================================

    function capitalize(value) {

        if (!value) {
            return "-";
        }


        return String(value)
            .charAt(0)
            .toUpperCase() +
            String(value)
                .slice(1)
                .toLowerCase();
    }


    // =====================================
    // FORMAT DATE
    // =====================================

    function formatDate(value) {

        if (!value) {
            return "-";
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "-";
        }


        return date.toLocaleDateString(
            "en-NG",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }


    // =====================================
    // SHOW MESSAGE
    // =====================================

    function showMessage(
        element,
        message,
        type
    ) {

        if (!element) {
            return;
        }


        element.textContent =
            message;


        element.className =
            type
                ? `form-message ${type}`
                : "form-message";
    }


    // =====================================
    // CLEAR MESSAGE
    // =====================================

    function clearMessage(
        element
    ) {

        if (!element) {
            return;
        }


        element.textContent =
            "";

        element.className =
            "form-message";
    }


    // =====================================
    // INITIAL LOAD
    // =====================================

    loadProfile();

});