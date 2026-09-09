const TOPICS = [
  "Anatomy","Cardiovascular System","Respiratory System","Nervous System",
  "Gastrointestinal System","Pharmacology","Pathology","Diagnostics","Surgery",
  "General Medical Terminology"
];

const state = {
  view:"dashboard", lesson:null, termIndex:0, quizIndex:0, quiz:[],
  answers:[], weak:[], lessonStarted:null, tutorHistory:[],
  selectedTopic:"Respiratory System", difficulty:"Intermediate", generated:false
};

function todayKey() {
  const d = new Date();
  return d.toISOString().slice(0,10);
}

function localProgress() {
  const key = `medterm-progress-${currentUser?.uid || "demo-user"}`;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : {terms:0, lessons:0, scores:[], weakTerms:{}, sessions:[], streak:0, lastDay:null};
}

function saveLocalProgress(p) {
  localStorage.setItem(`medterm-progress-${currentUser?.uid || "demo-user"}`, JSON.stringify(p));
}

window.getProgress = function() {
  if (isDemoMode()) return localProgress();
  return window._progressCache || localProgress();
};

window.loadProgress = async function() {
  if (isDemoMode()) return localProgress();
  const ref = db.collection("users").doc(currentUser.uid);
  const snap = await ref.get();
  const profile = snap.exists ? snap.data() : {};
  const sessions = await ref.collection("sessions").orderBy("startedAt","desc").limit(20).get();
  const p = {
    terms: profile.totalTermsLearned || 0,
    lessons: profile.totalQuizzesCompleted || 0,
    scores: [],
    weakTerms: profile.weakTerms || {},
    streak: profile.currentStreak || 0,
    lastDay: profile.lastLearningDate || null,
    sessions: sessions.docs.map(d=>({id:d.id,...d.data()}))
  };
  p.scores = p.sessions.map(s=>s.score).filter(n=>typeof n==="number");
  window._progressCache = p;
  return p;
};

async function persistSession(result) {
  const p = await loadProgress();
  const day = todayKey();
  let streak = p.streak || 0;
  if (p.lastDay !== day) {
    if (p.lastDay) {
      const diff = Math.round((new Date(day)-new Date(p.lastDay))/86400000);
      streak = diff === 1 ? streak + 1 : 1;
    } else streak = 1;
  }
  p.streak = streak; p.lastDay = day;
  p.lessons = (p.lessons||0)+1;
  p.terms = (p.terms||0)+result.termsStudied;
  p.scores = [result.score,...(p.scores||[])].slice(0,50);
  p.sessions = [result,...(p.sessions||[])].slice(0,20);
  p.weakTerms = {...(p.weakTerms||{})};
  result.weakTerms.forEach(term => p.weakTerms[term] = (p.weakTerms[term]||0)+1);
  saveLocalProgress(p);
  if (!isDemoMode()) {
    await db.collection("users").doc(currentUser.uid).set({
      totalTermsLearned:p.terms, totalQuizzesCompleted:p.lessons,
      averageScore:p.scores.length ? Math.round(p.scores.reduce((a,b)=>a+b,0)/p.scores.length) : 0,
      currentStreak:p.streak, lastLearningDate:p.lastDay, weakTerms:p.weakTerms
    }, {merge:true});
    await db.collection("users").doc(currentUser.uid).collection("sessions").add({
      topic:result.topic, startedAt:result.startedAt, completedAt:firebase.firestore.FieldValue.serverTimestamp(),
      termsStudied:result.termsStudied, questionsAnswered:result.questionsAnswered,
      correctAnswers:result.correctAnswers, score:result.score, weakTerms:result.weakTerms, completed:true
    });
  }
  window._progressCache = p;
  return p;
}

function termsFor(topic, difficulty) {
  let list = MEDICAL_TERMS.filter(t=>t.category===topic);
  if (list.length < 5) list = MEDICAL_TERMS.filter(t=>t.category.includes(topic));
  if (!list.length) list = MEDICAL_TERMS;
  const rank = {beginner:1, intermediate:2, advanced:3};
  const target = rank[String(difficulty).toLowerCase()] || 2;
  return [...list].sort((a,b)=>Math.abs(rank[a.difficulty]-target)-Math.abs(rank[b.difficulty]-target)).slice(0,5);
}

