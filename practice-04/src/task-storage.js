const SCHEMA_VERSION = 1;
const PRIORITIES = ["low", "medium", "high"];

function isValidTask(task) {
    if (!task || typeof task !== "object") return false;
    if (!Number.isSafeInteger(task.id) || task.id <= 0) return false;
    if (typeof task.title !== "string") return false;
    const title = task.title.trim();
    if (title.length < 1 || title.length > 100) return false;
    if (typeof task.completed !== "boolean") return false;
    if (!PRIORITIES.includes(task.priority)) return false;
    return true;
}

export function isValidTaskList(value) {
    if (!Array.isArray(value)) return false;
    const ids = new Set();
    for (const task of value) {
        if (!isValidTask(task)) return false;
        if (ids.has(task.id)) return false;
        ids.add(task.id);
    }
    return true;
}

function cloneTasks(tasks) {
    return tasks.map((task) => ({ ...task }));
}

export function loadTasks(storage, key, fallbackTasks) {
    const fallback = cloneTasks(fallbackTasks);
    try {
        const raw = storage.getItem(key);
        if (raw === null) {
            return { ok: true, source: "initial", tasks: fallback };
        }
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") {
            return { ok: false, source: "fallback", tasks: fallback, error: "Некорректная структура записи" };
        }
        if (parsed.version !== SCHEMA_VERSION) {
            return { ok: false, source: "fallback", tasks: fallback, error: "Неизвестная версия схемы" };
        }
        if (!isValidTaskList(parsed.tasks)) {
            return { ok: false, source: "fallback", tasks: fallback, error: "Некорректные данные задач" };
        }
        return { ok: true, source: "storage", tasks: cloneTasks(parsed.tasks) };
    } catch (error) {
        return {
            ok: false,
            source: "fallback",
            tasks: fallback,
            error: `Ошибка чтения: ${error.message}`,
        };
    }
}

export function saveTasks(storage, key, tasks) {
    if (!isValidTaskList(tasks)) {
        return { ok: false, error: "Некорректный список задач" };
    }
    try {
        const payload = { version: SCHEMA_VERSION, tasks };
        storage.setItem(key, JSON.stringify(payload));
        return { ok: true };
    } catch (error) {
        return { ok: false, error: `Ошибка записи: ${error.message}` };
    }
}

export function removeSavedTasks(storage, key) {
    try {
        storage.removeItem(key);
        return { ok: true };
    } catch (error) {
        return { ok: false, error: `Ошибка удаления: ${error.message}` };
    }
}