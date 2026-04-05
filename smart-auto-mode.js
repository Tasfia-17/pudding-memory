// Smart Auto-Mode - Detects article difficulty and adjusts automatically
class SmartAutoMode {
    constructor() {
        this.isActive = false;
        this.articleDifficulty = 0;
        this.checkInterval = null;
    }

    activate() {
        this.isActive = true;
        this.analyzeArticle();
        this.checkInterval = setInterval(() => this.adjustInRealTime(), 5000);
    }

    deactivate() {
        this.isActive = false;
        if (this.checkInterval) clearInterval(this.checkInterval);
    }

    analyzeArticle() {
        const mainContent = this.getMainContent();
        if (!mainContent) return;

        const text = mainContent.textContent;
        const paragraphs = mainContent.querySelectorAll('p');
        
        // Calculate difficulty metrics
        const avgWordLength = this.getAverageWordLength(text);
        const avgSentenceLength = this.getAverageSentenceLength(text);
        const paragraphDensity = this.getParagraphDensity(paragraphs);
        const jargonLevel = this.getJargonLevel(text);
        
        // Weighted difficulty score (0-100)
        this.articleDifficulty = Math.min(100,
            (avgWordLength * 8) +
            (avgSentenceLength * 1.5) +
            (paragraphDensity * 20) +
            (jargonLevel * 30)
        );

        console.log('Article difficulty:', this.articleDifficulty);
        this.applyAutoAdjustments();
    }

    applyAutoAdjustments() {
        // Auto-select simplification level
        let level = 3; // Default mid
        if (this.articleDifficulty > 70) level = 5; // High
        else if (this.articleDifficulty < 40) level = 1; // Low
        
        chrome.storage.sync.set({ simplificationLevel: level.toString() });

        // Auto-adjust spacing for dense text
        if (this.articleDifficulty > 60) {
            this.increaseSpacing();
        }
    }

    adjustInRealTime() {
        if (!this.isActive) return;
        
        const tracker = window.cognitiveTracker;
        if (!tracker) return;

        // Check if user is struggling
        const rereadCount = Array.from(tracker.readingData.rereads.values()).reduce((a, b) => a + b, 0);
        const avgPause = tracker.readingData.pauseDurations.slice(-5).reduce((a, b) => a + b, 0) / 5;

        if (rereadCount > 3 || avgPause > 5000) {
            // User struggling - increase simplification
            this.articleDifficulty = Math.min(100, this.articleDifficulty + 10);
            this.applyAutoAdjustments();
        }
    }

    increaseSpacing() {
        const mainContent = this.getMainContent();
        if (!mainContent) return;

        mainContent.style.lineHeight = '2.2';
        mainContent.style.letterSpacing = '0.5px';
        mainContent.style.wordSpacing = '2px';
    }

    getMainContent() {
        return document.querySelector('main, article, .content, #content');
    }

    getAverageWordLength(text) {
        const words = text.split(/\s+/).filter(w => w.length > 0);
        return words.reduce((sum, w) => sum + w.length, 0) / words.length;
    }

    getAverageSentenceLength(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = text.split(/\s+/).filter(w => w.length > 0);
        return words.length / sentences.length;
    }

    getParagraphDensity(paragraphs) {
        let totalDensity = 0;
        paragraphs.forEach(p => {
            const lines = p.offsetHeight / 20; // Approximate lines
            if (lines > 10) totalDensity += 1;
        });
        return totalDensity / paragraphs.length;
    }

    getJargonLevel(text) {
        const jargonPatterns = [
            /\w{12,}/g, // Very long words
            /tion\b/gi, /ment\b/gi, /ness\b/gi, /ity\b/gi,
            /methodology|paradigm|framework|infrastructure/gi
        ];
        
        let jargonCount = 0;
        jargonPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) jargonCount += matches.length;
        });
        
        const words = text.split(/\s+/).length;
        return jargonCount / words;
    }
}

window.smartAutoMode = new SmartAutoMode();
