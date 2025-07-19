import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase.js';

const plansRef = collection(db, 'plans');
const settingsRef = collection(db, 'settings');

export const loadPlans = async (uid) => {
  const q = query(plansRef, where('uid', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const addPlan = async (uid, plan) => {
  await addDoc(plansRef, { ...plan, uid });
  return loadPlans(uid);
};

export const removePlan = async (uid, id) => {
  await deleteDoc(doc(plansRef, id));
  return loadPlans(uid);
};

export const updatePlan = async (uid, id, plan) => {
  await updateDoc(doc(plansRef, id), plan);
  return loadPlans(uid);
};

export const loadBaseline = async (uid) => {
  const docSnap = await getDoc(doc(settingsRef, uid));
  return docSnap.exists() ? docSnap.data().baseline : null;
};

export const saveBaseline = async (uid, baseline) => {
  await setDoc(doc(settingsRef, uid), { baseline }, { merge: true });
  return loadBaseline(uid);
};
