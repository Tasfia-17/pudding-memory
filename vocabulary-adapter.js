// Adaptive Vocabulary Replacement
class VocabularyAdapter {
    constructor() {
        this.complexWords = new Map();
        this.initDictionary();
    }

    initDictionary() {
        // Common complex words and their simpler alternatives
        this.complexWords.set('cognitive dissonance', 'mental conflict when beliefs clash');
        this.complexWords.set('paradigm', 'pattern or model');
        this.complexWords.set('methodology', 'method or approach');
        this.complexWords.set('infrastructure', 'basic systems and structures');
        this.complexWords.set('facilitate', 'make easier or help');
        this.complexWords.set('utilize', 'use');
        this.complexWords.set('implement', 'put into action');
        this.complexWords.set('comprehensive', 'complete or thorough');
        this.complexWords.set('subsequent', 'following or next');
        this.complexWords.set('preliminary', 'initial or first');
    }

    scanAndEnhance(container) {
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.trim().length > 0) {
                textNodes.push(node);
            }
        }

        textNodes.forEach(textNode => {
            this.enhanceTextNode(textNode);
        });
    }

    enhanceTextNode(textNode) {
        const text = textNode.textContent;
        let hasComplex = false;

        this.complexWords.forEach((simple, complex) => {
            const regex = new RegExp(`\\b${complex}\\b`, 'gi');
            if (regex.test(text)) {
                hasComplex = true;
            }
        });

        if (!hasComplex) return;

        const span = document.createElement('span');
        span.innerHTML = this.wrapComplexWords(text);
        textNode.parentNode.replaceChild(span, textNode);
    }

    wrapComplexWords(text) {
        let result = text;
        
        this.complexWords.forEach((simple, complex) => {
            const regex = new RegExp(`\\b(${complex})\\b`, 'gi');
            result = result.replace(regex, (match) => {
                return `<span class="pudding-complex-word" data-simple="${simple}">${match}</span>`;
            });
        });

        return result;
    }

    addInteractivity() {
        const style = document.createElement('style');
        style.textContent = `
            .pudding-complex-word {
                border-bottom: 2px dotted #d4845c;
                cursor: help;
                position: relative;
            }
            .pudding-complex-word:hover {
                background: rgba(212, 132, 92, 0.1);
            }
            .pudding-word-tooltip {
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #d4845c 0%, #b86f4d 100%);
                color: white;
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 12px;
                white-space: nowrap;
                z-index: 999999;
                margin-bottom: 5px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                pointer-events: none;
            }
            .pudding-word-tooltip::after {
                content: '';
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                border: 5px solid transparent;
                border-top-color: #b86f4d;
            }
        `;
        document.head.appendChild(style);

        // Add hover listeners
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('pudding-complex-word')) {
                this.showTooltip(e.target);
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('pudding-complex-word')) {
                this.hideTooltip(e.target);
            }
        });

        // Click to toggle
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('pudding-complex-word')) {
                this.toggleWord(e.target);
            }
        });
    }

    showTooltip(element) {
        const simple = element.getAttribute('data-simple');
        const tooltip = document.createElement('div');
        tooltip.className = 'pudding-word-tooltip';
        tooltip.textContent = simple;
        element.appendChild(tooltip);
    }

    hideTooltip(element) {
        const tooltip = element.querySelector('.pudding-word-tooltip');
        if (tooltip) tooltip.remove();
    }

    toggleWord(element) {
        const original = element.textContent;
        const simple = element.getAttribute('data-simple');
        
        if (element.hasAttribute('data-original')) {
            element.textContent = element.getAttribute('data-original');
            element.removeAttribute('data-original');
        } else {
            element.setAttribute('data-original', original);
            element.textContent = simple;
        }
    }
}

window.vocabularyAdapter = new VocabularyAdapter();
window.vocabularyAdapter.addInteractivity();
