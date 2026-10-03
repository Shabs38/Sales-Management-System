document.addEventListener("DOMContentLoaded", function () {

    // =========================
    // MOBILE SIDEBAR
    // =========================

    const sidebar = document.getElementById("sidebar");
    const menuButton = document.getElementById("menuButton");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    if (menuButton && sidebar && sidebarOverlay) {

        menuButton.addEventListener("click", function () {

            sidebar.classList.add("open");
            sidebarOverlay.classList.add("active");

        });

    }


    if (sidebarOverlay && sidebar) {

        sidebarOverlay.addEventListener("click", function () {

            sidebar.classList.remove("open");
            sidebarOverlay.classList.remove("active");

        });

    }


    // =========================
    // NOTIFICATIONS
    // =========================

    const notificationButton =
        document.getElementById("notificationButton");

    const notificationPanel =
        document.getElementById("notificationPanel");

    const closeNotifications =
        document.getElementById("closeNotifications");


    if (notificationButton && notificationPanel) {

        notificationButton.addEventListener("click", function (event) {

            event.stopPropagation();

            notificationPanel.classList.toggle("active");

        });

    }


    if (closeNotifications && notificationPanel) {

        closeNotifications.addEventListener("click", function () {

            notificationPanel.classList.remove("active");

        });

    }


    document.addEventListener("click", function (event) {

        if (
            notificationPanel &&
            notificationButton &&
            !notificationPanel.contains(event.target) &&
            !notificationButton.contains(event.target)
        ) {

            notificationPanel.classList.remove("active");

        }

    });


    // =========================
    // NEW SALE
    // =========================

    const newSaleButton =
        document.getElementById("newSaleButton");

    if (newSaleButton) {

        newSaleButton.addEventListener("click", function () {

            window.location.href = "sales.html";

        });

    }


  // =========================
// LOGOUT
// =========================

const logoutButton =
    document.getElementById("logoutButton");

if (logoutButton) {

    logoutButton.addEventListener("click", async function (event) {

        event.preventDefault();

        const confirmLogout = confirm(
            "Are you sure you want to logout?"
        );

        if (!confirmLogout) {
            return;
        }

        try {

            const response = await fetch(
                "/api/auth/logout",
                {
                    method: "POST",
                    credentials: "include"
                }
            );

            const data = await response.json();

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

    });

}


    // =========================
    // CHART PERIOD
    // =========================

    const chartPeriod =
        document.getElementById("chartPeriod");

    if (chartPeriod) {

        chartPeriod.addEventListener("change", function () {

            if (this.value === "monthly") {

                alert(
                    "Monthly sales chart will be connected later."
                );

            }

        });

    }
    
    // =========================
// ACTIVE SIDEBAR LINK
// =========================

const currentPage =
    window.location.pathname.split("/").pop();

const navLinks =
    document.querySelectorAll(".nav-link");

navLinks.forEach(function (link) {

    const linkPage =
        link.getAttribute("href");

    if (linkPage === currentPage) {

        link.classList.add("active");

    } else {

        link.classList.remove("active");

        }

    });

});


/* =========================================
   MANAGER DASHBOARD - REAL DATA
========================================= */

async function loadManagerDashboard() {

    try {

        const response = await fetch(
            '/api/dashboard/manager',
            {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || 'Failed to load dashboard'
            );
        }

        /* =========================================
           1. DASHBOARD SUMMARY
        ========================================= */

        const totalSales =
            document.getElementById('managerTotalSales');

        const totalRevenue =
            document.getElementById('managerTotalRevenue');

        const productsSold =
            document.getElementById('managerProductsSold');

        const totalCustomers =
            document.getElementById('managerTotalCustomers');

const salesGrowth =
    document.getElementById(
        'managerSalesGrowth'
    );

const revenueGrowth =
    document.getElementById(
        'managerRevenueGrowth'
    );
    
 const customerGrowth =
    document.getElementById(
        'managerCustomerGrowth'
    );   


/* =========================================
   REAL GROWTH VALUES
========================================= */

if (salesGrowth) {

    const growth =
        Number(data.summary.sales_growth);

    salesGrowth.textContent =
        growth >= 0
            ? `↑ ${growth}%`
            : `↓ ${Math.abs(growth)}%`;

    salesGrowth.classList.remove(
        'positive',
        'negative'
    );

    salesGrowth.classList.add(
        growth >= 0
            ? 'positive'
            : 'negative'
    );
}


if (revenueGrowth) {

    const growth =
        Number(data.summary.revenue_growth);

    revenueGrowth.textContent =
        growth >= 0
            ? `↑ ${growth}%`
            : `↓ ${Math.abs(growth)}%`;

    revenueGrowth.classList.remove(
        'positive',
        'negative'
    );

    revenueGrowth.classList.add(
        growth >= 0
            ? 'positive'
            : 'negative'
    );
}

if (customerGrowth) {

    const growth =
        Number(
            data.summary.customer_growth
        );

    customerGrowth.textContent =
        growth >= 0
            ? `↑ ${growth}%`
            : `↓ ${Math.abs(growth)}%`;

    customerGrowth.classList.remove(
        'positive',
        'negative'
    );

    customerGrowth.classList.add(
        growth >= 0
            ? 'positive'
            : 'negative'
    );
}

        if (totalSales) {
            totalSales.textContent =
                Number(data.summary.total_sales).toLocaleString();
        }


        if (totalRevenue) {
            totalRevenue.textContent =
                '₦' +
                Number(data.summary.total_revenue)
                    .toLocaleString();
        }


        if (productsSold) {
            productsSold.textContent =
                Number(data.summary.products_sold)
                    .toLocaleString();
        }


        if (totalCustomers) {
            totalCustomers.textContent =
                Number(data.summary.total_customers)
                    .toLocaleString();
        }


        /* =========================================
           2. TOP PRODUCTS
        ========================================= */

        const topProducts =
            document.getElementById(
                'managerTopProducts'
            );

        if (topProducts) {

            topProducts.innerHTML = '';

            if (
                !data.top_products ||
                data.top_products.length === 0
            ) {

                topProducts.innerHTML = `
                    <div class="empty-state">
                        No product sales yet.
                    </div>
                `;

            } else {

                data.top_products.forEach(
                    (product, index) => {

                        const row =
                            document.createElement('div');

                        row.className = 'product-row';

                        row.innerHTML = `
                            <div class="product-info">
                                <div class="product-rank">
                                    ${index + 1}
                                </div>

                                <div>
                                    <h4>
                                        ${product.product_name}
                                    </h4>

                                    <span>
                                        ${Number(
                                            product.quantity_sold
                                        ).toLocaleString()}
                                        units sold
                                    </span>
                                </div>
                            </div>

                            <strong>
                                ₦${Number(
                                    product.total_revenue
                                ).toLocaleString()}
                            </strong>
                        `;

                        topProducts.appendChild(row);

                    }
                );

            }

        }


        /* =========================================
           3. RECENT SALES
        ========================================= */

        const recentSales =
            document.getElementById(
                'managerRecentSales'
            );

        if (recentSales) {

            recentSales.innerHTML = '';

            if (
                !data.recent_sales ||
                data.recent_sales.length === 0
            ) {

                recentSales.innerHTML = `
                    <tr>
                        <td colspan="6"
                            style="text-align:center;">
                            No sales recorded yet.
                        </td>
                    </tr>
                `;

            } else {

                data.recent_sales.forEach(
                    sale => {

                        const row =
                            document.createElement('tr');

                        const saleDate =
                            new Date(
                                sale.created_at
                            );

                        const formattedDate =
                            saleDate.toLocaleDateString(
                                'en-NG',
                                {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                }
                            );

                        const status =
                            sale.payment_status || 'paid';

                        row.innerHTML = `
                            <td>
                                ${sale.sale_reference}
                            </td>

                            <td>
                                ${sale.customer_name || 'Walk-in Customer'}
                            </td>

                            <td>
                                ${sale.manager_name || 'You'}
                            </td>

                            <td>
                                ₦${Number(
                                    sale.total_amount
                                ).toLocaleString()}
                            </td>

                            <td>
                                ${formattedDate}
                            </td>

                            <td>
                                <span class="status ${status.toLowerCase()}">
                                    ${status}
                                </span>
                            </td>
                        `;

                        recentSales.appendChild(row);

                    }
                );

            }

        }


        /* =========================================
           4. SALES CHART
        ========================================= */

        await loadManagerSalesChart(
            'weekly'
        );


    } catch (error) {

        console.error(
            'Manager dashboard error:',
            error
        );

    }

}


/* =========================================
   MANAGER SALES CHART
========================================= */

async function loadManagerSalesChart(
    period = 'weekly'
) {

    try {

        const response = await fetch(
            `/api/dashboard/manager?period=${period}`,
            {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                'Unable to load sales chart'
            );
        }

        renderManagerSalesChart(
            data.sales_chart || [],
            period
        );

    } catch (error) {

        console.error(
            'Manager chart error:',
            error
        );

    }

}


/* =========================================
   RENDER CHART
========================================= */

function renderManagerSalesChart(
    salesData,
    period
) {

    const chart =
        document.getElementById(
            'managerSalesChartBars'
        );

    if (!chart) return;

    chart.innerHTML = '';

   if (!salesData.length) {

    chart.innerHTML = `
        <div class="empty-chart">
            No sales data available.
        </div>
    `;

    renderManagerChartYAxis([]);

    return;
}

renderManagerChartYAxis(salesData);

    const values =
        salesData.map(
            item =>
                Number(item.total_revenue)
        );

    const maxValue =
        Math.max(...values, 1);


    salesData.forEach(
        item => {

            const value =
                Number(item.total_revenue);

            const percentage =
                Math.max(
                    (value / maxValue) * 100,
                    3
                );


            const date =
                new Date(item.sale_date);


            let label;


            if (period === 'weekly') {

                label =
                    date.toLocaleDateString(
                        'en-US',
                        {
                            weekday: 'short'
                        }
                    );

            } else {

                label =
                    date.toLocaleDateString(
                        'en-US',
                        {
                            month: 'short'
                        }
                    );

            }


            const column =
                document.createElement('div');

            column.className =
                'bar-column';


            column.innerHTML = `
                <div class="bar-wrapper">

                    <div
                        class="bar"
                        style="height:${percentage}%"
                        title="₦${value.toLocaleString()}"
                    ></div>

                </div>

                <span class="bar-label">
                    ${label}
                </span>
            `;


            chart.appendChild(column);

        }
    );


    const description =
        document.getElementById(
            'managerChartDescription'
        );

    if (description) {

        description.textContent =
            period === 'weekly'
                ? 'Your sales this week'
                : 'Your sales this month';

    }

}


/* =========================================
   CHART PERIOD SELECTOR
========================================= */

const chartPeriod =
    document.getElementById(
        'chartPeriod'
    );


if (chartPeriod) {

    chartPeriod.addEventListener(
        'change',
        function () {

            loadManagerSalesChart(
                this.value
            );

        }
    );

}


/* =========================================
   LOAD DASHBOARD
========================================= */

if (
    document.getElementById(
        'managerTotalSales'
    )
) {

    loadManagerDashboard();

}


/* =========================================
   LOAD LOGGED-IN MANAGER PROFILE
========================================= */

async function loadManagerProfile() {

    try {

        const response = await fetch(
            '/api/auth/me',
            {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || 'Unable to load profile'
            );
        }

        const user = data.user;

        /* Manager name */

        const profileName =
            document.getElementById('profileName');

        if (profileName) {
            profileName.textContent =
                user.full_name;
        }


        /* Manager role */

        const profileRole =
            document.getElementById('profileRole');

        if (profileRole) {
            profileRole.textContent =
                user.role.charAt(0).toUpperCase() +
                user.role.slice(1);
        }


        /* Manager initials */

        const profileAvatar =
            document.getElementById('profileAvatar');

        if (profileAvatar) {

            const names =
                user.full_name.trim().split(/\s+/);

            const initials =
                names
                    .slice(0, 2)
                    .map(name => name.charAt(0))
                    .join('')
                    .toUpperCase();

            profileAvatar.textContent =
                initials;
        }

    } catch (error) {

        console.error(
            'Manager profile error:',
            error
        );

    }

}


loadManagerProfile();


/* =========================================
   LOAD CURRENT DATE
========================================= */

function loadCurrentDate() {

    const dateElement =
        document.getElementById('currentDate');

    if (!dateElement) return;

    const today = new Date();

    dateElement.textContent =
        today.toLocaleDateString('en-NG', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
}

loadCurrentDate();

/* =========================================
   MANAGER CHART Y-AXIS
========================================= */

function renderManagerChartYAxis(salesData) {

    const yAxis =
        document.getElementById(
            'managerChartYAxis'
        );

    if (!yAxis) return;

    yAxis.innerHTML = '';

    if (!salesData || salesData.length === 0) {

        yAxis.innerHTML = `
            <span>₦0</span>
            <span>₦0</span>
            <span>₦0</span>
            <span>₦0</span>
            <span>₦0</span>
        `;

        return;
    }

    const values =
        salesData.map(item =>
            Number(item.total_revenue)
        );

    const maxValue =
        Math.max(...values, 1);

    const steps = 4;

    for (let i = steps; i >= 0; i--) {

        const value =
            (maxValue / steps) * i;

        let label;

        if (value >= 1000000) {

            label =
                '₦' +
                (value / 1000000)
                    .toFixed(1)
                    .replace('.0', '') +
                'M';

        } else if (value >= 1000) {

            label =
                '₦' +
                (value / 1000)
                    .toFixed(0) +
                'K';

        } else {

            label =
                '₦' +
                Math.round(value)
                    .toLocaleString();
        }

        const span =
            document.createElement('span');

        span.textContent = label;

        yAxis.appendChild(span);
    }
}

/* =========================================
   MANAGER NOTIFICATIONS
========================================= */

async function loadManagerNotifications() {

    try {

        const response = await fetch(
            '/api/notifications',
            {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                'Failed to load notifications'
            );
        }

        const badge =
            document.getElementById(
                'notificationBadge'
            );

        const notificationList =
            document.getElementById(
                'notificationList'
            );

        if (badge) {

            badge.textContent =
                data.count;

            badge.style.display =
                data.count > 0
                    ? 'inline-flex'
                    : 'none';
        }

        if (!notificationList) return;

        notificationList.innerHTML = '';

        if (
            !data.notifications ||
            data.notifications.length === 0
        ) {

            notificationList.innerHTML = `
                <div class="notification-item">

                    <div class="notification-icon">
                        ✓
                    </div>

                    <div>

                        <strong>
                            No New Notifications
                        </strong>

                        <p>
                            You're all caught up.
                        </p>

                    </div>

                </div>
            `;

            return;
        }

        data.notifications.forEach(
            notification => {

                const item =
                    document.createElement('div');

                item.className =
                    'notification-item';

                const time =
                    formatNotificationTime(
                        notification.created_at
                    );

                item.innerHTML = `
                    <div class="notification-icon">
                        ${notification.icon}
                    </div>

                    <div>

                        <strong>
                            ${notification.title}
                        </strong>

                        <p>
                            ${notification.message}
                        </p>

                        <small>
                            ${time}
                        </small>

                    </div>
                `;

                notificationList.appendChild(item);

            }
        );

    } catch (error) {

        console.error(
            'Notification error:',
            error
        );

    }

}


/* =========================================
   NOTIFICATION TIME
========================================= */

function formatNotificationTime(
    createdAt
) {

    const date =
        new Date(createdAt);

    const now =
        new Date();

    const difference =
        Math.floor(
            (now - date) / 1000
        );

    if (difference < 60) {
        return 'Just now';
    }

    const minutes =
        Math.floor(
            difference / 60
        );

    if (minutes < 60) {
        return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }

    const hours =
        Math.floor(
            minutes / 60
        );

    if (hours < 24) {
        return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }

    const days =
        Math.floor(
            hours / 24
        );

    return `${days} day${days === 1 ? '' : 's'} ago`;
}


/* =========================================
   LOAD NOTIFICATIONS
========================================= */

loadManagerNotifications();