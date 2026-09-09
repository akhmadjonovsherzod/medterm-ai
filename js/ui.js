function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function jsArg(value) {
  return encodeURIComponent(String(value ?? ""));
}

function toast(message) {
  const host = document.getElementById("toastHost");
  if (!host) return;

  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  host.appendChild(el);

  setTimeout(() => el.remove(), 3500);
}

function icon(name) {
  const icons = {
    grid: "▦",
    learn: "◫",
    ai: "✦",
    progress: "◔",
    profile: "◉",
    sun: "☼",
    moon: "◐",
    arrow: "→",
    check: "✓",
    close: "×",
    book: "▤",
    fire: "♨",
    clock: "◷"
  };

  return icons[name] || "•";
}

function difficultyBadge(d) {
  return `<span class="badge ${String(d).toLowerCase()}">${esc(d)}</span>`;
}

function render() {
  const root = document.getElementById("appRoot");
  if (!root) return;

  const p = getProgress();

  root.innerHTML =
    state.view === "dashboard" ? dashboardView(p) :
    state.view === "learn" ? learnView() :
    state.view === "lesson" ? lessonView() :
    state.view === "quiz" ? quizView() :
    state.view === "results" ? resultsView(p) :
    state.view === "ai" ? tutorView() :
    state.view === "progress" ? progressView(p) :
    profileView(p);

  bindView();
}

function nav(active) {
  return `
    <nav class="side-nav" aria-label="Main navigation">
      ${
        [
          ["dashboard", "Dashboard", "grid"],
          ["learn", "Learn", "learn"],
          ["ai", "AI Tutor", "ai"],
          ["progress", "Progress", "progress"],
          ["profile", "Profile", "profile"]
        ]
          .map(
            ([v, l, i]) =>
              `<button class="${active === v ? "active" : ""}" onclick="navigate('${v}')">
                <span class="nav-icon">${icon(i)}</span>
                <span>${l}</span>
              </button>`
          )
          .join("")
      }
    </nav>
  `;
}

function shell(content, active) {
  return `
    <div class="shell">

      <aside class="sidebar">

        <div class="brand">
          <div class="brand-mark">+</div>
          <div>
            <strong>MedTerm</strong>
            <span>MicroLearn</span>
          </div>
        </div>

        ${nav(active)}

        <div class="side-note">
          <strong>Learn. Recall. Apply.</strong>
          <p>
            Short medical English sessions designed for consistent practice.
          </p>
        </div>

      </aside>

      <main class="main">

        <header class="topbar">

          <div class="mobile-brand">
            <div class="brand-mark">+</div>
            <strong>MedTerm</strong>
          </div>

          <div class="top-actions">

            <button
              class="icon-btn"
              onclick="toggleTheme()"
              aria-label="Toggle theme"
            >
              ${icon(getTheme() === "dark" ? "sun" : "moon")}
            </button>

            <div class="avatar">
              ${esc(
                (currentProfile?.displayName || "L")[0].toUpperCase()
              )}
            </div>

            <button
              class="mobile-menu"
              onclick="toggleMobileNav()"
              aria-label="Open navigation"
            >
              ☰
            </button>

          </div>

        </header>

        <div class="page">
          ${content}
        </div>

      </main>

    </div>
  `;
}

