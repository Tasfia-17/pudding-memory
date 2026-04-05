let promptSession = null;
let systemPrompt = null; // Store systemPrompt globally

// Theme definitions
const themes = {
    default: {
        backgroundColor: '',
        textColor: '',
    },
    highContrast: {
        backgroundColor: '#FFFFFF',
        textColor: '#000000',
    },
    highContrastAlt: {
        backgroundColor: '#000000',
        textColor: '#FFFFFF',
    },
    darkMode: {
        backgroundColor: '#121212',
        textColor: '#E0E0E0',
    },
    sepia: {
        backgroundColor: '#F5E9D5',
        textColor: '#5B4636',
    },
    lowBlueLight: {
        backgroundColor: '#FFF8E1',
        textColor: '#2E2E2E',
    },
    softPastelBlue: {
        backgroundColor: '#E3F2FD',
        textColor: '#0D47A1',
    },
    softPastelGreen: {
        backgroundColor: '#F1FFF0',
        textColor: '#00695C',
    },
    creamPaper: {
        backgroundColor: '#FFFFF0',
        textColor: '#333333',
    },
    grayScale: {
        backgroundColor: '#F5F5F5',
        textColor: '#424242',
    },
    blueLightFilter: {
        backgroundColor: '#FFF3E0',
        textColor: '#4E342E',
    },
    highContrastYellowBlack: {
        backgroundColor: '#000000',
        textColor: '#FFFF00',
    },
    highContrastBlackYellow: {
        backgroundColor: '#FFFF00',
        textColor: '#000000',
    },
};

// Initialize the AI capabilities
async function getReadingLevel() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['readingLevel', 'simplificationLevel'], function(result) {
            // First try to get the explicitly set simplification level
            if (result.simplificationLevel) {
                console.log('Using explicit simplification level:', result.simplificationLevel);
                resolve(result.simplificationLevel.toString());
                return;
            }
            
            // Fall back to reading level or default
            let level = result.readingLevel ? 
                result.readingLevel.toString() : 
                (typeof simplificationLevelsConfig !== 'undefined' && 
                 simplificationLevelsConfig.levels === 3 ? '3' : '3');
                 
            console.log('Retrieved reading level:', level);
            resolve(level);
        });
    });
}

