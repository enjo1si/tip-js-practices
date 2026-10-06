"use strict";



const totalTasks = 12;
const completedTasks = 5;


const isValid =
    Number.isInteger(totalTasks) &&
    Number.isInteger(completedTasks) &&
    totalTasks >= 0 &&
    totalTasks <= 1000 &&
    completedTasks >= 0 &&
    completedTasks <= totalTasks;

if (!isValid) {
    console.log("Ошибка: недопустимые значения количества задач");
} else if (totalTasks === 0 && completedTasks === 0) {
    console.log("Задач пока нет");
} else {
    const remainingTasks = totalTasks - completedTasks;
    const percentage = (completedTasks / totalTasks) * 100;
    let status;

    if (completedTasks === 0) {
        status = "Не начато";
    } else if (completedTasks === totalTasks) {
        status = "Завершено";
    } else {
        status = "В работе";
    }

    console.log("Всего задач:", totalTasks);
    console.log("Выполнено:", completedTasks);
    console.log("Осталось:", remainingTasks);
    console.log("Прогресс:", percentage.toFixed(1) + "%");
    console.log("Статус:", status);
}