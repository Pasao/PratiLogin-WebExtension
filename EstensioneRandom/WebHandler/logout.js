console.log("logout.js caricato");

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === "checkLogoutPage") {
        console.log("Controllo se è la pagina di logout");
        setTimeout(function() { // Simula un'attività asincrona
            const isLogoutPage = checkIfLogoutPage(); 
            sendResponse({ isLogoutPage: isLogoutPage });
            console.log("E' la pagina?", isLogoutPage);
        }, 0);
        return true; // Indica che sendResponse verrà chiamata in modo asincrono
    }
});

function checkIfLogoutPage() {
    const isLogoutUrl = document.URL.includes("login.php?indexpage=session");
    const hasLogoutMessage = document.body.textContent.includes("Buona navigazione");
    const hasDisconnectButton = !!document.querySelector("input[value='Disconnetti']"); // Converti in booleano

    return isLogoutUrl && hasLogoutMessage && hasDisconnectButton;
}

  