function dashboardView(p) {
  const name = currentProfile?.displayName || "Learner";

  const weak = Object.entries(p.weakTerms || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return shell(
    `
      <section class="hero">

        <div>
          <span class="eyebrow">DAILY MICRO-LEARNING</span>

          <h1>
            Welcome back, ${esc(name)}.
          </h1>

          <p>
            Build professional medical English vocabulary one focused
            session at a time.
          </p>
        </div>

        <div class="hero-orbit">
          <span>5</span>
          <small>terms</small>
        </div>

      </section>


      <section class="daily-card card">

        <div class="section-label">
          TODAY'S MICRO-LESSON
        </div>

        <div class="daily-grid">

          <div>
            <h2>Respiratory System</h2>

            <p>
              dyspnea · tachypnea · apnea and related terminology.
            </p>

            <div class="meta-row">
              <span>◷ ~5 min</span>
              ${difficultyBadge("Intermediate")}
              <span>5 terms</span>
            </div>
          </div>

          <button
            class="primary-btn"
            onclick="startLesson('Respiratory System','Intermediate')"
          >
            Start lesson ${icon("arrow")}
          </button>

        </div>

      </section>


      <section class="stats-grid">

        ${statCard(
          "Terms learned",
          p.terms || 0,
          "book"
        )}

        ${statCard(
          "Quiz accuracy",
          p.scores?.length
            ? Math.round(
                p.scores.reduce((a, b) => a + b, 0) /
                p.scores.length
              )
            : 0,
          "check",
          "%"
        )}

        ${statCard(
          "Learning streak",
          p.streak || 0,
          "fire",
          " days"
        )}

        ${statCard(
          "Lessons completed",
          p.lessons || 0,
          "learn"
        )}

      </section>


      <section class="two-col">

        <div class="card">

          <div class="card-head">

            <div>
              <span class="section-label">
                RECOMMENDED REVIEW
              </span>

              <h3>
                Strengthen weak terms
              </h3>
            </div>

            <button
              class="text-btn"
              onclick="reviewWeak()"
            >
              Review all ${icon("arrow")}
            </button>

          </div>


          <div class="term-list">

            ${
              weak.length
                ? weak
                    .map(
                      ([t, n]) =>
                        `
                          <div class="review-row">

                            <span class="term-dot"></span>

                            <div>
                              <strong>${esc(t)}</strong>

                              <small>
                                Missed ${n} time${n > 1 ? "s" : ""}
                              </small>
                            </div>

                            <span class="review-arrow">
                              →
                            </span>

                          </div>
                        `
                    )
                    .join("")
                : `
                    <div class="empty-inline">
                      Complete a lesson to get personalized
                      review recommendations.
                    </div>
                  `
            }

          </div>

        </div>


        <div class="card">

          <div class="card-head">

            <div>
              <span class="section-label">
                TOPICS
              </span>

              <h3>
                Choose a pathway
              </h3>
            </div>

          </div>


          <div class="topic-grid">

            ${TOPICS.slice(0, 8)
              .map(
                t =>
                  `
                    <button
                      class="topic-chip"
                      onclick="startLesson(
                        decodeURIComponent('${jsArg(t)}'),
                        'Intermediate'
                      )"
                    >
                      ${esc(t)}
                      <span>→</span>
                    </button>
                  `
              )
              .join("")}

          </div>

        </div>

      </section>
    `,
    "dashboard"
  );
}

function statCard(label, value, ico, suffix = "") {
  return `
    <div class="stat card">

      <div class="stat-icon">
        ${icon(ico)}
      </div>

      <div>
        <span>${label}</span>
        <strong>
          ${value}${suffix}
        </strong>
      </div>

    </div>
  `;
}

function learnView() {
  return shell(
    `
      <div class="page-head">

        <div>
          <span class="eyebrow">
            LEARNING PATH
          </span>

          <h1>
            Choose a micro-lesson
          </h1>

          <p>
            Five terms, a short recall quiz,
            and one contextual challenge.
          </p>
        </div>

      </div>


      <div class="learn-controls card">

        <label>
          Topic

          <select onchange="setTopic(this.value)">
            ${TOPICS.map(
              t =>
                `
                  <option
                    ${t === state.selectedTopic ? "selected" : ""}
                  >
                    ${esc(t)}
                  </option>
                `
            ).join("")}
          </select>

        </label>


        <label>
          Difficulty

          <select onchange="setDifficulty(this.value)">
            ${["Beginner", "Intermediate", "Advanced"]
              .map(
                d =>
                  `
                    <option
                      ${d === state.difficulty ? "selected" : ""}
                    >
                      ${d}
                    </option>
                  `
              )
              .join("")}
          </select>

        </label>


        <button
          class="primary-btn"
          onclick="startLesson(
            state.selectedTopic,
            state.difficulty
          )"
        >
          Start built-in lesson ${icon("arrow")}
        </button>


        <button
          class="secondary-btn"
          id="generateLessonBtn"
          onclick="generateLesson()"
        >
          Generate with AI
        </button>

      </div>


      <div class="lesson-cards">

        ${TOPICS.map(
          (t, i) =>
            `
              <article class="lesson-card card">

                <div class="lesson-number">
                  ${String(i + 1).padStart(2, "0")}
                </div>

                <span class="section-label">
                  ${i % 2 ? "INTERMEDIATE" : "FOUNDATION"}
                </span>

                <h3>
                  ${esc(t)}
                </h3>

                <p>
                  Learn 5 focused terms,
                  then retrieve and apply them.
                </p>

                <button
                  class="text-btn"
                  onclick="startLesson(
                    decodeURIComponent('${jsArg(t)}'),
                    'Intermediate'
                  )"
                >
                  Open lesson ${icon("arrow")}
                </button>

              </article>
            `
        ).join("")}

      </div>
    `,
    "learn"
  );
}

