"use strict";


function sum(a, b) {
    return a + b;
}
console.log("1a:", sum(2, 3));
console.log("1b:", sum("2", "3"));


const square = (x) => {
    x * x;
};
console.log("2 (было):", square(4));


const squareFixed = (x) => {
    return x * x;
};
console.log("2 (исправлено):", squareFixed(4));

const original = { title: "Черновик", published: false };
const alias = original;
alias.published = true;
console.log("3:", original.published, original === alias);

const items = [{ id: 1 }, { id: 2 }];
const copy = [...items];
copy[0].id = 99;
console.log("4:", items[0].id, copy[0].id, items === copy);

const oldBook = { id: 12, title: "Черновик", available: false };
const newBook = { ...oldBook, available: true };
console.log("5:", oldBook.available, newBook.available);

function makeCaption(text = "Без названия") {
    return text;
}
console.log("6a:", makeCaption());
console.log("6b:", makeCaption(undefined));
console.log("6c:", makeCaption(null));
console.log("6d:", makeCaption(""));