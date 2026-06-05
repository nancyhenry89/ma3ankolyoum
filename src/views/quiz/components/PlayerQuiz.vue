<template>
    <div>
      <p class="quiz-success">أهلاً {{ playerName }}</p>
  
      <div v-if="quiz.state === 'waiting'">
        <h2 class="quiz-title">انتظر بداية المسابقة</h2>
        <p class="quiz-subtitle">سيظهر السؤال هنا عند بدء المسابقة.</p>
      </div>
  
      <div v-else-if="quiz.state === 'question' && currentQuestion">
        <h2 class="quiz-title">السؤال {{ quiz.currentQuestionIndex + 1 }}</h2>
  
        <p class="quiz-subtitle">{{ currentQuestion.text }}</p>
  
        <div class="quiz-grid">
          <button
            v-for="(option, index) in currentQuestion.options"
            :key="index"
            class="quiz-option"
            :class="{ selected: selectedIndex === index }"
            :disabled="answered"
            @click="answer(index)"
          >
            {{ letters[index] }}. {{ option }}
          </button>
        </div>
  
        <p v-if="answered" class="quiz-success">
          تم استلام إجابتك ✓
        </p>
      </div>
  
      <div v-else-if="quiz.state === 'closed'">
        <h2 class="quiz-title">انتهى وقت السؤال</h2>
        <p class="quiz-subtitle">انتظر عرض النتيجة.</p>
      </div>
  
      <div v-else-if="quiz.state === 'answer'">
        <h2 class="quiz-title">الإجابة الصحيحة</h2>
        <p class="quiz-success">
          {{ letters[currentQuestion?.correctIndex || 0] }}.
          {{ currentQuestion?.options[currentQuestion?.correctIndex || 0] }}
        </p>
        <p>{{ currentQuestion?.explanation }}</p>
      </div>
  
      <div v-else-if="quiz.state === 'leaderboard'">
        <h2 class="quiz-title">تابع الترتيب على الشاشة</h2>
      </div>
  
      <div v-else-if="quiz.state === 'finished'">
        <h2 class="quiz-title">انتهت المسابقة 🎉</h2>
        <p class="quiz-subtitle">شكرًا لمشاركتك.</p>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed, ref, watch } from "vue";
  import { submitAnswer, type Quiz } from "@/services/quizService";
  
  const props = defineProps<{
    quiz: Quiz;
    playerId: string;
    playerName: string;
  }>();
  
  const letters = ["A", "B", "C", "D"];
  const answered = ref(false);
  const selectedIndex = ref<number | null>(null);
  const questionStartedAt = ref(Date.now());
  
  const currentQuestion = computed(() => {
    return props.quiz.questions[props.quiz.currentQuestionIndex];
  });
  
  watch(
    () => [props.quiz.currentQuestionIndex, props.quiz.state],
    () => {
      if (props.quiz.state === "question") {
        answered.value = false;
        selectedIndex.value = null;
        questionStartedAt.value = Date.now();
      }
    }
  );
  
  async function answer(index: number) {
    if (answered.value) return;
  
    selectedIndex.value = index;
    answered.value = true;
  
    try {
      await submitAnswer({
        quiz: props.quiz,
        playerId: props.playerId,
        selectedIndex: index,
        questionStartedAt: questionStartedAt.value,
      });
    } catch (e) {
      // Already answered or network issue.
    }
  }
  </script>