import { demoTasks, variantTasks, variantNumber } from "./data.js";
import {
    createTask,
    findTaskById,
    getPendingTasks,
    getTaskTitles,
    getTaskStats,
    addTask,
    setTaskCompleted,
    renameTask,
    removeTask,
} from "./task-service.js";

function printStats(label, tasks) {
    const { total, completed, pending, progress } = getTaskStats(tasks);
    console.log(`${label}: всего ${total}, выполнено ${completed}, осталось ${pending}`);
    if (total === 0) {
        console.log("Задач пока нет");
    } else {
        console.log(`Прогресс: ${progress.toFixed(1)}%`);
    }
}

console.log("=== Общий сценарий ===");
let currentTasks = demoTasks;

printStats("Исходный набор", currentTasks);
console.log("Названия:", getTaskTitles(currentTasks));
console.log("Невыполненные:", getPendingTasks(currentTasks).map((t) => t.id));

let result = addTask(currentTasks, 20, "Добавить проверку", "high");
if (result.ok) currentTasks = result.tasks;
printStats("После добавления id=20", currentTasks);

result = setTaskCompleted(currentTasks, 4, true);
if (result.ok) currentTasks = result.tasks;
printStats("После выполнения id=4", currentTasks);

result = renameTask(currentTasks, 10, "Подготовить инструкцию запуска");
if (result.ok) currentTasks = result.tasks;
printStats("После переименования id=10", currentTasks);

result = removeTask(currentTasks, 7);
if (result.ok) currentTasks = result.tasks;
printStats("После удаления id=7", currentTasks);

console.log("Итоговые id:", currentTasks.map((t) => t.id));

result = addTask(currentTasks, 20, "Дубликат");
if (!result.ok) console.error("Ошибка (ожидаемо):", result.error);

console.log("Исходный demoTasks сохранён:", demoTasks.length === 4);

console.log("\n=== Индивидуальный вариант 5 ===");
let variantCurrent = variantTasks;
printStats("Исходный набор варианта", variantCurrent);

result = addTask(variantCurrent, 80, "Проверить прототип на пользователях", "medium");
if (result.ok) variantCurrent = result.tasks;
printStats("После добавления id=80", variantCurrent);

result = setTaskCompleted(variantCurrent, 11, true);
if (result.ok) variantCurrent = result.tasks;

result = renameTask(variantCurrent, 23, "Распределить задачи между участниками");
if (result.ok) variantCurrent = result.tasks;

result = removeTask(variantCurrent, 37);
if (result.ok) variantCurrent = result.tasks;

printStats("Итог по варианту", variantCurrent);
console.log("Итоговые id варианта:", variantCurrent.map((t) => t.id));

result = addTask(variantCurrent, 80, "Повтор");
if (!result.ok) console.error("Ошибка (ожидаемо):", result.error);

console.log("variantTasks сохранён:", variantTasks.length === 6);