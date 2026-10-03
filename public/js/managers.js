/* =========================================
   MANAGERS MANAGEMENT
========================================= */

const sidebar = document.getElementById("sidebar");
const menuButton = document.getElementById("menuButton");
const sidebarOverlay = document.getElementById("sidebarOverlay");

const managerTableBody = document.getElementById("managerTableBody");

const totalManagers = document.getElementById("totalManagers");
const activeManagers = document.getElementById("activeManagers");
const inactiveManagers = document.getElementById("inactiveManagers");

const managerSearch = document.getElementById("managerSearch");

const addManagerButton = document.getElementById("addManagerButton");
const managerModal = document.getElementById("managerModal");
const closeManagerModal = document.getElementById("closeManagerModal");
const cancelManager = document.getElementById("cancelManager");

const managerForm = document.getElementById("managerForm");
const modalTitle = document.getElementById("modalTitle");

const managerId = document.getElementById("managerId");
const fullName = document.getElementById("fullName");
const username = document.getElementById("username");
const email = document.getElementById("email");
const password = document.getElementById("password");

const passwordGroup = document.getElementById("passwordGroup");
const formMessage = document.getElementById("formMessage");

const profileName = document.getElementById("profileName");
const profileRole = document.getElementById("profileRole");
const profileAvatar = document.getElementById("profileAvatar");

const logoutButton = document.getElementById("logoutButton");


let managers = [];


/* =========================================
   MOBILE SIDEBAR
========================================= */

function openSidebar() {
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("show");
}

function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("show");
}

if (menuButton) {
    menuButton.addEventListener("click", openSidebar);
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", closeSidebar);
}


/* =========================================
   LOAD DIRECTOR PROFILE
========================================= */

async function loadProfile() {

    try {

        const response = await fetch(
            "/api/auth/me",
            {
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {

            window.location.href = "/pages/index.html";

            return;
        }


        const user = data.user;


        if (user.role !== "director") {

            alert("Access denied.");

            window.location.href =
                "/pages/manager-dashboard.html";

            return;
        }


        profileName.textContent =
            user.full_name || user.username;

        profileRole.textContent =
            "Director";


        profileAvatar.textContent =
            getInitials(
                user.full_name || user.username
            );


    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );

    }

}


/* =========================================
   GET INITIALS
========================================= */

function getInitials(name) {

    if (!name) {
        return "--";
    }

    const parts =
        name.trim().split(/\s+/);

    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();

    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();

}


/* =========================================
   LOAD MANAGERS FROM POSTGRESQL
========================================= */

async function loadManagers() {

    managerTableBody.innerHTML = `
        <tr>
            <td colspan="6" class="loading-row">
                Loading managers...
            </td>
        </tr>
    `;


    try {

        const response = await fetch(
            "/api/managers",
            {
                method: "GET",
                credentials: "include",
                headers: {
                    "Accept": "application/json"
                }
            }
        );


        const data = await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to load managers."
            );

        }


        managers = data.managers || [];


        updateManagerStats();

        renderManagers();


    } catch (error) {

        console.error(
            "Load managers error:",
            error
        );


        managerTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-row">
                    Unable to load managers.
                </td>
            </tr>
        `;

    }

}


/* =========================================
   UPDATE STATISTICS
========================================= */

function updateManagerStats() {

    const total =
        managers.length;


    const active =
        managers.filter(
            manager => manager.is_active
        ).length;


    const inactive =
        managers.filter(
            manager => !manager.is_active
        ).length;


    totalManagers.textContent =
        total.toLocaleString();


    activeManagers.textContent =
        active.toLocaleString();


    inactiveManagers.textContent =
        inactive.toLocaleString();

}


/* =========================================
   RENDER MANAGERS
========================================= */

function renderManagers() {

    const searchTerm =
        managerSearch.value
            .trim()
            .toLowerCase();


    const filteredManagers =
        managers.filter(function (manager) {

            return (
                manager.full_name
                    .toLowerCase()
                    .includes(searchTerm) ||

                manager.username
                    .toLowerCase()
                    .includes(searchTerm) ||

                manager.email
                    .toLowerCase()
                    .includes(searchTerm)
            );

        });


    if (filteredManagers.length === 0) {

        managerTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-row">
                    No managers found.
                </td>
            </tr>
        `;

        return;
    }


    managerTableBody.innerHTML =
        filteredManagers.map(
            function (manager) {

                return `

                    <tr>

                        <td>

                            <div class="manager-cell">

                                <div class="manager-avatar">
                                    ${escapeHtml(
                                        getInitials(
                                            manager.full_name
                                        )
                                    )}
                                </div>

                                <div>

                                    <strong>
                                        ${escapeHtml(
                                            manager.full_name
                                        )}
                                    </strong>

                                </div>

                            </div>

                        </td>


                        <td>
                            ${escapeHtml(
                                manager.username
                            )}
                        </td>


                        <td>
                            ${escapeHtml(
                                manager.email
                            )}
                        </td>


                        <td>

                            <span class="status ${
                                manager.is_active
                                    ? "active"
                                    : "inactive"
                            }">

                                ${
                                    manager.is_active
                                        ? "Active"
                                        : "Inactive"
                                }

                            </span>

                        </td>


                        <td>
                            ${formatDate(
                                manager.created_at
                            )}
                        </td>

<td>
    <button
        class="btn-edit"
        onclick="editManager(${manager.id})"
    >
        Edit
    </button>

    <button
        class="btn-password"
        onclick="openPasswordModal(${manager.id})"
    >
        Password
    </button>

    <button
        class="${manager.is_active ? 'btn-danger' : 'btn-success'}"
        onclick="toggleManagerStatus(${manager.id}, ${manager.is_active})"
    >
        ${manager.is_active ? 'Deactivate' : 'Activate'}
    </button>
</td>
                       
                    </tr>

                `;

            }
        ).join("");

}


