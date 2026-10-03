document.addEventListener("DOMContentLoaded", function () {

    // ========================================
    // MOBILE SIDEBAR
    // ========================================

    const sidebar =
        document.getElementById("sidebar");

    const menuButton =
        document.getElementById("menuButton");

    const sidebarOverlay =
        document.getElementById("sidebarOverlay");


    if (menuButton && sidebar && sidebarOverlay) {

        menuButton.addEventListener("click", function () {

            sidebar.classList.add("active");
            sidebarOverlay.classList.add("active");

        });

    }


    if (sidebarOverlay && sidebar) {

        sidebarOverlay.addEventListener("click", function () {

            sidebar.classList.remove("active");
            sidebarOverlay.classList.remove("active");

        });

    }


    // ========================================
    // NOTIFICATIONS
    // ========================================

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


    // ========================================
    // PRODUCT ELEMENTS
    // ========================================

    const productsTable =
        document.getElementById("productsTable");

    const productSearch =
        document.getElementById("productSearch");

    const categoryFilter =
        document.getElementById("categoryFilter");

    const stockFilter =
        document.getElementById("stockFilter");


    // ========================================
    // PRODUCT FILTERS
    // ========================================

    function applyProductFilters() {

        if (!productsTable) return;

        const rows =
            productsTable.querySelectorAll("tbody tr");


        const searchValue =
            productSearch
                ? productSearch.value.toLowerCase().trim()
                : "";


        const categoryValue =
            categoryFilter
                ? categoryFilter.value
                : "all";


        const stockValue =
            stockFilter
                ? stockFilter.value
                : "all";


        rows.forEach(function (row) {

            const rowText =
                row.textContent.toLowerCase();


            const rowCategory =
                row.dataset.category || "";


            const rowStock =
                row.dataset.stock || "";


            const matchesSearch =
                rowText.includes(searchValue);


            const matchesCategory =
                categoryValue === "all" ||
                rowCategory === categoryValue;


            const matchesStock =
                stockValue === "all" ||
                rowStock === stockValue;


            if (
                matchesSearch &&
                matchesCategory &&
                matchesStock
            ) {

                row.style.display = "";

            } else {

                row.style.display = "none";

            }

        });

    }


    if (productSearch) {

        productSearch.addEventListener(
            "input",
            applyProductFilters
        );

    }


    if (categoryFilter) {

        categoryFilter.addEventListener(
            "change",
            applyProductFilters
        );

    }


    if (stockFilter) {

        stockFilter.addEventListener(
            "change",
            applyProductFilters
        );

    }


    // ========================================
    // VIEW PRODUCT
    // ========================================

    function attachViewButtons() {

        const viewButtons =
            document.querySelectorAll(".view-product");


        viewButtons.forEach(function (button) {

            if (
                button.dataset.viewAttached === "true"
            ) {

                return;

            }


            button.dataset.viewAttached = "true";


            button.addEventListener("click", function () {

                const row =
                    this.closest("tr");


                if (!row) return;


                const nameElement =
                    row.querySelector(
                        ".product-name strong"
                    );


                const skuElement =
                    row.querySelector(
                        ".product-name span"
                    );


                if (!nameElement || !skuElement) {

                    return;

                }


                const productName =
                    nameElement.textContent.trim();


                const sku =
                    skuElement.textContent
                        .replace("SKU:", "")
                        .trim();


                const category =
                    row.querySelector(
                        "td:nth-child(2)"
                    ).textContent.trim();


                const price =
                    row.querySelector(
                        "td:nth-child(3)"
                    ).textContent.trim();


                const stock =
                    row.querySelector(
                        "td:nth-child(4)"
                    ).textContent.trim();


                const status =
                    row.querySelector(
                        "td:nth-child(5)"
                    ).textContent.trim();


                alert(
                    "Product Details\n\n" +
                    "Product: " + productName + "\n" +
                    "SKU: " + sku + "\n" +
                    "Category: " + category + "\n" +
                    "Selling Price: " + price + "\n" +
                    "Stock: " + stock + "\n" +
                    "Status: " + status
                );

            });

        });

    }


    // ========================================
    // EDIT PRODUCT
    // ========================================

    const editProductModal =
        document.getElementById("editProductModal");


    const closeEditProductModal =
        document.getElementById(
            "closeEditProductModal"
        );


    const cancelEditProduct =
        document.getElementById(
            "cancelEditProduct"
        );


    const editProductForm =
        document.getElementById(
            "editProductForm"
        );


    let currentEditingRow = null;


    // ========================================
    // OPEN EDIT MODAL
    // ========================================

    function openEditProductModal(button) {

        if (!editProductModal) return;


        const row =
            button.closest("tr");


        if (!row) return;


        currentEditingRow = row;


        const productId =
            row.dataset.productId;


        if (!productId) {

            alert("Product ID not found.");

            return;

        }


        const productName =
            row.querySelector(
                ".product-name strong"
            ).textContent.trim();


        const sku =
            row.querySelector(
                ".product-name span"
            ).textContent
                .replace("SKU:", "")
                .trim();


        const category =
            row.dataset.category || "food";


        const priceText =
            row.querySelector(
                "td:nth-child(3)"
            ).textContent
                .replace("₦", "")
                .replace(/,/g, "")
                .trim();


        const stock =
            row.querySelector(
                "td:nth-child(4)"
            ).textContent.trim();


        const lowStockLimit =
            row.dataset.lowStockLimit || 10;


        document.getElementById(
            "editProductName"
        ).value = productName;


        document.getElementById(
            "editProductSku"
        ).value = sku;


        document.getElementById(
            "editProductCategory"
        ).value = category;


        document.getElementById(
            "editProductPrice"
        ).value = Number(priceText) || 0;


        document.getElementById(
            "editProductStock"
        ).value = Number(stock) || 0;


        document.getElementById(
            "editLowStockLimit"
        ).value = Number(lowStockLimit) || 0;


        editProductModal.classList.add("active");

    }


    // ========================================
    // ATTACH EDIT BUTTONS
    // ========================================

    function attachEditButtons() {

        const editButtons =
            document.querySelectorAll(
                ".edit-product"
            );


        editButtons.forEach(function (button) {

            if (
                button.dataset.editAttached === "true"
            ) {

                return;

            }


            button.dataset.editAttached = "true";


            button.addEventListener(
                "click",
                function () {

                    openEditProductModal(this);

                }
            );

        });

    }


    // ========================================
    // CLOSE EDIT MODAL
    // ========================================

    function closeEditProductModalWindow() {

        if (editProductModal) {

            editProductModal.classList.remove(
                "active"
            );

        }


        currentEditingRow = null;

    }


    if (closeEditProductModal) {

        closeEditProductModal.addEventListener(
            "click",
            closeEditProductModalWindow
        );

    }


    if (cancelEditProduct) {

        cancelEditProduct.addEventListener(
            "click",
            closeEditProductModalWindow
        );

    }


    if (editProductModal) {

        editProductModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === editProductModal
                ) {

                    closeEditProductModalWindow();

                }

            }
        );

    }


    // ========================================
    // SAVE EDITED PRODUCT
    // ========================================

    if (editProductForm) {

        editProductForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                if (!currentEditingRow) {

                    alert("No product selected.");

                    return;

                }


                const productId =
                    currentEditingRow.dataset.productId;


                if (!productId) {

                    alert("Product ID not found.");

                    return;

                }


                const productName =
                    document.getElementById(
                        "editProductName"
                    ).value.trim();


                const sku =
                    document.getElementById(
                        "editProductSku"
                    ).value.trim();


                const category =
                    document.getElementById(
                        "editProductCategory"
                    ).value;


                const price =
                    Number(
                        document.getElementById(
                            "editProductPrice"
                        ).value
                    );


                const stock =
                    Number(
                        document.getElementById(
                            "editProductStock"
                        ).value
                    );


                const lowStockLimit =
                    Number(
                        document.getElementById(
                            "editLowStockLimit"
                        ).value
                    );


                // VALIDATION

                if (
                    !productName ||
                    !sku ||
                    !category ||
                    !Number.isFinite(price) ||
                    !Number.isFinite(stock) ||
                    !Number.isFinite(lowStockLimit)
                ) {

                    alert(
                        "Please complete all product fields."
                    );

                    return;

                }


                if (
                    price < 0 ||
                    stock < 0 ||
                    lowStockLimit < 0
                ) {

                    alert(
                        "Price and stock values cannot be negative."
                    );

                    return;

                }


                try {

                    const response =
                        await fetch(
                            `/api/products/${productId}`,
                            {
                                method: "PUT",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                credentials: "include",

                                body: JSON.stringify({

                                    product_name:
                                        productName,

                                    sku:
                                        sku,

                                    category:
                                        category,

                                    selling_price:
                                        price,

                                    stock_quantity:
                                        stock,

                                    low_stock_limit:
                                        lowStockLimit

                                })

                            }
                        );


                    const data =
                        await response.json();


                    if (response.status === 401) {

                        window.location.href =
                            "/pages/index.html";

                        return;

                    }


                    if (response.status === 403) {

                        alert(
                            data.message ||
                            "Only a Director can edit products."
                        );

                        return;

                    }


                    if (!response.ok) {

                        alert(
                            data.message ||
                            "Failed to update product."
                        );

                        return;

                    }


                    alert(
                        "Product updated successfully."
                    );


                    closeEditProductModalWindow();


                    await loadProducts();

                } catch (error) {

                    console.error(
                        "Update product error:",
                        error
                    );


                    alert(
                        "Unable to connect to the server."
                    );

                }

            }
        );

    }


   // ========================================
