"use strict";



const totalTasks = 7;
const completedTasks = 2;
const dailyLimit = 2;


const isValidTasks =
    Number.isInteger(totalTasks) &&
    Number.isInteger(completedTasks) &&
    totalTasks >= 0 &&
    totalTasks <= 1000 &&
    completedTasks >= 0 &&
    completedTasks <= totalTasks;

const isValidLimit =
    Number.isInteger(dailyLimit) &&
    dailyLimit >= 1 &&
    dailyLimit <= 1000;

if (!isValidTasks) {
    console.log("Ошибка: недопустимые значения количества задач");
} else if (!isValidLimit) {
    console.log("Ошибка: недопустимое значение дневного лимита");
} else {
    let remaining = totalTasks - completedTasks;

    if (remaining === 0) {
        console.log("Все задачи выполнены");
        console.log("Потребуется дней: 0");
    } else {
        console.log("Осталось задач:", remaining);

        let day = 0;

        while (remaining > 0) {
            day += 1;
            const doneToday = Math.min(dailyLimit, remaining);
            remaining -= doneToday;
            console.log(`День ${day}: выполнено ${doneToday}, осталось ${remaining}`);
        }

        console.log("Потребуется дней:", day);
    }
}