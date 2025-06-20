const SERVER_HOST = 'https://mail-tracker-production-7e26.up.railway.app';

// Helper function to log messages
function log(message, type = 'info') {
    const icon = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌'
    }[type];
    console.log(`${icon} Background: ${message}`);
}

// Handle messages from content script
browser.runtime.onMessage.addListener(async (message, sender) => {
    if (message.action === 'storeEmail') {
        try {
            log(`Processing email data for ID: ${message.id}`, 'info');
            
            const response = await fetch(`${SERVER_HOST}/store`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subject: message.subject,
                    to: message.to,
                    content: message.content,
                    id: message.id
                })
            });

            const responseText = await response.text();
            
            if (!response.ok) {
                throw new Error(`Server responded with status ${response.status}: ${responseText}`);
            }

            log(`Email tracking data stored for ID: ${message.id}`, 'success');
            return true;

        } catch (error) {
            log(`Failed to store email data: ${error.message}`, 'error');
            return false;
        }
    }
});

// Log extension initialization
log('Background script initialized', 'success');
