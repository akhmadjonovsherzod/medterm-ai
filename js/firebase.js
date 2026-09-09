// Firebase bootstrap. Empty configuration automatically falls back to demo mode.
(function () {
  const cfg = window.firebaseConfig || {};
  const configured = Boolean(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);
  window.APP_CONFIGURED_FIREBASE = configured;
  window.APP_DEMO_MODE = window.DEMO_MODE !== false || !configured;
  if (!configured) {
    window.db = null;
    window.auth = null;
    return;
  }
  try {
    firebase.initializeApp(cfg);
    window.auth = firebase.auth();
    window.db = firebase.firestore();
    window.APP_DEMO_MODE = false;
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    window.APP_DEMO_MODE = true;
  }
})();