async function initAICapabilities() {
    // Using Gemini API instead of window.ai (works in all Chrome versions)
    const systemPrompts = await loadSystemPrompts();
    if (!systemPrompts) throw new Error('Failed to load system prompts.');

    const readingLevel = await getReadingLevel();
    const optimizeFor = await new Promise(resolve =>
        chrome.storage.sync.get(['optimizeFor'], r => resolve(r.optimizeFor || 'textClarity'))
    );

    systemPrompt = systemPrompts[optimizeFor][readingLevel];
    if (!systemPrompt) throw new Error('System prompt undefined.');

    // promptSession is a thin wrapper so the rest of the code stays unchanged
    promptSession = {
        promptStreaming: async function*(text) {
            const storage = await new Promise(r => chrome.storage.sync.get(['geminiApiKey'], r));
            const key = storage.geminiApiKey || '';
            if (!key) { yield 'Error: No Gemini API key set. Add it in the extension options page.'; return; }
            let data;
            try {
                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: systemPrompt + '\n\n' + text }] }]
                        })
                    }
                );
                data = await res.json();
            } catch(e) {
                console.error('Gemini fetch error:', e);
                yield '';
                return;
            }
            if (data.error) {
                const msg = data.error.message || '';
                console.error('Gemini API error:', msg);
                if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
                    yield 'Error: Gemini API quota exceeded. Please wait or upgrade your plan.';
                    return;
                }
                yield ''; return;
            }
            yield data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
    };

    return { promptSession };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Handle message asynchronously but keep connection open
    (async () => {
        console.log("Received action:", request.action);
        
        if (request.action === "translatePage") {
            try {
                await contentTranslator.translatePage(request.targetLang);
                sendResponse({success: true});
            } catch (error) {
                console.error('Translation error:', error);
                sendResponse({success: false, error: error.message});
            }
            return;
        }
        
        switch (request.action) {
            case "simplify":
                try {
                    await ensureInitialized();
                    if (!promptSession) {
                        console.error('Prompt API not available - cannot simplify text');
                        sendResponse({success: false, error: 'Prompt API not available'});
                        return;
                    }

                console.log('Finding main content element...');
                
                console.log('Prompt API status:', promptSession ? 'initialized' : 'not initialized');
                
                // Try to find the main content using various selectors, including Straits Times specific ones
                const mainContent = document.querySelector([
                    'main',
                    'article',
                    '.content',
                    '.post',
                    '#content',
                    '#main',
                    'div[role="main"]',
                    '.article-content',
                    '.article-body',
                    '.story-body',
                    '.article-text',
                    '.story-content',
                    '[itemprop="articleBody"]',
                    // Straits Times specific selectors
                    '.paid-premium-content',
                    '.str-story-body',
                    '.str-article-content',
                    '#story-body',
                    '.story-content'
                ].join(', '));

                // Log the found element and its hierarchy
                if (mainContent) {
                    console.log('Main content element details:', {
                        element: mainContent,
                        path: getElementPath(mainContent),
                        parentClasses: mainContent.parentElement?.className,
                        childElements: Array.from(mainContent.children).map(child => ({
                            tag: child.tagName,
                            class: child.className,
                            id: child.id
                        }))
                    });
                }

                // Helper function to get element's DOM path
                function getElementPath(element) {
                    const path = [];
                    while (element && element.nodeType === Node.ELEMENT_NODE) {
                        let selector = element.nodeName.toLowerCase();
                        if (element.id) {
                            selector += '#' + element.id;
                        } else if (element.className) {
                            selector += '.' + Array.from(element.classList).join('.');
                        }
                        path.unshift(selector);
                        element = element.parentNode;
                    }
                    return path.join(' > ');
                }
                
                if (!mainContent) {
                    console.error('Could not find main content element');
                    return;
                }

                // Restore original content if previously simplified
                const previouslySimplifiedElements = mainContent.querySelectorAll('[data-original-html]');
                previouslySimplifiedElements.forEach(el => {
                    const originalHTML = el.getAttribute('data-original-html');
                    // Create a temporary container to parse the original HTML
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = originalHTML;
                    const originalElement = tempDiv.firstChild;
                    // Replace the simplified element with the original element
                    el.parentNode.replaceChild(originalElement, el);
                });

                console.log('Found main content element:', {
                    tagName: mainContent.tagName,
                    className: mainContent.className,
                    id: mainContent.id
                });

                // Helper function to check if element is a header
                const isHeader = (element) => {
                    return element.tagName.match(/^H[1-6]$/i);
                };

                // Helper function to estimate token count (rough approximation)
                const estimateTokens = (text) => {
                    return text.split(/\s+/).length * 1.3; // Multiply by 1.3 as a safety factor
                };

                // Get all content elements (paragraphs, headers, and lists)
                // More detailed logging of the main content element
                console.log('Main content structure:', {
                    innerHTML: mainContent.innerHTML.substring(0, 200) + '...',
                    childNodes: mainContent.childNodes.length,
                    children: mainContent.children.length
                });

                // Try to find article content with more specific selectors
                const contentElements = Array.from(mainContent.querySelectorAll([
                    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'dl',
                    '.article-content p',
                    '.article-body p',
                    '.story-body p',
                    '.article-text p',
                    '.story-content p',
                    '[itemprop="articleBody"] p',
                    '.article p',
                    '.story p'
                ].join(', ')))
                .filter(el => {
                    if (isHeader(el)) return true;
                    
                    // Skip elements that are likely metadata
                    const isMetadata = 
                        el.closest('.author, .meta, .claps, .likes, .stats, .profile, .bio, header, footer, .premium-box') ||
                        (el.tagName !== 'UL' && el.tagName !== 'OL' && el.tagName !== 'DL' && el.textContent.trim().length < 50) ||
                        /^(By|Published|Updated|Written by|(\d+) min read|(\d+) claps)/i.test(el.textContent.trim());
                    
                    const hasContent = el.textContent.trim().length > 0;
                    
                    // Log skipped elements for debugging
                    if (isMetadata || !hasContent) {
                        console.log('Skipping element:', {
                            type: el.tagName,
                            class: el.className,
                            text: el.textContent.substring(0, 50) + '...',
                            reason: isMetadata ? 'metadata' : 'no content'
                        });
                    }
                    
                    // Include if it's not metadata and either a list or paragraph/header
                    return !isMetadata && hasContent;
                });

                console.log(`Found ${contentElements.length} content elements to process`);

                // Helper function to check if element is a list
                const isList = (element) => {
                    return ['UL', 'OL', 'DL'].includes(element.tagName);
                };

                // Group elements into chunks
                const chunks = [];
                let currentChunk = [];
                let currentTokenCount = 0;
                const MAX_TOKENS = 800; // Leave room for prompt text and response

                for (let i = 0; i < contentElements.length; i++) {
                    const element = contentElements[i];

                    // If we hit a header, list, or the chunk is getting too big, start a new chunk
                    if (isHeader(element) || isList(element) ||
                        (currentChunk.length > 0 && 
                         (currentTokenCount + estimateTokens(element.textContent) > MAX_TOKENS))) {
                        
                        if (currentChunk.length > 0) {
                            chunks.push(currentChunk);
                        }
                        currentChunk = [element];
                        currentTokenCount = estimateTokens(element.textContent);
                    } else {
                        currentChunk.push(element);
                        currentTokenCount += estimateTokens(element.textContent);
                    }
                }
                
                // Add the last chunk if it exists
                if (currentChunk.length > 0) {
                    chunks.push(currentChunk);
                }

                console.log(`Grouped content into ${chunks.length} chunks`);

                // Process each chunk
                for (let chunk of chunks) {
                    // Log full chunk details before processing
                    console.log('Processing chunk:', {
                        elements: chunk.length,
                        types: chunk.map(el => el.tagName).join(', '),
                        isHeaderOnly: chunk.length === 1 && isHeader(chunk[0])
                    });

                    // Skip chunks that only contain headers
                    if (chunk.length === 1 && isHeader(chunk[0])) {
                        console.log('Skipping header-only chunk');
                        continue;
                    }

                    // Combine paragraph texts in the chunk
                    const chunkText = chunk
                        .filter(el => !isHeader(el))
                        .map(el => el.textContent)
                        .join('\n\n');

                    try {
                        console.log('Attempting to simplify chunk:', {
                            fullText: chunkText,
                            length: chunkText.length,
                            paragraphs: chunkText.split('\n\n').length
                        });
                        
                        // First attempt with original text
                        // Log the exact prompt being sent
                        console.log('Sending prompt to API:', {
                            text: chunkText,
                            length: chunkText.length,
                            wordCount: chunkText.split(/\s+/).length
                        });
                        
                        // Send the chunkText as the prompt with retries
                        let simplifiedText = '';
                        let attempts = 0;
                        const maxAttempts = 3; // Gemini API is reliable, no need for 20 retries
                        
                        while (attempts < maxAttempts) {
                            try {
                                logPrompt(chunkText);
                                const stream = await promptSession.promptStreaming(chunkText);
                                for await (const chunk of stream) {
                                    simplifiedText = chunk.trim();
                                }
                                if (simplifiedText && simplifiedText.trim().length > 0) {
                                    if (simplifiedText.startsWith('Error:')) {
                                        console.error(simplifiedText);
                                        simplifiedText = '';
                                        attempts = maxAttempts; // stop retrying
                                    }
                                    break;
                                }
                                console.warn(`Empty response on attempt ${attempts + 1}`);
                            } catch (error) {
                                // Stop immediately if extension context is gone
                                if (error.message && error.message.includes('Extension context invalidated')) {
                                    console.warn('Extension was reloaded — stopping simplification.');
                                    return;
                                }
                                console.warn(`API error on attempt ${attempts + 1}:`, error);
                                if (attempts === maxAttempts - 1) throw error;
                            }
                            attempts++;
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }

                        if (!simplifiedText || simplifiedText.trim().length === 0) {
                            console.warn('Failed to get valid response after all attempts - keeping original text');
                            continue;
                        }

                        // Split simplified text back into paragraphs and ensure we have the right number
                        const simplifiedParagraphs = simplifiedText.split('\n\n');
                        const originalParagraphs = chunk.filter(el => !isHeader(el));

                        console.log('Paragraph replacement:', {
                            originalCount: originalParagraphs.length,
                            simplifiedCount: simplifiedParagraphs.length,
                            originalTexts: originalParagraphs.map(p => p.textContent.substring(0, 50) + '...'),
                            simplifiedTexts: simplifiedParagraphs.map(p => p.substring(0, 50) + '...')
                        });

                        // Handle paragraph count mismatch
                        if (simplifiedParagraphs.length !== originalParagraphs.length) {
                            console.log(`Mismatch in paragraph counts: original=${originalParagraphs.length}, simplified=${simplifiedParagraphs.length}`);
                            
                            // If we got more simplified paragraphs than original, trim the excess
                            if (simplifiedParagraphs.length > originalParagraphs.length) {
                                simplifiedParagraphs.length = originalParagraphs.length;
                            }
                            // If we got fewer simplified paragraphs, remove extra original paragraphs
                            if (simplifiedParagraphs.length < originalParagraphs.length) {
                                // Remove the extra original paragraphs from the DOM
                                for (let i = simplifiedParagraphs.length; i < originalParagraphs.length; i++) {
                                    originalParagraphs[i].remove();
                                }
                                // Update the array to match simplified length
                                originalParagraphs.length = simplifiedParagraphs.length;
                            }
                        }

                        // Replace remaining original paragraphs with simplified versions
                        originalParagraphs.forEach((p, index) => {
                            let newElement;
                            if (isList(p)) {
                                // Create the same type of list
                                newElement = document.createElement(p.tagName);
                                
                                // Get original list items for comparison
                                const originalItems = Array.from(p.children);
                                
                                // Split the simplified text into list items
                                const items = simplifiedParagraphs[index].split('\n').filter(item => item.trim());
                                
                                // Create new list items
                                items.forEach((item, idx) => {
                                    const li = document.createElement(p.tagName === 'DL' ? 'dt' : 'li');
                                    li.textContent = item.replace(/^[•\-*]\s*/, ''); // Remove bullet points if present
                                    
                                    // Preserve any nested lists from original
                                    if (originalItems[idx]) {
                                        const nestedLists = originalItems[idx].querySelectorAll('ul, ol, dl');
                                        nestedLists.forEach(nested => {
                                            li.appendChild(nested.cloneNode(true));
                                        });
                                    }
                                    
                                    newElement.appendChild(li);
                                });
                            } else {
                                // Handle regular paragraphs
                                newElement = document.createElement('p');
                                // Use marked to parse markdown, falling back to plain text if marked is not available
                                newElement.innerHTML = (typeof marked !== 'undefined' && typeof marked.parse === 'function') ? 
                                    marked.parse(simplifiedParagraphs[index], {
                                        breaks: true,
                                        gfm: true,
                                        headerIds: false,
                                        mangle: false
                                    }) : 
                                    simplifiedParagraphs[index];
                            }
                            
                            // Add styles for simplified text
                            const simplifiedStyles = document.createElement('style');
                            simplifiedStyles.textContent = `
                                .simplified-text {
                                    padding-left: 5px;
                                    padding-right: 5px;
                                    margin: 10px 0;
                                    line-height: 1.6;
                                    font-weight: 400;
                                }
                                .original-text-tooltip {
                                    position: absolute;
                                    max-width: 400px;
                                    background-color: rgba(0, 0, 0, 0.8);
                                    color: white;
                                    padding: 10px;
                                    border-radius: 5px;
                                    font-size: 14px;
                                    line-height: 1.4;
                                    z-index: 10000;
                                    pointer-events: none;
                                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                                }
                                .simplified-text ul, .simplified-text ol {
                                    margin-left: 20px;
                                }
                                .simplified-text code {
                                    background: #f8f8f8;
                                    padding: 2px 4px;
                                    border-radius: 3px;
                                }
                                .simplified-text blockquote {
                                    border-left: 2px solid #ddd;
                                    margin-left: 0;
                                    padding-left: 10px;
                                    color: #666;
                                }
                            `;
                            document.head.appendChild(simplifiedStyles);
                            newElement.classList.add('simplified-text');
                            // Store the original HTML content if it's not already stored
                            if (!p.hasAttribute('data-original-html')) {
                                newElement.setAttribute('data-original-html', p.outerHTML);
                            } else {
                                // Preserve the original HTML attribute
                                newElement.setAttribute('data-original-html', p.getAttribute('data-original-html'));
                            }
                            // Keep original text for hover functionality
                            newElement.setAttribute('data-original-text', p.textContent);
                            p.parentNode.replaceChild(newElement, p);
                            
                            // Store reference to simplified elements
                            simplifiedElements = simplifiedElements.filter(el => el !== p);
                            simplifiedElements.push(newElement);

                            // Add hover event listeners if enabled
                            if (hoverEnabled) {
                                newElement.addEventListener('mouseenter', showOriginalText);
                                newElement.addEventListener('mouseleave', hideOriginalText);
                            }
                            
                            console.log(`Replaced paragraph ${index + 1}/${originalParagraphs.length}:`, {
                                original: p.textContent.substring(0, 50) + '...',
                                simplified: newElement.textContent.substring(0, 50) + '...'
                            });

                            // Check if OpenDyslexic is enabled and apply it
                            chrome.storage.sync.get('useOpenDyslexic', function(result) {
                                if (result.useOpenDyslexic) {
                                    applyOpenDyslexicFont();
                                } else {
                                    removeOpenDyslexicFont();
                                }
                            });
                        });
                        console.log('Successfully replaced paragraph with simplified version');
                    } catch (error) {
                            console.error('Error simplifying paragraph:', error, {
                                text: chunkText.substring(0, 100) + '...'
                            });
                        }
                    }

                    // Add visual feedback
                    const notification = document.createElement('div');
                    notification.textContent = 'Text simplified';
                    notification.style.position = 'fixed';
                    notification.style.top = '20px';
                    notification.style.left = '50%';
                    notification.style.transform = 'translateX(-50%)';
                    notification.style.backgroundColor = '#3498db';
                    notification.style.color = 'white';
                    notification.style.padding = '10px 20px';
                    notification.style.borderRadius = '5px';
                    notification.style.zIndex = '10000';
                    document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 3000);
                    
                    // Only send success response after everything is complete
                    sendResponse({success: true});
                } catch (error) {
                    console.error('Error simplifying content:', error);
                    sendResponse({success: false, error: error.message});
                }
                break;
                
                
            case "toggleFont":
                console.log("Toggling OpenDyslexic font...");
                fontEnabled = request.enabled;
                toggleOpenDyslexicFont(fontEnabled);
                break;
                
            case "applyTheme":
                console.log("Applying theme:", request.theme);
                applyTheme(request.theme);
                sendResponse({ success: true });
                break;
                
            case "getFontState":
                sendResponse({ fontEnabled: fontEnabled });
                break;
                
            case "adjustSpacing":
                const { lineSpacing, letterSpacing, wordSpacing } = request;
                applySpacingAdjustments(lineSpacing, letterSpacing, wordSpacing);
                sendResponse({ success: true });
                break;
                
            case "toggleHover":
                console.log("Toggling hover to show original text...");
                hoverEnabled = request.enabled;
                if (hoverEnabled) {
                    enableHoverFeature();
                } else {
                    disableHoverFeature();
                }
                break;

            case "getHoverState":
                sendResponse({ hoverEnabled: hoverEnabled });
                break;
        }
        sendResponse({success: true});
    })();
    return true; // Keep the message channel open for async response
});


