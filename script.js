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

    const index = piDigits.indexOf(searchInput);

    if (index !== -1) {
        // Очистка предыдущего выделения
        const highlighted = document.querySelector('.highlight');
        if (highlighted) {
            highlighted.outerHTML = highlighted.innerHTML;
        }

        // Выделение новой последовательности
        const before = piDigits.substring(0, index);
        const found = piDigits.substring(index, index + searchInput.length);
        const after = piDigits.substring(index + searchInput.length);

        piDigitsElement.innerHTML = `${before}<span class="highlight">${found}</span>${after}`;

        // Прокрутка к найденной последовательности
        const highlightedElement = document.querySelector('.highlight');
        highlightedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        alert('Последовательность не найдена');
    }
}