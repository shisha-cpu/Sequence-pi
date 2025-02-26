document.addEventListener('DOMContentLoaded', function() {
    fetch('10m.txt')
        .then(response => response.text())
        .then(data => {
            const piDigitsElement = document.getElementById('pi-digits');
            piDigitsElement.textContent = data;
        })
        .catch(error => console.error('Ошибка загрузки файла:', error));
});

function searchSequence() {
    const searchInput = document.getElementById('search-input').value;
    const piDigitsElement = document.getElementById('pi-digits');
    const piDigits = piDigitsElement.textContent;

    if (!searchInput) {
        alert('Введите последовательность для поиска');
        return;
    }

    const regex = new RegExp(searchInput, 'g');
    const matches = [...piDigits.matchAll(regex)];

    if (matches.length > 0) {
        let highlightedPi = piDigits;
        let resultHTML = 'Последовательность найдена на позициях: ';
        let offset = 0;
        let positions = [];

        matches.forEach((match, i) => {
            const index = match.index + offset;
            positions.push(index + 1);

            // Вставляем теги <span> с id для навигации
            const spanId = `match-${i}`;
            highlightedPi = highlightedPi.substring(0, index) +
                `<span class="highlight" id="${spanId}">${match[0]}</span>` +
                highlightedPi.substring(index + match[0].length);

            // Смещаем индекс для учета вставленных тегов <span>
            offset += `<span class="highlight" id="${spanId}"></span>`.length;
        });

        piDigitsElement.innerHTML = highlightedPi;

        // Создаем список кликабельных ссылок
        resultHTML += positions
            .map((pos, i) => `<a href="#match-${i}" onclick="scrollToMatch('match-${i}'); return false;">${pos}</a>`)
            .join(', ');

        document.getElementById('result').innerHTML = resultHTML;

        // Прокрутка к первому найденному вхождению
        scrollToMatch('match-0');
    } else {
        alert('Последовательность не найдена');
        document.getElementById('result').textContent = '';
    }
}

function scrollToMatch(id) {
    const element = document.getElementById(id);
    if (element) {
        const yOffset = -300; // Отступ 200px сверху
        const y = element.getBoundingClientRect().top + window.scrollY + yOffset;

        window.scrollTo({ top: y, behavior: 'smooth' });
    }
}
