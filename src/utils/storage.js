import {
  loadPlans as apiLoad,
  addPlan as apiAdd,
  removePlan as apiRemove,
  updatePlan as apiUpdate,
  loadBaseline as apiLoadBaseline,
  saveBaseline as apiSaveBaseline,
} from './api.js';

export const loadPlans = async (uid) => {
  return apiLoad(uid);
};

export const addPlan = async (uid, plan) => {
  return apiAdd(uid, plan);
};

export const removePlan = async (uid, id) => {
  return apiRemove(uid, id);
};

export const updatePlan = async (uid, id, plan) => {
  return apiUpdate(uid, id, plan);
};

export const loadBaseline = async (uid) => {
  return apiLoadBaseline(uid);
};

export const saveBaseline = async (uid, baseline) => {
  return apiSaveBaseline(uid, baseline);
};
