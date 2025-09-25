<!-- Replace the values in firebaseConfig with your project's values. -->
<script>
// This file uses firebase-compat to make it easy to use without a bundler.
// Replace placeholders with real config from Firebase console -> Project settings -> General
(function(){
  // Inject compat SDKs
  const s1 = document.createElement('script');
  s1.src = 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js';
  s1.onload = () => {
    const s2 = document.createElement('script');
    s2.src = 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth-compat.js';
    document.head.appendChild(s2);
    const s3 = document.createElement('script');
    s3.src = 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore-compat.js';
    document.head.appendChild(s3);
    s2.onload = s3.onload = () => initialize();
  };
  document.head.appendChild(s1);

  function initialize(){
    if(window.firebaseApp) return; // already inited
const firebaseConfig = {
    apiKey: "AIzaSyAJUpbCOWRl_YU14eAjARPacD9CuiBSPfg",
    authDomain: "probso.firebaseapp.com",
    projectId: "probso",
    storageBucket: "probso.firebasestorage.app",
    messagingSenderId: "892196080965",
    appId: "1:892196080965:web:9459195d61c71ed22a022c"
  };

    window.firebaseApp = firebase.initializeApp(firebaseConfig);
    window.auth = firebase.auth();
    window.db = firebase.firestore();

    console.info('Firebase initialized (compat). Replace firebase-config.js placeholders with real values.');
  }
})();
</script>