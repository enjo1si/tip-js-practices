const PRIORITIES = ["low", "medium", "high"];
const MAX_TITLE_LENGTH = 100;

function isValidId(id) {
    return Number.isSafeInteger(id) && id > 0;
}

function normalizeTitle(value) {
    if (typeof value !== "string") {
        return { ok: false, error: "Название должно быть строкой" };
    }
    const title = value.trim();
    if (title.length < 1 || title.length > MAX_TITLE_LENGTH) {
        return { ok: false, error: "Длина названия должна быть от 1 до 100 символов" };
    }
    return { ok: true, title };
}

export function createTask(id, title, priority = "medium") {
    if (!isValidId(id)) {
        return { ok: false, error: "id должен быть положительным целым числом" };
    }
    const titleResult = normalizeTitle(title);
    if (!titleResult.ok) {
        return titleResult;
    }
    if (!PRIORITIES.includes(priority)) {
        return { ok: false, error: "Приоритет должен быть low, medium или high" };
    }
    return {
        ok: true,
        task: { id, title: titleResult.title, completed: false, priority },
    };
}

export function findTaskById(tasks, id) {
    return tasks.find((task) => task.id === id);
}

export function getPendingTasks(tasks) {
    return tasks.filter((task) => task.completed === false);
}

export function getTaskTitles(tasks) {
    return tasks.map((task) => task.title);
}

export function getTaskStats(tasks) {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed === true).length;
    const pending = total - completed;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    return { total, completed, pending, progress };
}

export function addTask(tasks, id, title, priority = "medium") {
    if (!isValidId(id)) {
        return { ok: false, error: "id должен быть положительным целым числом" };
    }
    if (tasks.some((task) => task.id === id)) {
        return { ok: false, error: "Задача с таким id уже существует" };
    }
    const created = createTask(id, title, priority);
    if (!created.ok) {
        return created;
    }
    return { ok: true, tasks: [...tasks, created.task] };
}

export function setTaskCompleted(tasks, id, completed) {
    if (!isValidId(id)) {
        return { ok: false, error: "id должен быть положительным целым числом" };
    }
    if (typeof completed !== "boolean") {
        return { ok: false, error: "completed должен быть true или false" };
    }
    if (!tasks.some((task) => task.id === id)) {
        return { ok: false, error: "Задача не найдена" };
    }
    const newTasks = tasks.map((task) =>
        task.id === id ? { ...task, completed } : task
    );
    return { ok: true, tasks: newTasks };
}

export function renameTask(tasks, id, title) {
    if (!isValidId(id)) {
        return { ok: false, error: "id должен быть положительным целым числом" };
    }
    const titleResult = normalizeTitle(title);
    if (!titleResult.ok) {
        return titleResult;
    }
    if (!tasks.some((task) => task.id === id)) {
        return { ok: false, error: "Задача не найдена" };
    }
    const newTasks = tasks.map((task) =>
        task.id === id ? { ...task, title: titleResult.title } : task
    );
    return { ok: true, tasks: newTasks };
}

export function removeTask(tasks, id) {
    if (!isValidId(id)) {
        return { ok: false, error: "id должен быть положительным целым числом" };
    }
    if (!tasks.some((task) => task.id === id)) {
        return { ok: false, error: "Задача не найдена" };
    }
    return { ok: true, tasks: tasks.filter((task) => task.id !== id) };
}