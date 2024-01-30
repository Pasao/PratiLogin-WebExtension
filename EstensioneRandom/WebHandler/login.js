console.log("logout.js caricato");
// Stampa la pagina in debug
function printPageHTML() {
  if (document.readyState === 'complete') {
    console.log('HTML della pagina:', document.documentElement.outerHTML);
  } else {
    console.log('La pagina è ancora in caricamento.');
  }
}
  
// Riempi il form
function fillLoginForm(username, password) {
  const usernameField = document.querySelector('input[name="username"]');
  const passwordField = document.querySelector('input[name="password"]');
  const submitButton = document.querySelector('input[type="submit"]');

  if (usernameField && passwordField) {
    setTimeout(function() {
      usernameField.value = username;
    }, 1000); // Aspetta 1 secondo per inserire l'username

    setTimeout(function() {
      passwordField.value = password;
    }, 1000); // Aspetta 1 secondo per inserire la password

    chrome.runtime.sendMessage({ action: "loginAttempt" });

    setTimeout(function() {
      submitButton.click(); // Simula il click sul pulsante di invio
    }, 2000); // Aspetta 2 secondi per inviare il form
  }

}

// Questa funzione controlla se le credenziali sono memorizzate e le usa
function checkAndFillCredentials() {
  chrome.storage.local.get(['username', 'password', 'credentialsSet', 'extensionActive'], function(items) {
    if (items.extensionActive && items.credentialsSet && items.username && items.password) {
      fillLoginForm(items.username, items.password);
    } else {
      console.log("Credenziali non impostate o hai la funzione disattivata");
    }
  });
}
  
function onPageLoad() {
  printPageHTML();
  checkAndFillCredentials();
}

// Esegui la funzione quando il contenuto della pagina è completamente caricato
window.onload = onPageLoad;