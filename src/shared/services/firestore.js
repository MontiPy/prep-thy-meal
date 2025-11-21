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
  // Ownership guard lives here so every call path is protected.
  const data = { ...plan, uid };
  await addDoc(plansRef, data);
  return loadPlans(uid);
};

const assertPlanOwnership = async (uid, id) => {
  const ref = doc(plansRef, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error('Plan not found');
  }
  if (snap.data().uid !== uid) {
    throw new Error('Unauthorized plan access');
  }
  return ref;
};

export const removePlan = async (uid, id) => {
  const ref = await assertPlanOwnership(uid, id);
  await deleteDoc(ref);
  return loadPlans(uid);
};

export const updatePlan = async (uid, id, plan) => {
  const ref = await assertPlanOwnership(uid, id);
  await updateDoc(ref, plan);
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

// Custom Ingredients
export const loadCustomIngredients = async (uid) => {
  const snap = await getDoc(doc(settingsRef, uid));
  return snap.exists() ? snap.data().customIngredients || [] : [];
};

export const saveCustomIngredients = async (uid, items) => {
  await setDoc(doc(settingsRef, uid), { customIngredients: items }, { merge: true });
  return loadCustomIngredients(uid);
};
