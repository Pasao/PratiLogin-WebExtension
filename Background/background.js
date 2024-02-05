// Azioni quando installi l'estensione
chrome.runtime.onInstalled.addListener(function(details) {
console.log("daje roma. L'utente ha scaricato l'estensione!");
    if (details.reason === "install") {
        chrome.storage.local.set({ extensionActive: false,  sessionId: '' }, function() {
            console.log("L'estensione è impostata su inattiva per default. L'utente non è loggato. SessionId = ''.");
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

//================ TIMER ======================

//Il tempo prima di fare il prossimo autologin (in minuti).
const TIME_TO_NEXT_LOGIN = 705;

function setLoginAlarm() {
    // 11 ore e 45 minuti in minuti = 707
    const minutesUntilAlarm = TIME_TO_NEXT_LOGIN; // Cambialo a due minuti per test.
    console.log(`Hai eseguito il login. Fra ${minutesUntilAlarm} minuti eseguirò il nuovo login.`)
    chrome.alarms.create("reloginAlarm", { delayInMinutes: minutesUntilAlarm });
}

chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name === "reloginAlarm") {
        console.log("Allarme scattato. E' il momento di rifare il login. (Daje che te lo faccio io.)")
        mainFunction(); // Richiama mainFunction quando l'allarme scatta
    }
});

function calculateAndSaveData() {
    chrome.storage.local.get('lastLoginTime', function(result) {
        if (chrome.runtime.lastError) {
            console.error("Errore nel recupero di lastLoginTime:", chrome.runtime.lastError);
            return;
        }
        console.log("salvo ultimi dati timer");
        if (result.lastLoginTime) {
            const formattedDate = formatDate(result.lastLoginTime);
            const formattedTimePassed = formatTimeToNextLogin(result.lastLoginTime);

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

function formatTimeToNextLogin(lastLoginTime) {
    console.log("Calcolo il tempo al prossimo autologin.");
    const now = new Date();
    const loginDate = new Date(lastLoginTime);

    // Calcolo il momento del prossimo autologin (11 ore e 45 minuti dopo l'ultimo login)
    const nextLoginTime = new Date(loginDate.getTime() + 705 * 60000);

    // Calcolo il tempo rimanente al prossimo autologin
    const timeRemaining = nextLoginTime - now;

    if (timeRemaining < 0) {
        // Se il tempo è già passato, mostra un messaggio appropriato
        return "Il prossimo autologin è già dovuto avvenire";
    }

    const remainingMinutes = Math.floor(timeRemaining / (1000 * 60));
    const remainingHours = Math.floor(remainingMinutes / 60);

    if (remainingHours < 1) {
        return `Prossimo autologin fra circa ${remainingMinutes} minuti`;
    } else {
        return `Prossimo autologin fra circa ${remainingHours} ore e ${remainingMinutes % 60} minuti`;
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
            console.log("lastLoginTime non trovato. Potrebbe essere la prima installazione o non è ancora stato impostato.");
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

//================ LOGIN LOGIC ======================

// Listen to popup request on connection.
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.command === "runMainFunction") {
        mainFunction();
        sendResponse({result: "mainFunction eseguita"});
    }
});

// Estrae valori da redirect URL
function extractValue(html, name) {
    const pattern = new RegExp(`<input[^>]+name=['"]${name}['"][^>]+value=['"]([^'"]+)['"]`, 'i');
    const match = html.match(pattern);
    return match ? match[1] : null;
}

// Usa l'URL di Redirect.
async function redirectToLoginPage() {
    const response = await fetch("http://172.100.10.1/externalGuestRedirect.html?redirectPage=0?cid=-3");
    const html = await response.text();
    const redirectUrlMatch = html.match(/window\.location = '([^']+)'/);
    const redirectUrl = redirectUrlMatch ? redirectUrlMatch[1] : null;
    if (!redirectUrl) {
        throw new Error("URL di reindirizzamento non trovato");
    }
    console.log("URL di reindirizzamento login completo (sto per fetcharlo):", { redirectUrl });
    const response_1 = await fetch(redirectUrl);
    return await response_1.text();
}

// Invia la richiesta di login
async function sendLoginRequest(loginPageHtml, username, password) {
    const formData = {
        sessionId: extractValue(loginPageHtml, 'sessionId'),
        mgmtBaseUrl: extractValue(loginPageHtml, 'mgmtBaseUrl'),
        MM_Login: extractValue(loginPageHtml, 'MM_Login'),
        mode: extractValue(loginPageHtml, 'mode'),
        action: extractValue(loginPageHtml, 'action'),
        accessType: extractValue(loginPageHtml, 'accessType'),
        username: username,
        password: password
    };
    console.log("Dati del form da inviare:", formData);

    const url = 'https://cp-praticelli.unipi.it/login.php';
    const searchParams = new URLSearchParams(formData);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Accept': 'application/json, text/javascript, */*; q=0.01'
        },
        body: searchParams.toString(),
        credentials: 'include'
    });
    console.log("Risposta raw della richiesta POST:", response);
    return await response.json();
}

//Mainfunc
async function mainFunction() {
    try {
        // Controlla se l'estensione è attiva o meno.
        const { extensionActive } = await getExtensionState();
        if (!extensionActive) {
            console.log("Autologin é disattivato. mainFunction non worka.");
            return;
        }

        // Prendi le credenziali
        const credentials = await getCredenziali();
        const { username, password } = credentials;
        console.log("Credenziali ottenute.");

        let storedSessionId = await getSessionId(); // Il primo è vuoto
        let attemptCount = 0;
        let success = false;

        // Tento connession al massimo 5 volte con delay di 2 secondi per non fare flooding nel server.
        while (attemptCount < 5 && !success) {
            if (attemptCount > 0) {
                console.log("Attendo e riprovo a connettermi.")
                await delay(2000); // Attendi prima di riprovare
            }

            // Prendo pagina di login e dati eventuali, estraggo il sessionId attuale.
            let loginPageHtml = await redirectToLoginPage();
            let newSessionId = extractValue(loginPageHtml, 'sessionId');

            console.log(`SessionId's: salvato '${storedSessionId}', attuale '${newSessionId}'`);

            // Eseguo il login (dovrebbe desincronizzare la sessione se chiedo un redirect dopo il login. Ciò su cui faccio leva.)
            const loginResponseData = await sendLoginRequest(loginPageHtml, username, password);
            console.log("Risposta di login:", loginResponseData);

            // Se loggato ufficialmente (Fare il login è diverso dall'ottenere l'accesso.)
            if (loginResponseData && loginResponseData.success && loginResponseData.redirect === 'login.php?indexpage=session') {
                const now = new Date();
                chrome.storage.local.set({ lastLoginTime: now.toISOString()}, function() {
                    chrome.storage.local.get('lastLoginTime', function(data) {
                        console.log("lastlogintime mainFunc:", data.lastLoginTime);
                            console.log("Entro qui??? Nel caso ho settato le allarmi.");
                            // Imposta un allarme per il prossimo minuto esatto
                            setAlarmForNextMinute();
                            setLoginAlarm()
                    });
                    calculateAndSaveData();
                });

                // Se diversi allora ho ottenuto l'accesso alla rete. MA se il storedSessionId è vuoto = "" allora non esco.
                if (storedSessionId !== newSessionId) {
                    await saveSessionId(newSessionId);
                    console.log("Session ID cambiato.");
                    // Uscita dal ciclo solo se storedSessionId non è vuoto
                    if (storedSessionId !== '') {
                        console.log("Uscita dal ciclo.");
                        success = true; 
                        break; 
                    }
                }
                //SE CI SONO ERRORI PROVA AD AGGIUNGERE L'IF CHE DAL GIRO 2 AGGIORNA IL STOREDSESSIONID VALUE RECUPERATO DA CONFRONTARE
            } else {
                console.error('Errore o login non riuscito:', loginResponseData);
            }

            storedSessionId = newSessionId; // Aggiorna sempre lo storedSessionId per il prossimo ciclo
            attemptCount++;
        }

        if (!success) {
            console.log("Login non riuscito dopo " + attemptCount + " tentativi.");
        }
        
    } catch (error) {
        console.error('Errore:', error);
    }
}

// Necessaria per prendere asincronamente le info.
function getCredenziali() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['username', 'password'], function(result) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve({ username: result.username, password: result.password });
            }
        });
    });
}

// Funzione per ottenere lo stato dell'estensione
function getExtensionState() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('extensionActive', function(result) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result);
            }
        });
    });
}

// Funzione per salvare il sessionId nello storage locale
function saveSessionId(sessionId) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({ sessionId: sessionId }, function() {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve();
            }
        });
    });
}

// Funzione per ottenere il sessionId dallo storage locale
function getSessionId() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('sessionId', function(result) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result.sessionId || '');
            }
        });
    });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//================ TEST CONNESSIONE ======================

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.command === "runConnectionTest") {
        verificaStatoConnessione();
        sendResponse({result: "connectionTest eseguito."});
    }
});

const URL_LOGIN = 'https://cp-praticelli.unipi.it/login.php';

function verificaConnessioneAlSitoLogin() {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            resolve(false); // Risolve false se il timeout scatta
        }, 1000); // Timeout impostato a 1 secondo

        fetch(URL_LOGIN, { method: 'HEAD', mode: 'no-cors' })
            .then(() => {
                clearTimeout(timeout); // Cancella il timeout se il fetch ha successo
                resolve(true); // Risolve true se il fetch ha successo
            })
            .catch(() => {
                clearTimeout(timeout); // Cancella il timeout se il fetch fallisce
                resolve(false); // Risolve false se il fetch fallisce
            });
    });
}

function verificaStatoConnessione() {
    if (navigator.onLine) { //Se sono connesso al network (potrei non avere accesso ad internet)
        // Se fosso connettermi al sito di login in meno di 2 secondi allora uso Ethenret
        verificaConnessioneAlSitoLogin().then(canReachLoginSite => {
            if (canReachLoginSite) {
                console.log("Connesso alla rete e all'Ethernet (Stai Usando Ethernet)");
                // Aggiorna icona e stato per Ethernet
                // Esegui login se necessario
            } else {
                console.log("Connesso alla Rete ma non all'Ethernet (Stai Usando Wi-Fi)");
                // Aggiorna icona e stato per Ethernet senza accesso a Internet
            }
        });
    } else {
        console.log("Non connesso alla rete. ");
        // Aggiorna icona e stato per Wi-Fi/disconnesso
    }
}
