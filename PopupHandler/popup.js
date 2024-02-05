//Update UI
function updateUI() {
    chrome.storage.local.get(['username', 'password', 'credentialsSet'], function(items) {
        if (items.credentialsSet) {
            // Credenziali salvate
            document.getElementById('savedUsername').textContent = items.username;
            document.getElementById('savedPassword').textContent = '[Privata]';
            document.getElementById('credentials').style.display = 'block';
            document.getElementById('editCredentials').style.display = 'none';
            document.getElementById('edit').style.display = 'block';
        } else {
            // Nessuna credenziale salvata
            document.getElementById('credentials').style.display = 'none';
            document.getElementById('editCredentials').style.display = 'block';
            document.getElementById('edit').style.display = 'none';
        }
    });
}

// Al caricamento del DOM
let updateInterval;
document.addEventListener('DOMContentLoaded', function() {
    const updateButton = document.getElementById('updateButton');
    updateButton.addEventListener('click', function() {
        periodicallyUpdateDisplay();
    });
    // Aggiorna lo stato del pulsante di attivazione/disattivazione dell'autologin
    chrome.storage.local.get('extensionActive', function(data) {
        document.getElementById('toggleExtension').textContent = data.extensionActive ? "Spegni Autologin" : "Attiva Autologin";
    });

    // Imposta l'intervallo di aggiornamento
    if (!updateInterval) {
        updateInterval = setInterval(periodicallyUpdateDisplay, 30000);
    }

    // Aggiorna immediatamente al caricamento
    periodicallyUpdateDisplay();

    // Session reset button.
    chrome.storage.local.get('extensionActive', function(data) {
        toggleSessionResetButton(data.extensionActive);
    });

    var sessionReset = document.getElementById('sessionReset');
    sessionReset.addEventListener('click', function() {
        callRunMainFunction();
    });
    
    document.getElementById('connectionTest').addEventListener('click', callConnectionTest);

    // Aggiorna l'interfaccia utente in base allo stato corrente delle credenziali
    updateUI();
});

function periodicallyUpdateDisplay() {
    chrome.runtime.sendMessage({ action: "requestFormattedData" });
}

// Bottone salva
document.getElementById('save').addEventListener('click', function() {
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    if (username && password) {
        chrome.storage.local.set({ username: username, password: password, credentialsSet: true }, 
            async function() {
            console.log('Credenziali salvate.');

            // Pulisci i campi del form
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';

            updateUI();
        });
    }
});

// Bottone elimina credenziali
document.getElementById('delete').addEventListener('click', function() {
    chrome.storage.local.remove(['username', 'password'], function() {
        chrome.storage.local.set({ credentialsSet: false }, function() {
            console.log('Credenziali eliminate.');
            updateUI();
        });
    });
});

// Bottone modifica
document.getElementById('edit').addEventListener('click', function() {
    document.getElementById('editCredentials').style.display = 'block';
    document.getElementById('credentials').style.display = 'none';
});

// Bottone annulla modifica
document.getElementById('cancelEdit').addEventListener('click', function() {
    updateUI();
});

// Bottone Mostra Password (Occhio)
document.getElementById('togglePasswordVisibility').addEventListener('click', function() {
    let passwordField = document.getElementById('password');
    if (passwordField.type === "password") {
        passwordField.type = "text";
    } else {
        passwordField.type = "password";
    }
});

// Bottone Open Login Page
document.getElementById('openLogin').addEventListener('click', function() {
    chrome.tabs.create({ url: 'https://cp-praticelli.unipi.it/login.php' });
});

// Bottone Open Logout Page
document.getElementById('openLogout').addEventListener('click', function() {
    chrome.tabs.create({ url: 'https://cp-praticelli.unipi.it/login.php?indexpage=session' });
});

// Bottone Open Side Panel - Nascondi pin
document.getElementById('openSidePanel').addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: "openSidePanel" });
});

// Bottone Spegni/Accendi Estensione
document.getElementById('toggleExtension').addEventListener('click', async function() {
    chrome.storage.local.get('extensionActive', async function(data) {
        let newState = !data.extensionActive;
        chrome.storage.local.set({ extensionActive: newState }, function() {
            document.getElementById('toggleExtension').textContent = newState ? "Spegni Autologin" : "Attiva Autologin";
            console.log('Stato dell\'estensione cambiato:', newState ? "Attivo" : "Inattivo");

            toggleSessionResetButton(newState);

            if (newState) {
                callRunMainFunction(); // Chiama callRunMainFunction se il nuovo stato è attivo
            }
        });
    });
});

// Funzione per mostrare/nascondere il bottone sessionReset
function toggleSessionResetButton(isExtensionActive) {
    const sessionResetButton = document.getElementById('sessionReset');
    if (isExtensionActive) {
        sessionResetButton.style.display = 'block'; // Mostra il pulsante
    } else {
        sessionResetButton.style.display = 'none'; // Nasconde il pulsante
    }
}

//------------- TIMER --------------

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === "updateFormattedData") {
        document.getElementById('lastLoginDisplay').textContent = message.formattedDate;
        document.getElementById('timerDisplay').textContent = message.formattedTimePassed;
    }
});

//---------------

function callRunMainFunction(){
    chrome.runtime.sendMessage({command: "runMainFunction"}, function(response) {
        console.log("Chiamata al background di connessione: ",response.result);
    });
}

function callConnectionTest(){
    chrome.runtime.sendMessage({command: "runConnectionTest"}, function(response) {
        console.log("Chiamata al background del test di connessione: ",response.result);
    });
}