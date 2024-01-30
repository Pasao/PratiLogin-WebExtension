// Azioni quando installi l'estensione
chrome.runtime.onInstalled.addListener(function(details) {
console.log("daje roma. Hai scaricato l'app migliore!");
    if (details.reason === "install") {
        chrome.storage.local.set({ extensionActive: false, userIsLogged: false }, function() {
            console.log("L'estensione è impostata su inattiva per default. L'utente non è loggato.");
        });
    chrome.tabs.create({url: "FirstAccessWelcome/welcome.html"});
    setAlarmForNextMinute();
    }
});

// Se lo user chiede di aprire il pannello laterale
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "openSidePanel") {
        // Ottieni l'ID della finestra corrente
        chrome.windows.getCurrent((win) => {
            // Apri il side panel nella finestra corrente
            chrome.sidePanel.open({ windowId: win.id }).catch(console.error);
        });
    }
});

//
chrome.runtime.onStartup.addListener(function() {
    setAlarmForNextMinute();
});

//------------ TIMER --------------
function calculateAndSaveData() {
    chrome.storage.local.get('lastLoginTime', function(result) {
        if (chrome.runtime.lastError) {
            console.error("Errore nel recupero di lastLoginTime:", chrome.runtime.lastError);
            return;
        }
        console.log("salvo ultimi dati timer");
        if (result.lastLoginTime) {
            const formattedDate = formatDate(result.lastLoginTime);
            const formattedTimePassed = formatTimePassed(result.lastLoginTime);

            chrome.storage.local.set({
                formattedDate: formattedDate,
                formattedTimePassed: formattedTimePassed
            });
        } else {
            // Gestione del caso in cui non c'è ancora un lastLoginTime
            chrome.storage.local.set({
                formattedDate: "Login non ancora effettuato",
                formattedTimePassed: ""
            });
        }
    });
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log("richiesti dati timer");
    if (message.action === "requestFormattedData") {
        calculateAndSaveData(); // Aggiorna i dati
        chrome.storage.local.get(['formattedDate', 'formattedTimePassed'], function(result) {
            console.log("invio dati timer");
            if (result.formattedDate) { // Verifica solo formattedDate, dato che formattedTimePassed potrebbe essere vuoto
                chrome.runtime.sendMessage({ 
                    action: "updateFormattedData", 
                    formattedDate: result.formattedDate, 
                    formattedTimePassed: result.formattedTimePassed 
                });
            }
        });
    }
});

function formatDate(lastLoginTime) {
    console.log("Calcolo format date.");
    const now = new Date();
    const loginDate = new Date(lastLoginTime);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const loginDay = new Date(loginDate.getFullYear(), loginDate.getMonth(), loginDate.getDate());
    const diffTime = today - loginDay;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    const hours = loginDate.getHours().toString().padStart(2, '0');
    const minutes = loginDate.getMinutes().toString().padStart(2, '0');

    if (diffDays === 0) {
        return `Oggi alle ${hours}:${minutes}`;
    } else if (diffDays === 1) {
        return `Ieri alle ${hours}:${minutes}`;
    } else {
        return `${diffDays} giorni fa alle ${hours}:${minutes}`;
    }
}

function formatTimePassed(lastLoginTime) {
    console.log("Calcolo format time passed.");
    const now = new Date();
    const loginDate = new Date(lastLoginTime);
    const diffTime = now - loginDate;
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours < 1) {
        return `Sono passati circa ${diffMinutes}-${diffMinutes+1} minuti da quel momento`;
    } else {
        return `Sono passate circa ${diffHours} ore e ${diffMinutes % 60} minuti da quel momento`;
    }
}

function setAlarmForNextMinute() {
    chrome.storage.local.get('lastLoginTime', function(result) {
        if (chrome.runtime.lastError) {
            console.error("Errore nel recupero di lastLoginTime:", chrome.runtime.lastError);
            return;
        }

        if (result.lastLoginTime) {
            const now = new Date();
            const delayInMinutes = (60 - now.getSeconds()) / 60;
            chrome.alarms.create('updateTimer', { delayInMinutes: delayInMinutes });
        } else {
            console.error("Nessun lastLoginTime trovato.");
        }
    });
}

chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name === 'updateTimer') {
        calculateAndSaveData();
        // Imposta l'allarme per il prossimo minuto
        chrome.alarms.create('updateTimer', { delayInMinutes: 1 });
    }
});

//------------ Login Part --------------
let isLoginAttempt = false;
// Messaggio da login.js
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === "loginAttempt") {
      isLoginAttempt = true;
    }
});

// Check logout page
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (isLoginAttempt && changeInfo.url && changeInfo.url.includes("login.php?indexpage=session")) {
        console.log("entroqui");
        isLoginAttempt = false;
        console.log("entroqui1.5");
        // Aspetta un breve intervallo prima di inviare il messaggio
        setTimeout(() => {
            chrome.tabs.sendMessage(tabId, { action: "checkLogoutPage" }, function(response) {
                if (chrome.runtime.lastError) {
                    console.log("Errore nell'invio del messaggio:", chrome.runtime.lastError.message);
                    return;
                }
                console.log("entroqui2");
                if (response && response.isLogoutPage) {
                    const now = new Date();
                    chrome.storage.local.set({ lastLoginTime: now.toISOString(), userIsLogged: true }, function() {
                        chrome.storage.local.get(['lastLoginTime', 'userIsLogged'], function(data) {
                            console.log("lastlogintime:", data.lastLoginTime);
                            if (data.userIsLogged === true) {
                                // Imposta un allarme per il prossimo minuto esatto
                                setAlarmForNextMinute();
                            }
                        });
                        calculateAndSaveData();
                        // Chiudi la scheda dopo 2 secondi
                        setTimeout(() => {
                            chrome.tabs.remove(tabId, function() {
                                if (chrome.runtime.lastError) {
                                    console.log("Errore nella chiusura della scheda:", chrome.runtime.lastError.message);
                                } else {
                                    console.log("Scheda chiusa con successo.");
                                }
                            });
                        }, 2000); // aspetta ulteriori 2 secondi
                    });
                } else {
                    console.log("Errore: la pagina di logout non è stata verificata correttamente.");
                }
            });
        }, 5000); // aspetta 5 secondi
    }
});

