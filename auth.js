// auth.js - initializes firebase (web v9 modular style) and provides small helpers.
// This file expects firebaseConfig to be present (from firebase-config.js)
document.addEventListener('DOMContentLoaded', () => {
  // Lazy-check for firebase SDK; if not present, show instructions.
  if (typeof firebase === 'undefined') {
    // Load firebase dynamically (CDN)
    const s = document.createElement('script');
    s.src = "https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js";
    s.onload = () => {
      const authScript = document.createElement('script');
      authScript.src = "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js";
      const firestoreScript = document.createElement('script');
      firestoreScript.src = "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js";
      const storageScript = document.createElement('script');
      storageScript.src = "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage-compat.js";

      document.head.appendChild(authScript);
      document.head.appendChild(firestoreScript);
      document.head.appendChild(storageScript);

      authScript.onload = () => {
        initFirebase();
      };
    };
    document.head.appendChild(s);
  } else {
    initFirebase();
  }

  function initFirebase(){
    if (!window.firebaseConfig) {
      console.warn('firebaseConfig missing. Fill firebase-config.js with your keys.');
      return;
    }
    try {
      firebase.initializeApp(window.firebaseConfig);
      window.auth = firebase.auth();
      window.db = firebase.firestore();
      window.storage = firebase.storage();
      console.log('Firebase initialized');
      // Expose helper
      window.getCurrentUser = () => auth.currentUser;
      // Optional: set up auth state listener
      auth.onAuthStateChanged(user => {
        if (user) {
          // populate UI with user info
          const nameEl = document.getElementById('profile-name');
          if (nameEl) nameEl.textContent = user.displayName || user.email || user.phoneNumber || 'User';
          const img = document.getElementById('profile-img');
          if (img && user.photoURL) img.src = user.photoURL;
        }
      });
    } catch (e) {
      console.error('Firebase init error', e);
    }
  }
});