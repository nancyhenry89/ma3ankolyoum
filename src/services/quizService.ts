import {
    collection,
    doc,
    addDoc,
    setDoc,
    getDocs,
    getDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp,
  } from "firebase/firestore";
  import { db } from "@/views/quiz/firebase";
  
  export type QuizState =
    | "waiting"
    | "question"
    | "closed"
    | "answer"
    | "leaderboard"
    | "finished";
  
  export type QuizQuestion = {
    text: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  };
  
  export type Quiz = {
    id?: string;
    title: string;
    active: boolean;
    state: QuizState;
    currentQuestionIndex: number;
    timePerQuestion: number;
    correctPoints: number;
    speedBonusEnabled: boolean;
    questions: QuizQuestion[];
    createdAt?: any;
    questionStartedAt?: any;
  };
  
  export type Player = {
    id?: string;
    quizId: string;
    name: string;
    nameLower: string;
    score: number;
    joinedAt?: any;
  };
  
  export type Answer = {
    quizId: string;
    playerId: string;
    questionIndex: number;
    selectedIndex: number;
    isCorrect: boolean;
    scoreAwarded: number;
    answeredAt: any;
    responseMs: number;
  };
  
  export function quizzesRef() {
    return collection(db, "quizzes");
  }
  
  export function quizRef(quizId: string) {
    return doc(db, "quizzes", quizId);
  }
  
  export function playersRef(quizId: string) {
    return collection(db, "quizzes", quizId, "players");
  }
  
  export function playerRef(quizId: string, playerId: string) {
    return doc(db, "quizzes", quizId, "players", playerId);
  }
  
  export function answersRef(quizId: string) {
    return collection(db, "quizzes", quizId, "answers");
  }
  
  export async function createQuiz(quiz: Omit<Quiz, "id" | "createdAt">) {
    return addDoc(quizzesRef(), {
      ...quiz,
      createdAt: serverTimestamp(),
    });
  }
  
  export async function updateQuiz(quizId: string, data: Partial<Quiz>) {
    return updateDoc(quizRef(quizId), data);
  }
  
  export async function deleteQuiz(quizId: string) {
    return deleteDoc(quizRef(quizId));
  }
  
  export async function getActiveQuiz() {
    const q = query(quizzesRef(), where("active", "==", true));
    const snap = await getDocs(q);
    if (snap.empty) return null;
  
    const first = snap.docs[0];
    return {
      id: first.id,
      ...first.data(),
    } as Quiz;
  }
  
  export function listenActiveQuiz(callback: (quiz: Quiz | null) => void) {
    const q = query(quizzesRef(), where("active", "==", true));
  
    return onSnapshot(q, (snap) => {
      if (snap.empty) {
        callback(null);
        return;
      }
  
      const first = snap.docs[0];
      callback({
        id: first.id,
        ...first.data(),
      } as Quiz);
    });
  }
  
  export function listenPlayers(
    quizId: string,
    callback: (players: Player[]) => void
  ) {
    const q = query(playersRef(quizId), orderBy("score", "desc"));
  
    return onSnapshot(q, (snap) => {
      callback(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Player[]
      );
    });
  }
  
  export function listenAnswers(
    quizId: string,
    questionIndex: number,
    callback: (answers: Answer[]) => void
  ) {
    const q = query(
      answersRef(quizId),
      where("questionIndex", "==", questionIndex)
    );
  
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => d.data() as Answer));
    });
  }
  
  export async function joinQuiz(quizId: string, name: string) {
    const cleanName = name.trim();
    const nameLower = cleanName.toLowerCase();
  
    const duplicateQuery = query(
      playersRef(quizId),
      where("nameLower", "==", nameLower)
    );
  
    const duplicateSnap = await getDocs(duplicateQuery);
  
    if (!duplicateSnap.empty) {
      throw new Error("NAME_TAKEN");
    }
  
    const newPlayer = await addDoc(playersRef(quizId), {
      quizId,
      name: cleanName,
      nameLower,
      score: 0,
      joinedAt: serverTimestamp(),
    });
  
    localStorage.setItem("quizPlayerId", newPlayer.id);
    localStorage.setItem("quizPlayerName", cleanName);
    localStorage.setItem("quizId", quizId);
  
    return newPlayer.id;
  }
  
  export async function submitAnswer(params: {
    quiz: Quiz;
    playerId: string;
    selectedIndex: number;
    questionStartedAt: number;
  }) {
    const { quiz, playerId, selectedIndex, questionStartedAt } = params;
  
    if (!quiz.id) throw new Error("Missing quiz id");
  
    const questionIndex = quiz.currentQuestionIndex;
    const question = quiz.questions[questionIndex];
    const responseMs = Date.now() - questionStartedAt;
  
    const existingAnswerQuery = query(
      answersRef(quiz.id),
      where("playerId", "==", playerId),
      where("questionIndex", "==", questionIndex)
    );
  
    const existingAnswerSnap = await getDocs(existingAnswerQuery);
  
    if (!existingAnswerSnap.empty) {
      throw new Error("ALREADY_ANSWERED");
    }
  
    const isCorrect = selectedIndex === question.correctIndex;
  
    let scoreAwarded = 0;
  
    if (isCorrect) {
      scoreAwarded = quiz.correctPoints;
  
      if (quiz.speedBonusEnabled) {
        const seconds = responseMs / 1000;
  
        if (seconds <= 3) scoreAwarded += 100;
        else if (seconds <= 5) scoreAwarded += 70;
        else if (seconds <= 10) scoreAwarded += 40;
        else if (seconds <= quiz.timePerQuestion) scoreAwarded += 20;
      }
    }
  
    await addDoc(answersRef(quiz.id), {
      quizId: quiz.id,
      playerId,
      questionIndex,
      selectedIndex,
      isCorrect,
      scoreAwarded,
      answeredAt: serverTimestamp(),
      responseMs,
    });
  
    const playerDoc = await getDoc(playerRef(quiz.id, playerId));
  
    if (playerDoc.exists()) {
      const currentScore = playerDoc.data().score || 0;
      await updateDoc(playerRef(quiz.id, playerId), {
        score: currentScore + scoreAwarded,
      });
    }
  
    return scoreAwarded;
  }
  
  export async function resetQuizPlayersAndAnswers(quizId: string) {
    const players = await getDocs(playersRef(quizId));
    const answers = await getDocs(answersRef(quizId));
  
    await Promise.all(players.docs.map((d) => deleteDoc(d.ref)));
    await Promise.all(answers.docs.map((d) => deleteDoc(d.ref)));
  
    await updateQuiz(quizId, {
      state: "waiting",
      currentQuestionIndex: 0,
    });
  }