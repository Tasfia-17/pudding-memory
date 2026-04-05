// Cognitive Adaptation Engine - Tracks reading behavior and adapts content
class CognitiveTracker {
    constructor() {
        this.readingData = {
            scrollSpeed: [],
            pauseDurations: [],
            rereads: new Map(),
            abandonedSections: new Set(),
            readingTime: 0,
            lastScrollPos: 0,
            lastScrollTime: Date.now()
        };
        this.init();
    }

    init() {
        this.loadData();
        this.trackScrollBehavior();
        this.trackReadingPatterns();
        this.trackMousePauses();
    }

    loadData() {
        const stored = localStorage.getItem('puddingCognitiveData');
        if (stored) {
            this.readingData = { ...this.readingData, ...JSON.parse(stored) };
        }
    }

    saveData() {
        localStorage.setItem('puddingCognitiveData', JSON.stringify({
            scrollSpeed: this.readingData.scrollSpeed.slice(-50),
            pauseDurations: this.readingData.pauseDurations.slice(-50),
            readingTime: this.readingData.readingTime
        }));
    }

    trackScrollBehavior() {
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            const now = Date.now();
            const currentPos = window.scrollY;
            const timeDiff = now - this.readingData.lastScrollTime;
            const scrollDiff = Math.abs(currentPos - this.readingData.lastScrollPos);
            
            if (timeDiff > 0) {
                const speed = scrollDiff / timeDiff;
                this.readingData.scrollSpeed.push(speed);
                
                // Detect reread (scrolling back up)
                if (currentPos < this.readingData.lastScrollPos) {
                    const section = this.getCurrentSection();
                    if (section) {
                        const count = this.readingData.rereads.get(section) || 0;
                        this.readingData.rereads.set(section, count + 1);
                    }
                }
            }
            
            this.readingData.lastScrollPos = currentPos;
            this.readingData.lastScrollTime = now;
            
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => this.saveData(), 1000);
        }, { passive: true });
    }

    trackReadingPatterns() {
        let pauseStart = Date.now();
        let isReading = true;

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                const pauseDuration = Date.now() - pauseStart;
                this.readingData.pauseDurations.push(pauseDuration);
                isReading = false;
            } else {
                pauseStart = Date.now();
                isReading = true;
            }
        });

        setInterval(() => {
            if (isReading) {
                this.readingData.readingTime += 1;
            }
        }, 1000);
    }

    trackMousePauses() {
        let lastMove = Date.now();
        let pauseTimeout;

        document.addEventListener('mousemove', () => {
            lastMove = Date.now();
            clearTimeout(pauseTimeout);
            
            pauseTimeout = setTimeout(() => {
                const pauseDuration = Date.now() - lastMove;
                if (pauseDuration > 3000) {
                    this.readingData.pauseDurations.push(pauseDuration);
                }
            }, 3000);
        }, { passive: true });
    }

    getCurrentSection() {
        const elements = document.querySelectorAll('p, h1, h2, h3, article');
        for (let el of elements) {
            const rect = el.getBoundingClientRect();
            if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
                return el.textContent.substring(0, 50);
            }
        }
        return null;
    }

    getAdaptationLevel() {
        const avgScrollSpeed = this.readingData.scrollSpeed.slice(-10).reduce((a, b) => a + b, 0) / 10;
        const rereadCount = Array.from(this.readingData.rereads.values()).reduce((a, b) => a + b, 0);
        const avgPause = this.readingData.pauseDurations.slice(-10).reduce((a, b) => a + b, 0) / 10;

        let level = 3; // Default mid
        
        if (rereadCount > 5 || avgPause > 5000) level = 5; // High simplification
        else if (avgScrollSpeed > 2 || avgPause < 2000) level = 1; // Low simplification
        
        return level;
    }

    shouldBreakIntoBullets() {
        const avgScrollSpeed = this.readingData.scrollSpeed.slice(-5).reduce((a, b) => a + b, 0) / 5;
        return avgScrollSpeed > 2; // Fast scrolling = needs bullets
    }

    shouldAddSubheadings() {
        const avgPause = this.readingData.pauseDurations.slice(-5).reduce((a, b) => a + b, 0) / 5;
        return avgPause > 4000; // Long pauses = needs structure
    }
}

// Initialize tracker
if (typeof window !== 'undefined') {
    window.cognitiveTracker = new CognitiveTracker();
}