// Logging function for prompts
function logPrompt(userPrompt) {
    if (!systemPrompt) {
        console.error('System Prompt is undefined.');
    } else {
        console.log('System Prompt:', systemPrompt);
    }
    console.log('User Prompt:', userPrompt.substring(0, 200) + (userPrompt.length > 200 ? '...' : ''));
}

// Load system prompts from background script
async function loadSystemPrompts() {
    console.log('Attempting to load system prompts from background script');
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'getSystemPrompts' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error sending message to background script:', chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
            } else {
                console.log('Received response from background script:', response);
                if (response && response.success) {
                    console.log('Successfully loaded system prompts:', response.prompts);
                    resolve(response.prompts);
                } else {
                    console.error('Error loading system prompts:', response.error);
                    reject(new Error(response.error));
                }
            }
        });
    });
}

// Initialize AI capabilities when content script loads
let initializationPromise = null;
// Track feature states
let fontEnabled = false;
let hoverEnabled = false;
let simplifiedElements = []; // Array to track simplified elements
let isSimplifying = false; // Flag to track simplification in progress

// Load feature states from storage when script loads
chrome.storage.sync.get(['fontEnabled'], function(result) {
    fontEnabled = result.fontEnabled || false;
    if (fontEnabled) {
        toggleOpenDyslexicFont(true);
    }
});

