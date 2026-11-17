import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";

export function messageForError(error) {
  if (!(error instanceof ApiError)) return "Не удалось выполнить операцию.";
  if (error.kind === "timeout") return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  if (error.kind === "network") return "Нет соединения с учебным API. Проверьте, запущен ли npm start.";
  if (error.kind === "invalid-response") return "Сервер вернул ответ неожиданного формата.";
  if (error.kind === "http" && error.status === 404) return "Запись уже отсутствует на сервере. Обновите список.";
  if (error.kind === "http") return error.message || `Сервер вернул ошибку ${error.status}.`;
  return "Не удалось выполнить операцию.";
}

export function createAppController({ api, view, validateDraft = validateTaskDraft } = {}) {
  if (typeof api?.loadInitialData !== "function" || typeof api?.getTasks !== "function"
      || typeof view?.setListState !== "function" || typeof validateDraft !== "function") {
    throw new TypeError("Ожидались API задач, представление и функция валидации.");
  }

  let tasks = [];
  let categories = null;
  let filters = {};
  let editingId = null;
  let activeLoad;
  let loadNumber = 0;
  let mutationPending = false;
  let destroyed = false;

  async function refresh() {
    if (destroyed) return;
    const number = ++loadNumber;
    activeLoad?.abort();
    const controller = new AbortController();
    activeLoad = controller;
    const options = { signal: controller.signal };
    view.setListState("loading");

    try {
      const initial = categories === null;
      const result = initial
        ? await api.loadInitialData(filters, options)
        : await api.getTasks(filters, options);
      if (number !== loadNumber) return;
      if (initial) {
        categories = result.categories;
        view.setCategories(categories);
      }
      tasks = result.tasks;
      view.setTasks(tasks, categories);
      if (mutationPending) view.setMutationPending(true);
      view.setTotal(result.meta.total);
      view.setListState(tasks.length ? "ready" : "empty");
    } catch (error) {
      if (number === loadNumber && error?.kind !== "aborted") {
        view.setListState("error", messageForError(error));
      }
    } finally {
      if (number === loadNumber) activeLoad = undefined;
    }
  }

  function applyFilters(nextFilters = {}) {
    filters = { ...nextFilters };
    return refresh();
  }

  function setFormTask(task) {
    editingId = task?.id ?? null;
    view.showFormErrors({});
    view.setFormTask(task);
  }

  function cancelEdit() {
    if (!destroyed && !mutationPending) setFormTask(null);
  }

  function beginEdit(id) {
    if (destroyed || mutationPending) return;
    const task = tasks.find((item) => item.id === id);
    if (task) setFormTask(task);
  }

  async function mutate(operation, message, afterSuccess, onError) {
    if (destroyed || mutationPending) return;
    mutationPending = true;
    view.setMutationPending(true);
    view.notify();
    try {
      await operation();
      if (destroyed) return;
      afterSuccess?.();
      view.notify(message, "success");
      await refresh();
    } catch (error) {
      if (!destroyed && error?.kind !== "aborted") {
        onError?.(error);
        view.notify(messageForError(error), "error");
      }
    } finally {
      mutationPending = false;
      if (!destroyed) view.setMutationPending(false);
    }
  }

  function submit(draft) {
    if (destroyed || mutationPending) return;
    const { valid, value, errors } = validateDraft(draft, categories ?? []);
    view.showFormErrors(errors);
    if (!valid) return;

    const id = editingId;
    return mutate(
      () => id === null ? api.createTask(value) : api.updateTask(id, value),
      id === null ? "Задача добавлена." : "Изменения сохранены.",
      () => setFormTask(null),
      (error) => {
        if (error instanceof ApiError && error.code === "VALIDATION_ERROR" && error.details) {
          view.showFormErrors(error.details);
        }
      },
    );
  }

  function toggleTask(id) {
    const task = tasks.find((item) => item.id === id);
    if (task) return mutate(() => api.setTaskCompleted(id, !task.completed), "Статус задачи обновлён.");
  }

  function deleteTask(id) {
    return mutate(() => api.deleteTask(id), "Задача удалена.", () => {
      if (editingId === id) setFormTask(null);
    });
  }

  function resetData() {
    return mutate(() => api.resetDemoData(), "Исходные данные восстановлены.", () => setFormTask(null));
  }

  function destroy() {
    destroyed = true;
    ++loadNumber;
    activeLoad?.abort();
    activeLoad = undefined;
  }

  return { start: applyFilters, applyFilters, refresh, submit, beginEdit, cancelEdit, toggleTask, deleteTask, resetData, destroy };
}
