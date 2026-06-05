<template>
    <ion-page>
      <ion-content :fullscreen="true">
    <div class="quiz-page">
      <div class="quiz-card">
        <h1 class="quiz-title">{{ quiz?.title || "المسابقة" }}</h1>
        <p class="quiz-subtitle">اكتب اسمك للدخول إلى المسابقة</p>
  
        <div v-if="!quiz">
          <p class="quiz-error">لا توجد مسابقة نشطة الآن</p>
        </div>
  
        <div v-else-if="!playerId">
          <input
            v-model="name"
            class="quiz-input"
            placeholder="اكتب اسمك"
            @keyup.enter="handleJoin"
          />
  
          <p v-if="error" class="quiz-error">{{ error }}</p>
  
          <button class="quiz-button" @click="handleJoin">دخول المسابقة</button>
        </div>
  
        <div v-else>
          <PlayerQuiz
            v-if="quiz"
            :quiz="quiz"
            :player-id="playerId"
            :player-name="playerName"
          />
        </div>
      </div>
    </div>
</ion-content>
  </ion-page>
</template>
  
  <script setup lang="ts">
  import { IonPage, IonContent } from "@ionic/vue";
  import { ref, onMounted, onUnmounted } from "vue";
  import { listenActiveQuiz, joinQuiz, type Quiz } from "@/services/quizService";
  import PlayerQuiz from "./components/PlayerQuiz.vue";
  import "./quiz.css";
  
  const quiz = ref<Quiz | null>(null);
  const name = ref("");
  const error = ref("");
  const playerId = ref(localStorage.getItem("quizPlayerId") || "");
  const playerName = ref(localStorage.getItem("quizPlayerName") || "");
  
  let unsub: null | (() => void) = null;
  
  onMounted(() => {
    unsub = listenActiveQuiz((activeQuiz) => {
      quiz.value = activeQuiz;
  
      const savedQuizId = localStorage.getItem("quizId");
      if (activeQuiz?.id && savedQuizId !== activeQuiz.id) {
        localStorage.removeItem("quizPlayerId");
        localStorage.removeItem("quizPlayerName");
        localStorage.removeItem("quizId");
        playerId.value = "";
        playerName.value = "";
      }
    });
  });
  
  onUnmounted(() => {
    if (unsub) unsub();
  });
  
  async function handleJoin() {
    error.value = "";
  
    if (!quiz.value?.id) {
      error.value = "لا توجد مسابقة نشطة الآن";
      return;
    }
  
    if (!name.value.trim()) {
      error.value = "من فضلك اكتب اسمك";
      return;
    }
  
    try {
      const id = await joinQuiz(quiz.value.id, name.value);
      playerId.value = id;
      playerName.value = name.value.trim();
    } catch (e: any) {
      if (e.message === "NAME_TAKEN") {
        error.value = "هذا الاسم مستخدم بالفعل. اختار اسم آخر.";
      } else {
        error.value = "حدث خطأ. حاول مرة أخرى.";
      }
    }
  }
  </script>