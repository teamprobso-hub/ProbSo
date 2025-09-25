/* script.js
   App logic: UI interactions, infinite feed, post/composer behaviours,
   location picker (OpenStreetMap via Leaflet + Nominatim),
   login modal trigger when user interacts while not logged in.
*/

/* -------------------------
   Simple in-memory demo store
   (Replace with Firestore integration as needed)
   ------------------------- */
const Store = {
  user: { uid: null, name: "Guest User", points: 0, loggedIn: false },
  posts: [],
  page: 0,
  pageSize: 6
};

/* -------------------------
   Helper: Toast
   ------------------------- */
function showToast(text, ms = 2000) {
  const t = document.getElementById('toast');
  t.textContent = text;
  t.classList.remove('hidden');
  setTimeout(()=>t.classList.add('hidden'), ms);
}

/* -------------------------
   Login modal behaviour
   ------------------------- */
const loginModal = document.getElementById('loginModal');
const loginLogoutBtn = document.getElementById('loginLogoutBtn');
const closeLogin = document.getElementById('closeLogin');

function openLogin() { loginModal.classList.remove('hidden'); }
function closeLoginModal() { loginModal.classList.add('hidden'); }

loginLogoutBtn.addEventListener('click', openLogin);
closeLogin.addEventListener('click', closeLoginModal);

// Simple demo login/signup handlers (replace with firebase auth)
document.getElementById('emailLoginBtn').addEventListener('click', ()=>{
  const email = document.getElementById('emailInput').value;
  if (!email) return showToast('Email dalo');
  Store.user = { uid: 'demo-uid', name: email.split('@')[0], points: 12, loggedIn:true };
  updateProfileUI();
  closeLoginModal();
  showToast('Logged in (demo)');
});
document.getElementById('emailSignupBtn').addEventListener('click', ()=>{
  showToast('Sign up demo - using same flow as login');
  document.getElementById('emailLoginBtn').click();
});

/* -------------------------
   Require login wrapper
   ------------------------- */
function requireLogin(action) {
  if (!Store.user.loggedIn) {
    openLogin();
    return false;
  }
  return true;
}

/* -------------------------
   Profile UI update
   ------------------------- */
function updateProfileUI(){
  document.getElementById('profileName').textContent = Store.user.name || 'Guest User';
  document.getElementById('profilePoints').textContent = `Points: ${Store.user.points || 0}`;
  document.getElementById('loginLogoutBtn').textContent = Store.user.loggedIn ? 'Logout' : 'Login / Sign Up';
  if (!Store.user.loggedIn) { document.getElementById('profileImage').src = 'https://via.placeholder.com/80'; }
}
updateProfileUI();

/* -------------------------
   Composer: auto-resize textarea
   ------------------------- */
function autosizeText(el){
  el.style.height = 'auto';
  el.style.height = (el.scrollHeight) + 'px';
}
document.querySelectorAll('.auto-resize').forEach(t => {
  t.addEventListener('input', ()=>autosizeText(t));
  autosizeText(t);
});

/* -------------------------
   Location picker (Leaflet + Nominatim)
   ------------------------- */
let map, marker, selectedLocation = null;
const locModal = document.getElementById('locModal');
const locBtn = document.getElementById('locBtn');
const locConfirm = document.getElementById('locConfirm');
const locCancel = document.getElementById('locCancel');
const locSearch = document.getElementById('locSearch');
const selectedLocationText = document.getElementById('selectedLocation');

locBtn.addEventListener('click', ()=>{
  locModal.classList.remove('hidden');
  setTimeout(initMap, 200);
});

locCancel.addEventListener('click', ()=> {
  locModal.classList.add('hidden');
});

locConfirm.addEventListener('click', ()=>{
  if (selectedLocation) {
    selectedLocationText.textContent = `Location: ${selectedLocation.display_name || selectedLocation.lat + ',' + selectedLocation.lon}`;
  }
  locModal.classList.add('hidden');
});

function initMap(){
  if (map) return;
  map = L.map('map').setView([20.5937,78.9629], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map);

  map.on('click', function(e){
    if (marker) map.removeLayer(marker);
    marker = L.marker(e.latlng).addTo(map);
    fetchNominatim(e.latlng.lat, e.latlng.lng).then(res => {
      selectedLocation = res || {lat:e.latlng.lat, lon:e.latlng.lng};
      selectedLocation.display_name = res ? res.display_name : `${e.latlng.lat},${e.latlng.lng}`;
    });
  });

  locSearch.addEventListener('keydown', (ev)=>{
    if (ev.key === 'Enter') {
      ev.preventDefault();
      const q = locSearch.value.trim();
      if (!q) return;
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then(arr => {
          if (arr && arr[0]) {
            const p = arr[0];
            map.setView([p.lat, p.lon], 14);
            if (marker) map.removeLayer(marker);
            marker = L.marker([p.lat, p.lon]).addTo(map);
            selectedLocation = p;
          } else {
            showToast('No results');
          }
        });
    }
  });
}
function fetchNominatim(lat, lon){
  return fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
    .then(r => r.json()).catch(()=>null);
}

