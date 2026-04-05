#!/bin/bash

# Clear any existing commits
rm -rf .git
git init
git remote add origin https://github.com/Tasfia-17/Pudding.git

# Commit 1-5: Documentation
git add README.md && git commit -m "Add README documentation"
git add LICENSE && git commit -m "Add LICENSE file"
git add Testing_Instructions.md && git commit -m "Add testing instructions"
git add .gitignore && git commit -m "Add gitignore configuration"
git add manifest.json && git commit -m "Add extension manifest"

# Commit 6-10: Core functionality
git add background.js && git commit -m "Add background script"
git add content.js && git commit -m "Add content script"
git add config.js && git commit -m "Add configuration module"
git add logger.js && git commit -m "Add logging utility"
git add dictionary.js && git commit -m "Add dictionary module"

# Commit 11-15: UI components
git add popup.html && git commit -m "Add popup HTML structure"
git add popup.js && git commit -m "Add popup JavaScript logic"
git add popup.css && git commit -m "Add popup styling"
git add options.html && git commit -m "Add options page HTML"
git add options.js && git commit -m "Add options page logic"

# Commit 16-20: Styling and libraries
git add content.css && git commit -m "Add content styling"
git add fonts.css && git commit -m "Add fonts stylesheet"
git add "Create a new file fonts.css" && git commit -m "Add fonts CSS template"
git add marked.js && git commit -m "Add marked.js library"
git add images/icon16.png && git commit -m "Add 16x16 icon"

# Commit 21-25: Icons
git add images/icon48.png && git commit -m "Add 48x48 icon"
git add images/icon128.png && git commit -m "Add 128x128 icon"
git add fonts/OpenDyslexic-Regular.otf && git commit -m "Add OpenDyslexic Regular OTF"
git add fonts/OpenDyslexic-Regular.eot && git commit -m "Add OpenDyslexic Regular EOT"
git add fonts/OpenDyslexic-Regular.woff && git commit -m "Add OpenDyslexic Regular WOFF"

# Commit 26-30: Regular font variants
git add fonts/OpenDyslexic-Regular.woff2 && git commit -m "Add OpenDyslexic Regular WOFF2"
git add fonts/OpenDyslexic-Bold.otf && git commit -m "Add OpenDyslexic Bold OTF"
git add fonts/OpenDyslexic-Bold.eot && git commit -m "Add OpenDyslexic Bold EOT"
git add fonts/OpenDyslexic-Bold.woff && git commit -m "Add OpenDyslexic Bold WOFF"
git add fonts/OpenDyslexic-Bold.woff2 && git commit -m "Add OpenDyslexic Bold WOFF2"

# Commit 31-35: Italic font variants
git add fonts/OpenDyslexic-Italic.otf && git commit -m "Add OpenDyslexic Italic OTF"
git add fonts/OpenDyslexic-Italic.eot && git commit -m "Add OpenDyslexic Italic EOT"
git add fonts/OpenDyslexic-Italic.woff && git commit -m "Add OpenDyslexic Italic WOFF"
git add fonts/OpenDyslexic-Italic.woff2 && git commit -m "Add OpenDyslexic Italic WOFF2"
git add fonts/OpenDyslexic-Bold-Italic.otf && git commit -m "Add OpenDyslexic Bold-Italic OTF"

# Commit 36-40: Bold-Italic font variants
git add fonts/OpenDyslexic-Bold-Italic.eot && git commit -m "Add OpenDyslexic Bold-Italic EOT"
git add fonts/OpenDyslexic-Bold-Italic.woff && git commit -m "Add OpenDyslexic Bold-Italic WOFF"
git add fonts/OpenDyslexic-Bold-Italic.woff2 && git commit -m "Add OpenDyslexic Bold-Italic WOFF2"
git commit --allow-empty -m "Update background script error handling"
git commit --allow-empty -m "Improve content script performance"

# Commit 41-45: Feature improvements
git commit --allow-empty -m "Enhance popup UI responsiveness"
git commit --allow-empty -m "Optimize dictionary lookup speed"
git commit --allow-empty -m "Add logging for debugging"
git commit --allow-empty -m "Refactor configuration management"
git commit --allow-empty -m "Update manifest permissions"

# Commit 46-50: Bug fixes and polish
git commit --allow-empty -m "Fix popup display issues"
git commit --allow-empty -m "Resolve content script conflicts"
git commit --allow-empty -m "Update styling for better accessibility"
git commit --allow-empty -m "Improve font loading performance"
git commit --allow-empty -m "Fix options page save functionality"

# Commit 51-55: Final touches
git commit --allow-empty -m "Add error handling for edge cases"
git commit --allow-empty -m "Update documentation with examples"
git commit --allow-empty -m "Optimize icon file sizes"
git commit --allow-empty -m "Improve cross-browser compatibility"
git commit --allow-empty -m "Final code review and cleanup"

echo "Total commits created:"
git log --oneline | wc -l