function makeQuiz(lesson) {
  const qs = lesson.map((t, i) => {
    const distractors = MEDICAL_TERMS.filter(x=>x.term!==t.term && x.category!==t.category)
      .sort(()=>Math.random()-.5).slice(0,3).map(x=>x.definition);
    const options = [t.definition,...distractors].sort(()=>Math.random()-.5);
    return {term:t.term, prompt:`What does "${t.term}" mean?`, options, answer:t.definition, type:"mcq", index:i};
  });
  if (lesson[0]) {
    const t = lesson[0];
    qs.push({term:t.term, prompt:`Complete the sentence: "${t.example.replace(t.term, "_____")}"`, options:[t.term,...MEDICAL_TERMS.filter(x=>x.term!==t.term).sort(()=>Math.random()-.5).slice(0,3).map(x=>x.term)].sort(()=>Math.random()-.5), answer:t.term, type:"context", index:0});
  }
  return qs.slice(0,5);
}

window.startLesson = function(topic, difficulty="Intermediate", customTerms=null) {
  const lesson = customTerms || termsFor(topic,difficulty);
  state.lesson={topic,difficulty,terms:lesson};
  state.termIndex=0; state.quizIndex=0; state.quiz=makeQuiz(lesson); state.answers=[]; state.weak=[];
  state.lessonStarted=new Date().toISOString();
  state.view="lesson";
  render();
};

window.nextTerm = function() {
  if (state.termIndex < state.lesson.terms.length-1) {
    state.termIndex++; render();
  } else {
    state.view="quiz"; state.quizIndex=0; render();
  }
};

window.answerQuiz = function(value) {
  if (state.answers[state.quizIndex]) return;
  const q=state.quiz[state.quizIndex];
  const correct=value===q.answer;
  state.answers[state.quizIndex]={correct,value,term:q.term};
  if (!correct) state.weak.push(q.term);
  render();
};

window.nextQuestion = function() {
  if (!state.answers[state.quizIndex]) return;
  if (state.quizIndex < state.quiz.length-1) { state.quizIndex++; render(); }
  else completeLesson();
};

async function completeLesson() {
  state.view="results"; render();
  const correct=state.answers.filter(a=>a?.correct).length;
  const result={
    topic:state.lesson.topic, startedAt:state.lessonStarted,
    termsStudied:state.lesson.terms.length, questionsAnswered:state.answers.length,
    correctAnswers:correct, score:Math.round(correct/state.quiz.length*100),
    weakTerms:[...new Set(state.weak)]
  };
  await persistSession(result);
  render();
}

window.reviewWeak = async function() {
  const p=await loadProgress();
  const names=Object.keys(p.weakTerms||{}).sort((a,b)=>p.weakTerms[b]-p.weakTerms[a]).slice(0,5);
  const review=MEDICAL_TERMS.filter(t=>names.includes(t.term));
  if (review.length) startLesson("Recommended Review","Intermediate",review);
  else {
    const fallback=termsFor("General Medical Terminology","Intermediate");
    startLesson("General Medical Terminology","Intermediate",fallback);
  }
};

window.generateLesson = async function() {
  const btn=document.getElementById("generateLessonBtn");
  setBusy(btn,true,"Generating...");
  try {
    const generated=await generateLessonWithAI(state.selectedTopic,state.difficulty,5);
    startLesson(state.selectedTopic,state.difficulty,generated);
  } catch(error) {
    toast("AI lesson generation unavailable. Using the built-in lesson.");
    startLesson(state.selectedTopic,state.difficulty);
  } finally { setBusy(btn,false); }
};

window.setTopic = function(v){state.selectedTopic=v; render();}
window.setDifficulty = function(v){state.difficulty=v; render();}

window.navigate = function(view){ state.view=view; if(view!=="lesson"&&view!=="quiz"&&view!=="results") render(); }

window.saveProfilePreference = async function(v) {
  await saveProfile({preferredDifficulty:v});
  state.difficulty=v;
  toast("Preference saved.");
  render();
};

function setBusy(btn,busy,label) {
  if(!btn)return;
  btn.disabled=busy;
  if(busy) btn.dataset.original=btn.textContent;
  btn.textContent=busy?label:(btn.dataset.original||btn.textContent);
}
