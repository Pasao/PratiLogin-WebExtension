// --------------------------
// Event Listener per i bottoni
document.addEventListener('DOMContentLoaded', () => {
    const openLoginButton = document.querySelector('.open-login-button');
    const openLogoutButton = document.querySelector('.open-logout-button');
    const startActionButton = document.querySelector('.start-action-button');
    const pinButton = document.querySelector('.pin-button');
    const refreshButton = document.querySelector('.refresh-button');
    const settingsButton = document.querySelector('.settings-button');
    const overlayMenu = document.querySelector('.overlay-menu');

    settingsButton.addEventListener('click', () => {
        overlayMenu.classList.toggle('visible');
        overlayMenu.style.display = overlayMenu.style.display === 'block' ? 'none' : 'block';
    });
    openLoginButton.addEventListener('click', () => openNewTab('https://cp-praticelli.unipi.it/login.php'));
    openLogoutButton.addEventListener('click', () => openNewTab('https://cp-praticelli.unipi.it/login.php?indexpage=session'));
    startActionButton.addEventListener('click', () => toggleExtensionState());
    pinButton.addEventListener('click', () => sendMessageToBackground({ action: "openSidePanel" }));
    refreshButton.addEventListener('click', () => {
        sendMessageToBackground({ action: "requestFormattedData" });
    });
});

// Funzione per creare una nuova scheda
const openNewTab = (url) => {
    chrome.tabs.create({ url: url });
};

// Funzione per inviare un messaggio allo script di background
const sendMessageToBackground = (message) => {
    chrome.runtime.sendMessage(message);
};

// Funzione per aggiornare lo stato dell'estensione
const toggleExtensionState = async () => {
    const extensionState = await chrome.storage.local.get('extensionActive');
    const newState = !extensionState.extensionActive;

    chrome.storage.local.set({ extensionActive: newState }, async () => {
        document.getElementById('toggleExtension').textContent = newState ? "Spegni Autologin" : "Attiva Autologin";
        console.log('Stato dell\'estensione cambiato:', newState ? "Attivo" : "Inattivo");

        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url && tab.url.includes("cp-praticelli.unipi.it/login.php")) {
            chrome.tabs.reload(tab.id);
        }
    });
};

// Bottone Salva
document.getElementById('save').addEventListener('click', function() {
    var username = document.getElementById('editUsername').value;
    var password = document.getElementById('editPassword').value;
    if (username && password) {
        chrome.storage.local.set({ username: username, password: password, credentialsSet: true }, async function() {
            console.log('Credenziali salvate.');

            // Pulisci i campi del form
            document.getElementById('editUsername').value = '';
            document.getElementById('editPassword').value = '';

            updateUI();

            // Gestione della pagina di login
            let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab.url.includes("cp-praticelli.unipi.it/login.php")) {
                chrome.tabs.reload(tab.id);
            }
        });
    }
});

// Bottone Elimina Credenziali
document.getElementById('delete').addEventListener('click', function() {
    chrome.storage.local.remove(['username', 'password'], function() {
        chrome.storage.local.set({ credentialsSet: false }, function() {
            console.log('Credenziali eliminate.');
            updateUI();
        });
    });
});

// Bottone Modifica
document.querySelector('.edit-button').addEventListener('click', function() {
    document.getElementById('editUserForm').style.display = 'block';
    document.querySelector('.last-user-info').style.display = 'none';
});

// Bottone Annulla Modifica
document.querySelector('.cancel-edit-button').addEventListener('click', function() {
    document.getElementById('editUserForm').style.display = 'none';
    document.querySelector('.last-user-info').style.display = 'block';
    updateUI();
});

// Bottone Mostra Password
document.getElementById('togglePasswordVisibility').addEventListener('click', function() {
    let passwordField = document.getElementById('editPassword');
    passwordField.type = passwordField.type === "password" ? "text" : "password";
});

// Update UI
const updateUI = () => {
    chrome.storage.local.get(['username', 'credentialsSet'], function(result) {
        // Aggiorna il nome utente salvato
        const lastSavedUsernameSpan = document.getElementById('lastSavedUsername');
        if (result.credentialsSet && result.username) {
            lastSavedUsernameSpan.textContent = result.username;
        } else {
            lastSavedUsernameSpan.textContent = 'Nessun utente salvato';
        }

        // Gestione della visualizzazione del form di modifica
        const editUserForm = document.getElementById('editUserForm');
        const lastUserInfoDiv = document.querySelector('.last-user-info');
        if (result.credentialsSet) {
            editUserForm.style.display = 'none';
            lastUserInfoDiv.style.display = 'block';
        } else {
            editUserForm.style.display = 'block';
            lastUserInfoDiv.style.display = 'none';
        }

        // Aggiungi qui altre logiche di aggiornamento UI se necessario
    });
};

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === "updateFormattedData") {
        // Aggiorna il display dell'ultimo login
        const lastLoginDisplay = document.getElementById('lastLoginDisplay');
        if (lastLoginDisplay) {
            lastLoginDisplay.textContent = message.formattedDate;
        }

        // Aggiorna il display del tempo trascorso dall'ultimo login
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            timerDisplay.textContent = message.formattedTimePassed;
        }
    }
});