function lessonView() {
  const t = state.lesson.terms[state.termIndex];
  const total = state.lesson.terms.length;

  return shell(
    `
      <div class="lesson-shell">

        <div class="lesson-top">

          <button
            class="back-btn"
            onclick="navigate('learn')"
          >
            ← Back to Learn
          </button>

          <span>
            Term ${state.termIndex + 1} of ${total}
          </span>

        </div>


        <div class="progress-track">
          <div
            style="width:${(state.termIndex / total) * 100}%"
          ></div>
        </div>


        <article class="term-card card">

          <div class="term-card-top">

            <span class="section-label">
              ${esc(state.lesson.topic)}
            </span>

            ${difficultyBadge(t.difficulty)}

          </div>


          <h1>
            ${esc(t.term)}
          </h1>


          <div class="pronunciation">
            /${esc(t.pronunciation)}/
          </div>


          <div class="definition-block">

            <span>
              Simple definition
            </span>

            <p>
              ${esc(t.definition)}
            </p>

          </div>


          <div class="term-details">

            <div>
              <span>UZBEK</span>
              <strong>${esc(t.uzbek)}</strong>
            </div>

            <div>
              <span>MEDICAL CONTEXT</span>
              <strong>${esc(t.example)}</strong>
            </div>

          </div>


          <div class="related">

            <span>
              Related practice
            </span>

            <div>
              ${MEDICAL_TERMS
                .filter(
                  x =>
                    x.category === t.category &&
                    x.term !== t.term
                )
                .slice(0, 3)
                .map(
                  x =>
                    `<span>${esc(x.term)}</span>`
                )
                .join("")}
            </div>

          </div>


          <button
            class="primary-btn wide"
            onclick="nextTerm()"
          >
            ${
              state.termIndex === total - 1
                ? "Start recall quiz"
                : "I understand — next term"
            }

            ${icon("arrow")}
          </button>

        </article>


        <p class="safety-note">
          Educational terminology practice only.
          This app does not diagnose or provide treatment advice.
        </p>

      </div>
    `,
    null
  );
}

function quizView() {
  const q = state.quiz[state.quizIndex];
  const ans = state.answers[state.quizIndex];

  const pct =
    (state.quizIndex / state.quiz.length) * 100;

  return shell(
    `
      <div class="quiz-shell">

        <div class="lesson-top">

          <span class="eyebrow">
            RETRIEVAL PRACTICE
          </span>

          <span>
            Question ${state.quizIndex + 1}
            of ${state.quiz.length}
          </span>

        </div>


        <div class="progress-track">

          <div
            style="width:${pct}%"
          ></div>

        </div>


        <article class="quiz-card card">

          <span class="section-label">
            ${
              q.type === "context"
                ? "CONTEXTUAL EXERCISE"
                : "ACTIVE RECALL"
            }
          </span>


          <h1>
            ${esc(q.prompt)}
          </h1>


          <div class="quiz-options">

            ${q.options
              .map(
                (o, index) =>
                  `
                    <button
                      class="quiz-option ${
                        ans
                          ? o === q.answer
                            ? "correct"
                            : o === ans.value
                            ? "wrong"
                            : ""
                          : ""
                      }"
                      ${ans ? "disabled" : ""}
                      onclick="answerQuiz(
                        decodeURIComponent('${jsArg(o)}')
                      )"
                    >

                      <span class="option-letter">
                        ${String.fromCharCode(65 + index)}
                      </span>

                      <span>
                        ${esc(o)}
                      </span>

                    </button>
                  `
              )
              .join("")}

          </div>


          ${
            ans
              ? `
                <div
                  class="feedback ${
                    ans.correct ? "good" : "bad"
                  }"
                >

                  <strong>
                    ${
                      ans.correct
                        ? "✓ Correct!"
                        : "Not quite."
                    }
                  </strong>

                  <p>
                    ${
                      ans.correct
                        ? q.type === "context"
                          ? "Great context recognition."
                          : `“${esc(q.term)}” means ${esc(q.answer)}.`
                        : `${esc(q.term)} means ${esc(
                            q.answer
                          )}. Let's reinforce this term before continuing.`
                    }
                  </p>

                </div>
              `
              : ""
          }


          ${
            ans
              ? `
                <button
                  class="primary-btn wide"
                  onclick="nextQuestion()"
                >

                  ${
                    state.quizIndex === state.quiz.length - 1
                      ? "See results"
                      : "Next question"
                  }

                  ${icon("arrow")}

                </button>
              `
              : ""
          }

        </article>

      </div>
    `,
    null
  );
}

