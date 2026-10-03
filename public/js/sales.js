document.addEventListener("DOMContentLoaded", function () {

    // =========================================
    // ELEMENTS
    // =========================================

    const sidebar = document.getElementById("sidebar");
    const menuButton = document.getElementById("menuButton");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    const notificationButton =
        document.getElementById("notificationButton");

    const notificationPanel =
        document.getElementById("notificationPanel");

    const closeNotifications =
        document.getElementById("closeNotifications");

    const newSaleButton =
        document.getElementById("newSaleButton");

    const saleModal =
        document.getElementById("saleModal");

    const closeSaleModal =
        document.getElementById("closeSaleModal");

    const cancelSale =
        document.getElementById("cancelSale");

    const saleForm =
        document.getElementById("saleForm");


    // =========================================
    // CUSTOMER ELEMENTS
    // =========================================

    const customerInput =
        document.getElementById("customerInput");

    const customerHidden =
        document.getElementById("customer");

    const customerSuggestions =
        document.getElementById("customerSuggestions");

    const addCustomerButton =
        document.getElementById("addCustomerButton");


    // =========================================
    // NEW CUSTOMER ELEMENTS
    // =========================================

    const newCustomerForm =
        document.getElementById("newCustomerForm");

    const newCustomerName =
        document.getElementById("newCustomerName");

    const newCustomerPhone =
        document.getElementById("newCustomerPhone");

    const newCustomerEmail =
        document.getElementById("newCustomerEmail");

    const newCustomerAddress =
        document.getElementById("newCustomerAddress");

    const saveNewCustomer =
        document.getElementById("saveNewCustomer");

    const cancelNewCustomer =
        document.getElementById("cancelNewCustomer");


    // =========================================
    // PRODUCT ELEMENTS
    // =========================================

    const saleItems =
        document.getElementById("saleItems");

    const addSaleItem =
        document.getElementById("addSaleItem");

    const saleTotal =
        document.getElementById("saleTotal");

    const paymentMethod =
        document.getElementById("paymentMethod");


    // =========================================
    // SALES TABLE
    // =========================================

    const table =
        document.getElementById("salesTable");

    const tableBody =
        table
            ? table.querySelector("tbody")
            : null;


    // =========================================
    // DATA
    // =========================================

    let products = [];
    let customers = [];
    let sales = [];


    // =========================================
    // MOBILE SIDEBAR
    // =========================================

    if (
        menuButton &&
        sidebar &&
        sidebarOverlay
    ) {

        menuButton.addEventListener(
            "click",
            function () {

                sidebar.classList.add("active");

                sidebarOverlay.classList.add(
                    "active"
                );

            }
        );

    }


    if (
        sidebarOverlay &&
        sidebar
    ) {

        sidebarOverlay.addEventListener(
            "click",
            function () {

                sidebar.classList.remove(
                    "active"
                );

                sidebarOverlay.classList.remove(
                    "active"
                );

            }
        );

    }


    // =========================================
    // NOTIFICATIONS
    // =========================================

    if (
        notificationButton &&
        notificationPanel
    ) {

        notificationButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                notificationPanel.classList.toggle(
                    "active"
                );

            }
        );

    }


    if (
        closeNotifications &&
        notificationPanel
    ) {

        closeNotifications.addEventListener(
            "click",
            function () {

                notificationPanel.classList.remove(
                    "active"
                );

            }
        );

    }


    // Close notification panel
    document.addEventListener(
        "click",
        function (event) {

            if (
                notificationPanel &&
                notificationButton &&
                !notificationPanel.contains(
                    event.target
                ) &&
                !notificationButton.contains(
                    event.target
                )
            ) {

                notificationPanel.classList.remove(
                    "active"
                );

            }

        }
    );


    // =========================================
    // API HELPER
    // =========================================

    async function apiRequest(
        url,
        options = {}
    ) {

        const response =
            await fetch(
                url,
                {
                    credentials: "include",
                    ...options,

                    headers: {
                        "Content-Type":
                            "application/json",

                        ...(options.headers || {})
                    }
                }
            );


        let data = {};


        try {

            data =
                await response.json();

        } catch (error) {

            data = {};

        }


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Request failed"
            );

        }


        return data;

    }


    // =========================================
    // ESCAPE HTML
    // =========================================

    function escapeHtml(value) {

        const div =
            document.createElement("div");


        div.textContent =
            value == null
                ? ""
                : String(value);


        return div.innerHTML;

    }


    // =========================================
    // LOAD CUSTOMERS
    // =========================================

    async function loadCustomers() {

        try {

            const data =
                await apiRequest(
                    "/api/customers"
                );


            customers =
                data.customers || [];


            console.log(
                "Customers loaded:",
                customers
            );

        } catch (error) {

            console.error(
                "Error loading customers:",
                error
            );

            alert(
                "Unable to load customers."
            );

        }

    }


    // =========================================
    // CUSTOMER AUTOCOMPLETE
    // =========================================

    function showCustomerSuggestions() {

        if (
            !customerSuggestions ||
            !customerInput
        ) {

            return;

        }


        const searchValue =
            customerInput.value
                .trim()
                .toLowerCase();


        customerSuggestions.innerHTML =
            "";


        if (!searchValue) {

            customerSuggestions.classList.remove(
                "active"
            );

            return;

        }


        const matches =
            customers
                .filter(
                    function (customer) {

                        return customer.is_active;

                    }
                )
                .filter(
                    function (customer) {

                        const name =
                            String(
                                customer.full_name ||
                                ""
                            ).toLowerCase();


                        const phone =
                            String(
                                customer.phone ||
                                ""
                            ).toLowerCase();


                        return (
                            name.includes(
                                searchValue
                            ) ||
                            phone.includes(
                                searchValue
                            )
                        );
                    }
                )
                .slice(0, 8);


        if (matches.length === 0) {

            customerSuggestions.innerHTML = `
                <div class="no-customer">
                    No matching customer found.
                </div>
            `;


            customerSuggestions.classList.add(
                "active"
            );


            return;

        }


        matches.forEach(
            function (customer) {

                const suggestion =
                    document.createElement(
                        "div"
                    );


                suggestion.className =
                    "customer-suggestion";


                suggestion.innerHTML = `
                    <strong>
                        ${escapeHtml(
                            customer.full_name
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            customer.phone
                        )}
                    </span>
                `;


                suggestion.addEventListener(
                    "click",
                    function () {

                        customerInput.value =
                            customer.full_name;


                        customerHidden.value =
                            customer.id;


                        customerSuggestions.innerHTML =
                            "";


                        customerSuggestions.classList.remove(
                            "active"
                        );

                    }
                );


                customerSuggestions.appendChild(
                    suggestion
                );

            }
        );


        customerSuggestions.classList.add(
            "active"
        );

    }


    // Customer typing
    if (customerInput) {

        customerInput.addEventListener(
            "input",
            function () {

                // Typing again clears
                // previous customer selection.
                if (customerHidden) {

                    customerHidden.value =
                        "";

                }


                showCustomerSuggestions();

            }
        );


        customerInput.addEventListener(
            "focus",
            function () {

                showCustomerSuggestions();

            }
        );

    }


    // Close customer suggestions
    document.addEventListener(
        "click",
        function (event) {

            if (
                customerInput &&
                customerSuggestions &&
                !customerInput.contains(
                    event.target
                ) &&
                !customerSuggestions.contains(
                    event.target
                )
            ) {

                customerSuggestions.classList.remove(
                    "active"
                );

            }

        }
    );


    // =========================================
    // ADD NEW CUSTOMER
    // =========================================

    if (
        addCustomerButton &&
        newCustomerForm
    ) {

        addCustomerButton.addEventListener(
            "click",
            function () {

                newCustomerForm.classList.add(
                    "active"
                );


                if (newCustomerName) {

                    newCustomerName.focus();

                }

            }
        );

    }


    // Cancel new customer
    if (cancelNewCustomer) {

        cancelNewCustomer.addEventListener(
            "click",
            function () {

                newCustomerForm.classList.remove(
                    "active"
                );

            }
        );

    }


    // Save new customer
    if (saveNewCustomer) {

        saveNewCustomer.addEventListener(
            "click",
            async function () {

                const fullName =
                    newCustomerName.value.trim();


                const phone =
                    newCustomerPhone.value.trim();


                const email =
                    newCustomerEmail.value.trim();


                const address =
                    newCustomerAddress.value.trim();


                if (!fullName) {

                    alert(
                        "Please enter the customer's name."
                    );


                    newCustomerName.focus();

                    return;

                }


                if (!phone) {

                    alert(
                        "Please enter the customer's phone number."
                    );


                    newCustomerPhone.focus();

                    return;

                }


                try {

                    saveNewCustomer.disabled =
                        true;


                    saveNewCustomer.textContent =
                        "Saving...";


                    const data =
                        await apiRequest(
                            "/api/customers",
                            {
                                method: "POST",

                                body:
                                    JSON.stringify({
                                        full_name:
                                            fullName,

                                        phone:
                                            phone,

                                        email:
                                            email ||
                                            null,

                                        address:
                                            address ||
                                            null
                                    })
                            }
                        );


                    const newCustomer =
                        data.customer;


                    if (!newCustomer) {

                        throw new Error(
                            "Customer was created but no customer data was returned."
                        );

                    }


                    // Add to local customer list
                    customers.push(
                        newCustomer
                    );


                    // Automatically select
                    // the newly created customer.
                    customerInput.value =
                        newCustomer.full_name;


                    customerHidden.value =
                        newCustomer.id;


                    // Close form
                    newCustomerForm.classList.remove(
                        "active"
                    );


                    // Clear form
                    newCustomerName.value =
                        "";

                    newCustomerPhone.value =
                        "";

                    newCustomerEmail.value =
                        "";

                    newCustomerAddress.value =
                        "";


                    alert(
                        "Customer added successfully."
                    );

                } catch (error) {

                    console.error(
                        "Error adding customer:",
                        error
                    );


                    alert(
                        error.message ||
                        "Unable to add customer."
                    );

                } finally {

                    saveNewCustomer.disabled =
                        false;


                    saveNewCustomer.textContent =
                        "Save Customer";

                }

            }
        );

    }


    // =========================================
    // LOAD PRODUCTS
    // =========================================

    async function loadProducts() {

        try {

            const data =
                await apiRequest(
                    "/api/products"
                );


            products =
                data.products || [];


            populateProductSelects();

        } catch (error) {

            console.error(
                "Error loading products:",
                error
            );


            alert(
                "Unable to load products."
            );

        }

    }


    // =========================================
    // CREATE PRODUCT OPTIONS
    // =========================================

    function createProductOptions() {

        let html = `
            <option value="">
                Select Product
            </option>
        `;


        products
            .filter(
                function (product) {

                    return (
                        product.is_active &&
                        Number(
                            product.stock_quantity
                        ) > 0
                    );

                }
            )
            .forEach(
                function (product) {

                    html += `
                        <option
                            value="${product.id}"
                            data-price="${Number(
                                product.selling_price
                            )}"
                            data-stock="${Number(
                                product.stock_quantity
                            )}"
                        >
                            ${escapeHtml(
                                product.product_name
                            )}
                            — ₦${Number(
                                product.selling_price
                            ).toLocaleString(
                                "en-NG"
                            )}
                            (Stock: ${Number(
                                product.stock_quantity
                            )})
                        </option>
                    `;

                }
            );


        return html;

    }


    // =========================================
    // POPULATE PRODUCT SELECTS
    // =========================================

    function populateProductSelects() {

        if (!saleItems) {

            return;

        }


        const selects =
            saleItems.querySelectorAll(
                ".sale-product"
            );


        selects.forEach(
            function (select) {

                const currentValue =
                    select.value;


                select.innerHTML =
                    createProductOptions();


                if (
                    currentValue &&
                    select.querySelector(
                        `option[value="${currentValue}"]`
                    )
                ) {

                    select.value =
                        currentValue;

                }

            }
        );

    }


    // =========================================
    // NEW SALE MODAL
    // =========================================

    if (
        newSaleButton &&
        saleModal
    ) {

        newSaleButton.addEventListener(
            "click",
            async function () {

                saleModal.classList.add(
                    "active"
                );


                await Promise.all([
                    loadCustomers(),
                    loadProducts()
                ]);


                calculateSaleTotal();

            }
        );

    }


    // Close sale modal
    if (
        closeSaleModal &&
        saleModal
    ) {

        closeSaleModal.addEventListener(
            "click",
            function () {

                saleModal.classList.remove(
                    "active"
                );

            }
        );

    }


    // Cancel sale
    if (
        cancelSale &&
        saleModal
    ) {

        cancelSale.addEventListener(
            "click",
            function () {

                saleModal.classList.remove(
                    "active"
                );

            }
        );

    }


    // Click outside modal
    if (saleModal) {

        saleModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    saleModal
                ) {

                    saleModal.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    // =========================================
    // CALCULATE FINAL TOTAL
    // =========================================

    function calculateSaleTotal() {

        if (
            !saleItems ||
            !saleTotal
        ) {

            return;

        }


        let total = 0;


        const items =
            saleItems.querySelectorAll(
                ".sale-item"
            );


        items.forEach(
            function (item) {

                const productSelect =
                    item.querySelector(
                        ".sale-product"
                    );


                const quantityInput =
                    item.querySelector(
                        ".sale-quantity"
                    );


                if (
                    !productSelect ||
                    !quantityInput
                ) {

                    return;

                }


                const selectedOption =
                    productSelect.options[
                        productSelect.selectedIndex
                    ];


                if (
                    !selectedOption ||
                    !selectedOption.value
                ) {

                    return;

                }


                const price =
                    Number(
                        selectedOption.dataset.price
                    ) || 0;


                const quantity =
                    Number(
                        quantityInput.value
                    ) || 0;


                total +=
                    price * quantity;

            }
        );


        saleTotal.textContent =
            "₦" +
            total.toLocaleString(
                "en-NG"
            );

    }


    // =========================================
    // UPDATE PRODUCT STOCK LIMIT
    // =========================================

  function updateProductStock(item) {

    const productSelect =
        item.querySelector(".sale-product");

    const quantityInput =
        item.querySelector(".sale-quantity");

    if (
        !productSelect ||
        !quantityInput
    ) {
        return;
    }

    const option =
        productSelect.options[
            productSelect.selectedIndex
        ];

    if (
        !option ||
        !option.value
    ) {
        quantityInput.removeAttribute("max");
        return;
    }

    const stock =
        Number(option.dataset.stock) || 0;

    // Do not use the HTML max attribute.
    // JavaScript will enforce the stock limit.
    quantityInput.removeAttribute("max");

    // Set default quantity only when empty.
    if (quantityInput.value === "") {
        quantityInput.value = "1";
    }

    // If existing quantity exceeds stock,
    // correct it.
    if (
        Number(quantityInput.value) > stock
    ) {

        quantityInput.value = stock;

        alert(
            `Only ${stock} units are available.`
        );
    }
}

    // =========================================
    // VALIDATE QUANTITY
    // =========================================

 function validateQuantity(item) {

    const productSelect =
        item.querySelector(".sale-product");

    const quantityInput =
        item.querySelector(".sale-quantity");

    if (
        !productSelect ||
        !quantityInput
    ) {
        return;
    }

    const option =
        productSelect.options[
            productSelect.selectedIndex
        ];

    if (
        !option ||
        !option.value
    ) {
        return;
    }

    const stock =
        Number(option.dataset.stock) || 0;

    // Allow the user to temporarily clear the field.
    if (quantityInput.value === "") {
        return;
    }

    let quantity =
        Number(quantityInput.value);

    if (!Number.isFinite(quantity)) {
        return;
    }

    // Do not allow zero or negative quantity.
    if (quantity < 1) {

        quantity = 1;

        quantityInput.value =
            quantity;
    }

    // Do not allow quantity above available stock.
    if (quantity > stock) {

        quantity = stock;

        quantityInput.value =
            quantity;

        alert(
            `Only ${stock} units are available.`
        );
    }
}


    // =========================================
    // ADD SALE ITEM
    // =========================================

    if (
        addSaleItem &&
        saleItems
    ) {

        addSaleItem.addEventListener(
            "click",
            function () {

                const newItem =
                    document.createElement(
                        "div"
                    );


                newItem.className =
                    "sale-item";


                newItem.innerHTML = `
                    <div class="form-group">

                        <label>
                            Product
                        </label>

                        <select
                            class="sale-product"
                            required
                        >
                            ${createProductOptions()}
                        </select>

                    </div>


                    <div class="form-group">

                        <label>
                            Quantity
                        </label>

                        <input
                            type="number"
                            class="sale-quantity"
                            min="1"
                            value="1"
                            required
                        >

                    </div>


                    <button
                        type="button"
                        class="remove-item-button"
                    >
                        ×
                    </button>
                `;


                saleItems.appendChild(
                    newItem
                );


                calculateSaleTotal();

            }
        );

    }

// =========================================
// SALE ITEM EVENTS
// =========================================

if (saleItems) {

    // Select quantity when the field receives focus
    saleItems.addEventListener(
        "focus",
        function (event) {

            if (
                event.target.classList.contains(
                    "sale-quantity"
                )
            ) {

                event.target.select();

            }

        },
        true
    );


    // Quantity typing
    saleItems.addEventListener(
        "input",
        function (event) {

            if (
                event.target.classList.contains(
                    "sale-quantity"
                )
            ) {

                calculateSaleTotal();

            }

        }
    );


        // Product selection
        saleItems.addEventListener(
            "change",
            function (event) {

                const item =
                    event.target.closest(
                        ".sale-item"
                    );


                if (
                    item &&
                    event.target.classList.contains(
                        "sale-product"
                    )
                ) {

                    updateProductStock(
                        item
                    );

                }


                calculateSaleTotal();

            }
        );


        // Remove product
        saleItems.addEventListener(
            "click",
            function (event) {

                if (
                    !event.target.classList.contains(
                        "remove-item-button"
                    )
                ) {

                    return;

                }


                const items =
                    saleItems.querySelectorAll(
                        ".sale-item"
                    );


                if (items.length <= 1) {

                    alert(
                        "A sale must contain at least one product."
                    );

                    return;

                }


                const item =
                    event.target.closest(
                        ".sale-item"
                    );


                if (item) {

                    item.remove();

                }


                calculateSaleTotal();

            }
        );

    }


    // =========================================
    // RECORD SALE
    // =========================================

    if (saleForm) {

        saleForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                // ---------------------------------
                // CUSTOMER VALIDATION
                // ---------------------------------

                if (
                    !customerHidden ||
                    !customerHidden.value
                ) {

                    alert(
                        "Please select a customer from the suggestions."
                    );


                    if (customerInput) {

                        customerInput.focus();

                    }


                    return;

                }


                // ---------------------------------
                // PAYMENT VALIDATION
                // ---------------------------------

                if (
                    !paymentMethod ||
                    !paymentMethod.value
                ) {

                    alert(
                        "Please select a payment method."
                    );


                    if (paymentMethod) {

                        paymentMethod.focus();

                    }


                    return;

                }


                // ---------------------------------
                // SALE ITEMS
                // ---------------------------------

                if (!saleItems) {

                    alert(
                        "Sale items are missing."
                    );

                    return;

                }


                const itemElements =
                    saleItems.querySelectorAll(
                        ".sale-item"
                    );


                const items = [];


                for (
                    const item
                    of itemElements
                ) {

                    const productSelect =
                        item.querySelector(
                            ".sale-product"
                        );


                    const quantityInput =
                        item.querySelector(
                            ".sale-quantity"
                        );


                    if (
                        !productSelect ||
                        !quantityInput
                    ) {

                        continue;

                    }


                    const productId =
                        Number(
                            productSelect.value
                        );


                    const quantity =
                        Number(
                            quantityInput.value
                        );


                    if (
                        !Number.isInteger(
                            productId
                        ) ||
                        !Number.isInteger(
                            quantity
                        ) ||
                        quantity <= 0
                    ) {

                        alert(
                            "Please select a valid product and quantity."
                        );

                        return;

                    }


                    const selectedOption =
                        productSelect.options[
                            productSelect.selectedIndex
                        ];


                    const availableStock =
                        Number(
                            selectedOption.dataset.stock
                        );


                    if (
                        quantity >
                        availableStock
                    ) {

                        alert(
                            `Only ${availableStock} units are available for this product.`
                        );

                        return;

                    }


                    items.push({

                        product_id:
                            productId,

                        quantity:
                            quantity

                    });

                }


                if (items.length === 0) {

                    alert(
                        "Please add at least one product."
                    );

                    return;

                }


                // ---------------------------------
                // SALE DATA
                // ---------------------------------

                const saleData = {

                    customer_id:
                        Number(
                            customerHidden.value
                        ),

                    items:
                        items,

                    // Discount is disabled
                    // in the current UI.
                    discount:
                        0,

                    payment_method:
                        paymentMethod.value,

                    payment_status:
                        "paid"

                };


                const submitButton =
                    saleForm.querySelector(
                        'button[type="submit"]'
                    );


                try {

                    if (submitButton) {

                        submitButton.disabled =
                            true;


                        submitButton.textContent =
                            "Recording...";

                    }


                    const data =
                        await apiRequest(
                            "/api/sales",
                            {
                                method:
                                    "POST",

                                body:
                                    JSON.stringify(
                                        saleData
                                    )
                            }
                        );


                    alert(
                        data.message ||
                        "Sale recorded successfully!"
                    );


                    // Close modal
                    if (saleModal) {

                        saleModal.classList.remove(
                            "active"
                        );

                    }


                    // Reset form
                    resetSaleForm();


                    // Refresh sales and products
                    await loadSales();

                    await loadProducts();

                } catch (error) {

                    console.error(
                        "Error recording sale:",
                        error
                    );


                    alert(
                        error.message ||
                        "Unable to record sale."
                    );

                } finally {

                    if (submitButton) {

                        submitButton.disabled =
                            false;


                        submitButton.textContent =
                            "Record Sale";

                    }

                }

            }
        );

    }


    // =========================================
    // RESET SALE FORM
    // =========================================

    function resetSaleForm() {

        if (saleForm) {

            saleForm.reset();

        }


        // Reset customer
        if (customerInput) {

            customerInput.value =
                "";

        }


        if (customerHidden) {

            customerHidden.value =
                "";

        }


        if (customerSuggestions) {

            customerSuggestions.innerHTML =
                "";


            customerSuggestions.classList.remove(
                "active"
            );

        }


        // Reset new customer form
        if (newCustomerForm) {

            newCustomerForm.classList.remove(
                "active"
            );

        }


        // Reset product list
        if (saleItems) {

            saleItems.innerHTML = `
                <div class="sale-item">

                    <div class="form-group">

                        <label>
                            Product
                        </label>

                        <select
                            class="sale-product"
                            required
                        >
                            ${createProductOptions()}
                        </select>

                    </div>


                    <div class="form-group">

                        <label>
                            Quantity
                        </label>

                        <input
                            type="number"
                            class="sale-quantity"
                            min="1"
                            value=""
                            required
                        >

                    </div>


                    <button
                        type="button"
                        class="remove-item-button"
                    >
                        ×
                    </button>

                </div>
            `;

        }


        calculateSaleTotal();

    }


    // =========================================
    // LOAD SALES
    // =========================================

    async function loadSales() {

        try {

            const data =
                await apiRequest(
                    "/api/sales"
                );


            sales =
                data.sales || [];


            renderSales();

            updateSalesStats();

        } catch (error) {

            console.error(
                "Error loading sales:",
                error
            );


            if (tableBody) {

                tableBody.innerHTML = `
                    <tr>
                        <td colspan="8">
                            Unable to load sales.
                        </td>
                    </tr>
                `;

            }

        }

    }


    // =========================================
    // RENDER SALES TABLE
    // =========================================

    function renderSales() {

        if (!tableBody) {

            return;

        }


        tableBody.innerHTML =
            "";


        if (sales.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="8">
                        No sales transactions found.
                    </td>
                </tr>
            `;

            return;

        }


        sales.forEach(
            function (sale) {

                const row =
                    document.createElement(
                        "tr"
                    );


                const date =
                    new Date(
                        sale.created_at
                    ).toLocaleDateString(
                        "en-US",
                        {
                            month:
                                "short",

                            day:
                                "2-digit",

                            year:
                                "numeric"
                        }
                    );


                const payment =
                    sale.payment_method ===
                        "pos"

                        ? "POS"

                        : sale.payment_method ===
                            "transfer"

                            ? "Transfer"

                            : "Cash";


                const statusClass =
                    sale.payment_status ===
                        "paid"

                        ? "completed"

                        : "pending";


                const statusText =
                    sale.payment_status ===
                        "paid"

                        ? "Completed"

                        : "Pending";


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
                            "Unknown"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            sale.salesperson_name ||
                            "Manager"
                        )}
                    </td>

                    <td>
                        ₦${Number(
                            sale.total_amount
                        ).toLocaleString(
                            "en-NG"
                        )}
                    </td>

                    <td>
                        ${payment}
                    </td>

                    <td>
                        ${date}
                    </td>

                    <td>
                        <span
                            class="status ${statusClass}"
                        >
                            ${statusText}
                        </span>
                    </td>

                    <td>
                        <button
                            type="button"
                            class="view-button"
                            data-id="${sale.id}"
                        >
                            View
                        </button>
                    </td>
                `;


                tableBody.appendChild(
                    row
                );

            }
        );

    }


    // =========================================
    // SALES STATISTICS
    // =========================================

    function updateSalesStats() {

        const statCards =
            document.querySelectorAll(
                ".sales-stat-card h2"
            );


        if (statCards.length < 4) {

            return;

        }


        const today =
            new Date().toDateString();


        const todaySales =
            sales.filter(
                function (sale) {

                    return (
                        new Date(
                            sale.created_at
                        ).toDateString() ===
                        today
                    );

                }
            );


        const todayRevenue =
            todaySales.reduce(
                function (sum, sale) {

                    return (
                        sum +
                        Number(
                            sale.total_amount
                        )
                    );

                },
                0
            );


        const completed =
            sales.filter(
                function (sale) {

                    return (
                        sale.payment_status ===
                        "paid"
                    );

                }
            ).length;


        const pending =
            sales.filter(
                function (sale) {

                    return (
                        sale.payment_status ===
                        "pending"
                    );

                }
            ).length;


        statCards[0].textContent =
            todaySales.length;


        statCards[1].textContent =
            "₦" +
            todayRevenue.toLocaleString(
                "en-NG"
            );


        statCards[2].textContent =
            completed;


        statCards[3].textContent =
            pending;

    }


    // =========================================
    // SEARCH AND FILTER
    // =========================================

    const searchInput =
        document.getElementById(
            "salesSearch"
        );


    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    const dateFilter =
        document.getElementById(
            "dateFilter"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            filterSales
        );

    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            filterSales
        );

    }


    if (dateFilter) {

        dateFilter.addEventListener(
            "change",
            filterSales
        );

    }


    function filterSales() {

        if (!tableBody) {

            return;

        }


        const searchValue =
            searchInput
                ? searchInput.value
                    .toLowerCase()
                    .trim()
                : "";


        const selectedStatus =
            statusFilter
                ? statusFilter.value
                    .toLowerCase()
                : "all";


        const selectedDate =
            dateFilter
                ? dateFilter.value
                : "";


        const rows =
            tableBody.querySelectorAll(
                "tr"
            );


        rows.forEach(
            function (row) {

                const text =
                    row.textContent
                        .toLowerCase();


                const statusElement =
                    row.querySelector(
                        ".status"
                    );


                const status =
                    statusElement
                        ? statusElement.textContent
                            .toLowerCase()
                            .trim()
                        : "";


                const cells =
                    row.querySelectorAll(
                        "td"
                    );


                const dateCell =
                    cells.length > 5
                        ? cells[5]
                        : null;


                let matchesDate =
                    true;


                if (
                    selectedDate &&
                    dateCell
                ) {

                    const rowDate =
                        new Date(
                            dateCell.textContent
                                .trim()
                        );


                    const selected =
                        new Date(
                            selectedDate +
                            "T00:00:00"
                        );


                    if (
                        !isNaN(
                            rowDate.getTime()
                        )
                    ) {

                        matchesDate =
                            rowDate.toDateString() ===
                            selected.toDateString();

                    }

                }


                const matchesSearch =
                    text.includes(
                        searchValue
                    );


                let matchesStatus =
                    true;


                if (
                    selectedStatus !==
                    "all"
                ) {

                    matchesStatus =
                        selectedStatus ===
                            "completed"

                            ? status ===
                                "completed"

                            : selectedStatus ===
                                "pending"

                                ? status ===
                                    "pending"

                                : true;

                }


                row.style.display =
                    matchesSearch &&
                    matchesStatus &&
                    matchesDate

                        ? ""

                        : "none";

            }
        );

    }


    // =========================================
    // SALE DETAILS MODAL
    // =========================================

    const saleDetailsModal =
        document.getElementById(
            "saleDetailsModal"
        );


    const closeSaleDetails =
        document.getElementById(
            "closeSaleDetails"
        );


    // =========================================
    // OPEN SALE DETAILS
    // =========================================

    async function openSaleDetails(
        saleId
    ) {

        try {

            const data =
                await apiRequest(
                    `/api/sales/${saleId}`
                );


            const sale =
                data.sale;


            const items =
                data.items || [];


            const transactionElement =
                document.getElementById(
                    "detailsTransactionId"
                );


            const customerElement =
                document.getElementById(
                    "detailsCustomer"
                );


            const salespersonElement =
                document.getElementById(
                    "detailsSalesperson"
                );


            const paymentElement =
                document.getElementById(
                    "detailsPayment"
                );


            const dateElement =
                document.getElementById(
                    "detailsDate"
                );


            const detailsProducts =
                document.getElementById(
                    "detailsProducts"
                );


            const detailsTotal =
                document.getElementById(
                    "detailsTotal"
                );


            if (transactionElement) {

                transactionElement.textContent =
                    "#" +
                    sale.sale_reference;

            }


            if (customerElement) {

                customerElement.textContent =
                    sale.customer_name ||
                    "—";

            }


            if (salespersonElement) {

                salespersonElement.textContent =
                    sale.salesperson_name ||
                    "—";

            }


            if (paymentElement) {

                paymentElement.textContent =
                    sale.payment_method ===
                        "pos"

                        ? "POS"

                        : sale.payment_method ===
                            "transfer"

                            ? "Transfer"

                            : "Cash";

            }


            if (dateElement) {

                dateElement.textContent =
                    new Date(
                        sale.created_at
                    ).toLocaleString(
                        "en-NG"
                    );

            }


            if (detailsProducts) {

                detailsProducts.innerHTML =
                    "";


                items.forEach(
                    function (item) {

                        const productRow =
                            document.createElement(
                                "div"
                            );


                        productRow.className =
                            "details-product-row";


                        productRow.innerHTML = `
                            <span>
                                ${escapeHtml(
                                    item.product_name
                                )}
                            </span>

                            <span>
                                ${item.quantity}
                                ×
                                ₦${Number(
                                    item.unit_price
                                ).toLocaleString(
                                    "en-NG"
                                )}
                            </span>

                            <strong>
                                ₦${Number(
                                    item.total_price
                                ).toLocaleString(
                                    "en-NG"
                                )}
                            </strong>
                        `;


                        detailsProducts.appendChild(
                            productRow
                        );

                    }
                );

            }


            if (detailsTotal) {

                detailsTotal.textContent =
                    "₦" +
                    Number(
                        sale.total_amount
                    ).toLocaleString(
                        "en-NG"
                    );

            }


            if (saleDetailsModal) {

                saleDetailsModal.classList.add(
                    "active"
                );

            }

        } catch (error) {

            console.error(
                "Error loading sale details:",
                error
            );


            alert(
                error.message ||
                "Unable to load sale details."
            );

        }

    }


    // =========================================
    // VIEW SALE BUTTON
    // =========================================

    if (tableBody) {

        tableBody.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        ".view-button"
                    );


                if (!button) {

                    return;

                }


                const saleId =
                    button.dataset.id;


                if (saleId) {

                    openSaleDetails(
                        saleId
                    );

                }

            }
        );

    }


    // =========================================
    // CLOSE SALE DETAILS
    // =========================================

    if (
        closeSaleDetails &&
        saleDetailsModal
    ) {

        closeSaleDetails.addEventListener(
            "click",
            function () {

                saleDetailsModal.classList.remove(
                    "active"
                );

            }
        );

    }


    // Click outside sale details
    if (saleDetailsModal) {

        saleDetailsModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    saleDetailsModal
                ) {

                    saleDetailsModal.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    // =========================================
    // LOGOUT
    // =========================================

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async function (event) {

                event.preventDefault();


                const confirmLogout =
                    confirm(
                        "Are you sure you want to logout?"
                    );


                if (!confirmLogout) {

                    return;

                }


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

                }


                window.location.href =
                    "../index.html";

            }
        );

    }


    // =========================================
    // INITIAL LOAD
    // =========================================

    loadSales();

    loadCustomers();

    loadProducts();

});
