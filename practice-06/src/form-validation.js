const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

export function validateTaskDraft(draft, categories) {
  const title = typeof draft?.title === "string" ? draft.title.trim() : "";
  const priority = draft?.priority;
  const rawCategory = draft?.categoryId;
  const categoryId = typeof rawCategory === "number" || /^\d+$/.test(rawCategory ?? "")
    ? Number(rawCategory) : NaN;
  const errors = {};

  if (title.length < 1 || title.length > 100) {
    errors.title = "Введите название длиной от 1 до 100 символов.";
  }
  if (!ALLOWED_PRIORITIES.has(priority)) errors.priority = "Выберите приоритет.";
  if (!Number.isSafeInteger(categoryId) || categoryId <= 0
      || !categories.some((category) => category.id === categoryId)) {
    errors.categoryId = "Выберите существующую категорию.";
  }

  const valid = Object.keys(errors).length === 0;
  return { valid, value: valid ? { title, priority, categoryId } : null, errors };
}
