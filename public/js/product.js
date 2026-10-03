document.addEventListener("DOMContentLoaded", function () {

    // ================================
    // MOBILE SIDEBAR
    // ================================

    const sidebar = document.getElementById("sidebar");
    const menuButton = document.getElementById("menuButton");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove("active");
        if (sidebarOverlay) sidebarOverlay.classList.remove("active");
    }

    if (menuButton && sidebar && sidebarOverlay) {
        menuButton.addEventListener("click", function () {
            sidebar.classList.add("active");
            sidebarOverlay.classList.add("active");
        });

        sidebarOverlay.addEventListener("click", closeSidebar);
    }


    // ================================
    // NOTIFICATIONS
    // ================================

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


    // ================================
    // PRODUCT ELEMENTS
    // ================================

    const productSearch =
        document.getElementById("productSearch");

    const categoryFilter =
        document.getElementById("categoryFilter");

    const stockFilter =
        document.getElementById("stockFilter");

    const productsTable =
        document.getElementById("productsTable");

    const productsTableBody =
        productsTable
            ? productsTable.querySelector("tbody")
            : null;


    // ================================
    // LOAD PRODUCTS FROM DATABASE
    // ================================

    async function loadProducts() {

        if (!productsTableBody) return;

        productsTableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    Loading products...
                </td>
            </tr>
        `;

        try {

            const response = await fetch("/api/products", {
                method: "GET",
                credentials: "include"
            });

            if (response.status === 401) {
                window.location.href = "../index.html";
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to load products.");
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(
                    data.message || "Failed to load products."
                );
            }

            const products = data.products || [];

            renderProducts(products);

        } catch (error) {

            console.error("Load products error:", error);

            productsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;">
                        Failed to load products.
                    </td>
                </tr>
            `;
        }
    }


    // ================================
    // RENDER PRODUCTS
    // ================================

    function renderProducts(products) {

        if (!productsTableBody) return;

        productsTableBody.innerHTML = "";

        if (products.length === 0) {

            productsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;">
                        No products found.
                    </td>
                </tr>
            `;

            updateStats(products);
            return;
        }


        products.forEach(function (product) {

            const row = document.createElement("tr");

            row.dataset.productId = product.id;
            row.dataset.category = product.category;
            row.dataset.stock = product.status;


            const initials =
                product.product_name
                    .split(" ")
                    .map(word => word.charAt(0))
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();


            const categoryName =
                formatCategory(product.category);


            const price =
                Number(product.selling_price)
                    .toLocaleString("en-NG", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2
                    });


            row.innerHTML = `

                <td>
                    <div class="product-name">

                        <div class="product-image">
                            ${initials}
                        </div>

                        <div>
                            <strong>
                                ${escapeHTML(product.product_name)}
                            </strong>

                            <span>
                                SKU: ${escapeHTML(product.sku)}
                            </span>
                        </div>

                    </div>
                </td>


                <td>
                    ${categoryName}
                </td>


                <td>
                    ₦${price}
                </td>


                <td>
                    ${product.stock_quantity}
                </td>


                <td>

                    <span class="stock-status ${product.status}">
                        ${formatStatus(product.status)}
                    </span>

                </td>


                <td>

                    <div class="action-buttons">

                        <button
                            type="button"
                            class="view-product">
                            View
                        </button>

                    </div>

                </td>

            `;


            const viewButton =
                row.querySelector(".view-product");


            if (viewButton) {

                viewButton.addEventListener(
                    "click",
                    function () {
                        showProductDetails(product);
                    }
                );

            }


            productsTableBody.appendChild(row);

        });


        updateStats(products);

        applyProductFilters();
    }


    // ================================
    // PRODUCT DETAILS
    // ================================

    function showProductDetails(product) {

        alert(
            "Product Details\n\n" +

            "Product: " +
            product.product_name +

            "\n\nSKU: " +
            product.sku +

            "\n\nCategory: " +
            formatCategory(product.category) +

            "\n\nSelling Price: ₦" +
            Number(product.selling_price).toLocaleString("en-NG") +

            "\n\nStock: " +
            product.stock_quantity +

            "\n\nStatus: " +
            formatStatus(product.status)
        );
    }


    // ================================
    // PRODUCT FILTERS
    // ================================

    function applyProductFilters() {

        if (!productsTable) return;

        const searchValue =
            productSearch
                ? productSearch.value.toLowerCase().trim()
                : "";

        const selectedCategory =
            categoryFilter
                ? categoryFilter.value
                : "all";

        const selectedStock =
            stockFilter
                ? stockFilter.value
                : "all";


        const rows =
            productsTable.querySelectorAll("tbody tr");


        rows.forEach(function (row) {

            if (!row.dataset.productId) return;

            const productName =
                row.querySelector(".product-name strong");

            const sku =
                row.querySelector(".product-name span");


            const productText =
                (
                    (productName
                        ? productName.textContent
                        : "") +

                    " " +

                    (sku
                        ? sku.textContent
                        : "")
                ).toLowerCase();


            const rowCategory =
                row.dataset.category || "";


            const rowStock =
                row.dataset.stock || "";


            const matchesSearch =
                productText.includes(searchValue);


            const matchesCategory =
                selectedCategory === "all" ||
                rowCategory === selectedCategory;


            const matchesStock =
                selectedStock === "all" ||
                rowStock === selectedStock;


            row.style.display =
                matchesSearch &&
                matchesCategory &&
                matchesStock
                    ? ""
                    : "none";

        });

    }


    // ================================
    // SEARCH
    // ================================

    if (productSearch) {

        productSearch.addEventListener(
            "input",
            applyProductFilters
        );

    }


    // ================================
    // CATEGORY FILTER
    // ================================

    if (categoryFilter) {

        categoryFilter.addEventListener(
            "change",
            applyProductFilters
        );

    }


    // ================================
    // STOCK FILTER
    // ================================

    if (stockFilter) {

        stockFilter.addEventListener(
            "change",
            applyProductFilters
        );

    }


    // ================================
    // UPDATE SUMMARY CARDS
    // ================================

    function updateStats(products) {

        const totalProducts =
            products.length;


        const inStock =
            products.filter(function (product) {
                return product.status === "in-stock";
            }).length;


        const lowStock =
            products.filter(function (product) {
                return product.status === "low-stock";
            }).length;


        const outOfStock =
            products.filter(function (product) {
                return product.status === "out-of-stock";
            }).length;


        const statCards =
            document.querySelectorAll(".stat-card");


        if (statCards.length >= 4) {

            statCards[0]
                .querySelector("strong")
                .textContent = totalProducts;


            statCards[1]
                .querySelector("strong")
                .textContent = inStock;


            statCards[2]
                .querySelector("strong")
                .textContent = lowStock;


            statCards[3]
                .querySelector("strong")
                .textContent = outOfStock;

        }

    }


    // ================================
    // FORMAT CATEGORY
    // ================================

    function formatCategory(category) {

        const categories = {

            "food": "Food",

            "beverages": "Beverages",

            "household": "Household",

            "personal-care": "Personal Care"

        };

        return categories[category] || category;

    }


    // ================================
    // FORMAT STOCK STATUS
    // ================================

    function formatStatus(status) {

        const statuses = {

            "in-stock": "In Stock",

            "low-stock": "Low Stock",

            "out-of-stock": "Out of Stock"

        };

        return statuses[status] || status;

    }


    // ================================
    // BASIC HTML ESCAPE
    // ================================

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    // ================================
    // LOGOUT
    // ================================

    const logoutButton =
        document.getElementById("logoutButton");


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async function (event) {

                event.preventDefault();

                const confirmLogout =
                    confirm(
                        "Are you sure you want to logout?"
                    );


                if (!confirmLogout) return;


                try {

                    await fetch(
                        "/api/auth/logout",
                        {
                            method: "POST",
                            credentials: "include"
                        }
                    );

                } catch (error) {

                    console.error(
                        "Logout error:",
                        error
                    );

                }


                window.location.href =
                    "../index.html";

            }
        );

    }


    // ================================
    // START
    // ================================

    loadProducts();

});