self.port.on("init", init);

const main = document.getElementById("main");

main.addEventListener("click", function (evt) {
    let target = evt.target;
    let li = target.closest("li[data-value]");
    if (!li) return;
    let value = li.dataset.value;
    send(value);
});
window.addEventListener("keypress", function (evt) {
    let activeElement = document.activeElement;
    if (!activeElement) return;
    let parentEl = null;
    let firstEl = null;
    let lastEl = null;
    if (activeElement.classList.contains("menuitem")) {
        parentEl = activeElement.parentElement;
        firstEl = parentEl.firstElementChild;
        lastEl = parentEl.lastElementChild;
    }
    if (evt.key === "ArrowUp") {
        if (!parentEl) {
            activeElement = main.querySelector(".menuitem:last-of-type");
            activeElement.focus();
        } else if (activeElement === firstEl) {
            lastEl.focus();
        } else {
            activeElement.previousElementSibling.focus();
        }
    } else if (evt.key === "ArrowDown") {
        if (!parentEl) {
            activeElement = main.querySelector(".menuitem:first-of-type");
            activeElement.focus();
        } else if (activeElement === lastEl) {
            firstEl.focus();
        } else {
            activeElement.nextElementSibling.focus();
        }
    } else if (evt.key === "Enter") {
        let value = activeElement.dataset.value;
        send(value);
    }
});
main.addEventListener("mousemove", function (evt) {
    let target = evt.target;
    let li = target.closest(".menuitem");
    if (!li) return;
    li.focus();
});
main.addEventListener("mouseleave", function () {
    document.activeElement.blur();
});

function init(data) {
    draw(data.items);
    window.focus();
}

function send(action) {
    self.postMessage({
        action,
    });
}

function draw(items) {
    let lis = items.map(item => {
        return `<li tabindex="0" class="menuitem" data-value="${item.value}" role="menuitem">${item.text}</li>`;
    });
    let ul = `<ul class="menu" role="menu">`;
    ul += lis.join("");
    ul += "</ul>";
    main.innerHTML = ul;
    let bounds = main.getBoundingClientRect();
    self.postMessage({
        resize: {
            width: bounds.width,
            height: bounds.height,
        },
    });
}
