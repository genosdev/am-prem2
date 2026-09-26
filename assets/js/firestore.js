import { db } from "./firebase-config.js";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function saveUserProfile(uid, data) {
  try {
    await setDoc(doc(db, "users", uid), {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.warn("saveUserProfile:", e);
  }
}

export async function getUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn("getUserProfile:", e);
    return null;
  }
}

export async function saveLog(uid, logData) {
  try {
    const ref = await addDoc(collection(db, "logs"), {
      uid,
      ...logData,
      createdAt: serverTimestamp()
    });
    return ref.id;
  } catch (e) {
    console.warn("saveLog:", e);
    return null;
  }
}

export async function getHistory(uid, max = 20) {
  try {
    const q = query(
      collection(db, "logs"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc"),
      limit(max)
    );
    const snap = await getDocs(q);
    const out = [];
    snap.forEach(d => out.push({ id: d.id, ...d.data() }));
    return out;
  } catch (e) {
    try {
      const q2 = query(
        collection(db, "logs"),
        where("uid", "==", uid),
        limit(max)
      );
      const snap2 = await getDocs(q2);
      const out = [];
      snap2.forEach(d => out.push({ id: d.id, ...d.data() }));
      out.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      return out;
    } catch (e2) {
      console.warn("getHistory:", e2);
      return [];
    }
  }
}