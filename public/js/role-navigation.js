document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("/api/auth/me", {
            method: "GET",
            credentials: "include",
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) return;

        const data = await response.json();
        const role = data.user?.role;

        if (!["director", "manager"].includes(role)) return;

        const dashboard = role === "director"
            ? "director-dashboard.html"
            : "manager-dashboard.html";

        const products = role === "director"
            ? "director-product.html"
            : "product.html";

        document.querySelectorAll("a[href]").forEach(link => {
            const href = link.getAttribute("href");
            if (!href || href.startsWith("#")) return;

            const filename = href.split("?")[0].split("/").pop();

            if (
                filename === "manager-dashboard.html" ||
                filename === "director-dashboard.html"
            ) {
                link.href = dashboard;
            } else if (
                ["products.html", "product.html",
                 "director-products.html", "director-product.html"].includes(filename)
            ) {
                link.href = products;
            } else if (filename === "customers.html") {
                link.href = "customer.html";
            } else if (filename === "reports.html") {
                link.href = "report.html";
            }
        });

    } catch (error) {
        console.error("Role navigation could not be configured:", error);
    }
});