/* =========================================
   FORMAT DATE
========================================= */

function formatDate(dateString) {

    if (!dateString) {
        return "-";
    }

    const date =
        new Date(dateString);


    if (Number.isNaN(date.getTime())) {
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


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================
   SEARCH
========================================= */

managerSearch.addEventListener(
    "input",
    renderManagers
);


/* =========================================
   OPEN ADD MANAGER MODAL
========================================= */

function openAddManagerModal() {

    managerForm.reset();

    managerId.value = "";

    modalTitle.textContent =
        "Add Manager";

    passwordGroup.style.display =
        "block";

    password.required = true;

    clearFormMessage();

    managerModal.classList.add("show");

    fullName.focus();

}


/* =========================================
   CLOSE MODAL
========================================= */

function closeManagerModalFunction() {

    managerModal.classList.remove("show");

    managerForm.reset();

    managerId.value = "";

    clearFormMessage();

}


/* =========================================
   ADD BUTTON
========================================= */

addManagerButton.addEventListener(
    "click",
    openAddManagerModal
);


closeManagerModal.addEventListener(
    "click",
    closeManagerModalFunction
);


cancelManager.addEventListener(
    "click",
    closeManagerModalFunction
);


/* =========================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
========================================= */

managerModal.addEventListener(
    "click",
    function (event) {

        if (event.target === managerModal) {

            closeManagerModalFunction();

        }

    }
);


/* =========================================
   SHOW FORM MESSAGE
========================================= */

function showFormMessage(
    message,
    type = "error"
) {

    formMessage.textContent =
        message;

    formMessage.className =
        `form-message show ${type}`;

}


function clearFormMessage() {

    formMessage.textContent = "";

    formMessage.className =
        "form-message";

}


/* =========================================
   CREATE / UPDATE MANAGER
========================================= */

managerForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        clearFormMessage();


        const id =
            managerId.value.trim();


        const managerData = {

            full_name:
                fullName.value.trim(),

            username:
                username.value.trim(),

            email:
                email.value.trim()

        };


        if (!managerData.full_name ||
            !managerData.username ||
            !managerData.email) {

            showFormMessage(
                "Please fill in all required fields."
            );

            return;
        }


        let url = "/api/managers";

        let method = "POST";


        /* EDIT */

        if (id) {

            url =
                `/api/managers/${id}`;

            method = "PUT";

        }


        /* CREATE PASSWORD */

        if (!id) {

            const newPassword =
                password.value;

            if (!newPassword) {

                showFormMessage(
                    "Password is required."
                );

                return;
            }


            if (newPassword.length < 6) {

                showFormMessage(
                    "Password must be at least 6 characters."
                );

                return;
            }


            managerData.password =
                newPassword;

        }


        try {

            const response =
                await fetch(
                    url,
                    {
                        method: method,

                        credentials: "include",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                managerData
                            )
                    }
                );


            const data =
                await response.json();


            if (!response.ok ||
                !data.success) {

                throw new Error(
                    data.message ||
                    "Unable to save manager."
                );

            }


            showFormMessage(
                data.message ||
                "Manager saved successfully.",
                "success"
            );


            await loadManagers();


            setTimeout(
                function () {

                    closeManagerModalFunction();

                },
                700
            );


        } catch (error) {

            console.error(
                "Save manager error:",
                error
            );


            showFormMessage(
                error.message ||
                "Unable to save manager."
            );

        }

    }
);


/* =========================================
   EDIT MANAGER
========================================= */

window.editManager =
    function (id) {

        const manager =
            managers.find(
                item =>
                    Number(item.id) ===
                    Number(id)
            );


        if (!manager) {

            alert(
                "Manager information not found."
            );

            return;
        }


        managerId.value =
            manager.id;


        fullName.value =
            manager.full_name;


        username.value =
            manager.username;


        email.value =
            manager.email;


        password.value = "";


        modalTitle.textContent =
            "Edit Manager";


        /*
            Password is not edited here.
            It has its own password action later.
        */

        passwordGroup.style.display =
            "none";

        password.required = false;


        clearFormMessage();

        managerModal.classList.add("show");

        fullName.focus();

    };