// Function to toggle OpenDyslexic font
function toggleOpenDyslexicFont(enabled) {
    console.log(`${enabled ? 'Applying' : 'Removing'} OpenDyslexic font...`);
    
    if (enabled) {
        // Add font-face definition if it doesn't exist
        if (!document.getElementById('opendyslexic-font-face')) {
            const fontFaceStyle = document.createElement('style');
            fontFaceStyle.id = 'opendyslexic-font-face';
            fontFaceStyle.textContent = `
                @font-face {
                    font-family: 'OpenDyslexic';
                    src: url('${chrome.runtime.getURL('fonts/OpenDyslexic-Regular.otf')}') format('opentype');
                    font-weight: normal;
                    font-style: normal;
                    font-display: swap;
                }
            `;
            document.head.appendChild(fontFaceStyle);
        }

        // Create or update style element to apply font to entire page
        let fontStyle = document.getElementById('opendyslexic-font-style');
        if (!fontStyle) {
            fontStyle = document.createElement('style');
            fontStyle.id = 'opendyslexic-font-style';
            document.head.appendChild(fontStyle);
        }

        fontStyle.textContent = `
            body, body * {
                font-family: 'OpenDyslexic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif !important;
                line-height: 1.5;
                letter-spacing: 0.5px;
                word-spacing: 3px;
            }
        `;
    } else {
        // Remove the font style applied to the entire page
        const fontStyle = document.getElementById('opendyslexic-font-style');
        if (fontStyle) {
            fontStyle.parentNode.removeChild(fontStyle);
        }

        // Optionally remove the font-face definition
        const fontFaceStyle = document.getElementById('opendyslexic-font-face');
        if (fontFaceStyle) {
            fontFaceStyle.parentNode.removeChild(fontFaceStyle);
        }
    }
}

