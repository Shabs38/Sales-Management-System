// =====================================
// REPORT PAGE
// =====================================

document.addEventListener("DOMContentLoaded", () => {

    // =====================================
    // DOM ELEMENTS
    // =====================================

    const dateFrom = document.getElementById("dateFrom");
    const dateTo = document.getElementById("dateTo");

    const reportStatus =
        document.getElementById("reportStatus");

    const paymentFilter =
        document.getElementById("paymentFilter");

    const reportSearch =
        document.getElementById("reportSearch");

    const chartPeriod =
        document.getElementById("chartPeriod");

    const generateReportButton =
        document.getElementById("generateReportButton");

    const printReportButton =
        document.getElementById("printReportButton");

    const reportTable =
        document.getElementById("reportTable");

    const salesChart =
        document.getElementById("salesChart");

    // =====================================
    // SUMMARY ELEMENTS
    // =====================================

    const totalRevenue =
        document.getElementById("totalRevenue");

    const totalSales =
        document.getElementById("totalSales");

    const productsSold =
        document.getElementById("productsSold");

    const totalCustomers =
        document.getElementById("totalCustomers");

    // =====================================
    // API REQUEST
    // =====================================

    async function apiRequest(url, options = {}) {

        const response = await fetch(url, {
            credentials: "include",
            ...options,
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                ...(options.headers || {})
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Request failed."
            );
        }

        return data;
    }

    // =====================================
    // FORMAT CURRENCY
    // =====================================

    function formatCurrency(value) {

        const amount = Number(value) || 0;

        return "₦" + amount.toLocaleString("en-NG", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // =====================================
    // FORMAT DATE
    // =====================================

    function formatDate(dateValue) {

        if (!dateValue) {
            return "-";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "-";
        }

        return date.toLocaleDateString("en-NG", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    // =====================================
    // LOAD REPORT
    // =====================================

    async function loadSales() {

        try {

            const params = new URLSearchParams();

            // ---------------------------------
            // PERIOD
            // ---------------------------------

            const period =
                chartPeriod && chartPeriod.value
                    ? chartPeriod.value
                    : "weekly";

            params.append("period", period);

            // ---------------------------------
            // DATE FILTERS
            // ---------------------------------

            if (dateFrom && dateFrom.value) {
                params.append("from", dateFrom.value);
            }

            if (dateTo && dateTo.value) {
                params.append("to", dateTo.value);
            }

            // ---------------------------------
            // STATUS FILTER
            // ---------------------------------

            if (
                reportStatus &&
                reportStatus.value &&
                reportStatus.value !== "all"
            ) {
                params.append(
                    "status",
                    reportStatus.value
                );
            }

            // ---------------------------------
            // PAYMENT FILTER
            // ---------------------------------

            if (
                paymentFilter &&
                paymentFilter.value &&
                paymentFilter.value !== "all"
            ) {
                params.append(
                    "payment",
                    paymentFilter.value
                );
            }

            // ---------------------------------
            // SEARCH
            // ---------------------------------

            if (
                reportSearch &&
                reportSearch.value.trim()
            ) {
                params.append(
                    "search",
                    reportSearch.value.trim()
                );
            }

            // ---------------------------------
            // API CALL
            // ---------------------------------

            const data = await apiRequest(
                `/api/reports?${params.toString()}`
            );

            console.log("REPORT DATA:", data);

            if (!data.success) {
                throw new Error(
                    data.message ||
                    "Unable to load report."
                );
            }

            // =================================
            // UPDATE SUMMARY
            // =================================

            const summary =
                data.summary || {};

            if (totalRevenue) {
                totalRevenue.textContent =
                    formatCurrency(
                        summary.total_revenue
                    );
            }

            if (totalSales) {
                totalSales.textContent =
                    Number(
                        summary.total_sales || 0
                    ).toLocaleString();
            }

            if (productsSold) {
                productsSold.textContent =
                    Number(
                        summary.products_sold || 0
                    ).toLocaleString();
            }

            if (totalCustomers) {
                totalCustomers.textContent =
                    Number(
                        summary.customers_served || 0
                    ).toLocaleString();
            }

            // =================================
            // TRANSACTIONS
            // =================================

            const transactions =
                data.transactions || [];

            renderTable(transactions);

            // =================================
            // CHART
            // =================================

            const chartData =
                data.sales_over_time || [];

            renderChart(
                chartData,
                period
            );

        } catch (error) {

            console.error(
                "Report loading error:",
                error
            );

            showTableError(
                error.message ||
                "Unable to load report."
            );

            showChartError(
                error.message ||
                "Unable to load chart."
            );
        }
    }

    // =====================================
    // RENDER TRANSACTION TABLE
    // =====================================

    function renderTable(transactions) {

        if (!reportTable) {
            return;
        }

        const tbody =
            reportTable.querySelector("tbody");

        if (!tbody) {
            return;
        }

        if (!transactions.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="8"
                        style="
                            text-align:center;
                            padding:30px;
                        ">
                        No transactions found.
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML =
            transactions.map(sale => {

                const status =
                    sale.payment_status ||
                    "paid";

                const payment =
                    sale.payment_method ||
                    "-";

                const customer =
                    sale.customer_name ||
                    "Unknown Customer";

                const salesperson =
                    sale.salesperson_name ||
                    "Unknown";

                const amount =
                    formatCurrency(
                        sale.total_amount
                    );

                const date =
                    formatDate(
                        sale.created_at
                    );

                const reference =
                    sale.sale_reference ||
                    `SALE-${sale.id}`;

                return `
                    <tr>

                        <td>
                            ${escapeHTML(reference)}
                        </td>

                        <td>
                            ${escapeHTML(customer)}
                        </td>

                        <td>
                            ${escapeHTML(salesperson)}
                        </td>

                        <td>
                            ${amount}
                        </td>

                        <td>
                            <span class="payment-method">
                                ${escapeHTML(
                                    payment.toUpperCase()
                                )}
                            </span>
                        </td>

                        <td>
                            ${date}
                        </td>

                        <td>
                            <span class="
                                status
                                ${status.toLowerCase()}
                            ">
                                ${escapeHTML(
                                    status
                                )}
                            </span>
                        </td>

                        <td>
                            <button
                                type="button"
                                class="view-sale-btn"
                                data-id="${sale.id}"
                            >
                                View
                            </button>
                        </td>

                    </tr>
                `;

            }).join("");

        // =================================
        // VIEW BUTTONS
        // =================================

        const viewButtons =
            tbody.querySelectorAll(
                ".view-sale-btn"
            );

        viewButtons.forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const saleId =
                        button.dataset.id;

                    viewSale(saleId);
                }
            );

        });
    }

    // =====================================
    // ESCAPE HTML
    // =====================================

    function escapeHTML(value) {

        if (value === null ||
            value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // =====================================
    // RENDER CHART
    // =====================================

    function renderChart(
        chartData,
        period
    ) {

        if (!salesChart) {
            return;
        }

        const barsContainer =
            salesChart.querySelector(
                ".bars"
            );

        if (!barsContainer) {
            return;
        }

        // ---------------------------------
        // NO DATA
        // ---------------------------------

        if (!chartData.length) {

            barsContainer.innerHTML = `
                <div style="
                    width:100%;
                    text-align:center;
                    padding:40px 10px;
                ">
                    No sales data available.
                </div>
            `;

            return;
        }

        // ---------------------------------
        // FIND MAXIMUM REVENUE
        // ---------------------------------

        const amounts =
            chartData.map(item =>
                Number(
                    item.total_revenue || 0
                )
            );

        const maxAmount =
            Math.max(...amounts, 1);

        // ---------------------------------
        // CREATE BARS
        // ---------------------------------

        barsContainer.innerHTML =
            chartData.map(item => {

                const amount =
                    Number(
                        item.total_revenue || 0
                    );

                const height =
                    amount === 0
                        ? 0
                        : Math.max(
                            (amount /
                                maxAmount) *
                            100,
                            5
                        );

                const date =
                    new Date(
                        item.sale_date
                    );

                let label = "";

                if (
                    period === "monthly"
                ) {

                    label =
                        date.toLocaleDateString(
                            "en-NG",
                            {
                                month: "short",
                                year: "numeric"
                            }
                        );

                } else {

                    label =
                        date.toLocaleDateString(
                            "en-NG",
                            {
                                day: "2-digit",
                                month: "short"
                            }
                        );
                }

                return `
                    <div
                        class="bar-item"
                        title="${formatCurrency(
                            amount
                        )}"
                    >

                        <div
                            class="bar"
                            style="
                                height:${height}%;
                            "
                        ></div>

                        <span>
                            ${label}
                        </span>

                    </div>
                `;

            }).join("");
    }

    // =====================================
    // TABLE ERROR
    // =====================================

    function showTableError(message) {

        if (!reportTable) {
            return;
        }

        const tbody =
            reportTable.querySelector("tbody");

        if (!tbody) {
            return;
        }

        tbody.innerHTML = `
            <tr>
                <td colspan="8"
                    style="
                        text-align:center;
                        padding:30px;
                        color:#b42318;
                    ">
                    ${escapeHTML(message)}
                </td>
            </tr>
        `;
    }

    // =====================================
    // CHART ERROR
    // =====================================

    function showChartError(message) {

        if (!salesChart) {
            return;
        }

        const barsContainer =
            salesChart.querySelector(
                ".bars"
            );

        if (!barsContainer) {
            return;
        }

        barsContainer.innerHTML = `
            <div style="
                width:100%;
                text-align:center;
                padding:40px 10px;
                color:#b42318;
            ">
                ${escapeHTML(message)}
            </div>
        `;
    }

    // =====================================
    // VIEW SALE
    // =====================================

    async function viewSale(saleId) {

        try {

            const data =
                await apiRequest(
                    `/api/sales/${saleId}`
                );

            console.log(
                "SALE DETAILS:",
                data
            );

            if (!data.success) {
                throw new Error(
                    data.message ||
                    "Unable to load sale."
                );
            }

            const sale =
                data.sale || data.data;

            if (!sale) {
                throw new Error(
                    "Sale details not found."
                );
            }

            // ---------------------------------
            // SIMPLE DETAIL VIEW
            // ---------------------------------

            const items = 
              data.items || sale.items || [];

            let itemsHTML = "";

            if (items.length) {

                itemsHTML =
                    items.map(item => {

                        return `
                            <div style="
                                display:flex;
                                justify-content:space-between;
                                gap:15px;
                                padding:8px 0;
                                border-bottom:1px solid #eee;
                            ">

                                <span>
                                    ${escapeHTML(
                                        item.product_name ||
                                        "Product"
                                    )}
                                    ×
                                    ${item.quantity}
                                </span>

                                <strong>
                                    ${formatCurrency(
                                        item.total_price
                                    )}
                                </strong>

                            </div>
                        `;

                    }).join("");

            } else {

                itemsHTML =
                    "<p>No sale items found.</p>";
            }

            // ---------------------------------
            // CREATE MODAL
            // ---------------------------------

            const existingModal =
                document.getElementById(
                    "saleDetailsModal"
                );

            if (existingModal) {
                existingModal.remove();
            }

            const modal =
                document.createElement(
                    "div"
                );

            modal.id =
                "saleDetailsModal";

            modal.style.cssText = `
                position:fixed;
                inset:0;
                background:rgba(0,0,0,.5);
                display:flex;
                align-items:center;
                justify-content:center;
                z-index:9999;
                padding:20px;
            `;

            modal.innerHTML = `
                <div style="
                    background:white;
                    width:100%;
                    max-width:550px;
                    max-height:90vh;
                    overflow-y:auto;
                    border-radius:12px;
                    padding:24px;
                ">

                    <div style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        margin-bottom:20px;
                    ">

                        <h2 style="
                            margin:0;
                        ">
                            Sale Details
                        </h2>

                        <button
                            type="button"
                            id="closeSaleModal"
                            style="
                                border:none;
                                background:none;
                                font-size:24px;
                                cursor:pointer;
                            "
                        >
                            ×
                        </button>

                    </div>

                    <p>
                        <strong>Reference:</strong>
                        ${escapeHTML(
                            sale.sale_reference ||
                            `SALE-${sale.id}`
                        )}
                    </p>

                    <p>
                        <strong>Customer:</strong>
                        ${escapeHTML(
                            sale.customer_name ||
                            "Unknown"
                        )}
                    </p>

                    <p>
                        <strong>Salesperson:</strong>
                        ${escapeHTML(
                            sale.salesperson_name ||
                            "Unknown"
                        )}
                    </p>

                    <p>
                        <strong>Payment:</strong>
                        ${escapeHTML(
                            sale.payment_method ||
                            "-"
                        )}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${escapeHTML(
                            sale.payment_status ||
                            "-"
                        )}
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${formatDate(
                            sale.created_at
                        )}
                    </p>

                    <hr>

                    <h3>Products</h3>

                    ${itemsHTML}

                    <hr>

                    <div style="
                        display:flex;
                        justify-content:space-between;
                        font-size:18px;
                        margin-top:15px;
                    ">

                        <strong>
                            Total
                        </strong>

                        <strong>
                            ${formatCurrency(
                                sale.total_amount
                            )}
                        </strong>

                    </div>

                </div>
            `;

            document.body.appendChild(
                modal
            );

            const closeButton =
                document.getElementById(
                    "closeSaleModal"
                );

            closeButton.addEventListener(
                "click",
                () => modal.remove()
            );

            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target === modal
                    ) {
                        modal.remove();
                    }

                }
            );

        } catch (error) {

            console.error(
                "View sale error:",
                error
            );

            alert(
                error.message ||
                "Unable to load sale details."
            );
        }
    }

    // =====================================
    // FILTER EVENTS
    // =====================================

    if (reportSearch) {

        reportSearch.addEventListener(
            "input",
            debounce(
                loadSales,
                400
            )
        );
    }

    if (reportStatus) {

        reportStatus.addEventListener(
            "change",
            loadSales
        );
    }

    if (paymentFilter) {

        paymentFilter.addEventListener(
            "change",
            loadSales
        );
    }

    if (dateFrom) {

        dateFrom.addEventListener(
            "change",
            loadSales
        );
    }

    if (dateTo) {

        dateTo.addEventListener(
            "change",
            loadSales
        );
    }

    // =====================================
    // WEEKLY / MONTHLY
    // =====================================

    if (chartPeriod) {

        chartPeriod.addEventListener(
            "change",
            loadSales
        );
    }

    // =====================================
    // GENERATE REPORT
    // =====================================

    if (generateReportButton) {

        generateReportButton.addEventListener(
            "click",
            loadSales
        );
    }

    // =====================================
    // PRINT REPORT
    // =====================================

    if (printReportButton) {

        printReportButton.addEventListener(
            "click",
            () => {
                window.print();
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

                    window.location.href =
                        "../index.html";

                } catch (error) {

                    console.error(
                        "Logout error:",
                        error
                    );

                    window.location.href =
                        "../index.html";
                }
            }
        );
    }

    // =====================================
    // DEBOUNCE
    // =====================================

    function debounce(
        functionToCall,
        delay
    ) {

        let timeout;

        return function (...args) {

            clearTimeout(timeout);

            timeout =
                setTimeout(
                    () => {
                        functionToCall(
                            ...args
                        );
                    },
                    delay
                );
        };
    }

    // =====================================
    // INITIAL LOAD
    // =====================================

    loadSales();

});
