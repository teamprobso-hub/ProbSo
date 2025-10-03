import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

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

export {app,auth, db};

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

// Credits Add karne ka function
async function addCredits(userId, credits) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    credits: increment(credits)
  });
  console.log("Credits added:", credits);
}

// Ye function message.html se call hoga
window.addCredits = addCredits;


// Toggle panel open/close
const notifIcon = document.getElementById("notif-icon");
const notifPanel = document.getElementById("notificationPanel");
notifIcon.addEventListener("click", () => {
  notifPanel.classList.toggle("hidden");
});

const notifBtn = document.getElementById("notificationBtn");
notifBtn.addEventListener("click", () =>
{
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
            <div><strong>Welcome!</strong>Thanks for joining us 🎉. Before using this app, see user's guide for better experience.</div>
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

// Page history stack
let pageHistory = [];

// Single loadPage function
function loadPage(page) {
  fetch(page)
    .then(res => res.text())
    .then(data => {
      document.querySelector("main").innerHTML = data;
      pageHistory.push(page); // history me save karo
    })
    .catch(err => console.error("Page load error:", err));
}

// Back button handle
document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "backBtn") {
    pageHistory.pop(); // current page remove
    let lastPage = pageHistory.pop(); // previous page

    if (lastPage) {
      loadPage(lastPage);
    } else {
      // Pure app ko reload karke index.html par wapas jao
      window.location.href = "index.html";
    }
  }
});

// Assuming Firebase is already initialized
document.addEventListener('DOMContentLoaded', () => {
    const messagesBtn = document.querySelectorAll('.messagesBtn');

    messagesBtn.forEach(btn => {
        btn.addEventListener('click', () => {
            const user = firebase.auth().currentUser;
            if(user){
                window.location.href = 'message.html';
            } else {
                alert('Login required!');
                openLoginModal();
            }
        });
    });
});

firebase.auth().onAuthStateChanged((user) => {
    if(user){
        db.collection('messages')
          .where('receiverId', '==', user.uid)
          .get()
          .then(snapshot => {
              snapshot.forEach(doc => {
                  console.log(doc.data()); // Display message
              });
          });
    }
});
// Example function to open login modal
function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if(modal) modal.style.display = 'block';
}

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