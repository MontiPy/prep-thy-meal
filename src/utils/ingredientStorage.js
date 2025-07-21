const LOCAL_KEY = 'customIngredients';
import { loadCustomIngredients as apiLoad, saveCustomIngredients as apiSave } from './api.js';

export const loadCustomIngredients = () => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocal = (items) => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
};

const saveRemote = async (uid, items) => {
  if (!uid) return;
  await apiSave(uid, items);
};

export const syncFromRemote = async (uid) => {
  if (!uid) return loadCustomIngredients();
  const items = await apiLoad(uid);
  saveLocal(items);
  return items;
};

export const addCustomIngredient = async (ingredient, uid) => {
  const items = loadCustomIngredients();
  const newIngredient = { id: Date.now(), ...ingredient };
  items.push(newIngredient);
  saveLocal(items);
  await saveRemote(uid, items);
  return newIngredient;
};

export const updateCustomIngredient = async (id, updates, uid) => {
  const items = loadCustomIngredients().map((i) =>
    i.id === id ? { ...i, ...updates } : i
  );
  saveLocal(items);
  await saveRemote(uid, items);
};

export const upsertCustomIngredient = async (ingredient, uid) => {
  const items = loadCustomIngredients();
  const idx = items.findIndex((i) => i.id === ingredient.id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], ...ingredient };
  } else {
    items.push({ ...ingredient });
  }
  saveLocal(items);
  await saveRemote(uid, items);
};

export const removeCustomIngredient = async (id, uid) => {
  const items = loadCustomIngredients().filter((i) => i.id !== id);
  saveLocal(items);
  await saveRemote(uid, items);
};
export const getAllIngredients = (defaults) => [...defaults, ...loadCustomIngredients()];

