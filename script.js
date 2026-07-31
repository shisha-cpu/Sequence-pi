const DIGITS_URL = '100m.txt';
const MAX_LISTED_MATCHES = 500;
const VIEW_BUFFER_LINES = 4;

let piDigits = '';
let charsPerLine = 80;
let lineHeightPx = 20;
let activeHighlight = null;

let piScroll;
let piSpacer;
let piDigitsElement;
let loadStatus;

document.addEventListener('DOMContentLoaded', () => {
    piScroll = document.getElementById('pi-scroll');
    piSpacer = document.getElementById('pi-spacer');
    piDigitsElement = document.getElementById('pi-digits');
    loadStatus = document.getElementById('load-status');

    piScroll.addEventListener('scroll', scheduleViewportUpdate);
    window.addEventListener('resize', () => {
        if (!piDigits) {
            return;
        }
        updateLayoutMetrics();
        renderViewport(getStartIndexFromScroll());
    });

    loadPiDigits();
});

function setLoadStatus(text) {
    if (loadStatus) {
        loadStatus.textContent = text;
    }
}

async function loadPiDigits() {
    setLoadStatus('Загрузка цифр π…');

    try {
        const response = await fetch(DIGITS_URL);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const total = Number(response.headers.get('Content-Length')) || 0;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let received = 0;
        let chunks = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            chunks.push(decoder.decode(value, { stream: true }));
            received += value.byteLength;
            if (total > 0 && received % (5 * 1024 * 1024) < value.byteLength) {
                const pct = Math.min(99, Math.round((received / total) * 100));
                setLoadStatus(`Загрузка цифр π… ${pct}%`);
            }
        }
        chunks.push(decoder.decode());

        piDigits = chunks.join('');
        updateLayoutMetrics();
        renderViewport(0);
        setLoadStatus(
            `Загружено ${piDigits.length.toLocaleString('ru-RU')} цифр. Прокручивайте или ищите последовательность.`
        );
    } catch (error) {
        console.error('Ошибка загрузки файла:', error);
        setLoadStatus(`Не удалось загрузить ${DIGITS_URL}. Положите файл в папку сайта.`);
    }
}

function updateLayoutMetrics() {
    const style = getComputedStyle(piDigitsElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `${style.fontSize} ${style.fontFamily}`;
    const charWidth = ctx.measureText('0').width || 8;
    const padding =
        parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const innerWidth = Math.max(1, piScroll.clientWidth - padding);
    charsPerLine = Math.max(1, Math.floor(innerWidth / charWidth));

    const fontSize = parseFloat(style.fontSize) || 16;
    lineHeightPx =
        parseFloat(style.lineHeight) ||
        (Number.isNaN(fontSize) ? 20 : fontSize * 1.25);

    const totalLines = Math.ceil(piDigits.length / charsPerLine);
    piSpacer.style.height = `${totalLines * lineHeightPx + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)}px`;
}

let viewportRaf = null;
let suppressScrollRender = false;

function scheduleViewportUpdate() {
    if (suppressScrollRender) {
        return;
    }
    if (viewportRaf !== null) {
        return;
    }
    viewportRaf = requestAnimationFrame(() => {
        viewportRaf = null;
        renderViewport(getStartIndexFromScroll());
    });
}

function getStartIndexFromScroll() {
    const startLine = Math.floor(piScroll.scrollTop / lineHeightPx);
    const bufferLines = Math.max(0, startLine - VIEW_BUFFER_LINES);
    return bufferLines * charsPerLine;
}

function getViewportWindowChars() {
    const visibleLines =
        Math.ceil(piScroll.clientHeight / lineHeightPx) + VIEW_BUFFER_LINES * 2;
    return visibleLines * charsPerLine;
}

function renderViewport(startIndex, highlightOverride) {
    if (!piDigits) {
        return;
    }

    const highlight =
        highlightOverride !== undefined ? highlightOverride : activeHighlight;
    const endIndex = Math.min(
        piDigits.length,
        startIndex + getViewportWindowChars()
    );

    const slice = piDigits.slice(startIndex, endIndex);
    const offsetLines = Math.floor(startIndex / charsPerLine);
    piDigitsElement.style.transform = `translateY(${offsetLines * lineHeightPx}px)`;

    if (highlight && highlight.length > 0) {
        const matchStart = highlight.index;
        const matchEnd = highlight.index + highlight.length;
        if (matchStart < endIndex && matchEnd > startIndex) {
            const localStart = Math.max(0, matchStart - startIndex);
            const localEnd = Math.min(slice.length, matchEnd - startIndex);
            const before = escapeHtml(slice.slice(0, localStart));
            const mid = escapeHtml(slice.slice(localStart, localEnd));
            const after = escapeHtml(slice.slice(localEnd));
            piDigitsElement.innerHTML =
                before +
                `<span class="highlight" id="${highlight.id}">${mid}</span>` +
                after;
            return;
        }
    }

    piDigitsElement.textContent = slice;
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function searchSequence() {
    const searchInput = document.getElementById('search-input').value;
    const resultEl = document.getElementById('result');

    if (!searchInput) {
        alert('Введите последовательность для поиска');
        return;
    }

    if (!piDigits) {
        alert('Цифры π ещё загружаются');
        return;
    }

    const regex = new RegExp(searchInput, 'g');
    const positions = [];
    let match;

    while ((match = regex.exec(piDigits)) !== null) {
        positions.push(match.index + 1);
        if (positions.length >= MAX_LISTED_MATCHES) {
            break;
        }
    }

    if (positions.length === 0) {
        alert('Последовательность не найдена');
        resultEl.textContent = '';
        activeHighlight = null;
        renderViewport(getStartIndexFromScroll());
        return;
    }

    let resultHTML = 'Последовательность найдена на позициях: ';
    const matchLength = searchInput.length;
    resultHTML += positions
        .map((pos, i) => {
            const index0 = pos - 1;
            return `<a href="#" data-match-index="${index0}" data-match-id="match-${i}" data-match-length="${matchLength}">${pos}</a>`;
        })
        .join(', ');

    if (positions.length >= MAX_LISTED_MATCHES) {
        resultHTML += ` (показаны первые ${MAX_LISTED_MATCHES})`;
    }

    resultEl.innerHTML = resultHTML;

    resultEl.querySelectorAll('a[data-match-index]').forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            scrollToMatch(
                link.dataset.matchId,
                Number(link.dataset.matchIndex),
                Number(link.dataset.matchLength)
            );
        });
    });

    scrollToMatch('match-0', positions[0] - 1, matchLength);
}

function scrollToMatch(id, index0, length) {
    activeHighlight = { id, index: index0, length };

    const windowChars = getViewportWindowChars();
    let startIndex = Math.max(0, index0 - Math.floor(windowChars / 3));
    if (startIndex + windowChars > piDigits.length) {
        startIndex = Math.max(0, piDigits.length - windowChars);
    }

    const offsetLines = Math.floor(startIndex / charsPerLine);
    suppressScrollRender = true;
    piScroll.scrollTop = offsetLines * lineHeightPx;
    renderViewport(startIndex, activeHighlight);
    requestAnimationFrame(() => {
        suppressScrollRender = false;
    });
}
