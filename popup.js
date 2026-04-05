function initializePopup() {
    // Initialize language
    chrome.storage.sync.get(['locale'], function(result) {
        const locale = result.locale || 'en';
        document.getElementById('languageSelector').value = locale;
        updateUI(locale);
    });
    
    // Restore selected simplification level and font settings
    chrome.storage.sync.get(['simplificationLevel', 'optimizeFor', 'fontEnabled'], function(result) {
        const level = result.simplificationLevel || '3'; // Default to '3' for "Mid"
        const button = document.querySelector(`.simplification-button[data-level="${level}"]`);
        if (button) {
            document.querySelectorAll('.simplification-button').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
        }
        
        // Restore optimize for selection
        document.getElementById('optimizeSelector').value = result.optimizeFor || 'textClarity';
        
        // Restore font toggle state
        document.getElementById('fontToggle').checked = result.fontEnabled || false;
    });


    // Restore theme, toggle and slider states
    chrome.storage.sync.get(['selectedTheme'], function(result) {
        document.getElementById('themeSelector').value = result.selectedTheme || 'default';
    });
    chrome.storage.sync.get(['lineSpacing', 'letterSpacing', 'wordSpacing'], function(result) {
        document.getElementById('lineSpacing').value = result.lineSpacing || 1.5;
        document.getElementById('lineSpacingValue').textContent = result.lineSpacing || 1.5;
        
        document.getElementById('letterSpacing').value = result.letterSpacing || 0;
        document.getElementById('letterSpacingValue').textContent = (result.letterSpacing || 0) + 'px';
        
        document.getElementById('wordSpacing').value = result.wordSpacing || 0;
        document.getElementById('wordSpacingValue').textContent = (result.wordSpacing || 0) + 'px';
    });
    
    chrome.storage.sync.get(['fontEnabled'], function(result) {
        document.getElementById('fontToggle').checked = result.fontEnabled || false;
    });
}

// Get references to the button and its elements
const simplifyButton = document.getElementById('simplifyText');
const simplifyButtonText = document.getElementById('simplifyButtonText');
const loader = document.getElementById('loader');

// Advanced feature buttons
const smartAutoBtn = document.getElementById('smartAutoBtn');
const readingBeamBtn = document.getElementById('readingBeamBtn');
const vocabAdaptBtn = document.getElementById('vocabAdaptBtn');
const autoChunkBtn = document.getElementById('autoChunkBtn');
const focusModeBtn = document.getElementById('focusModeBtn');
const complexityMapBtn = document.getElementById('complexityMapBtn');
const restructureBtn = document.getElementById('restructureBtn');
const adaptiveModeBtn = document.getElementById('adaptiveModeBtn');

// Smart Auto Mode
smartAutoBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "toggleSmartAuto"}, function(response) {
            if (response && response.active) {
                smartAutoBtn.classList.add('active');
                smartAutoBtn.innerHTML = '<i class="fa-solid fa-wand-sparkles"></i> Auto: ON';
            } else {
                smartAutoBtn.classList.remove('active');
                smartAutoBtn.innerHTML = '<i class="fa-solid fa-wand-sparkles"></i> Smart Auto';
            }
        });
    });
});

// Reading Beam
readingBeamBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "toggleReadingBeam"}, function(response) {
            if (response && response.active) {
                readingBeamBtn.classList.add('active');
                readingBeamBtn.innerHTML = '<i class="fa-solid fa-highlighter"></i> Beam: ON';
            } else {
                readingBeamBtn.classList.remove('active');
                readingBeamBtn.innerHTML = '<i class="fa-solid fa-highlighter"></i> Reading Beam';
            }
        });
    });
});

// Vocab Adapter
vocabAdaptBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "enableVocabAdapter"}, function(response) {
            if (response && response.success) {
                vocabAdaptBtn.classList.add('active');
                setTimeout(() => vocabAdaptBtn.classList.remove('active'), 2000);
            }
        });
    });
});

// Auto Chunk
autoChunkBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "autoChunk"}, function(response) {
            if (response && response.success) {
                autoChunkBtn.classList.add('active');
                setTimeout(() => autoChunkBtn.classList.remove('active'), 2000);
            }
        });
    });
});

