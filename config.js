// MedTerm MicroLearn configuration.
// Never commit real secrets to this file.
//
// Firebase is optional for demo mode. Fill these values to enable
// authenticated persistence.
//
// Gemini can use either:
//   1) window.PROXY_URL = "https://your-serverless-proxy.example.com"
//   2) window.GEMINI_API_KEY = "..." for prototype/local testing.
// The browser-key approach is intentionally documented as insecure for production.

window.firebaseConfig = {
  apiKey: "AIzaSyDcP7uTd5NAnC8lQgs4L1AQO43eGy_0xnw",
  authDomain: "medterm-med.firebaseapp.com",
  projectId: "medterm-med",
  storageBucket: "medterm-med.firebasestorage.app",
  messagingSenderId: "662493407669",
  appId: "1:662493407669:web:30f9a475a04c277cddd1fc"
};

window.PROXY_URL = "https://medicai-medterm.sherzodbekakhmadjonov0604.workers.dev";
window.GEMINI_API_KEY = "";
window.GEMINI_MODEL = "gemini-3.1-flash-lite";
window.DEMO_MODE = false; // Set false when Firebase is configured; auto-detection still protects empty configs.
