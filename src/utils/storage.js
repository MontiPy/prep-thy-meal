import { loadPlans as apiLoad, addPlan as apiAdd, removePlan as apiRemove } from './api.js';

export const loadPlans = async (uid) => {
  return apiLoad(uid);
};

export const addPlan = async (uid, plan) => {
  return apiAdd(uid, plan);
};

export const removePlan = async (uid, id) => {
  return apiRemove(uid, id);
};