// Focus Mode
focusModeBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "toggleFocusMode"}, function(response) {
            if (response && response.active) {
                focusModeBtn.classList.add('active');
                focusModeBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i> Exit Focus';
            } else {
                focusModeBtn.classList.remove('active');
                focusModeBtn.innerHTML = '<i class="fa-solid fa-eye"></i> Focus Mode';
            }
        });
    });
});

// Complexity Map
complexityMapBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "showComplexityMap"}, function(response) {
            if (response && response.success) {
                complexityMapBtn.classList.add('active');
                setTimeout(() => complexityMapBtn.classList.remove('active'), 2000);
            }
        });
    });
});

// Smart Restructure
restructureBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "restructureContent"}, function(response) {
            if (response && response.success) {
                restructureBtn.classList.add('active');
                setTimeout(() => restructureBtn.classList.remove('active'), 2000);
            }
        });
    });
});

// Adaptive Mode
adaptiveModeBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "enableAdaptiveMode"}, function(response) {
            if (response && response.active) {
                adaptiveModeBtn.classList.add('active');
                adaptiveModeBtn.innerHTML = '<i class="fa-solid fa-brain"></i> Adaptive: ON';
            } else {
                adaptiveModeBtn.classList.remove('active');
                adaptiveModeBtn.innerHTML = '<i class="fa-solid fa-brain"></i> Adaptive Mode';
            }
        });
    });
});

// Button click handler
simplifyButton.addEventListener('click', function() {
    // Disable the button
    simplifyButton.disabled = true;

    // Update the button text and show loader
    simplifyButtonText.textContent = 'Simplifying Text...';
    loader.style.display = 'inline-block';

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && /^https?:/.test(tabs[0].url)) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "simplify"}, function(response) {
                if (chrome.runtime.lastError) {
                    console.error("Could not send simplify message:", chrome.runtime.lastError.message);

                    // Re-enable the button and reset text and loader
                    simplifyButton.disabled = false;
                    simplifyButtonText.textContent = 'Simplify Text';
                    loader.style.display = 'none';
                } else {
                    if(response && response.success) {
                        // Simplification succeeded
                        simplifyButtonText.textContent = 'Done!';
                    } else {
                        // Handle error
                        simplifyButtonText.textContent = 'Error!';
                        console.error("Simplification failed:", response.error);
                    }

                    // Hide the loader
                    loader.style.display = 'none';

                    // After a delay, reset the button
                    setTimeout(function() {
                        simplifyButton.disabled = false;
                        simplifyButtonText.textContent = 'Simplify Text';
                    }, 2000);
                }
            });
        } else {
            console.warn("Active tab is not a valid web page.");

            // Re-enable the button and reset text and loader
            simplifyButton.disabled = false;
            simplifyButtonText.textContent = 'Simplify Text';
            loader.style.display = 'none';
        }
    });
});