function enableHoverFeature() {
    console.log("Enabling hover feature...");
    simplifiedElements = document.querySelectorAll('.simplified-text');
    simplifiedElements.forEach(el => {
        el.addEventListener('mouseenter', showOriginalText);
        el.addEventListener('mouseleave', hideOriginalText);
    });
}

function disableHoverFeature() {
    console.log("Disabling hover feature...");
    simplifiedElements.forEach(el => {
        el.removeEventListener('mouseenter', showOriginalText);
        el.removeEventListener('mouseleave', hideOriginalText);
    });
}

function showOriginalText(event) {
    const originalText = event.currentTarget.getAttribute('data-original-text');
    if (!originalText) return;

    const tooltip = document.createElement('div');
    tooltip.className = 'original-text-tooltip';
    tooltip.textContent = originalText;
    document.body.appendChild(tooltip);

    const rect = event.currentTarget.getBoundingClientRect();
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 10}px`;

    event.currentTarget._originalTextTooltip = tooltip;
}

function hideOriginalText(event) {
    const tooltip = event.currentTarget._originalTextTooltip;
    if (tooltip) {
        tooltip.remove();
        event.currentTarget._originalTextTooltip = null;
    }
}

function ensureInitialized() {
    if (!initializationPromise) {
        console.log('Content script loaded - starting initialization');
        initializationPromise = initAICapabilities().then(() => {
            console.log('Content script setup complete with capabilities:', {
                promptSessionAvailable: !!promptSession
            });
        }).catch(error => {
            console.error('Failed to initialize AI capabilities:', error);
            initializationPromise = null; // Allow retry on failure
        });
    }
    return initializationPromise;
}

// Function to apply spacing adjustments
function applySpacingAdjustments(lineSpacing, letterSpacing, wordSpacing) {
    const existingStyle = document.getElementById('spacing-adjustments-style');
    if (existingStyle) {
        existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = 'spacing-adjustments-style';
    style.textContent = `
        body, body * {
            line-height: ${lineSpacing} !important;
            letter-spacing: ${letterSpacing}px !important;
            word-spacing: ${wordSpacing}px !important;
        }
    `;
    document.head.appendChild(style);
}

// Function to apply selected theme
function applyTheme(themeName) {
    const theme = themes[themeName];
    if (!theme) return;

    const { backgroundColor, textColor } = theme;

    let themeStyle = document.getElementById('theme-style');
    if (!themeStyle) {
        themeStyle = document.createElement('style');
        themeStyle.id = 'theme-style';
        document.head.appendChild(themeStyle);
    }

    themeStyle.textContent = `
        html, body {
            background-color: ${backgroundColor} !important;
            color: ${textColor} !important;
        }
        body * {
            background-color: ${backgroundColor} !important;
            color: ${textColor} !important;
        }
    `;
}


// Initialize
document.addEventListener('DOMContentLoaded', () => {
    ensureInitialized();
    
    // Apply saved theme
    chrome.storage.sync.get(['selectedTheme'], function(result) {
        const selectedTheme = result.selectedTheme || 'default';
        applyTheme(selectedTheme);
    });
    
    // Load and apply initial spacing settings
    chrome.storage.sync.get(['lineSpacing', 'letterSpacing', 'wordSpacing'], function(result) {
        applySpacingAdjustments(
            result.lineSpacing || 1.5,
            result.letterSpacing || 0,
            result.wordSpacing || 0
        );
    });
});

// Advanced Features Message Handlers
let focusModeActive = false;
let adaptiveModeActive = false;
let smartAutoActive = false;
let readingBeamActive = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleSmartAuto") {
        smartAutoActive = !smartAutoActive;
        if (smartAutoActive && window.smartAutoMode) {
            window.smartAutoMode.activate();
        } else if (window.smartAutoMode) {
            window.smartAutoMode.deactivate();
        }
        sendResponse({success: true, active: smartAutoActive});
        return true;
    }
    
    if (request.action === "toggleReadingBeam") {
        readingBeamActive = !readingBeamActive;
        if (readingBeamActive && window.readingBeam) {
            window.readingBeam.activate('sentence');
        } else if (window.readingBeam) {
            window.readingBeam.deactivate();
        }
        sendResponse({success: true, active: readingBeamActive});
        return true;
    }
    
    if (request.action === "enableVocabAdapter") {
        const mainContent = document.querySelector('main, article, .content, #content');
        if (mainContent && window.vocabularyAdapter) {
            window.vocabularyAdapter.scanAndEnhance(mainContent);
            sendResponse({success: true});
        } else {
            sendResponse({success: false});
        }
        return true;
    }
    
    if (request.action === "autoChunk") {
        const mainContent = document.querySelector('main, article, .content, #content');
        if (mainContent) {
            const paragraphs = mainContent.querySelectorAll('p');
            paragraphs.forEach(p => {
                const text = p.textContent;
                const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
                
                if (sentences.length > 4) {
                    p.innerHTML = '';
                    let chunk = [];
                    sentences.forEach((sentence, idx) => {
                        chunk.push(sentence);
                        if (chunk.length === 3 || idx === sentences.length - 1) {
                            const div = document.createElement('div');
                            div.textContent = chunk.join(' ');
                            div.style.marginBottom = '15px';
                            div.style.lineHeight = '1.8';
                            p.appendChild(div);
                            chunk = [];
                        }
                    });
                }
            });
            sendResponse({success: true});
        } else {
            sendResponse({success: false});
        }
        return true;
    }
    
    if (request.action === "toggleFocusMode") {
        if (focusModeActive) {
            window.focusMode.deactivate();
            focusModeActive = false;
        } else {
            window.focusMode.activate();
            focusModeActive = true;
        }
        sendResponse({success: true, active: focusModeActive});
        return true;
    }
    
    if (request.action === "showComplexityMap") {
        const mainContent = document.querySelector('main, article, .content, #content');
        if (mainContent && window.complexityAnalyzer) {
            window.complexityAnalyzer.highlightComplexity(mainContent);
            sendResponse({success: true});
        } else {
            sendResponse({success: false});
        }
        return true;
    }
    
    if (request.action === "restructureContent") {
        const mainContent = document.querySelector('main, article, .content, #content');
        if (mainContent && window.contentRestructurer) {
            window.contentRestructurer.restructureContent(mainContent);
            sendResponse({success: true});
        } else {
            sendResponse({success: false});
        }
        return true;
    }
    
    if (request.action === "enableAdaptiveMode") {
        adaptiveModeActive = !adaptiveModeActive;
        
        if (adaptiveModeActive && window.cognitiveTracker) {
            // Use cognitive tracker data to auto-adjust
            const level = window.cognitiveTracker.getAdaptationLevel();
            console.log('Adaptive mode: Auto-detected level', level);
            
            // Auto-apply features based on reading behavior
            if (window.cognitiveTracker.shouldBreakIntoBullets()) {
                const mainContent = document.querySelector('main, article, .content, #content');
                if (mainContent) window.contentRestructurer.restructureContent(mainContent);
            }
            
            if (window.cognitiveTracker.shouldAddSubheadings()) {
                const mainContent = document.querySelector('main, article, .content, #content');
                if (mainContent) window.contentRestructurer.addInlineSummaries(mainContent);
            }
        }
        
        sendResponse({success: true, active: adaptiveModeActive});
        return true;
    }
});

// ── Utility message handlers ──────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSelectedText') {
        sendResponse({ text: window.getSelection()?.toString() || '' });
        return true;
    }
    if (request.action === 'getPageText') {
        const el = document.querySelector('main, article, .content, #content') || document.body;
        sendResponse({ text: el.innerText.slice(0, 2000) });
        return true;
    }
});

// ── Predictive Highlighter ────────────────────────────────────────────────────
// On page load, extract keywords and highlight concepts the user has struggled with.

(async function predictiveHighlight() {
    const MEMORY_API = 'http://localhost:8000';

    // Simple keyword extractor: capitalised words + words > 6 chars
    function pageKeywords() {
        const text = document.body.innerText || '';
        const caps = text.match(/\b[A-Z][a-z]{3,}\b/g) || [];
        const long = text.match(/\b[a-z]{7,}\b/g) || [];
        return [...new Set([...caps, ...long])].slice(0, 30);
    }

    let struggled = [];
    try {
        const res = await fetch(`${MEMORY_API}/api/check-memory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keywords: pageKeywords(), user_id: 'guest' })
        });
        const data = await res.json();
        struggled = data.struggled_concepts || [];
    } catch (e) {
        return; // backend offline — fail silently
    }

    if (!struggled.length) return;

    // Inject tooltip style once
    if (!document.getElementById('pudding-highlight-style')) {
        const style = document.createElement('style');
        style.id = 'pudding-highlight-style';
        style.textContent = `
            .pudding-struggled {
                text-decoration: underline wavy #e74c3c;
                cursor: pointer;
                position: relative;
            }
            .pudding-struggled::after {
                content: attr(data-tip);
                display: none;
                position: absolute;
                bottom: 120%;
                left: 0;
                background: #e74c3c;
                color: #fff;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 12px;
                white-space: nowrap;
                z-index: 99999;
            }
            .pudding-struggled:hover::after { display: block; }
        `;
        document.head.appendChild(style);
    }

    // Walk text nodes and wrap matched concepts
    const pattern = new RegExp(`\\b(${struggled.map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const toReplace = [];

    let node;
    while ((node = walker.nextNode())) {
        if (['SCRIPT','STYLE','NOSCRIPT'].includes(node.parentElement?.tagName)) continue;
        if (pattern.test(node.textContent)) toReplace.push(node);
        pattern.lastIndex = 0;
    }

    toReplace.forEach(textNode => {
        const span = document.createElement('span');
        span.innerHTML = textNode.textContent.replace(pattern, match =>
            `<span class="pudding-struggled" data-tip="You struggled with '${match}' before. Click to simplify.">${match}</span>`
        );
        // Click to trigger simplification
        span.querySelectorAll('.pudding-struggled').forEach(el => {
            el.addEventListener('click', () => {
                window.getSelection()?.selectAllChildren(el);
                document.dispatchEvent(new CustomEvent('pudding:simplify-selection'));
            });
        });
        textNode.parentNode.replaceChild(span, textNode);
    });
})();
