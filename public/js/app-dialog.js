/* =========================================
   SALES MANAGEMENT SYSTEM
   REUSABLE CUSTOM DIALOGUE COMPONENT
========================================= */

(function () {
    "use strict";

    if (window.appDialog) {
        return;
    }

    const style = document.createElement("style");

    style.textContent = `
        .app-dialog-overlay {
            position: fixed;
            inset: 0;
            z-index: 100000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(15, 23, 42, 0.55);
            backdrop-filter: blur(4px);
        }

        .app-dialog-overlay[hidden] {
            display: none !important;
        }

        .app-dialog-box {
            width: 100%;
            max-width: 420px;
            padding: 28px;
            background: #ffffff;
            border-radius: 18px;
            box-shadow: 0 25px 70px rgba(0, 0, 0, 0.2);
            animation: appDialogEnter 0.2s ease-out;
            font-family: Arial, sans-serif;
        }

        .app-dialog-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 54px;
            height: 54px;
            margin-bottom: 18px;
            border-radius: 50%;
            font-size: 25px;
            font-weight: bold;
        }

        .app-dialog-icon.info {
            color: #08717d;
            background: #e0f2f4;
        }

        .app-dialog-icon.success {
            color: #15803d;
            background: #dcfce7;
        }

        .app-dialog-icon.error {
            color: #b91c1c;
            background: #fee2e2;
        }

        .app-dialog-icon.warning {
            color: #b45309;
            background: #fef3c7;
        }

        .app-dialog-title {
            margin: 0 0 10px;
            color: #111827;
            font-size: 21px;
            font-weight: 700;
        }

        .app-dialog-message {
            margin: 0 0 24px;
            color: #4b5563;
            font-size: 14px;
            line-height: 1.7;
            overflow-wrap: anywhere;
            white-space: pre-wrap;
        }

        .app-dialog-input {
            display: block;
            width: 100%;
            box-sizing: border-box;
            margin: 0 0 22px;
            padding: 12px 14px;
            border: 1px solid #d1d5db;
            border-radius: 9px;
            outline: none;
            font-size: 15px;
        }

        .app-dialog-input:focus {
            border-color: #08717d;
            box-shadow: 0 0 0 3px rgba(8, 113, 125, 0.12);
        }

        .app-dialog-actions {
            display: flex;
            justify-content: flex-end;
            flex-wrap: wrap;
            gap: 10px;
        }

        .app-dialog-button {
            min-height: 42px;
            padding: 10px 17px;
            border: none;
            border-radius: 9px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .app-dialog-button:hover {
            opacity: 0.9;
        }

        .app-dialog-button:active {
            transform: scale(0.98);
        }

        .app-dialog-button:focus-visible {
            outline: 3px solid rgba(8, 113, 125, 0.3);
            outline-offset: 3px;
        }

        .app-dialog-primary {
            color: #ffffff;
            background: #08717d;
        }

        .app-dialog-danger {
            color: #ffffff;
            background: #dc2626;
        }

        .app-dialog-secondary {
            color: #374151;
            background: #f3f4f6;
        }

        @keyframes appDialogEnter {
            from {
                opacity: 0;
                transform: translateY(8px) scale(0.98);
            }

            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        @media (max-width: 480px) {
            .app-dialog-box {
                padding: 23px;
            }

            .app-dialog-actions {
                flex-direction: column-reverse;
            }

            .app-dialog-button {
                width: 100%;
            }
        }
    `;

    document.head.appendChild(style);

    const overlay = document.createElement("div");

    overlay.className = "app-dialog-overlay";
    overlay.hidden = true;

    overlay.innerHTML = `
        <section
            class="app-dialog-box"
            role="dialog"
            aria-modal="true"
            aria-labelledby="appDialogTitle"
            aria-describedby="appDialogMessage"
        >
            <div class="app-dialog-icon info" id="appDialogIcon">
                i
            </div>

            <h2 class="app-dialog-title" id="appDialogTitle">
                Notification
            </h2>

            <p class="app-dialog-message" id="appDialogMessage"></p>

            <input
                class="app-dialog-input"
                id="appDialogInput"
                type="text"
                autocomplete="off"
                hidden
            >

            <div class="app-dialog-actions" id="appDialogActions"></div>
        </section>
    `;

    document.body.appendChild(overlay);

    const titleElement =
        overlay.querySelector("#appDialogTitle");

    const messageElement =
        overlay.querySelector("#appDialogMessage");

    const iconElement =
        overlay.querySelector("#appDialogIcon");

    const inputElement =
        overlay.querySelector("#appDialogInput");

    const actionsElement =
        overlay.querySelector("#appDialogActions");

    let currentResolver = null;
    let previousFocus = null;

    function closeDialog(result) {
        if (overlay.hidden) {
            return;
        }

        overlay.hidden = true;
        document.body.style.overflow = "";

        if (currentResolver) {
            const resolve = currentResolver;
            currentResolver = null;
            resolve(result);
        }

        if (previousFocus && previousFocus.isConnected) {
            previousFocus.focus();
        }

        previousFocus = null;
    }

    function addButton(text, className, result) {
        const button = document.createElement("button");

        button.type = "button";
        button.className =
            "app-dialog-button " + className;

        button.textContent = text;

        button.addEventListener("click", function () {
            closeDialog(result);
        });

        actionsElement.appendChild(button);

        return button;
    }

    function show(options) {
        if (currentResolver) {
            closeDialog(false);
        }

        options = options || {};

        previousFocus = document.activeElement;

        titleElement.textContent =
            options.title || "Notification";

        messageElement.textContent =
            options.message || "";

        const type = options.type || "info";

        const icons = {
            info: "i",
            success: "✓",
            error: "!",
            warning: "!"
        };

        iconElement.className =
            "app-dialog-icon " +
            (icons[type] ? type : "info");

        iconElement.textContent =
            icons[type] || "i";

        inputElement.hidden = !options.input;

        inputElement.value = "";
        inputElement.placeholder =
            options.placeholder || "";

        actionsElement.replaceChildren();

        overlay.hidden = false;
        document.body.style.overflow = "hidden";

        return new Promise(function (resolve) {
            currentResolver = resolve;

            if (options.input) {
                inputElement.focus();
            } else {
                const firstButton =
                    actionsElement.querySelector("button");

                if (firstButton) {
                    firstButton.focus();
                }
            }
        });
    }

    async function alertDialog(message, options) {
        options = options || {};

        await show({
            title: options.title || "Notification",
            message: message,
            type: options.type || "info"
        }).then(function () {});

        return true;
    }

    async function confirmDialog(message, options) {
        options = options || {};

        return show({
            title: options.title || "Confirm Action",
            message: message,
            type: options.type || "warning"
        }).then(function (unused) {
            return unused;
        });
    }

    /*
       Configure the buttons separately so the result is explicit.
    */

    function openDialog(options) {
        if (currentResolver) {
            closeDialog(false);
        }

        options = options || {};

        previousFocus = document.activeElement;

        titleElement.textContent =
            options.title || "Notification";

        messageElement.textContent =
            options.message || "";

        const type = options.type || "info";

        const icons = {
            info: "i",
            success: "✓",
            error: "!",
            warning: "!"
        };

        iconElement.className =
            "app-dialog-icon " +
            (icons[type] ? type : "info");

        iconElement.textContent =
            icons[type] || "i";

        inputElement.hidden = !options.input;
        inputElement.value = "";
        inputElement.placeholder =
            options.placeholder || "";

        actionsElement.replaceChildren();

        return new Promise(function (resolve) {
            currentResolver = resolve;

            if (options.cancelText) {
                addButton(
                    options.cancelText,
                    "app-dialog-secondary",
                    false
                );
            }

            const confirmButton = addButton(
                options.confirmText || "OK",
                options.danger
                    ? "app-dialog-danger"
                    : "app-dialog-primary",
                true
            );

            overlay.hidden = false;
            document.body.style.overflow = "hidden";

            if (options.input) {
                inputElement.focus();
            } else {
                confirmButton.focus();
            }
        });
    }

    window.appDialog = {
        alert: async function (message, options) {
            await openDialog({
                ...(options || {}),
                message: message,
                confirmText: "OK"
            });

            return true;
        },

        confirm: async function (message, options) {
            return openDialog({
                ...(options || {}),
                message: message,
                title:
                    (options && options.title) ||
                    "Confirm Action",
                cancelText: "Cancel",
                confirmText:
                    (options && options.confirmText) ||
                    "Continue"
            });
        },

        prompt: async function (message, options) {
            options = options || {};

            const result = await openDialog({
                ...options,
                message: message,
                input: true,
                cancelText: "Cancel",
                confirmText:
                    options.confirmText || "Submit"
            });

            if (!result) {
                return null;
            }

            return inputElement.value;
        }
    };

    overlay.addEventListener("click", function (event) {
        if (event.target === overlay) {
            closeDialog(false);
        }
    });

    document.addEventListener("keydown", function (event) {
        if (overlay.hidden) {
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            closeDialog(false);
        }

        if (
            event.key === "Enter" &&
            document.activeElement === inputElement
        ) {
            event.preventDefault();

            const button =
                actionsElement.querySelector(
                    ".app-dialog-primary, .app-dialog-danger"
                );

            if (button) {
                button.click();
            }
        }
    });
})();
