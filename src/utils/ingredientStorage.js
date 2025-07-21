const LOCAL_KEY = 'customIngredients';

export const loadCustomIngredients = () => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveCustomIngredients = (items) => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
};

export const addCustomIngredient = (ingredient) => {
  const items = loadCustomIngredients();
  const newIngredient = { id: Date.now(), ...ingredient };
  items.push(newIngredient);
  saveCustomIngredients(items);
  return newIngredient;
};

export const updateCustomIngredient = (id, updates) => {
  const items = loadCustomIngredients().map((i) =>
    i.id === id ? { ...i, ...updates } : i
  );
  saveCustomIngredients(items);
};

export const upsertCustomIngredient = (ingredient) => {
  const items = loadCustomIngredients();
  const idx = items.findIndex((i) => i.id === ingredient.id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], ...ingredient };
  } else {
    items.push({ ...ingredient });
  }
  saveCustomIngredients(items);
};

export const removeCustomIngredient = (id) => {
  const items = loadCustomIngredients().filter((i) => i.id !== id);
  saveCustomIngredients(items);
};
export const getAllIngredients = (defaults) => [...defaults, ...loadCustomIngredients()];