function resultsView(p) {
  const score = state.answers.filter(
    a => a?.correct
  ).length;

  const total = state.quiz.length;

  const pct = Math.round(
    (score / total) * 100
  );

  const weak = [...new Set(state.weak)];

  return shell(
    `
      <div class="results-shell">

        <div class="result-mark">
          ${pct >= 80 ? "✓" : "↗"}
        </div>

        <span class="eyebrow">
          LESSON COMPLETE
        </span>

        <h1>
          ${
            pct >= 80
              ? "Strong work."
              : "Good start — keep building."
          }
        </h1>

        <p class="result-sub">
          ${esc(state.lesson.topic)}
        </p>


        <div class="result-grid">

          <div>
            <span>Terms studied</span>
            <strong>
              ${state.lesson.terms.length}
            </strong>
          </div>

          <div>
            <span>Correct answers</span>
            <strong>
              ${score}/${total}
            </strong>
          </div>

          <div>
            <span>Score</span>
            <strong>
              ${pct}%
            </strong>
          </div>

        </div>


        <div class="two-col result-cols">

          <div class="card">

            <span class="section-label">
              STRONG AREAS
            </span>

            <h3>
              What went well
            </h3>

            <p>
              Definitions and context were reinforced
              through retrieval practice.
            </p>

          </div>


          <div class="card">

            <span class="section-label">
              NEEDS PRACTICE
            </span>

            <h3>
              ${
                weak.length
                  ? weak.join(", ")
                  : "Nothing flagged"
              }
            </h3>

            <p>
              ${
                weak.length
                  ? "Review these terms in your next microlearning session."
                  : "Keep the momentum going with another topic."
              }
            </p>

          </div>

        </div>


        <div class="result-actions">

          <button
            class="primary-btn"
            onclick="navigate('dashboard')"
          >
            Back to dashboard
          </button>

          <button
            class="secondary-btn"
            onclick="reviewWeak()"
          >
            Review weak terms
          </button>

          <button
            class="secondary-btn"
            onclick="navigate('ai')"
          >
            Ask AI Tutor
          </button>

        </div>

      </div>
    `,
    null
  );
}

function tutorView() {
  return shell(
    `
      <div class="page-head">

        <div>

          <span class="eyebrow">
            EDUCATIONAL ASSISTANT
          </span>

          <h1>
            Medical English Tutor
          </h1>

          <p>
            Ask about terminology, compare terms,
            or practice retrieval. Answers stay concise
            and student-focused.
          </p>

        </div>

      </div>


      <div class="tutor-layout card">

        <div
          id="tutorMessages"
          class="tutor-messages"
        >

          <div class="tutor-welcome">

            <div class="ai-mark">
              ✦
            </div>

            <h2>
              What would you like to practice?
            </h2>

            <p>
              I can explain a term, compare terminology,
              give examples, or quiz you.
            </p>


            <div class="prompt-grid">

              ${
                [
                  "Explain myocardial infarction",
                  "Compare dyspnea and tachypnea",
                  "Give me an example using prognosis",
                  "Translate etiology to Uzbek",
                  "Quiz me on cardiovascular terminology",
                  "Help me remember pathogenesis"
                ]
                  .map(
                    x =>
                      `
                        <button
                          onclick="tutorPrompt(
                            decodeURIComponent('${jsArg(x)}')
                          )"
                        >
                          ${esc(x)}
                        </button>
                      `
                  )
                  .join("")
              }

            </div>

          </div>

        </div>


        <form
          class="tutor-input"
          onsubmit="sendTutor(event)"
        >

          <input
            id="tutorInput"
            aria-label="Ask the medical English tutor"
            placeholder="Ask a terminology question..."
            autocomplete="off"
          >

          <button
            class="primary-btn"
            type="submit"
          >
            Send ${icon("arrow")}
          </button>

        </form>

      </div>


      <p class="safety-note">
        Educational use only. If you ask for diagnosis
        or treatment, the tutor will redirect to
        terminology education.
      </p>
    `,
    "ai"
  );
}