// DELETE PRODUCT
// ========================================

function attachDeleteButtons() {

    const deleteButtons =
        document.querySelectorAll(".delete-product");


    deleteButtons.forEach(function (button) {

        if (
            button.dataset.deleteAttached === "true"
        ) {

            return;

        }


        button.dataset.deleteAttached = "true";


        button.addEventListener(
            "click",
            async function () {

                const row =
                    this.closest("tr");


                if (!row) return;


                const productId =
                    row.dataset.productId;


                if (!productId) {

                    alert("Product ID not found.");

                    return;

                }


                const nameElement =
                    row.querySelector(
                        ".product-name strong"
                    );


                if (!nameElement) return;


                const productName =
                    nameElement.textContent.trim();


                const confirmDelete =
                    confirm(
                        "Are you sure you want to delete " +
                        productName +
                        "?"
                    );


                if (!confirmDelete) {

                    return;

                }


                try {

                    const response =
                        await fetch(
                            `/api/products/${productId}`,
                            {
                                method: "DELETE",

                                credentials: "include"
                            }
                        );


                    const data =
                        await response.json();


                    if (response.status === 401) {

                        window.location.href =
                            "/pages/index.html";

                        return;

                    }


                    if (response.status === 403) {

                        alert(
                            data.message ||
                            "Only a Director can delete products."
                        );

                        return;

                    }


                    if (!response.ok) {

                        alert(
                            data.message ||
                            "Failed to delete product."
                        );

                        return;

                    }


                    alert(
                        productName +
                        " has been deleted successfully."
                    );


                    // Reload from PostgreSQL
                    await loadProducts();


                } catch (error) {

                    console.error(
                        "Delete product error:",
                        error
                    );


                    alert(
                        "Unable to connect to the server."
                    );

                }

            }
        );

    });

}

    // ========================================
    // ATTACH PRODUCT BUTTONS
    // ========================================

    function attachProductButtons() {

        attachViewButtons();

        attachEditButtons();

        attachDeleteButtons();

    }


    // ========================================
    // LOAD PRODUCTS FROM DATABASE
    // ========================================

    async function loadProducts() {

        try {

            const response =
                await fetch(
                    "/api/products",
                    {
                        method: "GET",
                        credentials: "include"
                    }
                );


            if (response.status === 401) {

                window.location.href =
                    "/pages/index.html";

                return;

            }


            if (response.status === 403) {

                alert(
                    "You do not have permission to view products."
                );

                return;

            }


            if (!response.ok) {

                throw new Error(
                    "Failed to load products."
                );

            }


            const data =
                await response.json();


            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Failed to load products."
                );

            }


            const tableBody =
                document.querySelector(
                    "#productsTable tbody"
                );


            if (!tableBody) return;


            tableBody.innerHTML = "";


            data.products.forEach(
                function (product) {

                    const row =
                        document.createElement("tr");


                    // Store database values on the row
                    row.dataset.productId =
                        product.id;


                    row.dataset.category =
                        product.category;


                    row.dataset.stock =
                        product.status;


                    row.dataset.lowStockLimit =
                        product.low_stock_limit;


                    // Product initials

                    const initials =
                        product.product_name
                            .split(" ")
                            .slice(0, 2)
                            .map(
                                function (word) {

                                    return word
                                        .charAt(0);

                                }
                            )
                            .join("")
                            .toUpperCase();


                    // Category names

                    const categoryNames = {

                        "food":
                            "Food",

                        "beverages":
                            "Beverages",

                        "household":
                            "Household",

                        "personal-care":
                            "Personal Care"

                    };


                    const categoryName =
                        categoryNames[
                            product.category
                        ] ||
                        product.category;


                    // Stock status

                    let stockStatus = "";

                    let stockClass = "";


                    if (
                        product.status ===
                        "out-of-stock"
                    ) {

                        stockStatus =
                            "Out of Stock";

                        stockClass =
                            "out-of-stock";

                    } else if (
                        product.status ===
                        "low-stock"
                    ) {

                        stockStatus =
                            "Low Stock";

                        stockClass =
                            "low-stock";

                    } else {

                        stockStatus =
                            "In Stock";

                        stockClass =
                            "in-stock";

                    }


                    // Build table row

                    row.innerHTML = `

                        <td>

                            <div class="product-name">

                                <div class="product-image">
                                    ${initials}
                                </div>

                                <div>

                                    <strong>
                                        ${product.product_name}
                                    </strong>

                                    <span>
                                        SKU: ${product.sku}
                                    </span>

                                </div>

                            </div>

                        </td>


                        <td>
                            ${categoryName}
                        </td>


                        <td>
                            ₦${Number(
                                product.selling_price
                            ).toLocaleString("en-NG")}
                        </td>


                        <td>
                            ${product.stock_quantity}
                        </td>


                        <td>

                            <span
                                class="stock-status ${stockClass}"
                            >
                                ${stockStatus}
                            </span>

                        </td>


                        <td>

                            <div class="action-buttons">

                                <button
                                    type="button"
                                    class="view-product"
                                >
                                    View
                                </button>


                                <button
                                    type="button"
                                    class="edit-product"
                                >
                                    Edit
                                </button>


                                <button
                                    type="button"
                                    class="delete-product"
                                >
                                    Delete
                                </button>

                            </div>

                        </td>

                    `;


                    tableBody.appendChild(row);

                }
            );


            attachProductButtons();

            applyProductFilters();


            console.log(
                "Products loaded successfully:",
                data.products
            );


        } catch (error) {

            console.error(
                "Load products error:",
                error
            );


            alert(
                "Unable to load products from the server."
            );

        }

    }


    // ========================================
    // ADD PRODUCT MODAL
    // ========================================

    const addProductButton =
        document.getElementById(
            "addProductButton"
        );


    const productModal =
        document.getElementById(
            "productModal"
        );


    const closeProductModal =
        document.getElementById(
            "closeProductModal"
        );


    const cancelProduct =
        document.getElementById(
            "cancelProduct"
        );


    const productForm =
        document.getElementById(
            "productForm"
        );


    // ========================================
    // OPEN ADD PRODUCT MODAL
    // ========================================

    if (
        addProductButton &&
        productModal
    ) {

        addProductButton.addEventListener(
            "click",
            function () {

                productModal.classList.add(
                    "active"
                );

            }
        );

    }


    // ========================================
    // CLOSE ADD PRODUCT MODAL
    // ========================================

    function closeProductModalWindow() {

        if (productModal) {

            productModal.classList.remove(
                "active"
            );

        }

    }


    if (closeProductModal) {

        closeProductModal.addEventListener(
            "click",
            closeProductModalWindow
        );

    }


    if (cancelProduct) {

        cancelProduct.addEventListener(
            "click",
            closeProductModalWindow
        );

    }


    if (productModal) {

        productModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === productModal
                ) {

                    closeProductModalWindow();

                }

            }
        );

    }


    // ========================================
    // ADD NEW PRODUCT TO DATABASE
    // ========================================

    if (productForm) {

        productForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const productName =
                    document.getElementById(
                        "productName"
                    ).value.trim();


                const productSku =
                    document.getElementById(
                        "productSku"
                    ).value.trim();


                const category =
                    document.getElementById(
                        "productCategory"
                    ).value;


                const price =
                    Number(
                        document.getElementById(
                            "productPrice"
                        ).value
                    );


                const stock =
                    Number(
                        document.getElementById(
                            "productStock"
                        ).value
                    );


                const lowStockLimit =
                    Number(
                        document.getElementById(
                            "lowStockLimit"
                        ).value
                    );


                // VALIDATION

                if (
                    !productName ||
                    !productSku ||
                    !category ||
                    !Number.isFinite(price) ||
                    !Number.isFinite(stock) ||
                    !Number.isFinite(lowStockLimit) ||
                    price < 0 ||
                    stock < 0 ||
                    lowStockLimit < 0
                ) {

                    alert(
                        "Please complete all product fields."
                    );

                    return;

                }


                try {

                    const response =
                        await fetch(
                            "/api/products",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                credentials: "include",

                                body: JSON.stringify({

                                    product_name:
                                        productName,

                                    sku:
                                        productSku,

                                    category:
                                        category,

                                    selling_price:
                                        price,

                                    stock_quantity:
                                        stock,

                                    low_stock_limit:
                                        lowStockLimit

                                })

                            }
                        );


                    if (response.status === 401) {

                        window.location.href =
                            "/pages/index.html";

                        return;

                    }


                    if (response.status === 403) {

                        alert(
                            "Only a Director can add products."
                        );

                        return;

                    }


                    const data =
                        await response.json();


                    if (
                        !response.ok ||
                        !data.success
                    ) {

                        alert(
                            data.message ||
                            "Failed to add product."
                        );

                        return;

                    }


                    alert(
                        productName +
                        " has been added successfully."
                    );


                    productForm.reset();


                    closeProductModalWindow();


                    await loadProducts();


                } catch (error) {

                    console.error(
                        "Add product error:",
                        error
                    );


                    alert(
                        "Unable to connect to the server."
                    );

                }

            }
        );

    }


    // ========================================
    // INITIAL LOAD
    // ========================================

    loadProducts();

});
