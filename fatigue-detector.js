// Reading Fatigue Detection
class FatigueDetector {
    constructor() {
        this.fatigueScore = 0;
        this.startTime = Date.now();
        this.scrollPauses = [];
        this.rapidScrolls = 0;
        this.tabSwitches = 0;
    }

    init() {
        this.trackScrollPauses();
        this.trackRapidScrolling();
        this.trackTabSwitches();
        this.monitorFatigue();
    }

    trackScrollPauses() {
        let lastScroll = Date.now();
        let pauseStart = Date.now();

        window.addEventListener('scroll', () => {
            const now = Date.now();
            const pauseDuration = now - lastScroll;
            
            if (pauseDuration > 3000) {
                this.scrollPauses.push(pauseDuration);
            }
            
            lastScroll = now;
        }, { passive: true });
    }

    trackRapidScrolling() {
        let scrollCount = 0;
        let scrollTimer;

        window.addEventListener('scroll', () => {
            scrollCount++;
            clearTimeout(scrollTimer);
            
            scrollTimer = setTimeout(() => {
                if (scrollCount > 10) {
                    this.rapidScrolls++;
                }
                scrollCount = 0;
            }, 1000);
        }, { passive: true });
    }

    trackTabSwitches() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.tabSwitches++;
            }
        });
    }

    monitorFatigue() {
        setInterval(() => {
            this.calculateFatigue();
            
            if (this.fatigueScore > 60) {
                this.offerUltraFocusMode();
            }
        }, 30000); // Check every 30 seconds
    }

    calculateFatigue() {
        const readingTime = (Date.now() - this.startTime) / 60000; // minutes
        const avgPause = this.scrollPauses.slice(-10).reduce((a, b) => a + b, 0) / 10;
        
        // Fatigue indicators
        const timeScore = Math.min(40, readingTime * 2); // Long reading = fatigue
        const pauseScore = Math.min(30, avgPause / 200); // Long pauses = fatigue
        const rapidScore = Math.min(20, this.rapidScrolls * 5); // Rapid scrolling = frustration
        const switchScore = Math.min(10, this.tabSwitches * 3); // Tab switching = distraction
        
        this.fatigueScore = timeScore + pauseScore + rapidScore + switchScore;
        console.log('Fatigue score:', this.fatigueScore);
    }

    offerUltraFocusMode() {
        if (document.getElementById('pudding-fatigue-prompt')) return;

        const prompt = document.createElement('div');
        prompt.id = 'pudding-fatigue-prompt';
        prompt.innerHTML = `
            <style>
                #pudding-fatigue-prompt {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #d4845c 0%, #b86f4d 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                    z-index: 999999;
                    max-width: 300px;
                    animation: slideIn 0.4s ease;
                }
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                #pudding-fatigue-prompt h3 {
                    margin: 0 0 10px 0;
                    font-size: 16px;
                }
                #pudding-fatigue-prompt p {
                    margin: 0 0 15px 0;
                    font-size: 13px;
                    opacity: 0.9;
                }
                #pudding-fatigue-prompt button {
                    background: rgba(255,255,255,0.3);
                    border: 1px solid rgba(255,255,255,0.5);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 13px;
                    margin-right: 8px;
                    transition: all 0.2s;
                }
                #pudding-fatigue-prompt button:hover {
                    background: rgba(255,255,255,0.5);
                }
            </style>
            <h3>Feeling tired?</h3>
            <p>We noticed you might need a break. Try Ultra Focus Mode or chunk the article.</p>
            <button id="pudding-ultra-focus">Ultra Focus</button>
            <button id="pudding-chunk">Chunk It</button>
            <button id="pudding-dismiss">Dismiss</button>
        `;

        document.body.appendChild(prompt);

        document.getElementById('pudding-ultra-focus').addEventListener('click', () => {
            this.activateUltraFocusMode();
            prompt.remove();
        });

        document.getElementById('pudding-chunk').addEventListener('click', () => {
            this.chunkArticle();
            prompt.remove();
        });

        document.getElementById('pudding-dismiss').addEventListener('click', () => {
            prompt.remove();
        });
    }

    activateUltraFocusMode() {
        if (window.focusMode) {
            window.focusMode.activate();
        }
        // Also enable reading beam
        if (window.readingBeam) {
            window.readingBeam.activate();
        }
    }

    chunkArticle() {
        const mainContent = document.querySelector('main, article, .content, #content');
        if (!mainContent) return;

        const paragraphs = mainContent.querySelectorAll('p');
        paragraphs.forEach((p, idx) => {
            p.setAttribute('data-chunk', Math.floor(idx / 3));
            p.style.marginBottom = idx % 3 === 2 ? '30px' : '10px';
        });
    }
}

window.fatigueDetector = new FatigueDetector();
window.fatigueDetector.init();
