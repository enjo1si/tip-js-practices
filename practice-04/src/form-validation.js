const PRIORITIES = ["low", "medium", "high"];
const MAX_TITLE_LENGTH = 100;

export function validateTaskDraft(draft, tasks, editingId = null) {
    const errors = {};


    let id;
    if (editingId !== null) {
        id = editingId;
        if (!Number.isSafeInteger(id) || id <= 0) {
            errors.id = "Некорректный идентификатор";
        } else if (!tasks.some((task) => task.id === id)) {
            errors.id = "Задача для редактирования не найдена";
        }
    } else {
        const rawId = draft.id;
        if (rawId === "" || rawId === null || rawId === undefined) {
            errors.id = "Укажите идентификатор";
        } else {
            id = Number(rawId);
            if (!Number.isSafeInteger(id) || id <= 0) {
                errors.id = "id должен быть положительным целым числом";
            } else if (tasks.some((task) => task.id === id)) {
                errors.id = "Задача с таким id уже существует";
            }
        }
    }


    let title;
    if (typeof draft.title !== "string") {
        errors.title = "Название должно быть строкой";
    } else {
        title = draft.title.trim();
        if (title.length < 1) {
            errors.title = "Название не должно быть пустым";
        } else if (title.length > MAX_TITLE_LENGTH) {
            errors.title = "Название не должно превышать 100 символов";
        }
    }


    if (!PRIORITIES.includes(draft.priority)) {
        errors.priority = "Приоритет должен быть low, medium или high";
    }

    if (Object.keys(errors).length > 0) {
        return { ok: false, errors };
    }

    return {
        ok: true,
        value: { id, title, priority: draft.priority },
    };
}