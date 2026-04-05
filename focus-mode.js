// Focus Mode Engine - Distraction suppression and reading focus
class FocusMode {
    constructor() {
        this.isActive = false;
        this.originalStyles = new Map();
        this.focusedElement = null;
    }

    activate() {
        this.isActive = true;
        this.suppressDistractions();
        this.enableSpotlightMode();
        this.addFocusControls();
    }

    deactivate() {
        this.isActive = false;
        this.restoreOriginalStyles();
        this.removeFocusControls();
    }

    suppressDistractions() {
        // Blur sidebars
        const sidebars = document.querySelectorAll('aside, [class*="sidebar"], [class*="side-bar"]');
        sidebars.forEach(el => this.applyBlur(el));

        // Hide ads
        const ads = document.querySelectorAll('[class*="ad-"], [id*="ad-"], iframe[src*="ads"]');
        ads.forEach(el => this.hideElement(el));

        // Collapse comments
        const comments = document.querySelectorAll('[class*="comment"], [id*="comment"]');
        comments.forEach(el => this.hideElement(el));

        // Dim navigation
        const navs = document.querySelectorAll('nav, header:not(article header), footer');
        navs.forEach(el => this.applyDim(el));
    }

    applyBlur(element) {
        this.originalStyles.set(element, element.style.cssText);
        element.style.filter = 'blur(8px)';
        element.style.opacity = '0.3';
        element.style.pointerEvents = 'none';
        element.style.transition = 'all 0.3s ease';
    }

    applyDim(element) {
        this.originalStyles.set(element, element.style.cssText);
        element.style.opacity = '0.4';
        element.style.transition = 'all 0.3s ease';
    }

    hideElement(element) {
        this.originalStyles.set(element, element.style.cssText);
        element.style.display = 'none';
    }

    enableSpotlightMode() {
        const mainContent = this.findMainContent();
        if (!mainContent) return;

        const paragraphs = mainContent.querySelectorAll('p, h1, h2, h3, h4, li');
        paragraphs.forEach((p, idx) => {
            p.setAttribute('data-focus-index', idx);
            p.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            p.style.opacity = '0.3';
            p.classList.add('pudding-focus-paragraph');
        });

        this.focusOnViewport();
        window.addEventListener('scroll', () => this.focusOnViewport(), { passive: true });
    }

    focusOnViewport() {
        const paragraphs = document.querySelectorAll('.pudding-focus-paragraph');
        paragraphs.forEach(p => {
            const rect = p.getBoundingClientRect();
            const inView = rect.top >= 0 && rect.top <= window.innerHeight * 0.6;
            
            if (inView) {
                p.style.opacity = '1';
                p.style.transform = 'scale(1.02)';
                this.focusedElement = p;
            } else {
                p.style.opacity = '0.3';
                p.style.transform = 'scale(1)';
            }
        });
    }

    addFocusControls() {
        const controls = document.createElement('div');
        controls.id = 'pudding-focus-controls';
        controls.innerHTML = `
            <style>
                #pudding-focus-controls {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: rgba(212, 132, 92, 0.95);
                    backdrop-filter: blur(10px);
                    padding: 15px;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                    z-index: 999999;
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }
                .pudding-focus-btn {
                    background: rgba(255,255,255,0.3);
                    border: none;
                    padding: 8px 12px;
                    border-radius: 8px;
                    cursor: pointer;
                    color: white;
                    font-size: 14px;
                    transition: all 0.2s;
                }
                .pudding-focus-btn:hover {
                    background: rgba(255,255,255,0.5);
                    transform: translateY(-2px);
                }
            </style>
            <button class="pudding-focus-btn" id="pudding-prev">↑ Prev</button>
            <button class="pudding-focus-btn" id="pudding-next">↓ Next</button>
            <button class="pudding-focus-btn" id="pudding-exit">✕ Exit Focus</button>
        `;
        document.body.appendChild(controls);

        document.getElementById('pudding-prev').addEventListener('click', () => this.navigateParagraph(-1));
        document.getElementById('pudding-next').addEventListener('click', () => this.navigateParagraph(1));
        document.getElementById('pudding-exit').addEventListener('click', () => this.deactivate());
    }

    navigateParagraph(direction) {
        if (!this.focusedElement) return;
        
        const currentIndex = parseInt(this.focusedElement.getAttribute('data-focus-index'));
        const paragraphs = document.querySelectorAll('.pudding-focus-paragraph');
        const nextIndex = currentIndex + direction;
        
        if (nextIndex >= 0 && nextIndex < paragraphs.length) {
            paragraphs[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    removeFocusControls() {
        const controls = document.getElementById('pudding-focus-controls');
        if (controls) controls.remove();
    }

    restoreOriginalStyles() {
        this.originalStyles.forEach((style, element) => {
            element.style.cssText = style;
        });
        this.originalStyles.clear();

        document.querySelectorAll('.pudding-focus-paragraph').forEach(p => {
            p.style.opacity = '';
            p.style.transform = '';
            p.classList.remove('pudding-focus-paragraph');
        });
    }

    findMainContent() {
        const selectors = ['main', 'article', '[role="main"]', '.content', '#content'];
        for (let selector of selectors) {
            const el = document.querySelector(selector);
            if (el) return el;
        }
        return document.body;
    }
}

window.focusMode = new FocusMode();
