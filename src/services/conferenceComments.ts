// src/services/conferenceComments.ts
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
  import { db, auth, ensureAnonymousUser } from "@/lib/firebase";
  
  export async function publishComment(params: {
    conferenceId: string;
    targetType: "verse" | "quote";
    targetId: string;
    text: string;
  }) {
    const user = await ensureAnonymousUser();
  
    await addDoc(collection(db, "conferences", params.conferenceId, "comments"), {
      targetType: params.targetType,
      targetId: params.targetId,
      text: params.text,
      authorId: user.uid,
      authorName: "مشارك",
      anonymous: false,
      deleted: false,
      createdAt: serverTimestamp(),
    });
  }
  
  export function listenComments(
    conferenceId: string,
    targetType: "verse" | "quote",
    targetId: string,
    callback: (items: any[]) => void
  ) {
    const q = query(
      collection(db, "conferences", conferenceId, "comments"),
      where("targetType", "==", targetType),
      where("targetId", "==", targetId),
      where("deleted", "==", false),
      orderBy("createdAt", "asc")
    );
  
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }
  
  export async function deleteComment(conferenceId: string, commentId: string) {
    await updateDoc(doc(db, "conferences", conferenceId, "comments", commentId), {
      deleted: true,
    });
  }