<template>
    <ion-page>
      <ion-content :fullscreen="true">
        <div v-if="!isAdminUnlocked" class="quiz-page">
          <div class="quiz-card">
            <h1 class="quiz-title">دخول المسؤول</h1>
  
            <input
              v-model="adminPasswordInput"
              type="password"
              class="quiz-input"
              placeholder="كلمة المرور"
              @keyup.enter="unlockAdmin"
            />
  
            <p v-if="adminPasswordError" class="quiz-error">
              {{ adminPasswordError }}
            </p>
  
            <button class="quiz-button" @click="unlockAdmin">
              دخول
            </button>
          </div>
        </div>
  
        <div v-else class="quiz-page">
          <div class="quiz-card">
            <button class="quiz-button danger" @click="logoutAdmin">
              خروج المسؤول
            </button>
  
            <h1 class="quiz-title">إدارة المسابقات</h1>
  
            <div class="quiz-admin-layout">
              <div>
                <h2>إنشاء / تعديل مسابقة</h2>
  
                <label>عنوان المسابقة</label>
                <input v-model="form.title" class="quiz-input" />
  
                <label>وقت كل سؤال بالثواني</label>
                <input
                  v-model.number="form.timePerQuestion"
                  type="number"
                  class="quiz-input"
                />
  
                <label>نقاط الإجابة الصحيحة</label>
                <input
                  v-model.number="form.correctPoints"
                  type="number"
                  class="quiz-input"
                />
  
                <label>
                  <input type="checkbox" v-model="form.speedBonusEnabled" />
                  تفعيل نقاط السرعة
                </label>
  
                <h3>الأسئلة</h3>
  
                <div
                  v-for="(q, qIndex) in form.questions"
                  :key="qIndex"
                  class="quiz-question-editor"
                >
                  <h4>سؤال {{ qIndex + 1 }}</h4>
  
                  <label>نص السؤال</label>
                  <textarea v-model="q.text" class="quiz-textarea"></textarea>
  
                  <label>الاختيارات</label>
                  <input
                    v-for="(option, oIndex) in q.options"
                    :key="oIndex"
                    v-model="q.options[oIndex]"
                    class="quiz-input"
                    :placeholder="`اختيار ${letters[oIndex]}`"
                  />
  
                  <label>الإجابة الصحيحة</label>
                  <select v-model.number="q.correctIndex" class="quiz-select">
                    <option :value="0">A</option>
                    <option :value="1">B</option>
                    <option :value="2">C</option>
                    <option :value="3">D</option>
                  </select>
  
                  <label>شرح قصير بعد ظهور الإجابة</label>
                  <textarea v-model="q.explanation" class="quiz-textarea"></textarea>
  
                  <button class="quiz-button danger" @click="removeQuestion(qIndex)">
                    حذف السؤال
                  </button>
                </div>
  
                <button class="quiz-button secondary" @click="addQuestion">
                  إضافة سؤال
                </button>
  
                <button class="quiz-button" @click="saveQuiz">
                  {{ editingQuizId ? "حفظ التعديلات" : "إنشاء المسابقة" }}
                </button>
  
                <p v-if="message" class="quiz-success">{{ message }}</p>
                <p v-if="error" class="quiz-error">{{ error }}</p>
              </div>
  
              <div>
                <h2>المسابقات</h2>
  
                <div
                  v-for="quizItem in quizzes"
                  :key="quizItem.id"
                  class="quiz-question-editor"
                >
                  <h3>{{ quizItem.title }}</h3>
                  <p>عدد الأسئلة: {{ quizItem.questions.length }}</p>
                  <p>الحالة: {{ quizItem.active ? "نشطة" : "غير نشطة" }}</p>
  
                  <button class="quiz-button secondary" @click="editQuiz(quizItem)">
                    تعديل
                  </button>
  
                  <button class="quiz-button" @click="activateQuiz(quizItem)">
                    جعلها نشطة
                  </button>
  
                  <button class="quiz-button danger" @click="removeQuiz(quizItem)">
                    حذف
                  </button>
                </div>
              </div>
            </div>
          </div>
  
          <div class="quiz-card" v-if="activeQuiz">
            <h2 class="quiz-title">لوحة التحكم المباشر</h2>
  
            <p class="quiz-subtitle">
              المسابقة النشطة: {{ activeQuiz.title }}
            </p>
  
            <div class="quiz-row" style="justify-content:center">
              <button class="quiz-button" @click="setState('waiting')">
                غرفة الانتظار
              </button>
  
              <button class="quiz-button" @click="startQuestion">
                بدء السؤال
              </button>
  
              <button class="quiz-button secondary" @click="setState('closed')">
                إغلاق السؤال وعرض النسب
              </button>
  
              <button class="quiz-button secondary" @click="setState('answer')">
                إظهار الإجابة
              </button>
  
              <button class="quiz-button secondary" @click="setState('leaderboard')">
                الترتيب
              </button>
  
              <button class="quiz-button" @click="nextQuestion">
                السؤال التالي
              </button>
  
              <button class="quiz-button danger" @click="finishQuiz">
                إنهاء المسابقة
              </button>
  
              <button class="quiz-button danger" @click="resetPlayers">
                مسح المشاركين والإجابات
              </button>
            </div>
  
            <p class="quiz-subtitle">
              السؤال الحالي:
              {{ activeQuiz.currentQuestionIndex + 1 }}
              /
              {{ activeQuiz.questions.length }}
            </p>
  
            <p class="quiz-subtitle">
              الحالة الحالية: {{ activeQuiz.state }}
            </p>
          </div>
        </div>
      </ion-content>
    </ion-page>
  </template>