/* -------------------------
   Feed: generate demo posts and infinite scroll
   ------------------------- */
const feedList = document.getElementById('feedList');
const loadingMore = document.getElementById('loadingMore');

// create demo posts (in real app fetch from server)
function seedPosts(count=40){
  const categories = ['Emergency','Find Partner','Buy / Sell','Education','Find Job','Business','Other'];
  for (let i=1;i<=count;i++){
    Store.posts.push({
      id: 'p'+i,
      author: 'User'+(i%7+1),
      avatar: 'https://via.placeholder.com/48',
      text: `Sample post number ${i}. This is a demo content to show feed layout. Category: ${categories[i%categories.length]}`,
      time: Date.now() - (i*60000),
      comments: [],
      helpful: Math.floor(Math.random()*10),
      isAd: false
    });
  }
}
seedPosts(60);

// insert ads randomly after some posts
function preparePagedPosts(){
  const posts = [...Store.posts];
  const out = [];
  let i=0;
  while (i<posts.length){
    const step = 5 + Math.floor(Math.random()*6); // 5..10
    for (let j=0;j<step && i<posts.length;j++){
      out.push(posts[i++]);
    }
    // insert ad placeholder
    out.push({ id: 'ad-'+i, isAd:true, text:'--- Sponsored ---', adIndex: i });
  }
  return out;
}
const preparedPosts = preparePagedPosts();

function renderPost(post){
  if (post.isAd){
    const el = document.createElement('div');
    el.className = 'post';
    el.innerHTML = `<div style="font-weight:600">Advertisement</div><div class="muted small-text">Sponsored content</div><div style="margin-top:8px">${post.text}</div>`;
    return el;
  }

  const el = document.createElement('div');
  el.className = 'post';
  el.dataset.postId = post.id;
  el.innerHTML = `
    <div class="post-header">
      <div style="display:flex;gap:8px;align-items:center">
        <img src="${post.avatar}" style="width:48px;height:48px;border-radius:50%;object-fit:cover" />
        <div>
          <div style="font-weight:600;cursor:pointer" data-action="openProfile">${post.author}</div>
          <div class="post-meta">${new Date(post.time).toLocaleString()}</div>
        </div>
      </div>
      <div>
        <span class="three-dots" data-action="dots">⋯</span>
      </div>
    </div>
    <div class="post-content">${post.text}</div>
    <div class="post-actions">
      <button class="flat-btn" data-action="comment">Comment</button>
      <button class="flat-btn" data-action="seeComments">See Comments</button>
      <button class="flat-btn" data-action="helpful">Helpful (<span class="help-count">${post.helpful}</span>)</button>
    </div>
    <div class="small-text muted" style="margin-top:8px">Click name to open profile. Use three dots to report.</div>
  `;

  // event delegation per-post
  el.addEventListener('click', (ev)=>{
    const act = ev.target.closest('[data-action]');
    if (!act) return;
    const action = act.dataset.action;
    if (action === 'openProfile'){
      openProfileModal(post.author);
    } else if (action === 'dots'){
      openReportModal(post.id);
    } else if (action === 'comment'){
      if (!requireLogin()) return;
      openCommentsModal(post.id);
    } else if (action === 'seeComments'){
      openCommentsModal(post.id);
    } else if (action === 'helpful'){
      if (!requireLogin()) return;
      post.helpful = (post.helpful || 0) + 1;
      Store.user.points = (Store.user.points||0) + 1;
      updateProfileUI();
      el.querySelector('.help-count').textContent = post.helpful;
      showToast('Marked helpful');
    }
  });

  return el;
}

function loadNextPage(){
  loadingMore.classList.remove('hidden');
  setTimeout(()=>{
    const start = Store.page * Store.pageSize;
    const end = start + Store.pageSize;
    const slice = preparedPosts.slice(start, end);
    slice.forEach(p => feedList.appendChild(renderPost(p)));
    Store.page++;
    if (Store.page * Store.pageSize >= preparedPosts.length) {
      // no more
      loadingMore.textContent = 'No more posts';
      setTimeout(()=>loadingMore.classList.add('hidden'), 800);
    } else {
      loadingMore.classList.add('hidden');
    }
  }, 500);
}
loadNextPage();

// infinite scroll
window.addEventListener('scroll', ()=>{
  if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 200)) {
    // near bottom
    if (!loadingMore.classList.contains('hidden')) return;
    loadNextPage();
  }
});

/* -------------------------
   Post submission
   ------------------------- */
document.getElementById('postBtn').addEventListener('click', ()=>{
  if (!requireLogin()) return;
  const text = document.getElementById('postText').value.trim();
  if (!text) return showToast('Post likhen pehle');
  const newPost = {
    id: 'p' + (Store.posts.length + 1),
    author: Store.user.name,
    avatar: 'https://via.placeholder.com/48',
    text,
    time: Date.now(),
    comments: [],
    helpful: 0
  };
  // Prepend to feed
  Store.posts.unshift(newPost);
  preparedPosts.unshift(newPost);
  const node = renderPost(newPost);
  feedList.insertBefore(node, feedList.firstChild);
  document.getElementById('postText').value = '';
  autosizeText(document.getElementById('postText'));
  showToast('Posted');
});

