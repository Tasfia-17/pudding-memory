
// Save font preference
document.getElementById('useOpenDyslexic').addEventListener('change', function(e) {
    chrome.storage.sync.set({
        useOpenDyslexic: e.target.checked
    }, function() {
        const status = document.getElementById('status');
        status.textContent = 'Settings saved';
        status.className = 'status success';
        status.style.display = 'block';
        setTimeout(() => status.style.display = 'none', 2000);
    });
});

// Save Gemini API key
document.getElementById('geminiApiKey')?.addEventListener('change', function(e) {
    chrome.storage.sync.set({ geminiApiKey: e.target.value.trim() }, function() {
        const status = document.getElementById('status');
        status.textContent = 'API key saved';
        status.className = 'status success';
        status.style.display = 'block';
        setTimeout(() => status.style.display = 'none', 2000);
    });
});

// Load saved preferences
document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.sync.get(['useOpenDyslexic', 'geminiApiKey'], function(result) {
        document.getElementById('useOpenDyslexic').checked = result.useOpenDyslexic || false;
        if (document.getElementById('geminiApiKey')) {
            document.getElementById('geminiApiKey').value = result.geminiApiKey || '';
        }
    });
});