<script setup lang="ts">
import { IonPage, IonContent } from "@ionic/vue";
import { onMounted, onUnmounted, reactive, ref } from "vue";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/views/quiz/firebase";
import {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  listenActiveQuiz,
  resetQuizPlayersAndAnswers,
  type Quiz,
  type QuizState,
} from "@/services/quizService";

import "./quiz.css";

const letters = ["A", "B", "C", "D"];

const quizzes = ref<Quiz[]>([]);
const activeQuiz = ref<Quiz | null>(null);
const editingQuizId = ref("");
const message = ref("");
const error = ref("");

const adminPasswordInput = ref("");
const adminPasswordError = ref("");
const isAdminUnlocked = ref(
  localStorage.getItem("quizAdminUnlocked") === "true"
);

const form = reactive<Omit<Quiz, "id" | "createdAt">>({
  title: "مقدمة في سفر الأمثال",
  active: false,
  state: "waiting",
  currentQuestionIndex: 0,
  timePerQuestion: 15,
  correctPoints: 100,
  speedBonusEnabled: true,
  questions: [
    {
      text: "من هو الكاتب الرئيسي لسفر الأمثال؟",
      options: ["سليمان", "داود", "موسى", "إشعياء"],
      correctIndex: 0,
      explanation: "يبدأ السفر بعبارة: أمثال سليمان بن داود ملك إسرائيل.",
    },
  ],
});

let unsubActive: null | (() => void) = null;

onMounted(async () => {
  await loadQuizzes();

  unsubActive = listenActiveQuiz((quiz) => {
    activeQuiz.value = quiz;
  });
});

onUnmounted(() => {
  if (unsubActive) unsubActive();
});

function unlockAdmin() {
  adminPasswordError.value = "";

  if (adminPasswordInput.value === import.meta.env.VITE_QUIZ_ADMIN_PASSWORD) {
    isAdminUnlocked.value = true;
    localStorage.setItem("quizAdminUnlocked", "true");
  } else {
    adminPasswordError.value = "كلمة المرور غير صحيحة";
  }
}

function logoutAdmin() {
  isAdminUnlocked.value = false;
  localStorage.removeItem("quizAdminUnlocked");
}

async function loadQuizzes() {
  const snap = await getDocs(collection(db, "quizzes"));

  quizzes.value = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Quiz[];
}

function addQuestion() {
  form.questions.push({
    text: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    explanation: "",
  });
}

