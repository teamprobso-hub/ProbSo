import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAJUpbCOWRl_YU14eAjARPacD9CuiBSPfg",
  authDomain: "probso.firebaseapp.com",
  projectId: "probso",
  storageBucket: "probso.firebasestorage.app",
  messagingSenderId: "892196080965",
  appId: "1:892196080965:web:9459195d61c71ed22a022c"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Toggle panel open/close
const notifBtn = document.getElementById("notificationBtn");
const notifPanel = document.getElementById("notificationPanel");
notifBtn.addEventListener("click", () => {
  notifPanel.classList.toggle("hidden");
});

// Check login & show welcome notification (first time only)
onAuthStateChanged(auth, (user) => {
  if (user) {
    const userDocRef = doc(db, "users", user.uid);

    getDoc(userDocRef).then((docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();

        // Agar pehli baar login hai (welcomeShown flag nahi hai)
        if (!userData.welcomeShown) {
          // Notification count update
          document.getElementById("notifCount").innerText = "1";

          // Welcome notification banake list me daalo
          const li = document.createElement("li");
          li.className = "unread";
          li.innerHTML = `
            <div><strong>Welcome!</strong> Thanks for joining us 🎉</div>
            <button id="guideBtn">User Guide</button>
          `;
          document.getElementById("notificationList").prepend(li);

          // User Guide button action
          li.querySelector("#guideBtn").addEventListener("click", () => {
            loadPage("user-guide.html"); // alag page open hoga
          });

          // Flag update -> next login par dobara na aaye
          updateDoc(userDocRef, { welcomeShown: true });
        }
      }
    });
  }
});

// UI Elements
const loginModal = document.getElementById('loginModal');
const loginLogoutBtn = document.getElementById('loginLogoutBtn');
const closeLogin = document.getElementById('closeLogin');
const emailLoginBtn = document.getElementById('emailLoginBtn');
const emailSignupBtn = document.getElementById('emailSignupBtn');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const postBtn = document.getElementById('postBtn');
const postText = document.getElementById('postText');
const feedList = document.getElementById('feedList');
const profileNameEl = document.getElementById('profileName');
const profilePointsEl = document.getElementById('profilePoints');

// Toast
function showToast(msg,ms=2000){const t=document.getElementById('toast');t.textContent=msg;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),ms)}

// User doc
async function ensureUserDoc(user){
  if(!user) return;
  const uDoc = doc(db,'users',user.uid);
  const snap = await getDoc(uDoc);
  if(!snap.exists()){
    await setDoc(uDoc,{name:user.displayName||user.email.split('@')[0],points:0,createdAt:serverTimestamp()});
  }
}

// Login Modal open/close
function openLogin(){ loginModal.classList.remove('hidden'); }
function closeLoginModal(){ loginModal.classList.add('hidden'); }
loginLogoutBtn.addEventListener('click',()=>{if(auth.currentUser){signOut(auth).then(()=>showToast('Logged out'))}else openLogin();});
closeLogin.addEventListener('click',closeLoginModal);
loginModal.addEventListener('click',(e)=>{if(e.target===loginModal) closeLoginModal();});

// Email login/signup
emailLoginBtn.addEventListener('click', async ()=>{
  const email = document.getElementById('emailInput').value.trim();
  const pwd = document.getElementById('pwdInput').value.trim();
  if(!email||!pwd) return showToast('Email & Password chahiye');
  try{ await signInWithEmailAndPassword(auth,email,pwd); closeLoginModal(); showToast('Login successful'); }catch(err){alert(err.message);}
});
emailSignupBtn.addEventListener('click', async ()=>{
  const email = document.getElementById('emailInput').value.trim();
  const pwd = document.getElementById('pwdInput').value.trim();
  if(!email||!pwd) return showToast('Email & Password chahiye');
  try{ const cred = await createUserWithEmailAndPassword(auth,email,pwd); await ensureUserDoc(cred.user); closeLoginModal(); showToast('Signup successful'); }catch(err){alert(err.message);}
});

// Google login
googleLoginBtn.addEventListener('click', async ()=>{
  try{ const provider = new GoogleAuthProvider(); const result = await signInWithPopup(auth,provider); await ensureUserDoc(result.user); closeLoginModal(); showToast('Google login successful'); }catch(err){alert(err.message);}
});

// Auth state change
onAuthStateChanged(auth,async (user)=>{
  if(user){
    profileNameEl.innerText = user.displayName || user.email.split('@')[0] || 'User';
    await ensureUserDoc(user);
    const uSnap = await getDoc(doc(db,'users',user.uid));
    const udata = uSnap.exists()? uSnap.data() : null;
    profilePointsEl.innerText = 'Points: '+(udata?.points||0);
    loginLogoutBtn.innerText = 'Logout';
    loadFeedRealtime();
  }else{
    profileNameEl.innerText='Guest User';
    profilePointsEl.innerText='Points: 0';
    loginLogoutBtn.innerText='Login / Sign Up';
    feedList.innerHTML='<div class="small-text muted">Login to see interactive features.</div>';
  }
});

// Post submission
postBtn.addEventListener('click', async ()=>{
  if(!auth.currentUser){ openLogin(); return showToast('Login required'); }
  const text = postText.value.trim();
  const category = document.getElementById('categorySelect').value||'';
  if(!text) return showToast('Post likho pehle');
  try{
    await addDoc(collection(db,'posts'),{authorUid:auth.currentUser.uid,authorName:profileNameEl.innerText,text,category,createdAt:serverTimestamp()});
    postText.value='';
    showToast('Post submitted');
  }catch(err){alert(err.message);}
});

// Feed
function loadFeedRealtime(){
  const q = query(collection(db,'posts'),orderBy('createdAt','desc'));
  onSnapshot(q,(snap)=>{
    feedList.innerHTML='';
    snap.forEach(doc=>{
      const data = doc.data();
      const div = document.createElement('div');
      div.className='post';
      div.innerHTML=`<div><b>${data.authorName}</b> <span class="small-text">${data.category||''}</span></div><div>${data.text}</div>`;
      feedList.appendChild(div);
    });
  });
}