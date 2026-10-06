const initialItems = document.querySelectorAll("#list li");
console.log("1. Сохранённый NodeList:", initialItems.length);

const missing = document.querySelector("#missing");
console.log("1. Отсутствующий элемент:", missing);

const button = document.querySelector("button[data-task-id]");
console.log("2. dataset до Number:", button.dataset.taskId, typeof button.dataset.taskId);
console.log("2. После Number:", Number(button.dataset.taskId), typeof Number(button.dataset.taskId));

document.querySelector("#add-item").addEventListener("click", () => {
    const li = document.createElement("li");
    li.textContent = `Запись ${document.querySelectorAll("#list li").length + 1}`;
    document.querySelector("#list").append(li);
    console.log("3. Сохранённый NodeList:", initialItems.length);
    console.log("3. Новый querySelectorAll:", document.querySelectorAll("#list li").length);
});

document.querySelector("#toggle-title").addEventListener("click", (event) => {
    console.log("5. target:", event.target);
    console.log("5. currentTarget:", event.currentTarget);
    console.log("5. eventPhase:", event.eventPhase);
});

button.addEventListener("click", (event) => {
    const value = "<strong>Проверить пример</strong>";
    console.log("4. Значение:", value);
    console.log("4. Через textContent будет текстом, не HTML");
});