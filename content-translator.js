// Content translation with caching
class ContentTranslator {
  constructor() {
    this.cache = new Map();
    this.apiUrl = 'https://translate.googleapis.com/translate_a/single';
  }

  async translate(text, targetLang) {
    const cacheKey = `${text}_${targetLang}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const url = `${this.apiUrl}?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const response = await fetch(url);
      const data = await response.json();
      const translated = data[0].map(item => item[0]).join('');
      
      this.cache.set(cacheKey, translated);
      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  async translatePage(targetLang) {
    if (targetLang === 'en') return;

    const selectors = 'p, h1, h2, h3, h4, h5, h6, li, td, th, span.text, div.content';
    const elements = document.querySelectorAll(selectors);
    
    for (const el of elements) {
      if (el.children.length === 0 && el.textContent.trim().length > 0) {
        const original = el.textContent.trim();
        if (original.length > 3) {
          const translated = await this.translate(original, targetLang);
          el.textContent = translated;
          el.setAttribute('data-original', original);
        }
      }
    }
  }

  restoreOriginal() {
    const elements = document.querySelectorAll('[data-original]');
    elements.forEach(el => {
      el.textContent = el.getAttribute('data-original');
      el.removeAttribute('data-original');
    });
  }
}

const contentTranslator = new ContentTranslator();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = contentTranslator;
}
