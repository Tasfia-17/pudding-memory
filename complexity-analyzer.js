// Complexity Analyzer - Semantic difficulty mapping
class ComplexityAnalyzer {
    constructor() {
        this.complexityCache = new Map();
    }

    analyzeParagraph(text) {
        if (this.complexityCache.has(text)) {
            return this.complexityCache.get(text);
        }

        const score = this.calculateComplexity(text);
        this.complexityCache.set(text, score);
        return score;
    }

    calculateComplexity(text) {
        const words = text.split(/\s+/);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        // Metrics
        const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
        const avgSentenceLength = words.length / sentences.length;
        const longWords = words.filter(w => w.length > 8).length / words.length;
        const jargonDensity = this.detectJargon(words);
        const abstractness = this.detectAbstractness(text);
        
        // Weighted score (0-100)
        const score = Math.min(100, 
            (avgWordLength * 5) +
            (avgSentenceLength * 2) +
            (longWords * 50) +
            (jargonDensity * 30) +
            (abstractness * 20)
        );
        
        return Math.round(score);
    }

    detectJargon(words) {
        const jargonPatterns = [
            /tion$/, /ment$/, /ness$/, /ity$/, /ism$/,
            /logical$/, /ological$/, /ization$/
        ];
        
        let jargonCount = 0;
        words.forEach(word => {
            if (jargonPatterns.some(pattern => pattern.test(word))) {
                jargonCount++;
            }
        });
        
        return jargonCount / words.length;
    }

    detectAbstractness(text) {
        const abstractWords = [
            'concept', 'theory', 'abstract', 'paradigm', 'framework',
            'methodology', 'hypothesis', 'principle', 'notion', 'ideology'
        ];
        
        const lowerText = text.toLowerCase();
        let count = 0;
        abstractWords.forEach(word => {
            if (lowerText.includes(word)) count++;
        });
        
        return Math.min(1, count / 10);
    }

    getComplexityLevel(score) {
        if (score < 30) return 'easy';
        if (score < 60) return 'moderate';
        return 'hard';
    }

    getComplexityColor(score) {
        if (score < 30) return '#4caf50'; // Green
        if (score < 60) return '#ff9800'; // Orange
        return '#f44336'; // Red
    }

    highlightComplexity(element) {
        const paragraphs = element.querySelectorAll('p, li');
        
        paragraphs.forEach(p => {
            const text = p.textContent;
            if (text.length < 20) return;
            
            const score = this.analyzeParagraph(text);
            const level = this.getComplexityLevel(score);
            const color = this.getComplexityColor(score);
            
            // Add complexity indicator
            if (score > 40) {
                const indicator = document.createElement('span');
                indicator.className = 'pudding-complexity-badge';
                indicator.textContent = `${score}`;
                indicator.style.cssText = `
                    display: inline-block;
                    background: ${color};
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: bold;
                    margin-left: 8px;
                    cursor: help;
                    vertical-align: super;
                `;
                indicator.title = `Complexity: ${level} (${score}/100)`;
                
                p.style.position = 'relative';
                p.insertBefore(indicator, p.firstChild);
                
                // Add click to simplify
                indicator.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.simplifyParagraph(p);
                });
            }
        });
    }

    simplifyParagraph(paragraph) {
        // Trigger simplification for this specific paragraph
        const event = new CustomEvent('puddingSimplifyParagraph', {
            detail: { element: paragraph }
        });
        document.dispatchEvent(event);
    }

    createHeatmap(container) {
        const paragraphs = container.querySelectorAll('p');
        const heatmapData = [];
        
        paragraphs.forEach(p => {
            const score = this.analyzeParagraph(p.textContent);
            heatmapData.push({ element: p, score });
            
            // Apply background gradient based on complexity
            const opacity = Math.min(0.3, score / 200);
            const color = this.getComplexityColor(score);
            p.style.background = `linear-gradient(to right, ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}, transparent)`;
            p.style.padding = '8px';
            p.style.borderRadius = '4px';
            p.style.transition = 'all 0.3s ease';
        });
        
        return heatmapData;
    }
}

window.complexityAnalyzer = new ComplexityAnalyzer();
