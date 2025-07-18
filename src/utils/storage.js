const STORAGE_KEY = 'mealPlans';

export const loadPlans = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};

export const savePlans = (plans) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
};

export const addPlan = (plan) => {
  const plans = loadPlans();
  plans.push(plan);
  savePlans(plans);
  return plans;
};

export const removePlan = (id) => {
  const plans = loadPlans().filter((p) => p.id !== id);
  savePlans(plans);
  return plans;
};
