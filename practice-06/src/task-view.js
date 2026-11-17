const PRIORITY_LABELS = Object.freeze({
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
});

function textElement(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

export function createTaskElement(task, category) {
  const card = document.createElement("li");
  card.className = "task-card";
  card.classList.toggle("is-completed", task.completed);
  card.dataset.taskId = String(task.id);

  const meta = document.createElement("div");
  meta.className = "task-meta";
  meta.append(
    textElement("span", "task-status", task.completed ? "Выполнена" : "В работе"),
    textElement("span", "task-priority", PRIORITY_LABELS[task.priority]),
    textElement("span", "task-category", category?.name ?? "Неизвестная категория"),
  );
  const actions = document.createElement("div");
  actions.className = "task-actions";

  for (const [action, label] of [
    ["toggle", task.completed ? "Вернуть в работу" : "Завершить"],
    ["edit", "Изменить"],
    ["delete", "Удалить"],
  ]) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.action = action;
    button.append(textElement("span", "action-label", label));
    actions.append(button);
  }

  card.append(textElement("h3", "task-title", task.title), meta, actions);
  return card;
}

export function renderTaskList(list, tasks, categories) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  list.replaceChildren(...tasks.map((task) => createTaskElement(task, byId.get(task.categoryId))));
}
