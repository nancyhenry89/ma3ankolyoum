// src/services/conferenceQuestions.ts
import {
    addDoc,
    collection,
    serverTimestamp,
    query,
    where,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
  } from "firebase/firestore";
  import { db, ensureAnonymousUser } from "@/lib/firebase";
  
  export async function submitQuestion(conferenceId: string, text: string) {
    const user = await ensureAnonymousUser();
  
    await addDoc(collection(db, "conferences", conferenceId, "questions"), {
      text,
      authorId: user.uid,
      anonymous: true,
      deleted: false,
      pinned: false,
      answered: false,
      createdAt: serverTimestamp(),
    });
  }
  
  export function listenQuestions(
    conferenceId: string,
    callback: (items: any[]) => void
  ) {
    const q = query(
      collection(db, "conferences", conferenceId, "questions"),
      where("deleted", "==", false),
      orderBy("pinned", "desc"),
      orderBy("createdAt", "desc")
    );
  
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }
  
  export async function pinQuestion(
    conferenceId: string,
    questionId: string,
    pinned: boolean
  ) {
    await updateDoc(doc(db, "conferences", conferenceId, "questions", questionId), {
      pinned,
    });
  }
  
  export async function markQuestionAnswered(
    conferenceId: string,
    questionId: string,
    answered: boolean
  ) {
    await updateDoc(doc(db, "conferences", conferenceId, "questions", questionId), {
      answered,
    });
  }
  
  export async function deleteQuestion(conferenceId: string, questionId: string) {
    await updateDoc(doc(db, "conferences", conferenceId, "questions", questionId), {
      deleted: true,
    });
  }
  
  export async function addQuestionReply(
    conferenceId: string,
    questionId: string,
    text: string
  ) {
    const user = await ensureAnonymousUser();
  
    await addDoc(
      collection(
        db,
        "conferences",
        conferenceId,
        "questions",
        questionId,
        "replies"
      ),
      {
        text,
        authorId: user.uid,
        anonymous: true,
        deleted: false,
        createdAt: serverTimestamp(),
      }
    );
  }