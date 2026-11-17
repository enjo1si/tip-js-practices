import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

export function isTask(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.title === "string"
    && value.title.trim().length >= 1
    && value.title.trim().length <= 100
    && typeof value.completed === "boolean"
    && ALLOWED_PRIORITIES.has(value.priority)
    && isPositiveSafeInteger(value.categoryId),
  );
}

export function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}


function normalizeFilters(filters) {
  if (!filters || ![Object.prototype, null].includes(Object.getPrototypeOf(filters))) {
    throw new TypeError("Фильтры должны быть объектом.");
  }
  const normalized = {};
  for (const [key, value] of Object.entries(filters)) {
    if (!ALLOWED_FILTERS.has(key)
        || (key === "completed" && typeof value !== "boolean")
        || (key === "priority" && !ALLOWED_PRIORITIES.has(value))
        || (key === "categoryId" && !isPositiveSafeInteger(value))
        || (key === "q" && (typeof value !== "string" || value.trim().length > 100))) {
      throw new TypeError(`Некорректный фильтр ${key}.`);
    }
    normalized[key] = key === "q" ? value.trim() : value;
  }
  return normalized;
}

function taskPath(id) {
  if (!isPositiveSafeInteger(id)) throw new TypeError("Некорректный id задачи.");
  return `/tasks/${id}`;
}

function readCollection(payload, predicate) {
  const { data, meta } = payload ?? {};
  if (!Array.isArray(data) || !data.every(predicate) || meta?.total !== data.length
      || new Set(data.map(({ id }) => id)).size !== data.length) {
    throw invalidResponse("Некорректная коллекция.");
  }
  return data;
}

function readTask(payload) {
  if (!isTask(payload?.data)) throw invalidResponse("Некорректная задача.");
  return payload.data;
}

export function createTaskApi(client) {
  if (typeof client?.requestJson !== "function") throw new TypeError("Ожидался HTTP-клиент.");

  async function getTasks(filters = {}, options) {
    const payload = await client.requestJson("/tasks", { ...options, query: normalizeFilters(filters) });
    const tasks = readCollection(payload, isTask);
    if (!payload.meta.filters || typeof payload.meta.filters !== "object"
        || Array.isArray(payload.meta.filters)) {
      throw invalidResponse("Некорректные метаданные фильтров.");
    }
    return { tasks, meta: payload.meta };
  }

  async function getTaskById(id, options) {
    return readTask(await client.requestJson(taskPath(id), options));
  }

  async function getCategories(options) {
    return readCollection(await client.requestJson("/categories", options), isCategory);
  }

  async function loadInitialData(filters, options) {
    const [result, categories] = await Promise.all([getTasks(filters, options), getCategories(options)]);
    return { ...result, categories };
  }

  async function createTask({ title, priority, categoryId }, options) {
    return readTask(await client.requestJson("/tasks", {
      ...options, method: "POST", body: { title, priority, categoryId },
    }));
  }

  async function updateTask(id, changes, options) {
    return readTask(await client.requestJson(taskPath(id), { ...options, method: "PATCH", body: changes }));
  }

  async function setTaskCompleted(id, completed, options) {
    if (typeof completed !== "boolean") throw new TypeError("Ожидалось логическое значение completed.");
    return updateTask(id, { completed }, options);
  }

  async function deleteTask(id, options) {
    const payload = await client.requestJson(taskPath(id), { ...options, method: "DELETE" });
    if (payload !== null) throw invalidResponse("Ожидался ответ без тела.");
    return null;
  }

  async function resetDemoData(options) {
    const { data } = (await client.requestJson("/debug/reset", { ...options, method: "POST" })) ?? {};
    if (data?.reset !== true || !Number.isSafeInteger(data.total) || data.total < 0) {
      throw invalidResponse("Некорректный ответ сброса данных.");
    }
    return data;
  }

  return {
    getTasks, getTaskById, getCategories, loadInitialData, createTask, updateTask,
    setTaskCompleted, deleteTask, resetDemoData,
  };
}