// Function to generate simplification buttons based on config
function generateSimplificationButtons() {
    const buttonRow = document.getElementById('simplificationButtonRow');
    if (!buttonRow) {
        console.error('Simplification button row element not found');
        return;
    }
    
    buttonRow.innerHTML = ''; // Clear existing buttons

    // Get configuration from config.js
    if (typeof simplificationLevelsConfig === 'undefined') {
        console.error('Configuration not loaded');
        return;
    }

    const levels = simplificationLevelsConfig.levels;
    const labels = levels === 3 ? 
        ['Low', 'Mid', 'High'] : 
        ['Very Low', 'Low', 'Mid', 'High', 'Very High'];
    const dataLevels = levels === 3 ? 
        ['1', '3', '5'] : 
        ['1', '2', '3', '4', '5'];

    labels.forEach((label, index) => {
        const button = document.createElement('button');
        button.classList.add('simplification-button');
        button.setAttribute('data-level', dataLevels[index]);
        button.textContent = label;

        if (label === 'Mid') {
            button.classList.add('selected');
        }

        button.addEventListener('click', function() {
            document.querySelectorAll('.simplification-button')
                .forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            const level = this.getAttribute('data-level');
            chrome.storage.sync.set({ simplificationLevel: level });
            
            // Visual feedback
            const levelNames = { '1': 'Low', '3': 'Mid', '5': 'High' };
            showToast(`Level: ${levelNames[level]}`);
        });

        buttonRow.appendChild(button);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    generateSimplificationButtons();
    document.getElementById('mainContent').style.display = 'block';
    initializePopup();

    // Language selector handler
    document.getElementById('languageSelector').addEventListener('change', function(e) {
        const locale = e.target.value;
        setLocale(locale);
    });

    // Add help icon click handler
    const helpIcon = document.querySelector('.help-icon');
    const simplificationGuide = document.getElementById('simplificationGuide');
    
    helpIcon.addEventListener('click', function() {
        simplificationGuide.classList.toggle('expanded');
        const expanded = simplificationGuide.classList.contains('expanded');
        helpIcon.setAttribute('aria-expanded', expanded.toString());
    });

    // Reset to Defaults button handler
    document.getElementById('resetDefaults').addEventListener('click', function() {
        chrome.storage.sync.set({
            fontEnabled: false,
            selectedTheme: 'default',
            lineSpacing: 1.5,
            letterSpacing: 0,
            wordSpacing: 0
        }, function() {
            // Update the UI elements
            document.getElementById('fontToggle').checked = false;
            document.getElementById('themeSelector').value = 'default';

            document.getElementById('lineSpacing').value = 1.5;
            document.getElementById('lineSpacingValue').textContent = '1.5';

            document.getElementById('letterSpacing').value = 0;
            document.getElementById('letterSpacingValue').textContent = '0px';

            document.getElementById('wordSpacing').value = 0;
            document.getElementById('wordSpacingValue').textContent = '0px';

            // Apply defaults to the current tab
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                if (tabs[0]) {
                    // Reset font
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'toggleFont',
                        enabled: false
                    });

                    // Reset theme
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'applyTheme',
                        theme: 'default'
                    });

                    // Reset spacing
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'adjustSpacing',
                        lineSpacing: 1.5,
                        letterSpacing: 0,
                        wordSpacing: 0
                    });
                }
            });

            // Show confirmation message
            const statusMessage = document.createElement('div');
            statusMessage.textContent = 'Settings have been reset to defaults.';
            statusMessage.style.color = '#27ae60';
            statusMessage.style.marginTop = '10px';
            document.querySelector('.container').appendChild(statusMessage);
            setTimeout(() => statusMessage.remove(), 3000);
        });
    });

    // Settings navigation
    const settingsButton = document.querySelector('.settings-button');
    const backButton = document.querySelector('.back-button');
    const mainContent = document.getElementById('mainContent');
    const settingsPage = document.getElementById('settingsPage');

    settingsButton.addEventListener('click', function() {
        mainContent.style.display = 'none';
        settingsPage.style.display = 'block';
    });

    backButton.addEventListener('click', function() {
        settingsPage.style.display = 'none';
        mainContent.style.display = 'block';
    });

    // Handle optimize for dropdown changes and help icon
    document.getElementById('optimizeSelector').addEventListener('change', function(e) {
        const mode = e.target.value;
        chrome.storage.sync.set({ optimizeFor: mode });
        
        // Visual feedback
        const selector = document.getElementById('optimizeSelector');
        selector.style.background = 'rgba(212, 132, 92, 0.4)';
        selector.style.transform = 'scale(1.02)';
        
        setTimeout(() => {
            selector.style.background = '';
            selector.style.transform = '';
        }, 300);
        
        // Show toast notification
        showToast(`Mode: ${e.target.options[e.target.selectedIndex].text}`);
    });

    const helpIconOptimize = document.getElementById('helpIconOptimize');
    const optimizeGuide = document.getElementById('optimizeGuide');
    
    if (helpIconOptimize && optimizeGuide) {
        helpIconOptimize.addEventListener('click', function() {
            optimizeGuide.classList.toggle('expanded');
            const expanded = optimizeGuide.classList.contains('expanded');
            helpIconOptimize.setAttribute('aria-expanded', expanded.toString());
        });
    }



    // OpenDyslexic font toggle handler
    const fontToggle = document.getElementById('fontToggle');
    
    // Request current font state when popup opens
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && /^https?:/.test(tabs[0].url)) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'getFontState' }, function(response) {
                if (chrome.runtime.lastError) {
                    console.error("Could not get font state:", chrome.runtime.lastError.message);
                    fontToggle.checked = false; // Default to unchecked
                } else if (response && response.fontEnabled !== undefined) {
                    fontToggle.checked = response.fontEnabled;
                }
            });
        } else {
            console.warn("Active tab is not a valid web page. Cannot get font state.");
            fontToggle.checked = false; // Default to unchecked
        }
    });

    fontToggle.addEventListener('change', function(e) {
        const enabled = e.target.checked;
        
        // Save preference
        chrome.storage.sync.set({ fontEnabled: enabled });
        
        // Apply to current tab
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0] && /^https?:/.test(tabs[0].url)) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'toggleFont',
                    enabled: enabled
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error('Could not toggle font:', chrome.runtime.lastError.message);
                    }
                });
            } else {
                console.warn("Active tab is not a valid web page. Cannot toggle font.");
            }
        });
    });

    // Spacing adjustment handlers
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function applySpacingAdjustments() {
        const lineSpacing = document.getElementById('lineSpacing').value;
        const letterSpacing = document.getElementById('letterSpacing').value;
        const wordSpacing = document.getElementById('wordSpacing').value;

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0] && /^https?:/.test(tabs[0].url)) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'adjustSpacing',
                    lineSpacing: lineSpacing,
                    letterSpacing: letterSpacing,
                    wordSpacing: wordSpacing
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error('Could not adjust spacing:', chrome.runtime.lastError.message);
                    }
                });
            } else {
                console.warn("Active tab is not a valid web page. Cannot adjust spacing.");
            }
        });
    }

    const debouncedApplySpacing = debounce(applySpacingAdjustments, 100);

    // Debounce function implementation
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Define a debounced function to save settings and apply spacing
    const debouncedSaveAndApplySpacing = debounce(function() {
        const lineSpacing = document.getElementById('lineSpacing').value;
        const letterSpacing = document.getElementById('letterSpacing').value;
        const wordSpacing = document.getElementById('wordSpacing').value;

        // Save the current values to storage
        chrome.storage.sync.set({
            lineSpacing: lineSpacing,
            letterSpacing: letterSpacing,
            wordSpacing: wordSpacing
        });

        // Apply the spacing adjustments
        applySpacingAdjustments();
    }, 200);

    // Line Spacing Slider
    document.getElementById('lineSpacing').addEventListener('input', function(e) {
        const value = e.target.value;
        document.getElementById('lineSpacingValue').textContent = value;
        debouncedSaveAndApplySpacing();
    });

    // Letter Spacing Slider
    document.getElementById('letterSpacing').addEventListener('input', function(e) {
        const value = e.target.value;
        document.getElementById('letterSpacingValue').textContent = value + 'px';
        debouncedSaveAndApplySpacing();
    });

    // Word Spacing Slider
    document.getElementById('wordSpacing').addEventListener('input', function(e) {
        const value = e.target.value;
        document.getElementById('wordSpacingValue').textContent = value + 'px';
        debouncedSaveAndApplySpacing();
    });

    // Theme Selector Handler
    document.getElementById('themeSelector').addEventListener('change', function(e) {
        const selectedTheme = e.target.value;
        
        // Save the selected theme
        chrome.storage.sync.set({ selectedTheme: selectedTheme });
        
        // Send message to content script to apply the theme
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'applyTheme',
                theme: selectedTheme
            });
        });
    });

    // Apply initial spacing and theme
    debouncedApplySpacing();
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0] && /^https?:/.test(tabs[0].url)) {
            chrome.storage.sync.get(['selectedTheme'], function(result) {
                const selectedTheme = result.selectedTheme || 'default';
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'applyTheme',
                    theme: selectedTheme
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error('Could not apply theme:', chrome.runtime.lastError.message);
                    }
                });
            });
        } else {
            console.warn("Active tab is not a valid web page. Cannot apply theme.");
        }
    });
  });

// Toast notification helper
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'pudding-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #d4845c 0%, #b86f4d 100%);
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideUp 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}


// Translate Page button handler
document.getElementById('translatePageBtn')?.addEventListener('click', async function() {
    chrome.storage.sync.get(['locale'], async function(result) {
        const locale = result.locale || 'en';
        const langMap = { es: 'es', fr: 'fr', de: 'de', ar: 'ar', zh: 'zh-CN', ja: 'ja', hi: 'hi', pt: 'pt', bn: 'bn' };
        const targetLang = langMap[locale] || 'en';
        
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'translatePage',
                targetLang: targetLang
            });
        });
        
        window.close();
    });
});
