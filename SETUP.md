# LinkedIn Feed Curator - Setup Guide

## Quick Setup (5 minutes)

### 1. Prerequisites
- Chrome browser
- [Anthropic API key](https://console.anthropic.com/) (free tier available)

### 2. Installation
```bash
# Clone or download this repository
git clone [repository-url]
cd "LI feed curator"

# Load extension in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select this folder
```

### 3. Configuration
1. Extension auto-opens options page
2. Enter your Anthropic API key
3. Test connection
4. Adjust settings:
   - Quality threshold: 25 (recommended)
   - Auto-scroll: Enable for automatic processing
   - Custom keywords: Add topics of interest
5. Save settings

### 4. Usage
1. Visit [LinkedIn feed](https://linkedin.com/feed/)
2. Extension starts automatically
3. Use control panel for toggles and export
4. Access popup via browser toolbar for quick controls

## File Structure
```
LI feed curator/
├── manifest.json          # Extension configuration
├── content.js             # Main filtering logic (976 lines)
├── background.js          # API communication (309 lines)
├── popup.html/js          # Browser toolbar interface
├── options.html/js        # Settings page
├── styles.css             # UI styling
├── icons/                 # Extension icons
└── debug files/           # Development utilities
```

## Key Features
- **Post Scoring**: Visual quality indicators (🔥🟡⚪🔵)
- **Auto-Scroll**: Automatic post processing
- **Export**: Markdown reports with statistics
- **Custom Filtering**: Keyword-based preferences

## Development
```bash
# Load in developer mode for live testing
# Check console for debugging info
# Modify files and reload extension
# Test with: window.linkedInCurator in browser console
```

## Support
- See [README.md](README.md) for detailed documentation
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
- JavaScript console shows debug information 