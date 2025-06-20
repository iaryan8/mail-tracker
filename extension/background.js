// console.log('✅ ');
// console.log('✅ ');
// console.log('✅ ');
// console.log('✅ ');
// browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//   if (request.action === 'storeEmail') {
//     console.log("📥 Received message in background.js:", request);
//     console.log('✅ ');
    
  
//     fetch('https://mail-tracker-production-7e26.up.railway.app/store', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         subject: request.subject,
//         to: request.to,
//         content: request.content,
//         id: request.id
//       })
//     })
//     .then(response => {
//       if (!response.ok) {
//         console.error("❌ Server returned error:", response.status);
//       } else {
//         console.log('✅ Email data successfully sent to Flask:', response.status);
//       }
//     })
//     .catch(error => {
//       console.error('❌ Error sending email data to Flask:', error);
//     });
//   }
// });
// console.log('✅ ');

console.log('✅ Background script loaded');
console.log('✅ Ready to receive messages');

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'storeEmail') {
    console.log("📥 Received message in background.js:", request);

    fetch('https://mail-tracker-production-7e26.up.railway.app/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: request.subject,
        to: request.to,
        content: request.content,
        id: request.id
      })
    })
    .then(response => {
      console.log("📡 Response received:", response);
      return response.text().then(text => {
        console.log("📩 Response text:", text);

        if (!response.ok) {
          console.error("❌ Server error:", response.status, text);
        } else {
          console.log("✅ Email data successfully sent to Flask:", response.status);
        }
      });
    })
    .catch(error => {
      console.error("❌ Fetch failed:", error);
    });
  }
});

console.log('✅ Listener registered');
