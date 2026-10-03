document.addEventListener("DOMContentLoaded", function () {

    // ================================
    // MOBILE SIDEBAR
    // ================================

    const sidebar = document.getElementById("sidebar");
    const menuButton = document.getElementById("menuButton");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

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
    // CUSTOMER ELEMENTS
    // ================================

    const customersTable =
        document.getElementById("customersTable");

    const customerSearch =
        document.getElementById("customerSearch");

    const customerStatusFilter =
        document.getElementById("customerStatusFilter");

    const customerTypeFilter =
        document.getElementById("customerTypeFilter");


    // ================================
    // FORMAT CUSTOMER ID
    // ================================

    function formatCustomerId(id) {
        return "CUS-" + String(id).padStart(5, "0");
    }


    // ================================
    // GET INITIALS
    // ================================

    function getInitials(name) {

        return name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map(function (word) {
                return word.charAt(0);
            })
            .join("")
            .toUpperCase();

    }


    // ================================
    // ESCAPE HTML
    // ================================

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


    // ================================
    // FILTER CUSTOMERS
    // ================================

    function applyCustomerFilters() {

        if (!customersTable) return;

        const searchValue =
            customerSearch
                ? customerSearch.value.toLowerCase().trim()
                : "";

        const selectedStatus =
            customerStatusFilter
                ? customerStatusFilter.value
                : "all";

        const selectedType =
            customerTypeFilter
                ? customerTypeFilter.value
                : "all";

        const rows =
            customersTable.querySelectorAll("tbody tr");

        rows.forEach(function (row) {

            const rowText =
                row.textContent.toLowerCase();

            const rowStatus =
                row.dataset.status || "";

            const rowType =
                row.dataset.type || "";

            const matchesSearch =
                rowText.includes(searchValue);

            const matchesStatus =
                selectedStatus === "all" ||
                rowStatus === selectedStatus;

            const matchesType =
                selectedType === "all" ||
                rowType === selectedType;

            row.style.display =
                matchesSearch &&
                matchesStatus &&
                matchesType
                    ? ""
                    : "none";

        });

    }


    if (customerSearch) {
        customerSearch.addEventListener(
            "input",
            applyCustomerFilters
        );
    }

    if (customerStatusFilter) {
        customerStatusFilter.addEventListener(
            "change",
            applyCustomerFilters
        );
    }

    if (customerTypeFilter) {
        customerTypeFilter.addEventListener(
            "change",
            applyCustomerFilters
        );
    }


    // ================================
    // RENDER ONE CUSTOMER
    // ================================

    function createCustomerRow(customer) {

        const tableBody =
            customersTable.querySelector("tbody");

        if (!tableBody) return null;

        const row =
            document.createElement("tr");

        const type = "regular";

        const status =
            customer.is_active
                ? "active"
                : "inactive";

        const typeName = "Regular";

        const statusName =
            status === "active"
                ? "Active"
                : "Inactive";

        const statusClass =
            status === "active"
                ? "active"
                : "inactive";

        const customerId =
            formatCustomerId(customer.id);

        row.dataset.id = customer.id;
        row.dataset.status = status;
        row.dataset.type = type;
        row.dataset.email = customer.email || "";
        row.dataset.address = customer.address || "";
        row.dataset.purchases = "₦0";
        row.dataset.lastPurchase = "No purchase yet";

        row.innerHTML = `

            <td>

                <div class="customer-name">

                    <div class="customer-avatar">
                        ${escapeHtml(getInitials(customer.full_name))}
                    </div>

                    <div>

                        <strong>
                            ${escapeHtml(customer.full_name)}
                        </strong>

                        <span>
                            Customer ID: ${customerId}
                        </span>

                    </div>

                </div>

            </td>

            <td>
                ${escapeHtml(customer.phone)}
            </td>

            <td>
                ${typeName}
            </td>

            <td>
                ₦0
            </td>

            <td>
                No purchase yet
            </td>

            <td>

                <span class="customer-status ${statusClass}">
                    ${statusName}
                </span>

            </td>

            <td>

                <div class="action-buttons">

                    <button
                        type="button"
                        class="view-customer">
                        View
                    </button>

                    <button
                        type="button"
                        class="edit-customer">
                        Edit
                    </button>

                    <button
                        type="button"
                        class="delete-customer">
                        Delete
                    </button>

                </div>

            </td>

        `;

        tableBody.appendChild(row);

        return row;
    }


    // ================================
    // LOAD CUSTOMERS FROM DATABASE
    // ================================

    async function loadCustomers() {

        if (!customersTable) return;

        try {

            const response =
                await fetch("/api/customers");

            const data =
                await response.json();

            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Failed to load customers."
                );

            }

            const tableBody =
                customersTable.querySelector("tbody");

            if (!tableBody) return;

            tableBody.innerHTML = "";

            data.customers.forEach(function (customer) {

                createCustomerRow(customer);

            });

            attachCustomerActions();

            applyCustomerFilters();

            updateCustomerStats(data.customers);

        } catch (error) {

            console.error(
                "Error loading customers:",
                error
            );

            alert(
                "Unable to load customers from the server."
            );

        }

    }


    // ================================
    // CUSTOMER STATS
    // ================================