/* -------------------------
   Report modal
   ------------------------- */
let reportTargetPostId = null;
const reportModal = document.getElementById('reportModal');
function openReportModal(postId){
  reportTargetPostId = postId;
  document.getElementById('reportReason').value = '';
  reportModal.classList.remove('hidden');
}
document.getElementById('cancelReportBtn').addEventListener('click', ()=>reportModal.classList.add('hidden'));
document.getElementById('sendReportBtn').addEventListener('click', ()=>{
  const reason = document.getElementById('reportReason').value.trim();
  if (!reason) return showToast('Reason likhen');
  // TODO: send to firestore / admin queue
  reportModal.classList.add('hidden');
  showToast('Reported — admin will review');
});

/* -------------------------
   Comments modal
   ------------------------- */
const commentsModal = document.getElementById('commentsModal');
let activeCommentsPostId = null;
function openCommentsModal(postId){
  activeCommentsPostId = postId;
  const post = preparedPosts.find(p=>p.id === postId) || Store.posts.find(p=>p.id===postId);
  const list = document.getElementById('commentsList');
  list.innerHTML = '';
  (post.comments || []).forEach(c => {
    const el = document.createElement('div');
    el.className = 'comment-row';
    el.innerHTML = `<div style="flex:1"><b>${c.author}</b><div class="small-text">${c.text}</div></div><div><button class="flat-btn">Helpful</button></div>`;
    list.appendChild(el);
  });
  commentsModal.classList.remove('hidden');
}
document.getElementById('closeCommentsBtn').addEventListener('click', ()=>commentsModal.classList.add('hidden'));
document.getElementById('submitCommentBtn').addEventListener('click', ()=>{
  if (!requireLogin()) return;
  const text = document.getElementById('commentNew').value.trim();
  if (!text) return;
  const post = preparedPosts.find(p=>p.id === activeCommentsPostId) || Store.posts.find(p=>p.id===activeCommentsPostId);
  if (!post) return showToast('Post not found');
  post.comments.push({ author: Store.user.name, text });
  document.getElementById('commentNew').value = '';
  autosizeText(document.getElementById('commentNew'));
  openCommentsModal(activeCommentsPostId);
});

/* -------------------------
   Profile modal (simple)
   ------------------------- */
function openProfileModal(authorName){
  // For demo - show alert / toast. In real app open profile view
  showToast(`Open profile: ${authorName}`);
}

/* -------------------------
   UI: control buttons
   ------------------------- */
document.getElementById('refreshFeedBtn').addEventListener('click', ()=>{
  // In real app re-fetch from server with filters
  feedList.innerHTML = '';
  Store.page = 0;
  loadNextPage();
  showToast('Feed refreshed');
});

// Control: when non-logged in user clicks some interactive UI, open login
['openProfileBtn','notificationsBtn','messagesBtn','groupsBtn','categoryBtn','joinGroupBtn','groupPostBtn','messagesBtn'].forEach(id=>{
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('click', (ev)=>{
    if (!Store.user.loggedIn) {
      openLogin();
    } else {
      showToast(`${el.textContent} clicked`);
    }
  });
});

// Close login modal when clicking outside content
loginModal.addEventListener('click', (ev)=>{
  if (ev.target === loginModal) closeLoginModal();
});

/* -------------------------
   Report three-dots: clicking three-dots on posts uses openReportModal
   ------------------------- */
feedList.addEventListener('click', (ev)=>{
  const el = ev.target;
  if (el.classList.contains('three-dots')) {
    const postEl = el.closest('.post');
    if (!postEl) return;
    const postId = postEl.dataset.postId;
    openReportModal(postId);
  }
});

/* -------------------------
   On load: badges
   ------------------------- */
document.getElementById('notifBadge').textContent = 2;
document.getElementById('msgBadge').textContent = 1;
document.getElementById('notifBadge').classList.remove('hidden');
document.getElementById('msgBadge').classList.remove('hidden');

/* -------------------------
   Extra: clicking anywhere interactive when not logged in opens login --
   ensures "user can only view but not interact" behavior described
   ------------------------- */
document.addEventListener('click', function(ev){
  const target = ev.target;
  // If user is not logged in and clicked something with class 'requires-login' or a button (excluding some exceptions)
  if (!Store.user.loggedIn) {
    const interactive = target.closest('button, [data-action], textarea, input, select');
    if (interactive && !target.closest('#loginModal')) {
      // allow clicking on menu button and logo to not force login
      const allowed = target.closest('#menuBtn') || target.closest('.logo');
      if (!allowed) {
        // open login after short delay to avoid interrupting natural browsing
        openLogin();
      }
    }
  }
});