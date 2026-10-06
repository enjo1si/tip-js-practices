const form = document.querySelector("#demo-form");
const log = document.querySelector("#log");

function print(text) {
    const p = document.createElement("p");
    p.textContent = text;
    log.append(p);
    console.log(text);
}

form.addEventListener("submit", (event) => {
    event.preventDefault();
    print(`1. validity.valid = ${form.checkValidity()}`);

    const fd = new FormData(form);
    const raw = fd.get("title");
    print(`3. FormData.get = "${raw}" (${typeof raw})`);
    print(`3. defaultPrevented = ${event.defaultPrevented}`);
    print(`3. trim = "${raw.trim()}"`);

    localStorage.setItem("demo:form", JSON.stringify({ title: raw.trim() }));
    print(`4. Записано: ${localStorage.getItem("demo:form")}`);
});

// 5. Повреждённый JSON
try {
    const broken = JSON.parse("{broken-json");
    print(`5. ${broken}`);
} catch (error) {
    print(`5. Ошибка JSON.parse: ${error.message}`);
}