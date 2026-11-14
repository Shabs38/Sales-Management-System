document.addEventListener("DOMContentLoaded", () => {
    const $ = selector => document.querySelector(selector);

    const form = $("#expenseForm");
    const table = $("#expenseHistory");
    const messageBox = $("#messageBox");

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

    async function configureNavigation() {
        try {
            const data = await api("/api/auth/me");
            const role = data.user?.role;

            const dashboardLink = $("#dashboardLink");
            const productsLink = $("#productsLink");
            const settingsLink = $("#settingsLink");

            if (role === "manager") {
                if (dashboardLink) {
                    dashboardLink.href = "manager-dashboard.html";
                }

                if (productsLink) {
                    productsLink.href = "product.html";
                }

                if (settingsLink) {
                    settingsLink.remove();
                }
            } else if (role === "director") {
                if (dashboardLink) {
                    dashboardLink.href = "director-dashboard.html";
                }

                if (productsLink) {
                    productsLink.href = "director-product.html";
                }
            }
        } catch (error) {
            console.error("Could not load user navigation:", error);
        }
    }

    function renderExpenses(expenses) {
        table.innerHTML = "";

        if (!expenses.length) {
            table.innerHTML =
                '<tr><td colspan="5">No expenses found.</td></tr>';
            return;
        }

        expenses.forEach(expense => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${escapeHTML(expense.expense_date)}</td>
                <td>${escapeHTML(expense.category)}</td>
                <td>${escapeHTML(expense.description || "-")}</td>
                <td>${escapeHTML(expense.created_by_name || "-")}</td>
                <td>${money(expense.amount)}</td>
            `;

            table.appendChild(row);
        });
    }

    async function loadExpenses() {
        const category = $("#categoryFilter").value;
        const search = $("#expenseSearch").value.trim();

        const params = new URLSearchParams();

        if (category) params.set("category", category);
        if (search) params.set("search", search);

        try {
            const data = await api(`/api/expenses?${params.toString()}`);
            const expenses = data.expenses || [];

            renderExpenses(expenses);

            const total = expenses.reduce(
                (sum, expense) => sum + Number(expense.amount || 0),
                0
            );

            $("#totalExpenses").textContent = expenses.length;
            $("#totalExpenseAmount").textContent = money(total);
        } catch (error) {
            showMessage(error.message, "error");
        }
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const payload = {
            category: $("#expenseCategory").value,
            amount: Number($("#expenseAmount").value),
            expense_date: $("#expenseDate").value,
            description: $("#expenseDescription").value.trim()
        };

        if (
            !payload.category ||
            !Number.isFinite(payload.amount) ||
            payload.amount <= 0 ||
            !payload.expense_date
        ) {
            showMessage("Enter a valid category, amount and date.", "error");
            return;
        }

        const button = $("#saveExpenseButton");
        button.disabled = true;
        button.textContent = "Saving...";

        try {
            const data = await api("/api/expenses", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            showMessage(data.message || "Expense saved successfully.");

            form.reset();
            setToday();
            await loadExpenses();
        } catch (error) {
            showMessage(error.message, "error");
        } finally {
            button.disabled = false;
            button.textContent = "Save Expense";
        }
    });

    function setToday() {
        const today = new Date();

        $("#expenseDate").value =
            `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    }

    $("#categoryFilter").addEventListener("change", loadExpenses);

    $("#expenseSearch").addEventListener("input", () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(loadExpenses, 300);
    });

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

    setToday();
    configureNavigation();
    loadExpenses();
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
