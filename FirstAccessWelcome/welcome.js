document.getElementById('save').addEventListener('click', function() {
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    if (/*controlButtonClicked &&*/ username && password) {
        chrome.storage.local.set({ username: username, password: password, credentialsSet: true }, 
        function() {
            console.log('Credenziali salvate dal sito.');
            document.getElementById('message').style.display = 'block';
            // Invia un messaggio allo script di background per aprire il side panel
            chrome.runtime.sendMessage({ action: "openSidePanel" });
        });
    } else {
        var messageWrongSteps = document.getElementById("messageWrongSteps");
        messageWrongSteps.style.display = "block";
        messageWrongSteps.innerHTML = "Controlla di aver eseguito il logout e di aver inserito le credenziali.";
    }
});

// Bottone Mostra Password (Occhio)
document.getElementById('togglePasswordVision').addEventListener('click', function() {
    let passwordField = document.getElementById('password');
    if (passwordField.type === "password") {
        passwordField.type = "text";
    } else {
        passwordField.type = "password";
    }
});

document.getElementById('closeOrRedirectButton').addEventListener('click', closeTabOrRedirect);

function closeTabOrRedirect() {
    chrome.tabs.query({}, function(tabs) {
        if (tabs.length > 1) {
            // Se ci sono più schede aperte, chiudi questa scheda
            chrome.tabs.getCurrent(function(tab) {
                chrome.tabs.remove(tab.id);
            });
        } else {
            // Se questa è l'unica scheda aperta, reindirizza a Google
            window.location.href = 'https://www.google.com';
        }
    });
}

// Bottone Open Logout Page
/*
var controlButtonClicked = false;
document.getElementById('openLogoutPage').addEventListener('click', function() {
    this.style.display = "none";

    // Mostra il messaggio di controllo
    var messageContainer = document.getElementById("messageContainer");
    messageContainer.style.display = "block";
    messageContainer.innerHTML = "Controllo effettuato! Grazie";
    controlButtonClicked = true;

    chrome.tabs.create({ url: 'https://cp-praticelli.unipi.it/login.php?indexpage=session' });
});
*/