import { demoTasks, variantTasks, variantNumber } from "./data.js";
import {
    findTaskById,
    getTaskStats,
    addTask,
    setTaskCompleted,
    removeTask,
    updateTask,
} from "./task-service.js";
import { getVisibleTasks } from "./task-selectors.js";
import {
    renderTaskList,
    renderSummary,
    renderEmptyState,
} from "./task-view.js";
import { validateTaskDraft } from "./form-validation.js";
import {
    loadTasks,
    saveTasks,
    removeSavedTasks,
} from "./task-storage.js";

const params = new URLSearchParams(window.location.search);
const useVariant = params.get("dataset") === "variant";
const isCheckMode = params.get("mode") === "check";

const initialTasks = useVariant ? variantTasks : demoTasks;

const storageKey = isCheckMode
    ? (useVariant ? "tip-js-practice-04:checks:variant" : "tip-js-practice-04:checks:demo")
    : (useVariant ? "tip-js-practice-04:variant" : "tip-js-practice-04:demo");

const loadResult = loadTasks(localStorage, storageKey, initialTasks);
let currentTasks = loadResult.tasks;
let currentFilter = "all";
let editingId = null;

const listElement = document.querySelector("#task-list");
const summaryElement = document.querySelector("#task-summary");
const emptyElement = document.querySelector("#empty-message");
const filtersElement = document.querySelector("#task-filters");
const operationMessage = document.querySelector("#operation-message");
const form = document.querySelector("#task-form");
const formMessage = document.querySelector("#form-message");
const formMode = document.querySelector("#form-mode");
const submitButton = document.querySelector("#form-submit");
const cancelButton = document.querySelector("#cancel-edit");
const resetButton = document.querySelector("#reset-data");
const storageStatus = document.querySelector("#storage-status");
const datasetLabel = document.querySelector("#dataset-label");

const inputs = {
    id: form.querySelector('[name="id"]'),
    title: form.querySelector('[name="title"]'),
    priority: form.querySelector('[name="priority"]'),
};

if (datasetLabel) {
    datasetLabel.textContent = useVariant
        ? `Индивидуальный набор (вариант ${variantNumber})`
        : "Общий контрольный набор";
}

function showError(text) {
    operationMessage.textContent = text;
}

function clearError() {
    operationMessage.textContent = "";
}

function showFormErrors(errors) {
    for (const field of ["id", "title", "priority"]) {
        const input = inputs[field];
        const errorElement = document.querySelector(`[data-error-for="${field}"]`);
        if (errors[field]) {
            errorElement.textContent = errors[field];
            input.setAttribute("aria-invalid", "true");
        } else {
            errorElement.textContent = "";
            input.removeAttribute("aria-invalid");
        }
    }
}

function clearFormErrors() {
    showFormErrors({});
}

function setStorageStatus(text, isWarning = false) {
    storageStatus.textContent = text;
    storageStatus.classList.toggle("is-warning", isWarning);
}

