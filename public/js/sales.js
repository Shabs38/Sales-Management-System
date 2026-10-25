

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

          await window.appDialog.alert(
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

                 await  window.appDialog.alert(
    "Please enter the customer's name."
);

                    newCustomerName.focus();

                    return;

                }


                if (!phone) {

                 await  window.appDialog.alert(
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


                   await window.appDialog.alert(
    "Customer added successfully."
);

                } catch (error) {

                    console.error(
                        "Error adding customer:",
                        error
                    );


await window.appDialog.alert(
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


    // SEARCHABLE_PRODUCT_SELECTOR_V2
    function initializeProductSearch(item) {
        const select = item.querySelector('.sale-product');
        if (!select || select.dataset.searchInitialized === 'true') return;
        const group = select.parentElement;
        if (!group) return;
        select.dataset.searchInitialized = 'true';

        const wrapper = document.createElement('div');
        wrapper.className = 'sale-product-search-wrapper';
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'sale-product-search';
        input.placeholder = 'Search product name or SKU...';
        input.autocomplete = 'off';
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('aria-expanded', 'false');

        if (select.id) {
            input.id = select.id + 'Search';
            const label = group.querySelector('label[for="' + select.id + '"]');
            if (label) label.htmlFor = input.id;
        }

        const list = document.createElement('div');
        list.className = 'sale-product-suggestions';
        list.setAttribute('role', 'listbox');
        list.hidden = true;
        group.insertBefore(wrapper, select);
        wrapper.appendChild(input);
        wrapper.appendChild(list);

        // Preserve the original select for existing sale and price logic.
        select.required = false;
        select.tabIndex = -1;
        select.setAttribute('aria-hidden', 'true');
        select.style.cssText = 'position:absolute!important;width:1px!important;height:1px!important;margin:-1px!important;padding:0!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important;';

        function closeList() {
            list.hidden = true;
            list.innerHTML = '';
            input.setAttribute('aria-expanded', 'false');
        }

        function syncInput() {
            const option = select.options[select.selectedIndex];
            input.value = option && option.value ? option.textContent.trim().split(' — ')[0].trim() : '';
        }

        function showMatches() {
            const query = input.value.trim().toLowerCase();
            list.innerHTML = '';
            if (!query) { closeList(); return; }

            const matches = products.filter(function (product) {
                const active = product.is_active === true ||
                    product.is_active === 'true' ||
                    product.is_active === 1 ||
                    product.is_active === '1';

                const stock = Number(product.stock_quantity);
                if (!active || !Number.isFinite(stock) || stock <= 0) return false;

                const name = String(product.product_name || '').toLowerCase();
                const sku = String(product.sku || '').toLowerCase();

                return name.includes(query) || sku.includes(query);
            }).slice(0, 15);

            if (!matches.length) {
                const empty = document.createElement('div');
                empty.className = 'sale-product-no-results';
                empty.textContent = 'No matching in-stock products found';
                list.appendChild(empty);
            } else {
                matches.forEach(function (product) {
                    const option = document.createElement('button');
                    option.type = 'button';
                    option.className = 'sale-product-suggestion';
                    option.setAttribute('role', 'option');
                    const title = document.createElement('span');
                    title.className = 'sale-product-suggestion-name';
                    title.textContent = product.product_name || 'Unnamed product';
                    const details = document.createElement('span');
                    details.className = 'sale-product-suggestion-details';
                    details.textContent = (product.sku ? 'SKU: ' + product.sku + ' · ' : '') + '₦' + Number(product.selling_price || 0).toLocaleString('en-NG') + ' · Stock: ' + Number(product.stock_quantity || 0);
                    option.appendChild(title);
                    option.appendChild(details);
                    option.addEventListener('mousedown', function (event) { event.preventDefault(); });
                    option.addEventListener('click', function () {
                        select.value = String(product.id);
                        syncInput();
                        closeList();
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        const quantity = item.querySelector('.sale-quantity');
                        if (quantity) quantity.focus();
                    });
                    list.appendChild(option);
                });
            }
            list.hidden = false;
            input.setAttribute('aria-expanded', 'true');
        }

        input.addEventListener('input', function () {
            select.value = '';
            updateProductStock(item);
            calculateSaleTotal();
            showMatches();
        });
        input.addEventListener('focus', function () {
            if (input.value.trim() && !select.value) showMatches();
        });
        input.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') closeList();
            if (event.key === 'Enter' && !list.hidden) {
                const first = list.querySelector('.sale-product-suggestion');
                if (first) { event.preventDefault(); first.click(); }
            }
        });
        document.addEventListener('click', function (event) {
            if (!wrapper.contains(event.target)) closeList();
        });
        select.addEventListener('change', syncInput);
        syncInput();
    }

    function initializeProductSearches() {
        if (!saleItems) return;
        saleItems.querySelectorAll('.sale-item').forEach(function (item) {
            initializeProductSearch(item);
        });
    }

    (function installProductSearchStyles() {
        if (document.getElementById('saleProductSearchStyles')) return;
        const style = document.createElement('style');
        style.id = 'saleProductSearchStyles';
        style.textContent = '.sale-product-search-wrapper{position:relative;width:100%}' +
            '.sale-product-search{box-sizing:border-box;width:100%;padding:11px 12px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;color:#1f2937;font:inherit}' +
            '.sale-product-search:focus{outline:2px solid rgba(8,113,125,.2);border-color:#08717d}' +
            '.sale-product-suggestions{position:absolute;z-index:10000;top:calc(100% + 4px);left:0;right:0;max-height:240px;overflow-y:auto;background:#fff;border:1px solid #d1d5db;border-radius:7px;box-shadow:0 8px 20px rgba(0,0,0,.12)}' +
            '.sale-product-suggestions[hidden]{display:none!important}' +
            '.sale-product-suggestion{display:flex;flex-direction:column;gap:4px;width:100%;padding:10px 12px;border:0;border-bottom:1px solid #edf0f2;background:#fff;color:#1f2937;text-align:left;cursor:pointer;font:inherit}' +
            '.sale-product-suggestion:hover,.sale-product-suggestion:focus{background:#eef8f7;outline:none}' +
            '.sale-product-suggestion-name{font-weight:600}' +
            '.sale-product-suggestion-details,.sale-product-no-results{color:#64748b;font-size:.9em}' +
            '.sale-product-no-results{padding:12px}';
        document.head.appendChild(style);
    })();

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

            initializeProductSearches();

        } catch (error) {

            console.error(
                "Error loading products:",
                error
            );


  await window.appDialog.alert(
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

       window.appDialog.alert(
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

  window.appDialog.alert(
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

                initializeProductSearch(newItem);


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

                   window.appDialog.alert(
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

               // CUSTOMER VALIDATION
// Customer is optional.
// If a registered customer is selected,
// customerHidden.value contains their ID.
// If no customer is selected, the sale
// will be saved as a walk-in sale.


                // ---------------------------------
                // PAYMENT VALIDATION
                // ---------------------------------

                if (
                    !paymentMethod ||
                    !paymentMethod.value
                ) {

                  window.appDialog.alert(
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

                  window.appDialog.alert(
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

                      window.appDialog.alert(
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

                      window.appDialog.alert(
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

                  window.appDialog.alert(
    "Please add at least one product."
);

                    return;

                }


                // ---------------------------------
                // SALE DATA
                // ---------------------------------

                const saleData = {
		customer_id:
    customerHidden && customerHidden.value
        ? Number(customerHidden.value)
        : null,

                  items: items,

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


                   await window.appDialog.alert(
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


                  await window.appDialog.alert(
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


    /* SALES_RECEIPT_FEATURE_V1 */
    let activeReceiptSaleId = null;

    function ensurePrintReceiptButton(saleId) {
        activeReceiptSaleId = saleId;

        const header = document.querySelector('#saleDetailsModal .sale-details-header');
        if (!header) return;

        let button = document.getElementById('printSaleReceiptButton');
        if (button) return;

        button = document.createElement('button');
        button.id = 'printSaleReceiptButton';
        button.type = 'button';
        button.textContent = 'Print Receipt';
        button.style.cssText = 'margin:0 10px;padding:9px 13px;background:#08717d;color:white;border:0;border-radius:6px;cursor:pointer;';

        const closeButton = header.querySelector('#closeSaleDetails');
        if (closeButton) closeButton.parentNode.insertBefore(button, closeButton);
        else header.appendChild(button);

        button.addEventListener('click', async function () {
            if (!activeReceiptSaleId) return;

            button.disabled = true;
            button.textContent = 'Preparing...';

            try {
                const [saleData, brandingData] = await Promise.all([
                    apiRequest('/api/sales/' + encodeURIComponent(activeReceiptSaleId)),
                    apiRequest('/api/business/branding')
                ]);

                const sale = saleData.sale || {};
                const items = saleData.items || [];
               const business = brandingData.business || brandingData.branding || {};
const branding = brandingData.branding || {};

                const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({
                    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
                }[c]));

                const pick = (obj, keys, fallback = '') => {
                    for (const key of keys) {
                        if (obj && obj[key] != null && obj[key] !== '') return obj[key];
                    }
                    return fallback;
                };

                const money = value => '₦' + Number(value || 0).toLocaleString('en-NG', {
                    minimumFractionDigits: 2, maximumFractionDigits: 2
                });

                const name = pick(business, ['name', 'business_name'], 'Business');
                const address = pick(business, ['address']);
                const phone = pick(branding, ['phone']);
                const email = pick(branding, ['email']);
                const logo = pick(business, ['logo_url', 'logoUrl']);
                const reference = pick(sale, ['sale_reference', 'reference'], activeReceiptSaleId);
                const dateValue = pick(sale, ['created_at', 'sale_date']);
                const date = dateValue ? new Date(dateValue).toLocaleString() : '';
                const customer = pick(sale, ['customer_name'], 'Walk-in Customer');
                const staff = pick(sale, ['salesperson_name', 'user_name']);
                const payment = pick(sale, ['payment_method'], 'N/A');
                const status = pick(sale, ['status'], 'Completed');
                const subtotal = pick(sale, ['subtotal', 'sub_total'], null);
                const discount = pick(sale, ['discount_amount', 'discount'], 0);
                const total = pick(sale, ['total_amount', 'total', 'grand_total'], 0);

                const rows = items.map(item => {
                    const qty = Number(pick(item, ['quantity', 'qty'], 0));
                    const price = Number(pick(item, ['unit_price', 'price'], 0));
                    const amount = pick(item, ['line_total', 'total_price', 'subtotal', 'total'], qty * price);
                    return '<tr><td>' + esc(pick(item, ['product_name', 'item_name', 'name'], 'Item')) +
                        '</td><td class="num">' + esc(qty) +
                        '</td><td class="num">' + esc(money(price)) +
                        '</td><td class="num">' + esc(money(amount)) + '</td></tr>';
                }).join('');

                function receipt(copyName) {
                    return '<section class="receipt"><header>' +
                        (logo ? '<img class="logo" src="' + esc(logo) + '" alt="Logo">' : '') +
                        '<h1>' + esc(name) + '</h1>' +
                        (address ? '<div>' + esc(address) + '</div>' : '') +
                        (phone ? '<div>Phone: ' + esc(phone) + '</div>' : '') +
                        (email ? '<div>Email: ' + esc(email) + '</div>' : '') +
                        '<h2>SALES RECEIPT</h2><strong>' + copyName + '</strong></header>' +
                        '<p><b>Receipt:</b> ' + esc(reference) + '<br><b>Date:</b> ' + esc(date) +
                        '<br><b>Customer:</b> ' + esc(customer) +
                        (staff ? '<br><b>Served by:</b> ' + esc(staff) : '') + '</p>' +
                        '<table><thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead>' +
                        '<tbody>' + (rows || '<tr><td colspan="4">No item details available</td></tr>') + '</tbody></table>' +
                        '<div class="totals">' +
                        (subtotal !== null ? '<p>Subtotal: <b>' + esc(money(subtotal)) + '</b></p>' : '') +
                        '<p>Discount: <b>' + esc(money(discount)) + '</b></p>' +
                        '<h3>Total: ' + esc(money(total)) + '</h3>' +
                        '<p>Payment: ' + esc(payment) + '<br>Status: ' + esc(status) + '</p></div>' +
                        '<footer>Thank you for your patronage!</footer></section>';
                }

                const printWindow = window.open('', '_blank', 'width=900,height=700');
                if (!printWindow) {
                    alert('Allow pop-ups in your browser, then try again.');
                    return;
                }

                printWindow.document.open();
                printWindow.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Receipt</title><style>' +
                    '@page{margin:12mm}body{font-family:Arial,sans-serif;color:#222;font-size:12px}' +
                    '.receipt{max-width:700px;margin:auto;padding:10px 0 24px;page-break-after:always}' +
                    '.receipt:last-child{page-break-after:auto}header{text-align:center;line-height:1.5}h1{font-size:22px;margin:6px}' +
                    '.logo{max-width:100px;max-height:70px;object-fit:contain}table{width:100%;border-collapse:collapse;margin:14px 0}' +
                    'th,td{text-align:left;border-bottom:1px solid #ddd;padding:8px 4px}.num{text-align:right;white-space:nowrap}' +
                    '.totals{margin-left:auto;max-width:300px}.totals h3{border-top:2px solid;padding-top:8px}' +
                    'footer{text-align:center;margin-top:24px}@media print{.receipt{break-after:page}.receipt:last-child{break-after:auto}}' +
                    '</style></head><body>' + receipt('CUSTOMER COPY') + receipt('OFFICE COPY') +
                    '<script>window.onload=function(){var a=[...document.images];Promise.all(a.map(i=>i.decode?i.decode().catch(()=>{}):Promise.resolve())).then(()=>window.print())};<\/script>' +
                    '</body></html>');
                printWindow.document.close();
            } catch (error) {
                console.error('Receipt preparation failed:', error);
                alert('Could not prepare the receipt. Check that the sale and business branding are available.');
            } finally {
                button.disabled = false;
                button.textContent = 'Print Receipt';
            }
        });
    }

async function openSaleDetails(
        saleId
    ) {
        ensurePrintReceiptButton(saleId);


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


          await window.appDialog.alert(
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


               const confirmLogout = await window.appDialog.confirm(
    "Are you sure you want to logout?",
    {
        title: "Confirm Logout",
        confirmText: "Logout",
        cancelText: "Stay"
    }
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
