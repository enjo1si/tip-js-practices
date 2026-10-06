import { demoTasks, variantTasks } from "./data.js";
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
const formTitle = document.querySelector("#form-title");
const submitButton = document.querySelector("#submit-button");
const cancelButton = document.querySelector("#cancel-button");
const resetButton = document.querySelector("#reset-button");
const storageMessage = document.querySelector("#storage-message");

const inputs = {
    id: form.querySelector('[name="id"]'),
    title: form.querySelector('[name="title"]'),
    priority: form.querySelector('[name="priority"]'),
};

function showError(text) {
    operationMessage.textContent = text;
    operationMessage.hidden = false;
}

function clearError() {
    operationMessage.textContent = "";
    operationMessage.hidden = true;
}

function showFormErrors(errors) {
    for (const field of ["id", "title", "priority"]) {
        const input = inputs[field];
        const errorElement = document.querySelector(`[data-error="${field}"]`);
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
        inputs.id.disabled = false;
        formTitle.textContent = "Добавление задачи";
        submitButton.textContent = "Добавить задачу";
        cancelButton.hidden = true;
        inputs.id.focus();
        return;
    }

    const task = findTaskById(currentTasks, id);
    if (!task) {
        showError("Задача для редактирования не найдена.");
        return;
    }

    editingId = id;
    clearFormErrors();
    inputs.id.value = String(task.id);
    inputs.id.disabled = true;
    inputs.title.value = task.title;
    inputs.priority.value = task.priority;
    formTitle.textContent = "Редактирование задачи";
    submitButton.textContent = "Сохранить изменения";
    cancelButton.hidden = false;
    inputs.title.focus();
}

function handleFormSubmit(event) {
    event.preventDefault();
    clearError();

    const formData = new FormData(form);
    const draft = {
        id: formData.get("id"),
        title: formData.get("title"),
        priority: formData.get("priority"),
    };

    // В режиме редактирования id берём из editingId (поле disabled → не попадает в FormData)
    const validation = validateTaskDraft(
        { ...draft, id: editingId === null ? draft.id : editingId },
        currentTasks,
        editingId
    );

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
        showError(result.error);
        return;
    }

    currentTasks = result.tasks;

    const save = saveTasks(localStorage, storageKey, currentTasks);
    if (!save.ok) {
        storageMessage.textContent = save.error;
        storageMessage.hidden = false;
    } else {
        storageMessage.hidden = true;
    }

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
        setFormMode(id);
        clearError();
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

    const save = saveTasks(localStorage, storageKey, currentTasks);
    if (!save.ok) {
        storageMessage.textContent = save.error;
        storageMessage.hidden = false;
    } else {
        storageMessage.hidden = true;
    }

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
    storageMessage.hidden = true;
    renderApp();
}

form.addEventListener("submit", handleFormSubmit);
cancelButton.addEventListener("click", () => setFormMode(null));
listElement.addEventListener("click", handleTaskListClick);
filtersElement.addEventListener("click", handleFilterClick);
resetButton.addEventListener("click", handleResetClick);

for (const field of ["id", "title", "priority"]) {
    inputs[field].addEventListener("input", () => {
        const errorElement = document.querySelector(`[data-error="${field}"]`);
        errorElement.textContent = "";
        inputs[field].removeAttribute("aria-invalid");
    });
}

if (!loadResult.ok) {
    showError(loadResult.error || "Не удалось загрузить сохранённые данные.");
}

setFormMode(null);
renderApp();