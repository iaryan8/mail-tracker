
(function () {
    const SERVER_HOST = 'https://mail-tracker-production-7e26.up.railway.app';
    let trackingEnabled = false;
    let recipientEmail = '';

    // Helper function to log messages
    function log(message, type = 'info') {
        const icon = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        }[type];
        console.log(`${icon} Mail Tracker: ${message}`);
    }

    // Initialize tracking settings
    async function initializeTracking() {
        try {
            const result = await browser.storage.sync.get(['trackingEnabled', 'recipientEmail']);
            trackingEnabled = result.trackingEnabled || false;
            recipientEmail = result.recipientEmail || '';
            
            if (!trackingEnabled) {
                log('Tracking is disabled', 'warning');
                return;
            }
            
            if (!recipientEmail || !recipientEmail.includes('@')) {
                log('Invalid or missing recipient email', 'warning');
                return;
            }

            log('Tracking initialized successfully', 'success');
            attachSendListener();
        } catch (error) {
            log(`Failed to initialize tracking: ${error.message}`, 'error');
        }
    }

    // Create and insert tracking pixel
    function createTrackingPixel(bodyElem) {
        const uniqueId = Date.now();
        const img = document.createElement('img');
        img.src = `${SERVER_HOST}/track?id=${uniqueId}`;
        img.width = 1;
        img.height = 1;
        img.style.display = 'none';
        bodyElem.appendChild(img);
        
        log(`Tracking pixel inserted with ID: ${uniqueId}`, 'success');
        return uniqueId;
    }

    // Send email data to background script
    async function sendEmailData(data) {
        try {
            await browser.runtime.sendMessage({
                action: 'storeEmail',
                ...data
            });
            log('Email data sent to background script', 'success');
        } catch (error) {
            log(`Failed to send email data: ${error.message}`, 'error');
            throw error;
        }
    }

    // Attach listener to send button
    function attachSendListener() {
        const sendButtons = document.querySelectorAll('div[aria-label^="Send"], div[data-tooltip*="Send"]');
        
        sendButtons.forEach(btn => {
            if (!btn.hasAttribute('data-tracker-listener')) {
                btn.setAttribute('data-tracker-listener', 'true');
                log('Listener attached to Send button', 'success');

                btn.addEventListener('click', handleSendClick);
            }
        });
    }

    // Handle send button click
    async function handleSendClick() {
        setTimeout(async () => {
            try {
                const bodyElem = document.querySelector('div[aria-label="Message Body"]');
                const subjectElem = document.querySelector('input[name="subjectbox"]');

                if (!bodyElem) {
                    log('Message body not found', 'error');
                    return;
                }

                if (!trackingEnabled) {
                    log('Tracking is disabled', 'warning');
                    return;
                }

                if (!recipientEmail || !recipientEmail.includes('@')) {
                    log('Invalid recipient email', 'warning');
                    return;
                }

                const uniqueId = createTrackingPixel(bodyElem);
                const subject = subjectElem ? subjectElem.value : '';

                await sendEmailData({
                    subject,
                    to: recipientEmail,
                    content: bodyElem.innerHTML,
                    id: uniqueId
                });

            } catch (error) {
                log(`Error processing email: ${error.message}`, 'error');
            }
        }, 1000);
    }

    // Watch for DOM changes to reattach listeners
    function observeDOMChanges() {
        const observer = new MutationObserver(() => {
            if (trackingEnabled) {
                attachSendListener();
            }
        });

        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });

        log('DOM observer initialized', 'success');
    }

    // Initialize the extension
    initializeTracking();
    observeDOMChanges();
})();
