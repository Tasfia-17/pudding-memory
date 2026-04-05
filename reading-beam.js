// Guided Reading Beam - Highlights one section at a time
class ReadingBeam {
    constructor() {
        this.isActive = false;
        this.currentIndex = 0;
        this.beamWidth = 'sentence'; // 'sentence' or 'paragraph'
        this.elements = [];
        this.autoScroll = false;
    }

    activate(width = 'sentence') {
        this.isActive = true;
        this.beamWidth = width;
        this.setupBeam();
        this.addControls();
    }

    deactivate() {
        this.isActive = false;
        this.removeBeam();
        this.removeControls();
    }

    setupBeam() {
        const mainContent = document.querySelector('main, article, .content, #content');
        if (!mainContent) return;

        // Add overlay
        const overlay = document.createElement('div');
        overlay.id = 'pudding-reading-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 999998;
            pointer-events: none;
        `;
        document.body.appendChild(overlay);

        // Get elements to highlight
        if (this.beamWidth === 'sentence') {
            this.elements = this.extractSentences(mainContent);
        } else {
            this.elements = Array.from(mainContent.querySelectorAll('p, h1, h2, h3, li'));
        }

        this.elements.forEach((el, idx) => {
            el.setAttribute('data-beam-index', idx);
            el.style.transition = 'all 0.3s ease';
        });

        this.highlightCurrent();
    }

    extractSentences(container) {
        const sentences = [];
        const paragraphs = container.querySelectorAll('p');
        
        paragraphs.forEach(p => {
            const text = p.textContent;
            const sentenceArray = text.match(/[^.!?]+[.!?]+/g) || [text];
            
            sentenceArray.forEach(sentence => {
                const span = document.createElement('span');
                span.textContent = sentence;
                span.className = 'pudding-beam-sentence';
                sentences.push(span);
            });
            
            // Replace paragraph content with spans
            p.innerHTML = '';
            const relevantSpans = sentences.slice(-sentenceArray.length);
            relevantSpans.forEach(span => p.appendChild(span));
        });

        return sentences;
    }

    highlightCurrent() {
        // Dim all
        this.elements.forEach(el => {
            el.style.opacity = '0.3';
            el.style.filter = 'blur(2px)';
        });

        // Highlight current
        const current = this.elements[this.currentIndex];
        if (current) {
            current.style.opacity = '1';
            current.style.filter = 'none';
            current.style.background = 'rgba(212, 132, 92, 0.1)';
            current.style.padding = '8px';
            current.style.borderRadius = '4px';
            current.style.boxShadow = '0 0 20px rgba(212, 132, 92, 0.3)';
            
            // Scroll into view
            current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    next() {
        if (this.currentIndex < this.elements.length - 1) {
            this.currentIndex++;
            this.highlightCurrent();
        }
    }

    previous() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.highlightCurrent();
        }
    }

    toggleAutoScroll() {
        this.autoScroll = !this.autoScroll;
        
        if (this.autoScroll) {
            this.autoScrollInterval = setInterval(() => {
                this.next();
                if (this.currentIndex >= this.elements.length - 1) {
                    this.autoScroll = false;
                    clearInterval(this.autoScrollInterval);
                }
            }, 5000); // 5 seconds per section
        } else {
            clearInterval(this.autoScrollInterval);
        }
    }

    addControls() {
        const controls = document.createElement('div');
        controls.id = 'pudding-beam-controls';
        controls.innerHTML = `
            <style>
                #pudding-beam-controls {
                    position: fixed;
                    bottom: 30px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(135deg, #d4845c 0%, #b86f4d 100%);
                    padding: 15px 20px;
                    border-radius: 50px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                    z-index: 999999;
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }
                .pudding-beam-btn {
                    background: rgba(255,255,255,0.3);
                    border: none;
                    color: white;
                    padding: 10px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s;
                }
                .pudding-beam-btn:hover {
                    background: rgba(255,255,255,0.5);
                    transform: translateY(-2px);
                }
                .pudding-beam-progress {
                    color: white;
                    font-size: 13px;
                    font-weight: 600;
                }
            </style>
            <button class="pudding-beam-btn" id="beam-prev">← Prev</button>
            <span class="pudding-beam-progress" id="beam-progress">1 / ${this.elements.length}</span>
            <button class="pudding-beam-btn" id="beam-next">Next →</button>
            <button class="pudding-beam-btn" id="beam-auto">Auto</button>
            <button class="pudding-beam-btn" id="beam-exit">✕ Exit</button>
        `;
        document.body.appendChild(controls);

        document.getElementById('beam-prev').addEventListener('click', () => {
            this.previous();
            this.updateProgress();
        });

        document.getElementById('beam-next').addEventListener('click', () => {
            this.next();
            this.updateProgress();
        });

        document.getElementById('beam-auto').addEventListener('click', () => {
            this.toggleAutoScroll();
        });

        document.getElementById('beam-exit').addEventListener('click', () => {
            this.deactivate();
        });

        // Keyboard controls
        this.keyHandler = (e) => {
            if (e.key === 'ArrowRight') this.next();
            if (e.key === 'ArrowLeft') this.previous();
            if (e.key === 'Escape') this.deactivate();
            this.updateProgress();
        };
        document.addEventListener('keydown', this.keyHandler);
    }

    updateProgress() {
        const progress = document.getElementById('beam-progress');
        if (progress) {
            progress.textContent = `${this.currentIndex + 1} / ${this.elements.length}`;
        }
    }

    removeBeam() {
        const overlay = document.getElementById('pudding-reading-overlay');
        if (overlay) overlay.remove();

        this.elements.forEach(el => {
            el.style.opacity = '';
            el.style.filter = '';
            el.style.background = '';
            el.style.padding = '';
            el.style.borderRadius = '';
            el.style.boxShadow = '';
        });

        if (this.autoScrollInterval) clearInterval(this.autoScrollInterval);
    }

    removeControls() {
        const controls = document.getElementById('pudding-beam-controls');
        if (controls) controls.remove();
        
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
    }
}

window.readingBeam = new ReadingBeam();