/* =========================================
   TOGGLE MANAGER STATUS
========================================= */

window.toggleManagerStatus =
    async function (
        id,
        currentlyActive
    ) {

        const manager =
            managers.find(
                item =>
                    Number(item.id) ===
                    Number(id)
            );


        if (!manager) {
            return;
        }


        const action =
            currentlyActive
                ? "deactivate"
                : "activate";


        const confirmed =
            confirm(
                `Are you sure you want to ${action} ${manager.full_name}'s account?`
            );


        if (!confirmed) {
            return;
        }


        try {

            const response =
                await fetch(
                    `/api/managers/${id}/status`,
                    {
                        method: "PATCH",

                        credentials: "include",

                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            const data =
                await response.json();


            if (!response.ok ||
                !data.success) {

                throw new Error(
                    data.message ||
                    "Unable to update manager status."
                );

            }


            await loadManagers();


        } catch (error) {

            console.error(
                "Status update error:",
                error
            );


            alert(
                error.message ||
                "Unable to update manager status."
            );

        }

    };


/* =========================================
   LOGOUT
========================================= */

async function logoutUser() {

    try {

        const response =
            await fetch(
                "/api/auth/logout",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const data =
            await response.json();


        if (data.success) {

            window.location.href =
                "/pages/index.html";

        } else {

            alert(
                data.message ||
                "Unable to logout."
            );

        }

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        alert(
            "Unable to connect to the server."
        );

    }

}


logoutButton.addEventListener(
    "click",
    function (event) {

        event.preventDefault();


        const confirmed =
            confirm(
                "Are you sure you want to logout?"
            );


        if (!confirmed) {
            return;
        }


        logoutUser();

    }
);


/* CHANGE MANAGER PASSWORD */

const passwordModal = document.getElementById("passwordModal");
const closePasswordModal = document.getElementById("closePasswordModal");
const cancelPasswordButton = document.getElementById("cancelPasswordButton");
const passwordForm = document.getElementById("passwordForm");

const passwordManagerId = document.getElementById("passwordManagerId");
const passwordManagerName = document.getElementById("passwordManagerName");
const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");
const passwordMessage = document.getElementById("passwordMessage");


function openPasswordModal(managerId) {

    const manager = managers.find(function (item) {
        return Number(item.id) === Number(managerId);
    });

    if (!manager) {
        alert("Manager not found.");
        return;
    }

    passwordManagerId.value = manager.id;
    passwordManagerName.value = manager.full_name;

    newPassword.value = "";
    confirmPassword.value = "";
    passwordMessage.textContent = "";
    passwordMessage.className = "form-message";

    passwordModal.classList.add("show");
}


function closePasswordModalWindow() {

    passwordModal.classList.remove("show");

    passwordForm.reset();

    passwordMessage.textContent = "";
    passwordMessage.className = "form-message";
}


closePasswordModal.addEventListener("click", closePasswordModalWindow);

cancelPasswordButton.addEventListener(
    "click",
    closePasswordModalWindow
);


passwordModal.addEventListener("click", function (event) {

    if (event.target === passwordModal) {
        closePasswordModalWindow();
    }

});


passwordForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const managerId = passwordManagerId.value;
    const password = newPassword.value.trim();
    const confirm = confirmPassword.value.trim();

    passwordMessage.textContent = "";
    passwordMessage.className = "form-message";


    if (!password || !confirm) {

        passwordMessage.textContent =
            "Please enter and confirm the new password.";

        passwordMessage.classList.add("error");

        return;
    }


    if (password.length < 6) {

        passwordMessage.textContent =
            "Password must be at least 6 characters.";

        passwordMessage.classList.add("error");

        return;
    }


    if (password !== confirm) {

        passwordMessage.textContent =
            "Passwords do not match.";

        passwordMessage.classList.add("error");

        return;
    }


    try {

        const response = await fetch(
            `/api/managers/${managerId}/password`,
            {
                method: "PATCH",

                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },

                credentials: "include",

                body: JSON.stringify({
                    password: password
                })
            }
        );


        const data = await response.json();


        if (!response.ok || !data.success) {

            passwordMessage.textContent =
                data.message || "Unable to change password.";

            passwordMessage.classList.add("error");

            return;
        }


        passwordMessage.textContent =
            "Manager password changed successfully.";

        passwordMessage.classList.add("success");


        setTimeout(function () {
            closePasswordModalWindow();
        }, 1200);


    } catch (error) {

        console.error("Change password error:", error);

        passwordMessage.textContent =
            "Unable to connect to the server.";

        passwordMessage.classList.add("error");
    }

});

/* =========================================
   INITIALIZE
========================================= */

loadProfile();

loadManagers();