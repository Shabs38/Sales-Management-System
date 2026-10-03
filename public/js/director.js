/* =========================================
   DIRECTOR DASHBOARD
   REAL POSTGRESQL DATA
========================================= */


/* =========================================
   MOBILE SIDEBAR
========================================= */

const sidebar =
    document.getElementById("sidebar");

const menuButton =
    document.getElementById("menuButton");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");


function openSidebar() {

    sidebar.classList.add("open");

    sidebarOverlay.classList.add("show");

}


function closeSidebar() {

    sidebar.classList.remove("open");

    sidebarOverlay.classList.remove("show");

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
   NAVIGATION
========================================= */

const navLinks =
    document.querySelectorAll(".nav-link");


navLinks.forEach(function (link) {

    link.addEventListener(
        "click",
        function () {

            navLinks.forEach(function (item) {

                item.classList.remove("active");

            });

            link.classList.add("active");


            if (window.innerWidth <= 760) {

                closeSidebar();

            }

        }
    );

});


/* =========================================
   NOTIFICATIONS
========================================= */

const notificationButton =
    document.getElementById(
        "notificationButton"
    );

const notificationPanel =
    document.getElementById(
        "notificationPanel"
    );

const closeNotifications =
    document.getElementById(
        "closeNotifications"
    );


notificationButton.addEventListener(
    "click",
    function () {

        notificationPanel.classList.toggle(
            "show"
        );

    }
);


closeNotifications.addEventListener(
    "click",
    function () {

        notificationPanel.classList.remove(
            "show"
        );

    }
);


/* =========================================
   CLOSE NOTIFICATIONS OUTSIDE
========================================= */

document.addEventListener(
    "click",
    function (event) {

        if (
            !notificationPanel.contains(
                event.target
            ) &&
            !notificationButton.contains(
                event.target
            )
        ) {

            notificationPanel.classList.remove(
                "show"
            );

        }

    }
);


/* =========================================
   NEW SALE BUTTON
========================================= */

const newSaleButton =
    document.getElementById(
        "newSaleButton"
    );


newSaleButton.addEventListener(
    "click",
    function () {

        window.location.href =
            "sales.html";

    }
);


/* =========================================
   LOGOUT
========================================= */

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


async function logoutUser() {

    try {

        const response = await fetch(
            "/api/auth/logout",
            {
                method: "POST",
                credentials: "include"
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


        const confirmLogout =
            confirm(
                "Are you sure you want to logout?"
            );


        if (!confirmLogout) {

            return;

        }


        logoutUser();

    }
);


/* =========================================
   FORMAT CURRENCY
========================================= */

function formatCurrency(amount) {

    const number =
        Number(amount) || 0;


    return "₦" +
        number.toLocaleString(
            "en-NG",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        );

}


/* =========================================
   FORMAT DATE
========================================= */

function formatDate(dateValue) {

    if (!dateValue) {

        return "-";

    }


    const date =
        new Date(dateValue);


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
   MANAGER INITIALS
========================================= */

function getInitials(name) {

    if (!name) {

        return "M";

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
   LOAD DIRECTOR PROFILE
========================================= */

async function loadDirectorProfile() {

    try {

        const response = await fetch(
            "/api/auth/me",
            {
                credentials: "include",
                headers: {
                    "Accept": "application/json"
                }
            }
        );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success ||
            !data.user
        ) {

            window.location.href =
                "/pages/index.html";

            return;

        }


        if (data.user.role !== "director") {

            window.location.href =
                "/pages/manager-dashboard.html";

            return;

        }


        const profileName =
            document.getElementById(
                "profileName"
            );

        const profileRole =
            document.getElementById(
                "profileRole"
            );

        const profileAvatar =
            document.getElementById(
                "profileAvatar"
            );


        if (profileName) {

            profileName.textContent =
                data.user.full_name;

        }


        if (profileRole) {

            profileRole.textContent =
                "Director";

        }


        if (profileAvatar) {

            profileAvatar.textContent =
                getInitials(
                    data.user.full_name
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
   UPDATE SUMMARY CARDS
========================================= */

function updateSummary(summary) {

    const totalRevenue =
        document.getElementById(
            "totalRevenue"
        );

    const totalSales =
        document.getElementById(
            "totalSales"
        );

    const totalProducts =
        document.getElementById(
            "totalProducts"
        );

    const totalManagers =
        document.getElementById(
            "totalManagers"
        );

    const activeManagers =
        document.getElementById(
            "activeManagers"
        );

    const managerStatusText =
        document.getElementById(
            "managerStatusText"
        );


    if (totalRevenue) {

        totalRevenue.textContent =
            formatCurrency(
                summary.total_revenue
            );

    }


    if (totalSales) {

        totalSales.textContent =
            Number(
                summary.total_sales
            ).toLocaleString();

    }


    if (totalProducts) {

        totalProducts.textContent =
            Number(
                summary.total_products
            ).toLocaleString();

    }


    if (totalManagers) {

        totalManagers.textContent =
            Number(
                summary.total_managers
            ).toLocaleString();

    }


    if (activeManagers) {

        activeManagers.textContent =
            `${Number(
                summary.active_managers
            )} Active`;

    }


    if (managerStatusText) {

        managerStatusText.textContent =
            `${Number(
                summary.inactive_managers
            )} currently inactive`;

    }

}


/* =========================================
   RENDER TOP MANAGERS
========================================= */

function renderTopManagers(managers) {

    const managerList =
        document.getElementById(
            "managerList"
        );


    if (!managerList) {

        return;

    }


    managerList.innerHTML = "";


    if (
        !managers ||
        managers.length === 0
    ) {

        managerList.innerHTML =
            `<p class="empty-state">
                No manager sales data available.
            </p>`;

        return;

    }


    managers.forEach(function (manager) {

        const row =
            document.createElement("div");

        row.className =
            "manager-row";


        row.innerHTML = `
            <div class="manager-avatar">
                ${escapeHtml(
                    getInitials(
                        manager.full_name
                    )
                )}
            </div>

            <div class="manager-details">

                <strong>
                    ${escapeHtml(
                        manager.full_name
                    )}
                </strong>

                <span>
                    ${Number(
                        manager.total_sales
                    ).toLocaleString()} sales
                </span>

            </div>

            <strong class="manager-revenue">
                ${formatCurrency(
                    manager.total_revenue
                )}
            </strong>
        `;


        managerList.appendChild(row);

    });

}


/* =========================================
   RENDER RECENT TRANSACTIONS
========================================= */

function renderTransactions(transactions) {

    const tableBody =
        document.getElementById(
            "transactionsTableBody"
        );


    if (!tableBody) {

        return;

    }


    tableBody.innerHTML = "";


    if (
        !transactions ||
        transactions.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    No transactions found.
                </td>
            </tr>
        `;

        return;

    }


    transactions.forEach(function (sale) {

        const row =
            document.createElement("tr");


        const status =
            String(
                sale.payment_status || ""
            ).toLowerCase();


        let statusClass =
            "pending";


        let statusText =
            "Pending";


        if (status === "paid") {

            statusClass =
                "completed";

            statusText =
                "Completed";

        }


        row.innerHTML = `
            <td>
                <strong>
                    #${escapeHtml(
                        sale.sale_reference
                    )}
                </strong>
            </td>

            <td>
                ${escapeHtml(
                    sale.customer_name ||
                    "Unknown Customer"
                )}
            </td>

            <td>
                ${escapeHtml(
                    sale.manager_name ||
                    "Unknown Manager"
                )}
            </td>

            <td>
                ${formatCurrency(
                    sale.total_amount
                )}
            </td>

            <td>
                ${formatDate(
                    sale.created_at
                )}
            </td>

            <td>
                <span class="status ${statusClass}">
                    ${statusText}
                </span>
            </td>
        `;


        tableBody.appendChild(row);

    });

}


/* =========================================
   RENDER SALES CHART
========================================= */

function renderSalesChart(chartData) {

    const barsContainer =
        document.getElementById(
            "salesChartBars"
        );


    if (!barsContainer) {

        return;

    }


    barsContainer.innerHTML = "";


    if (
        !chartData ||
        chartData.length === 0
    ) {

        barsContainer.innerHTML = `
            <div class="empty-chart">
                No sales data available.
            </div>
        `;

        return;

    }


    const values =
        chartData.map(function (item) {

            return Number(
                item.total_revenue
            ) || 0;

        });


    const maxValue =
        Math.max(...values, 1);


    chartData.forEach(function (item) {

        const value =
            Number(
                item.total_revenue
            ) || 0;


        const height =
            Math.max(
                (value / maxValue) * 100,
                value > 0 ? 5 : 0
            );


        const date =
            new Date(
                item.sale_date
            );


        let label = "-";


        if (!Number.isNaN(date.getTime())) {

            label =
                date.toLocaleDateString(
                    "en-NG",
                    {
                        day: "numeric",
                        month: "short"
                    }
                );

        }


        const column =
            document.createElement("div");

        column.className =
            "bar-column";


        column.innerHTML = `
            <div
                class="bar"
                style="height: ${height}%"
                title="${formatCurrency(value)}"
            ></div>

            <span>
                ${escapeHtml(label)}
            </span>
        `;


        barsContainer.appendChild(column);

    });

}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================
   LOAD DASHBOARD DATA
========================================= */

async function loadDashboard() {

    try {

        const selectedPeriod =
    chartPeriod ? chartPeriod.value : "monthly";

const response = await fetch(
    `/api/dashboard/director?period=${selectedPeriod}`,
    {
        credentials: "include",
        headers: {
            "Accept": "application/json"
        }
    }
);

        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            console.error(
                "Dashboard API error:",
                data.message
            );

            return;

        }


        updateSummary(
            data.summary
        );


        renderTopManagers(
            data.top_managers
        );


        renderTransactions(
            data.recent_transactions
        );


        renderSalesChart(
            data.sales_chart
        );


    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );

    }

}


/* =========================================
   CHART PERIOD
========================================= */

const chartPeriod =
    document.getElementById(
        "chartPeriod"
    );


if (chartPeriod) {
    chartPeriod.addEventListener(
        "change",
        function () {
            loadDashboard();
        }
    );
}

/* =========================================
   INITIALIZE DASHBOARD
========================================= */

async function initializeDashboard() {

    await loadDirectorProfile();

    await loadDashboard();

}


initializeDashboard();