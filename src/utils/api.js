import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase.js';

const plansRef = collection(db, 'plans');

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