function updateCustomerStats(customers) {

    // Find the four statistic cards
    const statCards =
        document.querySelectorAll(".customer-stats .stat-card");

    if (statCards.length < 4) {
        console.error("Customer statistic cards not found.");
        return;
    }


    // ================================
    // TOTAL CUSTOMERS
    // ================================

    const totalCustomers =
        customers.length;


    // ================================
    // ACTIVE CUSTOMERS
    // ================================

    const activeCustomers =
        customers.filter(function (customer) {
            return customer.is_active === true;
        }).length;


    // ================================
    // NEW THIS MONTH
    // ================================

    const now = new Date();

    const currentMonth =
        now.getMonth();

    const currentYear =
        now.getFullYear();


    const newThisMonth =
        customers.filter(function (customer) {

            if (!customer.created_at) {
                return false;
            }

            const createdDate =
                new Date(customer.created_at);

            return (
                createdDate.getMonth() === currentMonth &&
                createdDate.getFullYear() === currentYear
            );

        }).length;


    // ================================
    // REPEAT CUSTOMERS
    // ================================

    // We don't have sales history yet.
    // This will be calculated when the
    // Sales module is connected.

    const repeatCustomers = 0;


    // ================================
    // UPDATE HTML
    // ================================

    statCards[0]
        .querySelector("strong")
        .textContent = totalCustomers.toLocaleString();


    statCards[1]
        .querySelector("strong")
        .textContent = newThisMonth.toLocaleString();


    statCards[2]
        .querySelector("strong")
        .textContent = activeCustomers.toLocaleString();


    statCards[3]
        .querySelector("strong")
        .textContent = repeatCustomers.toLocaleString();

}
    
    // ================================
    // ADD CUSTOMER MODAL
    // ================================

    const addCustomerButton =
        document.getElementById("addCustomerButton");

    const customerModal =
        document.getElementById("customerModal");

    const closeCustomerModal =
        document.getElementById("closeCustomerModal");

    const cancelCustomer =
        document.getElementById("cancelCustomer");

    const customerForm =
        document.getElementById("customerForm");


    function closeAddCustomerModal() {

        if (customerModal) {
            customerModal.classList.remove("active");
        }

    }


    if (addCustomerButton && customerModal) {

        addCustomerButton.addEventListener("click", function () {

            customerModal.classList.add("active");

        });

    }


    if (closeCustomerModal) {

        closeCustomerModal.addEventListener(
            "click",
            closeAddCustomerModal
        );

    }


    if (cancelCustomer) {

        cancelCustomer.addEventListener(
            "click",
            closeAddCustomerModal
        );

    }


    if (customerModal) {

        customerModal.addEventListener("click", function (event) {

            if (event.target === customerModal) {
                closeAddCustomerModal();
            }

        });

    }


    // ================================
    // ADD CUSTOMER TO DATABASE
    // ================================

    if (customerForm) {

        customerForm.addEventListener("submit", async function (event) {

            event.preventDefault();

            const name =
                document.getElementById("customerName").value.trim();

            const phone =
                document.getElementById("customerPhone").value.trim();

            const email =
                document.getElementById("customerEmail").value.trim();

            const address =
                document.getElementById("customerAddress").value.trim();

            const type =
                document.getElementById("customerType").value;

            const status =
                document.getElementById("customerStatus").value;


            if (!name || !phone || !type || !status) {

                alert(
                    "Please complete all required customer fields."
                );

                return;

            }


            try {

                const response =
                    await fetch("/api/customers", {

                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({

                            full_name: name,
                            phone: phone,
                            email: email || null,
                            address: address || null,

                            is_active:
                                status === "active"

                        })

                    });


                const data =
                    await response.json();


                if (!response.ok || !data.success) {

                    throw new Error(
                        data.message ||
                        "Failed to add customer."
                    );

                }


                customerForm.reset();

                closeAddCustomerModal();

                await loadCustomers();


                alert(
                    name +
                    " has been added successfully."
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

            }

        });

    }


    // ================================
    // VIEW CUSTOMER MODAL
    // ================================

    const viewCustomerModal =
        document.getElementById("viewCustomerModal");

    const closeViewCustomerModal =
        document.getElementById("closeViewCustomerModal");

    const closeViewCustomer =
        document.getElementById("closeViewCustomer");


    function closeViewModal() {

        if (viewCustomerModal) {
            viewCustomerModal.classList.remove("active");
        }

    }


    if (closeViewCustomerModal) {

        closeViewCustomerModal.addEventListener(
            "click",
            closeViewModal
        );

    }


    if (closeViewCustomer) {

        closeViewCustomer.addEventListener(
            "click",
            closeViewModal
        );

    }


    if (viewCustomerModal) {

        viewCustomerModal.addEventListener("click", function (event) {

            if (event.target === viewCustomerModal) {
                closeViewModal();
            }

        });

    }


    // ================================
    // VIEW CUSTOMER
    // ================================

    function viewCustomer(row) {

        if (!row || !viewCustomerModal) return;

        const nameElement =
            row.querySelector(".customer-name strong");

        const idElement =
            row.querySelector(".customer-name span");

        const phoneElement =
            row.querySelector("td:nth-child(2)");

        const typeElement =
            row.querySelector("td:nth-child(3)");

        const purchasesElement =
            row.querySelector("td:nth-child(4)");

        const lastPurchaseElement =
            row.querySelector("td:nth-child(5)");

        const statusElement =
            row.querySelector(".customer-status");


        const name =
            nameElement
                ? nameElement.textContent.trim()
                : "N/A";

        const customerId =
            idElement
                ? idElement.textContent.trim()
                : "N/A";

        const phone =
            phoneElement
                ? phoneElement.textContent.trim()
                : "N/A";

        const type =
            typeElement
                ? typeElement.textContent.trim()
                : "Regular";

        const purchases =
            purchasesElement
                ? purchasesElement.textContent.trim()
                : "₦0";

        const lastPurchase =
            lastPurchaseElement
                ? lastPurchaseElement.textContent.trim()
                : "No purchase yet";

        const status =
            statusElement
                ? statusElement.textContent.trim()
                : "N/A";

        const email =
            row.dataset.email || "Not provided";

        const address =
            row.dataset.address || "Not provided";


        document.getElementById(
            "viewCustomerAvatar"
        ).textContent = getInitials(name);

        document.getElementById(
            "viewCustomerName"
        ).textContent = name;

        document.getElementById(
            "viewCustomerId"
        ).textContent = customerId;

        document.getElementById(
            "viewCustomerPhone"
        ).textContent = phone;

        document.getElementById(
            "viewCustomerEmail"
        ).textContent = email;

        document.getElementById(
            "viewCustomerType"
        ).textContent = type;

        document.getElementById(
            "viewCustomerStatus"
        ).textContent = status;

        document.getElementById(
            "viewCustomerPurchases"
        ).textContent = purchases;

        document.getElementById(
            "viewCustomerLastPurchase"
        ).textContent = lastPurchase;

        document.getElementById(
            "viewCustomerAddress"
        ).textContent = address;


        viewCustomerModal.classList.add("active");

    }


    // ================================
    // EDIT CUSTOMER MODAL
    // ================================

    const editCustomerModal =
        document.getElementById("editCustomerModal");

    const closeEditCustomerModal =
        document.getElementById("closeEditCustomerModal");

    const cancelEditCustomer =
        document.getElementById("cancelEditCustomer");

    const editCustomerForm =
        document.getElementById("editCustomerForm");


    let currentEditingRow = null;


    function closeEditModal() {

        if (editCustomerModal) {
            editCustomerModal.classList.remove("active");
        }

        currentEditingRow = null;

    }


    if (closeEditCustomerModal) {

        closeEditCustomerModal.addEventListener(
            "click",
            closeEditModal
        );

    }


    if (cancelEditCustomer) {

        cancelEditCustomer.addEventListener(
            "click",
            closeEditModal
        );

    }


    if (editCustomerModal) {

        editCustomerModal.addEventListener("click", function (event) {

            if (event.target === editCustomerModal) {
                closeEditModal();
            }

        });

    }


    // ================================
    // OPEN EDIT CUSTOMER
    // ================================

    function editCustomer(row) {

        if (!row || !editCustomerModal) return;

        currentEditingRow = row;


        const nameElement =
            row.querySelector(".customer-name strong");

        const phoneElement =
            row.querySelector("td:nth-child(2)");


        document.getElementById(
            "editCustomerName"
        ).value =
            nameElement
                ? nameElement.textContent.trim()
                : "";


        document.getElementById(
            "editCustomerPhone"
        ).value =
            phoneElement
                ? phoneElement.textContent.trim()
                : "";


        document.getElementById(
            "editCustomerEmail"
        ).value =
            row.dataset.email || "";


        document.getElementById(
            "editCustomerAddress"
        ).value =
            row.dataset.address || "";


        document.getElementById(
            "editCustomerType"
        ).value =
            row.dataset.type || "regular";


        document.getElementById(
            "editCustomerStatus"
        ).value =
            row.dataset.status || "active";


        editCustomerModal.classList.add("active");

    }


    // ================================
    // SAVE CUSTOMER EDIT TO DATABASE
    // ================================

    if (editCustomerForm) {

        editCustomerForm.addEventListener("submit", async function (event) {

            event.preventDefault();

            if (!currentEditingRow) return;


            const customerId =
                currentEditingRow.dataset.id;

            const name =
                document.getElementById(
                    "editCustomerName"
                ).value.trim();

            const phone =
                document.getElementById(
                    "editCustomerPhone"
                ).value.trim();

            const email =
                document.getElementById(
                    "editCustomerEmail"
                ).value.trim();

            const address =
                document.getElementById(
                    "editCustomerAddress"
                ).value.trim();

            const type =
                document.getElementById(
                    "editCustomerType"
                ).value;

            const status =
                document.getElementById(
                    "editCustomerStatus"
                ).value;


            if (!name || !phone || !type || !status) {

                alert(
                    "Please complete all required customer fields."
                );

                return;

            }


            try {

                const response =
                    await fetch(
                        `/api/customers/${customerId}`,
                        {

                            method: "PUT",

                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify({

                                full_name: name,
                                phone: phone,
                                email: email || null,
                                address: address || null,

                                is_active:
                                    status === "active"

                            })

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok || !data.success) {

                    throw new Error(
                        data.message ||
                        "Failed to update customer."
                    );

                }


                closeEditModal();

                await loadCustomers();


                alert(
                    name +
                    " has been updated successfully."
                );


            } catch (error) {

                console.error(
                    "Error updating customer:",
                    error
                );

                alert(
                    error.message ||
                    "Unable to update customer."
                );

            }

        });

    }


    // ================================
    // DELETE CUSTOMER FROM DATABASE
    // ================================

    async function deleteCustomer(row) {

        if (!row) return;

        const customerId =
            row.dataset.id;

        const nameElement =
            row.querySelector(
                ".customer-name strong"
            );

        if (!customerId || !nameElement) return;

        const name =
            nameElement.textContent.trim();


        const confirmDelete =
            confirm(
                "Are you sure you want to delete " +
                name +
                "?"
            );


        if (!confirmDelete) return;


        try {

            const response =
                await fetch(
                    `/api/customers/${customerId}`,
                    {
                        method: "DELETE"
                    }
                );


            const data =
                await response.json();


            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Failed to delete customer."
                );

            }


            row.remove();


            alert(
                name +
                " has been deleted successfully."
            );


            applyCustomerFilters();


        } catch (error) {

            console.error(
                "Error deleting customer:",
                error
            );

            alert(
                error.message ||
                "Unable to delete customer."
            );

        }

    }


    // ================================
    // CUSTOMER ACTIONS
    // ================================

    function attachCustomerActions() {

        const viewButtons =
            document.querySelectorAll(".view-customer");

        const editButtons =
            document.querySelectorAll(".edit-customer");

        const deleteButtons =
            document.querySelectorAll(".delete-customer");


        // VIEW

        viewButtons.forEach(function (button) {

            if (button.dataset.attached === "true") return;

            button.dataset.attached = "true";

            button.addEventListener("click", function () {

                const row =
                    this.closest("tr");

                viewCustomer(row);

            });

        });


        // EDIT

        editButtons.forEach(function (button) {

            if (button.dataset.attached === "true") return;

            button.dataset.attached = "true";

            button.addEventListener("click", function () {

                const row =
                    this.closest("tr");

                editCustomer(row);

            });

        });


        // DELETE

        deleteButtons.forEach(function (button) {

            if (button.dataset.attached === "true") return;

            button.dataset.attached = "true";

            button.addEventListener("click", function () {

                const row =
                    this.closest("tr");

                deleteCustomer(row);

            });

        });

    }


    // ================================
    // LOGOUT
    // ================================

    const logoutButton =
        document.getElementById("logoutButton");


    if (logoutButton) {

        logoutButton.addEventListener("click", function (event) {

            event.preventDefault();

            const confirmLogout =
                confirm(
                    "Are you sure you want to logout?"
                );

            if (confirmLogout) {

                window.location.href =
                    "../index.html";

            }

        });

    }


    // ================================
    // INITIAL LOAD
    // ================================

    loadCustomers();

});