document.addEventListener('DOMContentLoaded', async () => {
    const toggle = document.getElementById('trackingToggle');
    const statusText = document.getElementById('statusText');
    const emailInput = document.getElementById('recipientEmail');
    const saveBtn = document.getElementById('saveBtn');
    const emailError = document.getElementById('emailError');
    const successMessage = document.getElementById('successMessage');

    // Helper function to validate email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Helper function to show error
    function showError(message) {
        emailError.textContent = message;
        emailError.style.display = 'block';
        successMessage.style.display = 'none';
        emailInput.classList.add('error');
    }

    // Helper function to show success
    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        emailError.style.display = 'none';
        emailInput.classList.remove('error');
    }

    // Helper function to clear messages
    function clearMessages() {
        emailError.style.display = 'none';
        successMessage.style.display = 'none';
        emailInput.classList.remove('error');
    }

    try {
        // Load saved settings
        const result = await browser.storage.sync.get(['trackingEnabled', 'recipientEmail']);
        toggle.checked = result.trackingEnabled || false;
        statusText.textContent = toggle.checked ? "Tracking is ON" : "Tracking is OFF";
        emailInput.value = result.recipientEmail || '';
    } catch (error) {
        console.error("Error loading settings:", error);
        showError("Failed to load saved settings");
    }

    // Toggle tracking status
    toggle.addEventListener('change', async () => {
        const enabled = toggle.checked;
        try {
            await browser.storage.sync.set({ trackingEnabled: enabled });
            statusText.textContent = enabled ? "Tracking is ON" : "Tracking is OFF";
            console.log("✅ Tracking setting updated:", enabled);
        } catch (error) {
            console.error("❌ Failed to update tracking setting:", error);
            toggle.checked = !enabled; // Revert the toggle
            showError("Failed to update tracking setting");
        }
    });

    // Save recipient email
    saveBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        clearMessages();

        if (!email) {
            showError("Please enter an email address");
            return;
        }

        if (!isValidEmail(email)) {
            showError("Please enter a valid email address");
            return;
        }

        try {
            await browser.storage.sync.set({ recipientEmail: email });
            console.log("✅ Recipient email saved:", email);
            showSuccess("Email saved successfully!");
        } catch (error) {
            console.error("❌ Failed to save email:", error);
            showError("Failed to save email. Please try again.");
        }
    });

    // Open dashboard
    document.getElementById("statusBtn").onclick = () => {
        window.open("https://mail-tracker-production-7e26.up.railway.app/dashboard", "_blank");
    };

    // Clear error on input
    emailInput.addEventListener('input', () => {
        clearMessages();
    });
});