function renderApp() {
    const visible = getVisibleTasks(currentTasks, currentFilter);
    renderTaskList(listElement, visible);
    renderSummary(summaryElement, currentTasks, visible.length);
    renderEmptyState(emptyElement, currentTasks.length, visible.length);

    filtersElement.querySelectorAll("button[data-filter]").forEach((button) => {
        const isActive = button.dataset.filter === currentFilter;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
}

function setFormMode(id) {
    if (id === null) {
        editingId = null;
        form.reset();
        clearFormErrors();
        formMessage.textContent = "";
        inputs.id.disabled = false;
        formMode.textContent = "Режим создания новой задачи.";
        submitButton.textContent = "Добавить задачу";
        cancelButton.hidden = true;
        inputs.id.focus();
        return;
    }

    const task = findTaskById(currentTasks, id);
    if (!task) {
        formMessage.textContent = "Задача для редактирования не найдена.";
        return;
    }

    editingId = id;
    clearFormErrors();
    formMessage.textContent = "";
    inputs.id.value = String(task.id);
    inputs.id.disabled = true;
    inputs.title.value = task.title;
    inputs.priority.value = task.priority;
    formMode.textContent = `Режим редактирования задачи id = ${task.id}.`;
    submitButton.textContent = "Сохранить изменения";
    cancelButton.hidden = false;
    inputs.title.focus();
}

function persistTasks() {
    const save = saveTasks(localStorage, storageKey, currentTasks);
    if (!save.ok) {
        setStorageStatus(save.error, true);
    } else {
        setStorageStatus("Изменения сохранены.");
    }
}

function handleFormSubmit(event) {
    event.preventDefault();
    clearError();

    const formData = new FormData(form);
    const draft = {
        id: editingId === null ? formData.get("id") : editingId,
        title: formData.get("title"),
        priority: formData.get("priority"),
    };

    const validation = validateTaskDraft(draft, currentTasks, editingId);
    if (!validation.ok) {
        showFormErrors(validation.errors);
        return;
    }

    clearFormErrors();
    const value = validation.value;

    let result;
    if (editingId === null) {
        result = addTask(currentTasks, value.id, value.title, value.priority);
    } else {
        result = updateTask(currentTasks, value.id, value.title, value.priority);
    }

    if (!result.ok) {
        formMessage.textContent = result.error;
        return;
    }

    currentTasks = result.tasks;
    persistTasks();
    setFormMode(null);
    renderApp();
}

function handleTaskListClick(event) {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest("button[data-action]");
    if (!button || !listElement.contains(button)) return;

    const action = button.dataset.action;
    if (!["toggle", "delete", "edit"].includes(action)) return;

    const card = button.closest("li[data-task-id]");
    if (!card) return;

    const id = Number(card.dataset.taskId);
    if (!Number.isSafeInteger(id) || id <= 0) {
        showError("Некорректный идентификатор задачи.");
        return;
    }

    const task = findTaskById(currentTasks, id);
    if (!task) {
        showError("Задача не найдена.");
        return;
    }

    if (action === "edit") {
        clearError();
        setFormMode(id);
        return;
    }

    let result;
    if (action === "toggle") {
        result = setTaskCompleted(currentTasks, id, !task.completed);
    } else {
        result = removeTask(currentTasks, id);
    }

    if (!result.ok) {
        showError(result.error);
        return;
    }

    currentTasks = result.tasks;

    if (editingId === id) {
        setFormMode(null);
    }

    persistTasks();
    clearError();
    renderApp();
}

function handleFilterClick(event) {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest("button[data-filter]");
    if (!button || !filtersElement.contains(button)) return;

    const filter = button.dataset.filter;
    if (!["all", "pending", "completed"].includes(filter)) return;

    currentFilter = filter;
    clearError();
    renderApp();
}

function handleResetClick() {
    removeSavedTasks(localStorage, storageKey);
    currentTasks = initialTasks.map((task) => ({ ...task }));
    currentFilter = "all";
    setFormMode(null);
    clearError();
    setStorageStatus("Сохранённые данные удалены, восстановлен исходный набор.");
    renderApp();
}

form.addEventListener("submit", handleFormSubmit);
cancelButton.addEventListener("click", () => setFormMode(null));
listElement.addEventListener("click", handleTaskListClick);
filtersElement.addEventListener("click", handleFilterClick);
resetButton.addEventListener("click", handleResetClick);

for (const field of ["id", "title", "priority"]) {
    inputs[field].addEventListener("input", () => {
        const errorElement = document.querySelector(`[data-error-for="${field}"]`);
        errorElement.textContent = "";
        inputs[field].removeAttribute("aria-invalid");
    });
}

if (!loadResult.ok) {
    setStorageStatus(loadResult.error || "Не удалось загрузить сохранённые данные.", true);
} else if (loadResult.source === "storage") {
    setStorageStatus("Данные восстановлены из localStorage.");
} else {
    setStorageStatus("Использован исходный набор.");
}

setFormMode(null);
renderApp();