function removeQuestion(index: number) {
  form.questions.splice(index, 1);
}

function validateForm() {
  if (!form.title.trim()) return "اكتب عنوان المسابقة";
  if (!form.questions.length) return "أضف سؤال واحد على الأقل";

  for (let i = 0; i < form.questions.length; i++) {
    const q = form.questions[i];

    if (!q.text.trim()) return `اكتب نص السؤال رقم ${i + 1}`;

    if (q.options.some((o) => !o.trim())) {
      return `كل اختيارات السؤال رقم ${i + 1} مطلوبة`;
    }
  }

  return "";
}

async function saveQuiz() {
  message.value = "";
  error.value = "";

  const validation = validateForm();

  if (validation) {
    error.value = validation;
    return;
  }

  const payload = JSON.parse(JSON.stringify(form));

  if (editingQuizId.value) {
    await updateQuiz(editingQuizId.value, payload);
    message.value = "تم حفظ التعديلات";
  } else {
    await createQuiz(payload);
    message.value = "تم إنشاء المسابقة";
  }

  editingQuizId.value = "";
  resetForm();
  await loadQuizzes();
}

function editQuiz(quiz: Quiz) {
  if (!quiz.id) return;

  editingQuizId.value = quiz.id;

  form.title = quiz.title;
  form.active = quiz.active;
  form.state = quiz.state;
  form.currentQuestionIndex = quiz.currentQuestionIndex;
  form.timePerQuestion = quiz.timePerQuestion;
  form.correctPoints = quiz.correctPoints;
  form.speedBonusEnabled = quiz.speedBonusEnabled;
  form.questions = JSON.parse(JSON.stringify(quiz.questions));
}

function resetForm() {
  form.title = "مقدمة في سفر الأمثال";
  form.active = false;
  form.state = "waiting";
  form.currentQuestionIndex = 0;
  form.timePerQuestion = 15;
  form.correctPoints = 100;
  form.speedBonusEnabled = true;
  form.questions = [
    {
      text: "",
      options: ["", "", "", ""],
      correctIndex: 0,
      explanation: "",
    },
  ];
}

async function activateQuiz(quiz: Quiz) {
  if (!quiz.id) return;

  const snap = await getDocs(collection(db, "quizzes"));

  await Promise.all(
    snap.docs.map((d) =>
      updateDoc(doc(db, "quizzes", d.id), {
        active: false,
      })
    )
  );

  await updateQuiz(quiz.id, {
    active: true,
    state: "waiting",
    currentQuestionIndex: 0,
  });

  await loadQuizzes();
}

async function removeQuiz(quiz: Quiz) {
  if (!quiz.id) return;

  const ok = confirm(`هل تريد حذف "${quiz.title}"؟`);
  if (!ok) return;

  await deleteQuiz(quiz.id);
  await loadQuizzes();
}

async function setState(state: QuizState) {
  if (!activeQuiz.value?.id) return;
  await updateQuiz(activeQuiz.value.id, { state });
}

async function startQuestion() {
  if (!activeQuiz.value?.id) return;

  await updateQuiz(activeQuiz.value.id, {
    state: "question",
    questionStartedAt: serverTimestamp(),
  });
}

async function nextQuestion() {
  if (!activeQuiz.value?.id) return;

  const next = activeQuiz.value.currentQuestionIndex + 1;

  if (next >= activeQuiz.value.questions.length) {
    await updateQuiz(activeQuiz.value.id, { state: "finished" });
    return;
  }

  await updateQuiz(activeQuiz.value.id, {
    currentQuestionIndex: next,
    state: "question",
    questionStartedAt: serverTimestamp(),
  });
}

async function finishQuiz() {
  if (!activeQuiz.value?.id) return;
  await updateQuiz(activeQuiz.value.id, { state: "finished" });
}

async function resetPlayers() {
  if (!activeQuiz.value?.id) return;

  const ok = confirm("هل تريد مسح كل المشاركين والإجابات؟");
  if (!ok) return;

  await resetQuizPlayersAndAnswers(activeQuiz.value.id);
}
</script>