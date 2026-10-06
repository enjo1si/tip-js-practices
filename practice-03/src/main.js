import { demoTasks, variantTasks, variantNumber } from "./data.js";
import {
    findTaskById,
    setTaskCompleted,
    removeTask,
} from "./task-service.js";
import { getVisibleTasks } from "./task-selectors.js";
import {
    renderTaskList,
    renderSummary,
    renderEmptyState,
} from "./task-view.js";

const params = new URLSearchParams(window.location.search);
const useVariant = params.get("dataset") === "variant";

const initialTasks = useVariant ? variantTasks : demoTasks;

let currentTasks = initialTasks.map((task) => ({ ...task }));
let currentFilter = "all";

const listElement = document.querySelector("#task-list");
const summaryElement = document.querySelector("#task-summary");
const emptyElement = document.querySelector("#empty-message");
const filtersElement = document.querySelector("#task-filters");
const operationMessage = document.querySelector("#operation-message");

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

function showError(text) {
    operationMessage.textContent = text;
    operationMessage.hidden = false;
}

function clearError() {
    operationMessage.textContent = "";
    operationMessage.hidden = true;
}

export function handleTaskListClick(event) {
    if (!(event.target instanceof Element)) return;

    const button = event.target.closest("button[data-action]");
    if (!button || !listElement.contains(button)) return;

    const action = button.dataset.action;
    if (action !== "toggle" && action !== "delete") return;

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
    clearError();
    renderApp();
}

export function handleFilterClick(event) {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest("button[data-filter]");
    if (!button || !filtersElement.contains(button)) return;

    const filter = button.dataset.filter;
    if (!["all", "pending", "completed"].includes(filter)) return;

    currentFilter = filter;
    clearError();
    renderApp();
}

listElement.addEventListener("click", handleTaskListClick);
filtersElement.addEventListener("click", handleFilterClick);

renderApp();