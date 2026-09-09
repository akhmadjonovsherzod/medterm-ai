// Authentication and user profile persistence.
window.currentUser = null;
window.currentProfile = null;

const DEMO_USER_KEY = "medterm-demo-user";

function isDemoMode() {
  return Boolean(window.APP_DEMO_MODE || !window.auth || !window.db);
}

async function ensureUserProfile(user) {
  const ref = db.collection("users").doc(user.uid);
  const snap = await ref.get();
  if (!snap.exists) {
    const profile = {
      displayName: user.displayName || user.email.split("@")[0],
      email: user.email || "",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      totalTermsLearned: 0,
      totalQuizzesCompleted: 0,
      averageScore: 0,
      currentStreak: 0,
      lastLearningDate: null,
      preferredDifficulty: "Intermediate",
      weakTerms: {}
    };
    await ref.set(profile);
    return profile;
  }
  return snap.data();
}

function demoProfile() {
  const raw = localStorage.getItem(DEMO_USER_KEY);
  return raw ? JSON.parse(raw) : {
    uid: "demo-user",
    displayName: "Demo Learner",
    email: "demo@medterm.local",
    totalTermsLearned: 0,
    totalQuizzesCompleted: 0,
    averageScore: 0,
    currentStreak: 0,
    lastLearningDate: null,
    preferredDifficulty: "Intermediate",
    weakTerms: {}
  };
}

function saveDemoProfile(profile) {
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(profile));
}

window.startAuth = function(onLogin, onLogout) {
  if (isDemoMode()) {
    currentUser = null;
    currentProfile = null;
    onLogout();
    return;
  }
  auth.onAuthStateChanged(async user => {
    if (!user) {
      currentUser = null;
      currentProfile = null;
      onLogout();
      return;
    }
    try {
      currentUser = user;
      currentProfile = await ensureUserProfile(user);
      onLogin(user, currentProfile);
    } catch (error) {
      console.error(error);
      onLogin(user, {displayName: user.displayName || "Learner", email: user.email || ""});
    }
  });
};

window.signUp = async function(displayName, email, password) {
  if (isDemoMode()) {
    const profile = {...demoProfile(), uid:"demo-user", displayName, email};
    saveDemoProfile(profile);
    currentUser = profile;
    currentProfile = profile;
    return profile;
  }
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  await cred.user.updateProfile({displayName});
  currentUser = cred.user;
  currentProfile = await ensureUserProfile(cred.user);
  return cred.user;
};

window.logIn = async function(email, password) {
  if (isDemoMode()) {
    if (!email || !password) throw new Error("Please enter your email and password.");
    const profile = demoProfile();
    profile.displayName = profile.displayName || email.split("@")[0];
    profile.email = email;
    saveDemoProfile(profile);
    currentUser = profile;
    currentProfile = profile;
    return profile;
  }
  const cred = await auth.signInWithEmailAndPassword(email, password);
  return cred.user;
};

window.logOut = async function() {
  if (isDemoMode()) {
    currentUser = null;
    currentProfile = null;
    // Demo mode intentionally remains usable after logout via the login screen.
    return;
  }
  await auth.signOut();
};

window.saveProfile = async function(patch) {
  currentProfile = {...currentProfile, ...patch};
  if (isDemoMode()) {
    saveDemoProfile(currentProfile);
    return currentProfile;
  }
  await db.collection("users").doc(currentUser.uid).set(patch, {merge:true});
  return currentProfile;
};
