function authView() {
  document.body.innerHTML = `<div class="auth-page">
    <div class="auth-visual"><div class="auth-copy"><div class="brand-mark large">+</div><span class="eyebrow">MEDICAL ENGLISH · MICRO-LEARNING</span><h1>Learn the language of medicine, one focused session at a time.</h1><p>Build terminology through small lessons, retrieval practice, contextual exercises, and AI tutoring.</p><div class="auth-principles"><span>01 Micro-content</span><span>02 Active recall</span><span>03 Immediate feedback</span></div></div></div>
    <div class="auth-panel"><div class="auth-brand"><div class="brand-mark">+</div><div><strong>MedTerm</strong><span>MicroLearn</span></div></div><div class="auth-card">
      <span class="eyebrow" id="authEyebrow">WELCOME</span><h2 id="authTitle">Build your medical English vocabulary.</h2><p id="authSub">Sign in to continue your learning journey.</p>
      <div class="auth-tabs"><button class="active" id="loginTab" onclick="switchAuth('login')">Sign in</button><button id="signupTab" onclick="switchAuth('signup')">Create account</button></div>
      <div id="authAlert" class="auth-alert"></div>
      <form id="loginForm" onsubmit="handleLogin(event)"><label>Email<input id="loginEmail" type="email" required autocomplete="email" placeholder="you@example.com"></label><label>Password<input id="loginPassword" type="password" required minlength="8" autocomplete="current-password" placeholder="••••••••"></label><button class="primary-btn wide" type="submit" id="loginBtn">Sign in ${icon("arrow")}</button></form>
      <form id="signupForm" class="hidden" onsubmit="handleSignup(event)"><label>Name<input id="signupName" required minlength="2" placeholder="Your name" autocomplete="name"></label><label>Email<input id="signupEmail" type="email" required autocomplete="email" placeholder="you@example.com"></label><label>Password<input id="signupPassword" type="password" required minlength="8" placeholder="At least 8 characters" autocomplete="new-password"></label><button class="primary-btn wide" type="submit" id="signupBtn">Create account ${icon("arrow")}</button></form>
      <button class="demo-link" onclick="enterDemo()">Continue in demo mode</button>
      <p class="auth-disclaimer">Educational use only. This application does not provide medical diagnosis or treatment advice.</p>
    </div></div>`;
  applyTheme();
}
function switchAuth(mode) {
  const login=mode==="login";
  document.getElementById("loginForm").classList.toggle("hidden",!login);
  document.getElementById("signupForm").classList.toggle("hidden",login);
  document.getElementById("loginTab").classList.toggle("active",login);
  document.getElementById("signupTab").classList.toggle("active",!login);
  document.getElementById("authTitle").textContent=login?"Build your medical English vocabulary.":"Start your microlearning journey.";
  document.getElementById("authSub").textContent=login?"Sign in to continue your learning journey.":"Create a lightweight learning profile. No unnecessary data.";
}
function authError(message) {
  const el=document.getElementById("authAlert"); el.textContent=message; el.classList.add("show");
}
async function handleLogin(e) {
  e.preventDefault(); const btn=document.getElementById("loginBtn");
  btn.disabled=true; btn.textContent="Signing in...";
  try { await logIn(document.getElementById("loginEmail").value.trim(),document.getElementById("loginPassword").value); bootApp(); }
  catch(err){authError(friendlyAuthError(err)); btn.disabled=false; btn.textContent=`Sign in ${icon("arrow")}`;}
}
async function handleSignup(e) {
  e.preventDefault(); const btn=document.getElementById("signupBtn");
  btn.disabled=true; btn.textContent="Creating account...";
  try {
    await signUp(document.getElementById("signupName").value.trim(),document.getElementById("signupEmail").value.trim(),document.getElementById("signupPassword").value);
    bootApp();
  } catch(err){authError(friendlyAuthError(err)); btn.disabled=false; btn.textContent=`Create account ${icon("arrow")}`;}
}
function friendlyAuthError(err) {
  const m=String(err?.message||err);
  if(m.includes("email-already-in-use"))return"This email is already registered. Try signing in.";
  if(m.includes("invalid-email"))return"Please enter a valid email address.";
  if(m.includes("weak-password"))return"Use a stronger password with at least 8 characters.";
  if(m.includes("invalid-credential")||m.includes("wrong-password"))return"Incorrect email or password.";
  if(m.includes("network"))return"Network error. Please check your connection.";
  return window.APP_DEMO_MODE?"Demo mode is active. You can continue without Firebase.": "Authentication failed. Please try again.";
}
function enterDemo(){ window.APP_DEMO_MODE=true; currentUser=demoProfile(); currentProfile=currentUser; bootApp(); }
async function bootApp() {
  document.body.innerHTML=`<div id="appRoot"></div><div id="toastHost" class="toast-host"></div>`;
  applyTheme();
  await loadProgress();
  render();
}
startAuth((user,profile)=>{currentUser=user;currentProfile=profile;bootApp();},()=>authView());
