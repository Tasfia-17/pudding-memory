// Content Restructurer - Smart structural adaptation
class ContentRestructurer {
    constructor() {
        this.restructuredElements = new Set();
    }

    restructureContent(container) {
        this.convertDenseParagraphs(container);
        this.addCollapsibleSections(container);
        this.highlightKeyEntities(container);
        this.addInlineSummaries(container);
    }

    convertDenseParagraphs(container) {
        const paragraphs = container.querySelectorAll('p');
        
        paragraphs.forEach(p => {
            const text = p.textContent;
            const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
            
            // If paragraph has 5+ sentences, convert to list
            if (sentences.length >= 5 && text.length > 400) {
                const list = document.createElement('ul');
                list.className = 'pudding-restructured-list';
                list.style.cssText = `
                    background: rgba(255, 255, 255, 0.5);
                    padding: 15px 15px 15px 35px;
                    border-radius: 8px;
                    border-left: 4px solid #d4845c;
                    margin: 10px 0;
                `;
                
                sentences.forEach(sentence => {
                    if (sentence.trim().length > 10) {
                        const li = document.createElement('li');
                        li.textContent = sentence.trim() + '.';
                        li.style.marginBottom = '8px';
                        list.appendChild(li);
                    }
                });
                
                p.replaceWith(list);
                this.restructuredElements.add(list);
            }
        });
    }

    addCollapsibleSections(container) {
        const headings = container.querySelectorAll('h2, h3');
        
        headings.forEach(heading => {
            const section = this.getSectionContent(heading);
            if (!section || section.length === 0) return;
            
            const wrapper = document.createElement('details');
            wrapper.className = 'pudding-collapsible-section';
            wrapper.open = true;
            wrapper.style.cssText = `
                background: rgba(255, 255, 255, 0.3);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.5);
                border-radius: 12px;
                padding: 15px;
                margin: 15px 0;
            `;
            
            const summary = document.createElement('summary');
            summary.textContent = heading.textContent;
            summary.style.cssText = `
                cursor: pointer;
                font-weight: 600;
                color: #2c1810;
                padding: 5px;
                border-radius: 6px;
                transition: all 0.2s;
            `;
            summary.addEventListener('mouseenter', () => {
                summary.style.background = 'rgba(212, 132, 92, 0.2)';
            });
            summary.addEventListener('mouseleave', () => {
                summary.style.background = 'transparent';
            });
            
            wrapper.appendChild(summary);
            
            const content = document.createElement('div');
            content.style.marginTop = '10px';
            section.forEach(el => content.appendChild(el.cloneNode(true)));
            wrapper.appendChild(content);
            
            heading.replaceWith(wrapper);
            section.forEach(el => el.remove());
            
            this.restructuredElements.add(wrapper);
        });
    }

    getSectionContent(heading) {
        const content = [];
        let next = heading.nextElementSibling;
        
        while (next && !['H1', 'H2', 'H3'].includes(next.tagName)) {
            content.push(next);
            next = next.nextElementSibling;
        }
        
        return content;
    }

    highlightKeyEntities(container) {
        const paragraphs = container.querySelectorAll('p, li');
        
        paragraphs.forEach(p => {
            let html = p.innerHTML;
            
            // Highlight numbers and statistics
            html = html.replace(/\b(\d+(?:,\d{3})*(?:\.\d+)?%?)\b/g, 
                '<span style="background: rgba(212, 132, 92, 0.2); padding: 2px 4px; border-radius: 3px; font-weight: 600;">$1</span>');
            
            // Highlight quoted text
            html = html.replace(/"([^"]+)"/g, 
                '<span style="background: rgba(255, 235, 205, 0.5); padding: 2px 4px; border-radius: 3px; font-style: italic;">"$1"</span>');
            
            p.innerHTML = html;
        });
    }

    addInlineSummaries(container) {
        const longParagraphs = Array.from(container.querySelectorAll('p'))
            .filter(p => p.textContent.length > 300);
        
        longParagraphs.forEach(p => {
            const summary = this.generateQuickSummary(p.textContent);
            
            const summaryBox = document.createElement('div');
            summaryBox.className = 'pudding-inline-summary';
            summaryBox.innerHTML = `
                <div style="
                    background: linear-gradient(135deg, #d4845c 0%, #b86f4d 100%);
                    color: white;
                    padding: 10px 15px;
                    border-radius: 8px;
                    margin: 10px 0;
                    font-size: 14px;
                    box-shadow: 0 2px 8px rgba(212, 132, 92, 0.3);
                ">
                    <strong>📌 Key Point:</strong> ${summary}
                </div>
            `;
            
            p.parentNode.insertBefore(summaryBox, p);
            this.restructuredElements.add(summaryBox);
        });
    }

    generateQuickSummary(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        // Return first sentence as summary
        return sentences[0].trim() + '.';
    }

    addWhyThisMatters(container) {
        const sections = container.querySelectorAll('section, article');
        
        sections.forEach(section => {
            const insight = document.createElement('div');
            insight.className = 'pudding-why-matters';
            insight.innerHTML = `
                <div style="
                    background: rgba(255, 255, 255, 0.4);
                    backdrop-filter: blur(10px);
                    border-left: 4px solid #d4845c;
                    padding: 12px 15px;
                    margin: 15px 0;
                    border-radius: 8px;
                ">
                    <strong style="color: #d4845c;">💡 Why this matters:</strong>
                    <span style="color: #2c1810; margin-left: 8px;">This section helps you understand the core concept.</span>
                </div>
            `;
            
            section.insertBefore(insight, section.firstChild);
        });
    }

    reset() {
        this.restructuredElements.forEach(el => {
            if (el.parentNode) el.remove();
        });
        this.restructuredElements.clear();
    }
}

window.contentRestructurer = new ContentRestructurer();
