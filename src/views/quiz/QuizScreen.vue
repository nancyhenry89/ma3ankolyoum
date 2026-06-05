<template>
    <ion-page>
      <ion-content :fullscreen="true">
    <div class="quiz-page">
      <div class="quiz-card big-screen">
        <h1 class="quiz-title">{{ quiz?.title || "المسابقة" }}</h1>
  
        <div v-if="!quiz">
          <p class="quiz-error">لا توجد مسابقة نشطة الآن</p>
        </div>
  
        <div v-else-if="quiz.state === 'waiting'">
          <h2 class="quiz-title">امسح الكود وادخل المسابقة</h2>
  
          <div style="text-align:center; margin: 24px">
            <qrcode-vue :value="joinUrl" :size="220" />
            <p style="font-size: 28px; font-weight: 800">{{ joinUrl }}</p>
          </div>
  
          <h3>المشاركون: {{ players.length }}</h3>
  
          <div class="quiz-row">
            <span v-for="p in players" :key="p.id" class="quiz-option">
              {{ p.name }}
            </span>
          </div>
        </div>
  
        <div v-else-if="quiz.state === 'question' && currentQuestion">
          <div class="big-timer">{{ timer }}</div>
  
          <h2 class="big-question">{{ currentQuestion.text }}</h2>
  
          <div class="quiz-grid">
            <div
              v-for="(option, index) in currentQuestion.options"
              :key="index"
              class="quiz-option"
            >
              {{ letters[index] }}. {{ option }}
            </div>
          </div>
  
          <p class="quiz-subtitle" style="font-size: 26px">
            الإجابات المستلمة: {{ answers.length }} / {{ players.length }}
          </p>
        </div>
  
        <div v-else-if="quiz.state === 'closed'">
          <h2 class="quiz-title">نتيجة السؤال</h2>
  
          <div
            v-for="(option, index) in currentQuestion?.options"
            :key="index"
            class="result-bar"
          >
            <div class="result-label">
              {{ letters[index] }}. {{ option }} — {{ getPercentage(index) }}%
            </div>
            <div class="result-track">
              <div
                class="result-fill"
                :style="{ width: getPercentage(index) + '%' }"
              ></div>
            </div>
          </div>
        </div>
  
        <div v-else-if="quiz.state === 'answer'">
          <h2 class="quiz-title">الإجابة الصحيحة</h2>
          <p class="big-question">
            {{ letters[currentQuestion?.correctIndex || 0] }}.
            {{ currentQuestion?.options[currentQuestion?.correctIndex || 0] }}
          </p>
          <p class="quiz-subtitle" style="font-size: 28px">
            {{ currentQuestion?.explanation }}
          </p>
        </div>
  
        <div v-else-if="quiz.state === 'leaderboard'">
          <h2 class="quiz-title">🏆 الترتيب</h2>
  
          <div
            v-for="(player, index) in sortedPlayers.slice(0, 10)"
            :key="player.id"
            class="leaderboard-row"
          >
            <div>{{ medal(index) }}</div>
            <div>{{ player.name }}</div>
            <div>{{ player.score }}</div>
          </div>
        </div>
  
        <div v-else-if="quiz.state === 'finished'">
          <h2 class="quiz-title">🎉 انتهت المسابقة</h2>
  
          <div
            v-for="(player, index) in sortedPlayers.slice(0, 3)"
            :key="player.id"
            class="leaderboard-row"
          >
            <div>{{ medal(index) }}</div>
            <div>{{ player.name }}</div>
            <div>{{ player.score }}</div>
          </div>
        </div>
      </div>
    </div>
</ion-content>
  </ion-page>
</template>
  
  <script setup lang="ts">
  import { IonPage, IonContent } from "@ionic/vue";
  import { computed, onMounted, onUnmounted, ref, watch } from "vue";
  import QrcodeVue from "qrcode.vue";
  import {
    listenActiveQuiz,
    listenPlayers,
    listenAnswers,
    type Quiz,
    type Player,
    type Answer,
  } from "@/services/quizService";
  import "./quiz.css";
  
  const quiz = ref<Quiz | null>(null);
  const players = ref<Player[]>([]);
  const answers = ref<Answer[]>([]);
  const timer = ref(0);
  
  const letters = ["A", "B", "C", "D"];
  const joinUrl = `${window.location.origin}/quiz`;
  
  let unsubQuiz: null | (() => void) = null;
  let unsubPlayers: null | (() => void) = null;
  let unsubAnswers: null | (() => void) = null;
  let interval: any = null;
  
  const currentQuestion = computed(() => {
    if (!quiz.value) return null;
    return quiz.value.questions[quiz.value.currentQuestionIndex];
  });
  
  const sortedPlayers = computed(() => {
    return [...players.value].sort((a, b) => b.score - a.score);
  });
  
  onMounted(() => {
    unsubQuiz = listenActiveQuiz((activeQuiz) => {
      quiz.value = activeQuiz;
  
      if (unsubPlayers) unsubPlayers();
      if (unsubAnswers) unsubAnswers();
  
      if (activeQuiz?.id) {
        unsubPlayers = listenPlayers(activeQuiz.id, (data) => {
          players.value = data;
        });
  
        unsubAnswers = listenAnswers(
          activeQuiz.id,
          activeQuiz.currentQuestionIndex,
          (data) => {
            answers.value = data;
          }
        );
      }
    });
  });
  
  onUnmounted(() => {
    if (unsubQuiz) unsubQuiz();
    if (unsubPlayers) unsubPlayers();
    if (unsubAnswers) unsubAnswers();
    if (interval) clearInterval(interval);
  });
  
  watch(
    () => [quiz.value?.state, quiz.value?.currentQuestionIndex],
    () => {
      if (!quiz.value) return;
  
      if (interval) clearInterval(interval);
  
      if (quiz.value.state === "question") {
        timer.value = quiz.value.timePerQuestion;
  
        interval = setInterval(() => {
          timer.value--;
  
          if (timer.value <= 0 && interval) {
            clearInterval(interval);
          }
        }, 1000);
      }
    }
  );
  
  function getPercentage(optionIndex: number) {
    if (!answers.value.length) return 0;
  
    const count = answers.value.filter(
      (a) => a.selectedIndex === optionIndex
    ).length;
  
    return Math.round((count / answers.value.length) * 100);
  }
  
  function medal(index: number) {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return index + 1;
  }
  </script>