function progressView(p) {
  const avg = p.scores?.length
    ? Math.round(
        p.scores.reduce((a, b) => a + b, 0) /
        p.scores.length
      )
    : 0;

  const weak = Object.entries(
    p.weakTerms || {}
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return shell(
    `
      <div class="page-head">

        <div>

          <span class="eyebrow">
            YOUR LEARNING DATA
          </span>

          <h1>
            Progress
          </h1>

          <p>
            Simple feedback loops show what you know
            and what deserves another look.
          </p>

        </div>

      </div>


      <div class="stats-grid">

        ${statCard(
          "Terms learned",
          p.terms || 0,
          "book"
        )}

        ${statCard(
          "Average score",
          avg,
          "check",
          "%"
        )}

        ${statCard(
          "Current streak",
          p.streak || 0,
          "fire",
          " days"
        )}

        ${statCard(
          "Lessons completed",
          p.lessons || 0,
          "learn"
        )}

      </div>


      <div class="two-col">

        <div class="card">

          <div class="card-head">

            <div>

              <span class="section-label">
                TOPIC PERFORMANCE
              </span>

              <h3>
                Keep your practice balanced
              </h3>

            </div>

          </div>


          ${TOPICS.slice(0, 7)
            .map((t, i) => {
              const performance = Math.min(
                95,
                35 + i * 7 + avg / 5
              );

              return `
                <div class="metric-row">

                  <span>
                    ${esc(t)}
                  </span>

                  <div class="metric">
                    <i
                      style="width:${performance}%"
                    ></i>
                  </div>

                  <strong>
                    ${performance}%
                  </strong>

                </div>
              `;
            })
            .join("")}

        </div>


        <div class="card">

          <span class="section-label">
            WEAK TERMS
          </span>

          <h3>
            Recommended review
          </h3>


          <div class="term-list">

            ${
              weak.length
                ? weak
                    .map(
                      ([t, n]) =>
                        `
                          <div class="review-row">

                            <div>

                              <strong>
                                ${esc(t)}
                              </strong>

                              <small>
                                Needs reinforcement ·
                                ${n} missed
                              </small>

                            </div>

                          </div>
                        `
                    )
                    .join("")
                : `
                    <div class="empty-inline">
                      No weak terms yet.
                      Your quiz results will personalize
                      this list.
                    </div>
                  `
            }

          </div>

        </div>

      </div>


      <div class="card sessions">

        <div class="card-head">

          <div>

            <span class="section-label">
              RECENT SESSIONS
            </span>

            <h3>
              Learning history
            </h3>

          </div>

        </div>


        ${
          (p.sessions || [])
            .slice(0, 6)
            .map(
              s =>
                `
                  <div class="session-row">

                    <div>

                      <strong>
                        ${esc(
                          s.topic ||
                          "Micro-lesson"
                        )}
                      </strong>

                      <small>
                        ${s.termsStudied || 5}
                        terms ·
                        ${s.correctAnswers || 0}/
                        ${s.questionsAnswered || 0}
                        correct
                      </small>

                    </div>

                    <b>
                      ${s.score || 0}%
                    </b>

                  </div>
                `
            )
            .join("") ||
          `
            <div class="empty-inline">
              Finish your first lesson to see
              session history.
            </div>
          `
        }

      </div>
    `,
    "progress"
  );
}

function profileView(p) {
  return shell(
    `
      <div class="page-head">

        <div>

          <span class="eyebrow">
            ACCOUNT
          </span>

          <h1>
            Profile
          </h1>

          <p>
            Keep your learning preferences
            simple and private.
          </p>

        </div>

      </div>


      <div class="profile-grid">

        <div class="card profile-card">

          <div class="big-avatar">
            ${esc(
              (currentProfile?.displayName || "L")[0]
                .toUpperCase()
            )}
          </div>

          <h2>
            ${esc(
              currentProfile?.displayName ||
              "Learner"
            )}
          </h2>

          <p>
            ${esc(
              currentProfile?.email || ""
            )}
          </p>


          <div class="profile-stats">

            <span>
              <b>${p.lessons || 0}</b>
              lessons
            </span>

            <span>
              <b>${p.streak || 0}</b>
              day streak
            </span>

          </div>

        </div>


        <div class="card">

          <span class="section-label">
            PREFERENCES
          </span>

          <h3>
            Learning settings
          </h3>


          <label class="setting">

            Preferred difficulty

            <select
              onchange="saveProfilePreference(this.value)"
            >

              ${["Beginner", "Intermediate", "Advanced"]
                .map(
                  d =>
                    `
                      <option
                        ${
                          d ===
                          (
                            currentProfile?.preferredDifficulty ||
                            "Intermediate"
                          )
                            ? "selected"
                            : ""
                        }
                      >
                        ${d}
                      </option>
                    `
                )
                .join("")}

            </select>

          </label>


          <div class="setting">

            <span>
              Theme
            </span>

            <button
              class="secondary-btn"
              onclick="toggleTheme()"
            >
              Switch light/dark
            </button>

          </div>


          <div class="setting">

            <span>
              Account
            </span>

            <button
              class="danger-btn"
              onclick="doLogout()"
            >
              Sign out
            </button>

          </div>

        </div>

      </div>
    `,
    "profile"
  );
}

function bindView() {
  const input =
    document.getElementById("tutorInput");

  if (input) {
    input.focus();
  }
}

window.tutorPrompt = function (text) {
  const input =
    document.getElementById("tutorInput");

  if (input) {
    input.value = text;
    sendTutor(new Event("submit"));
  }
};

window.sendTutor = async function (e) {
  e.preventDefault();

  const input =
    document.getElementById("tutorInput");

  const box =
    document.getElementById("tutorMessages");

  const text =
    input?.value.trim();

  if (!text) return;

  input.value = "";

  const user =
    document.createElement("div");

  user.className = "chat-msg user";

  user.innerHTML = `
    <span>You</span>
    <p>${esc(text)}</p>
  `;

  box.appendChild(user);


  const loading =
    document.createElement("div");

  loading.className = "chat-msg ai";

  loading.innerHTML = `
    <span>MedTerm Tutor</span>
    <p class="loading">
      Thinking<span> ·</span>
    </p>
  `;

  box.appendChild(loading);

  box.scrollTop = box.scrollHeight;


  state.tutorHistory.push({
    role: "user",
    text
  });


  try {

    const context = state.lesson
      ? state.lesson.terms
          .map(
            t =>
              `${t.term}: ${t.definition}`
          )
          .join("; ")
      : "No active lesson.";


    const reply =
      await askTutor(
        text,
        context
      );


    loading.innerHTML = `
      <span>MedTerm Tutor</span>
      <p>${formatTutor(reply)}</p>
    `;


    state.tutorHistory.push({
      role: "model",
      text: reply
    });

  } catch (error) {

    loading.innerHTML = `
      <span>MedTerm Tutor</span>
      <p>
        AI tutor is temporarily unavailable.
        You can continue using the built-in
        medical terminology lessons.
      </p>
    `;

  }

  box.scrollTop =
    box.scrollHeight;
};

function formatTutor(text) {
  let html = esc(text);

  // Remove unnecessary escaping before Markdown characters
  html = html.replace(/\\([#*_\-])/g, "$1");

  // Headings
  html = html.replace(
    /^###\s+(.+)$/gm,
    "<h4>$1</h4>"
  );

  html = html.replace(
    /^##\s+(.+)$/gm,
    "<h3>$1</h3>"
  );

  html = html.replace(
    /^#\s+(.+)$/gm,
    "<h2>$1</h2>"
  );

  // Horizontal rules
  html = html.replace(
    /^---+$/gm,
    "<hr>"
  );

  // Bold
  html = html.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );

  // Italic
  html = html.replace(
    /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
    "<em>$1</em>"
  );

  // Bullet points
  html = html.replace(
    /^[*-]\s+(.+)$/gm,
    "<li>$1</li>"
  );

  // Numbered lists
  html = html.replace(
    /^\d+\.\s+(.+)$/gm,
    "<li>$1</li>"
  );

  // Wrap consecutive list items in <ul>
  html = html.replace(
    /((?:<li>.*?<\/li>\s*)+)/gs,
    "<ul>$1</ul>"
  );

  // Paragraphs / line breaks
  html = html.replace(
    /\n{2,}/g,
    "</p><p>"
  );

  html = html.replace(
    /\n/g,
    "<br>"
  );

  return `<div class="tutor-formatted"><p>${html}</p></div>`;
}

window.doLogout = async function () {
  await logOut();
  location.reload();
};

window.toggleTheme = function () {
  const next =
    getTheme() === "dark"
      ? "light"
      : "dark";

  localStorage.setItem(
    "medterm-theme",
    next
  );

  applyTheme();
};

function getTheme() {
  return (
    localStorage.getItem(
      "medterm-theme"
    ) || "light"
  );
}

function applyTheme() {
  document.documentElement.dataset.theme =
    getTheme();
}

window.toggleMobileNav = function () {
  document
    .querySelector(".sidebar")
    ?.classList.toggle(
      "mobile-open"
    );
};