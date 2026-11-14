document.addEventListener("DOMContentLoaded", () => {
    const $ = (selector, parent = document) => parent.querySelector(selector);

    const form = $("#purchaseForm");
    const itemsContainer = $("#purchaseItems");
    const messageBox = $("#messageBox");

    let itemCounter = 0;
    let searchTimer;

    const money = value =>
        new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN"
        }).format(Number(value || 0));

    const escapeHTML = value =>
        String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);

    async function api(url, options = {}) {
        const response = await fetch(url, {
            credentials: "include",
            ...options,
            headers: {
                ...(options.body ? { "Content-Type": "application/json" } : {}),
                ...(options.headers || {})
            }
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || "The request could not be completed.");
        }

        return data;
    }

    function showMessage(message, type = "success") {
        if (!messageBox) return;

        messageBox.textContent = message;
        messageBox.className = `message-box ${type}`;
        messageBox.style.display = "block";

        window.scrollTo({ top: 0, behavior: "smooth" });

        setTimeout(() => {
            messageBox.style.display = "none";
        }, 5000);
    }

    function updateTotals() {
        let totalCents = 0;

        itemsContainer.querySelectorAll(".purchase-item").forEach(row => {
            const quantity = Number($(".item-quantity", row)?.value || 0);
            const cost = Number($(".item-cost", row)?.value || 0);
            const lineCents = Math.round(quantity * cost * 100);

            totalCents += lineCents;

            const lineTotal = $(".item-line-total", row);
            if (lineTotal) lineTotal.textContent = money(lineCents / 100);
        });

        $("#purchaseTotal").textContent = money(totalCents / 100);

        const amountPaid = Number($("#amountPaid").value || 0);
        const balance = Math.max(0, totalCents / 100 - amountPaid);

        $("#savePurchaseButton").disabled =
            totalCents <= 0 || amountPaid < 0 || balance < 0;

        return totalCents / 100;
    }

    function closeSuggestions(row) {
        const box = $(".product-suggestions", row);
        if (box) box.innerHTML = "";
    }

    function createItemRow() {
        const row = document.createElement("div");
        row.className = "purchase-item";
        row.dataset.itemId = String(++itemCounter);
        row.dataset.productId = "";

        row.innerHTML = `
            <div class="purchase-item-heading">
                <strong>Purchase item</strong>
                <button type="button" class="remove-item-button">Remove</button>
            </div>

            <div class="form-group">
                <label>Product type</label>
                <select class="item-type">
                    <option value="existing">Existing product</option>
                    <option value="new">Add a new product</option>
                </select>
            </div>

            <div class="existing-product-fields">
                <div class="form-group autocomplete-wrap">
                    <label>Search product</label>
                    <input type="text" class="product-search"
                        placeholder="Type product name or SKU" autocomplete="off">
                    <div class="product-suggestions autocomplete-list"></div>
                    <small class="selected-product"></small>
                </div>
            </div>

            <div class="new-product-fields" hidden>
                <div class="form-group">
                    <label>Product name</label>
                    <input type="text" class="new-product-name"
                        placeholder="Product name">
                </div>

                <div class="form-group">
                    <label>SKU</label>
                    <input type="text" class="new-product-sku"
                        placeholder="Unique product SKU">
                </div>

                <div class="form-group">
                    <label>Category</label>
                    <select class="new-product-category">
                        <option value="">Select category</option>
                        <option value="food">Food</option>
                        <option value="beverages">Beverages</option>
                        <option value="household">Household</option>
                        <option value="personal-care">Personal Care</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Selling price (₦)</label>
                    <input type="number" class="new-product-price"
                        min="0" step="0.01" placeholder="Selling price">
                </div>

                <div class="form-group">
                    <label>Low stock limit</label>
                    <input type="number" class="new-product-low-stock"
                        min="0" step="1" value="10">
                </div>
            </div>

            <div class="purchase-item-fields">
                <div class="form-group">
                    <label>Quantity purchased</label>
                    <input type="number" class="item-quantity"
                        min="1" step="1" value="1">
                </div>

                <div class="form-group">
                    <label>Unit cost (₦)</label>
                    <input type="number" class="item-cost"
                        min="0" step="0.01" placeholder="Cost per unit">
                </div>

                <div class="form-group">
                    <label>Line total</label>
                    <strong class="item-line-total">${money(0)}</strong>
                </div>
            </div>
        `;

        itemsContainer.appendChild(row);
        return row;
    }

    async function searchProducts(query, row) {
        const box = $(".product-suggestions", row);

        if (!query.trim()) {
            box.innerHTML = "";
            return;
        }

        try {
            const data = await api(
                `/api/purchases/products?q=${encodeURIComponent(query)}`
            );

            box.innerHTML = "";

            (data.products || []).forEach(product => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "autocomplete-option";

                button.textContent =
                    `${product.product_name} (${product.sku}) — Stock: ${product.stock_quantity}`;

                button.addEventListener("click", () => {
                    row.dataset.productId = product.id;

                    $(".product-search", row).value = product.product_name;
                    $(".selected-product", row).textContent =
                        `Selected: ${product.product_name} | SKU: ${product.sku} | Current stock: ${product.stock_quantity}`;

                    closeSuggestions(row);
                });

                box.appendChild(button);
            });

            if (!data.products?.length) {
                box.textContent = "No matching product found. You can add it as a new product.";
            }
        } catch (error) {
            box.textContent = error.message;
        }
    }

    async function searchSuppliers(query) {
        const box = $("#supplierSuggestions");

        if (!query.trim()) {
            box.innerHTML = "";
            return;
        }

        try {
            const data = await api(
                `/api/purchases/suppliers?q=${encodeURIComponent(query)}`
            );

            box.innerHTML = "";

            (data.suppliers || []).forEach(supplier => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "autocomplete-option";
                button.textContent = supplier.supplier_name;

                button.addEventListener("click", () => {
                    $("#supplierName").value = supplier.supplier_name;
                    $("#supplierContact").value =
                        supplier.supplier_contact || "";
                    box.innerHTML = "";
                });

                box.appendChild(button);
            });
        } catch (error) {
            box.textContent = error.message;
        }
    }

    function calculateStatus(total, paid) {
        if (paid >= total) return "Paid";
        if (paid > 0) return "Partially paid";
        return "Unpaid";
    }

    function renderPurchases(purchases) {
        const table = $("#purchaseHistory");
        table.innerHTML = "";

        if (!purchases.length) {
            table.innerHTML =
                '<tr><td colspan="7">No purchase records found.</td></tr>';
            return;
        }

        purchases.forEach(purchase => {
            const total = Number(purchase.total_amount);
            const paid = Number(purchase.amount_paid);
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${escapeHTML(purchase.purchase_date)}</td>
                <td>${escapeHTML(purchase.supplier_name)}</td>
                <td>${escapeHTML(purchase.invoice_number || "-")}</td>
                <td>${money(total)}</td>
                <td>${money(paid)}</td>
                <td>${escapeHTML(calculateStatus(total, paid))}</td>
                <td>
                    <button type="button" class="view-purchase-button"
                        data-id="${Number(purchase.id)}">View</button>
                </td>
            `;

            table.appendChild(row);
        });
    }

    async function loadPurchases() {
        const search = $("#purchaseSearch").value.trim();

        try {
            const data = await api(
                `/api/purchases?search=${encodeURIComponent(search)}`
            );

            const purchases = data.purchases || [];
            renderPurchases(purchases);

            const totalValue = purchases.reduce(
                (sum, item) => sum + Number(item.total_amount || 0), 0
            );

            const outstanding = purchases.reduce(
                (sum, item) =>
                    sum + Math.max(
                        0,
                        Number(item.total_amount || 0) -
                        Number(item.amount_paid || 0)
                    ),
                0
            );

            $("#totalPurchases").textContent = purchases.length;
            $("#totalPurchaseValue").textContent = money(totalValue);
            $("#outstandingPayments").textContent = money(outstanding);
        } catch (error) {
            showMessage(error.message, "error");
        }
    }

    async function showPurchaseDetails(id) {
        try {
            const data = await api(`/api/purchases/${id}`);
            const purchase = data.purchase;
            const modal = $("#purchaseDetailsModal");
            const details = $("#purchaseDetails");

            details.innerHTML = `
                <h3>${escapeHTML(purchase.supplier_name)}</h3>
                <p><strong>Date:</strong> ${escapeHTML(purchase.purchase_date)}</p>
                <p><strong>Invoice:</strong> ${escapeHTML(purchase.invoice_number || "-")}</p>
                <p><strong>Contact:</strong> ${escapeHTML(purchase.supplier_contact || "-")}</p>
                <p><strong>Total:</strong> ${money(purchase.total_amount)}</p>
                <p><strong>Paid:</strong> ${money(purchase.amount_paid)}</p>
                <p><strong>Balance:</strong> ${money(
                    Number(purchase.total_amount) - Number(purchase.amount_paid)
                )}</p>
                <p><strong>Payment method:</strong> ${escapeHTML(purchase.payment_method || "-")}</p>
                <p><strong>Notes:</strong> ${escapeHTML(purchase.notes || "-")}</p>

                <h4>Purchased products</h4>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>SKU</th>
                                <th>Quantity</th>
                                <th>Unit cost</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(purchase.items || []).map(item => `
                                <tr>
                                    <td>${escapeHTML(item.product_name)}</td>
                                    <td>${escapeHTML(item.sku)}</td>
                                    <td>${Number(item.quantity)}</td>
                                    <td>${money(item.unit_cost)}</td>
                                    <td>${money(item.total_cost)}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            `;

            modal.hidden = false;
            modal.style.display = "flex";
        } catch (error) {
            showMessage(error.message, "error");
        }
    }

    $("#addItemButton").addEventListener("click", () => {
        createItemRow();
    });

    itemsContainer.addEventListener("change", event => {
        if (!event.target.classList.contains("item-type")) return;

        const row = event.target.closest(".purchase-item");
        const isNew = event.target.value === "new";

        row.dataset.productId = "";
        $(".product-search", row).value = "";
        $(".selected-product", row).textContent = "";
        closeSuggestions(row);

        $(".existing-product-fields", row).hidden = isNew;
        $(".new-product-fields", row).hidden = !isNew;
    });

    itemsContainer.addEventListener("input", event => {
        const row = event.target.closest(".purchase-item");
        if (!row) return;

        if (event.target.classList.contains("product-search")) {
            row.dataset.productId = "";
            $(".selected-product", row).textContent = "";

            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                searchProducts(event.target.value, row);
            }, 300);
        }

        if (
            event.target.classList.contains("item-quantity") ||
            event.target.classList.contains("item-cost")
        ) {
            updateTotals();
        }
    });

    itemsContainer.addEventListener("click", event => {
        if (!event.target.classList.contains("remove-item-button")) return;

        event.target.closest(".purchase-item").remove();
        updateTotals();
    });

    $("#amountPaid").addEventListener("input", updateTotals);

    $("#supplierName").addEventListener("input", event => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            searchSuppliers(event.target.value);
        }, 300);
    });

    document.addEventListener("click", event => {
        if (!event.target.closest(".autocomplete-wrap")) {
            $("#supplierSuggestions").innerHTML = "";
            itemsContainer.querySelectorAll(".purchase-item").forEach(closeSuggestions);
        }
    });

    $("#purchaseSearch").addEventListener("input", () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(loadPurchases, 300);
    });

    $("#purchaseHistory").addEventListener("click", event => {
        const button = event.target.closest(".view-purchase-button");
        if (button) showPurchaseDetails(button.dataset.id);
    });

    $("#closeDetailsButton").addEventListener("click", () => {
        $("#purchaseDetailsModal").style.display = "none";
        $("#purchaseDetailsModal").hidden = true;
    });

    $("#printPurchaseButton").addEventListener("click", () => {
        window.print();
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const items = [];
        let invalid = false;

        itemsContainer.querySelectorAll(".purchase-item").forEach(row => {
            const quantity = Number($(".item-quantity", row).value);
            const unitCost = Number($(".item-cost", row).value);

            if (!Number.isInteger(quantity) || quantity <= 0 ||
                !Number.isFinite(unitCost) || unitCost < 0) {
                invalid = true;
                return;
            }

            const item = { quantity, unit_cost: unitCost };

            if ($(".item-type", row).value === "existing") {
                const productId = Number(row.dataset.productId);

                if (!Number.isInteger(productId) || productId <= 0) {
                    invalid = true;
                    return;
                }

                item.product_id = productId;
            } else {
                const newProduct = {
                    product_name: $(".new-product-name", row).value.trim(),
                    sku: $(".new-product-sku", row).value.trim(),
                    category: $(".new-product-category", row).value,
                    selling_price: Number($(".new-product-price", row).value),
                    low_stock_limit: Number($(".new-product-low-stock", row).value)
                };

                if (
                    !newProduct.product_name ||
                    !newProduct.sku ||
                    !newProduct.category ||
                    !Number.isFinite(newProduct.selling_price) ||
                    newProduct.selling_price < 0 ||
                    !Number.isInteger(newProduct.low_stock_limit) ||
                    newProduct.low_stock_limit < 0
                ) {
                    invalid = true;
                    return;
                }

                item.new_product = newProduct;
            }

            items.push(item);
        });

        if (invalid || !items.length) {
            showMessage(
                "Check every item. Select an existing product or complete all new-product fields, quantity and unit cost.",
                "error"
            );
            return;
        }

        const total = updateTotals();
        const amountPaid = Number($("#amountPaid").value || 0);

        if (amountPaid < 0 || amountPaid > total) {
            showMessage("Amount paid cannot exceed the purchase total.", "error");
            return;
        }

        const payload = {
            supplier_name: $("#supplierName").value.trim(),
            supplier_contact: $("#supplierContact").value.trim(),
            invoice_number: $("#invoiceNumber").value.trim(),
            purchase_date: $("#purchaseDate").value,
            amount_paid: amountPaid,
            payment_method: $("#paymentMethod").value,
            notes: $("#purchaseNotes").value.trim(),
            items
        };

        if (!payload.supplier_name || !payload.purchase_date) {
            showMessage("Supplier name and purchase date are required.", "error");
            return;
        }

        const saveButton = $("#savePurchaseButton");
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        try {
            const data = await api("/api/purchases", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            showMessage(data.message || "Purchase saved successfully.");

            form.reset();
            itemsContainer.innerHTML = "";
            createItemRow();
            updateTotals();

            await loadPurchases();
        } catch (error) {
            showMessage(error.message, "error");
        } finally {
            saveButton.textContent = "Save Purchase";
            saveButton.disabled = false;
            updateTotals();
        }
    });

    const today = new Date();
    $("#purchaseDate").value =
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    createItemRow();
    loadPurchases();

    const logoutButton = $("#logoutButton");
    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            try {
                await api("/api/auth/logout", { method: "POST" });
            } finally {
                window.location.href = "/";
            }
        });
    }
});


// MOBILE SIDEBAR
document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.querySelector(".sidebar");
    const menuButton = document.getElementById("menuButton");
    const overlay = document.getElementById("sidebarOverlay");

    if (!sidebar || !menuButton || !overlay) return;

    menuButton.addEventListener("click", () => {
        sidebar.classList.add("active");
        overlay.classList.add("active");
    });

    overlay.addEventListener("click", () => {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
    });
});
