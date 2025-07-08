# 🔧 LinkedIn Feed Curator - Troubleshooting Guide

## 🚨 Common Issues and Solutions

### Issue 1: Extension Not Loading / `net::ERR_FAILED` Errors

**Symptoms:**
- Console shows `net::ERR_FAILED` errors
- Extension not appearing in Chrome extensions list
- No console logs from content script

**Solutions:**

1. **Check Extension Installation:**
   ```
   1. Go to chrome://extensions/
   2. Enable "Developer mode" (top right toggle)
   3. Click "Load unpacked"
   4. Select the "LI feed curator" folder
   5. Look for any error messages in red
   ```

2. **Verify File Structure:**
   ```
   LI feed curator/
   ├── manifest.json
   ├── content.js
   ├── background.js
   ├── popup.html
   ├── popup.js
   ├── options.html
   ├── options.js
   ├── styles.css
   └── icon files (icon16.png, icon48.png, icon128.png)
   ```

3. **Check Manifest Syntax:**
   - Ensure `manifest.json` is valid JSON
   - Verify all file references exist

### Issue 2: Content Script Not Running on LinkedIn

**Symptoms:**
- No console logs when visiting linkedin.com
- Extension popup shows but doesn't affect posts

**Debug Steps:**

1. **Use Debug Version:**
   - Rename `manifest.json` to `manifest-original.json`
   - Rename `manifest-debug.json` to `manifest.json`
   - Reload extension in chrome://extensions/

2. **Check Console Logs:**
   - Open LinkedIn in a new tab
   - Open Developer Tools (F12)
   - Look for debug messages starting with 🚀, 📍, 🌐

3. **Verify URL Matching:**
   - Ensure you're on `https://www.linkedin.com/feed/` or similar
   - Check that content script matches work with your LinkedIn URL

### Issue 3: Posts Not Being Detected

**Symptoms:**
- Content script loads but finds 0 posts
- No post filtering happening

**Debug Steps:**

1. **Check Post Selectors:**
   - Open LinkedIn feed
   - Open Developer Tools
   - In Console, run: `document.querySelectorAll('[data-urn*="urn:li:activity:"]').length`
   - If 0, try: `document.querySelectorAll('.feed-shared-update-v2').length`

2. **Wait for Dynamic Content:**
   - LinkedIn loads posts dynamically
   - Scroll down to load more posts
   - Check if posts appear after scrolling

### Issue 4: Background Script Communication Issues

**Symptoms:**
- Content script works but no scores returned
- "Message passing error" in console

**Debug Steps:**

1. **Check Background Script:**
   - Go to chrome://extensions/
   - Click "Inspect views: service worker" under your extension
   - Check for errors in background script console

2. **Verify API Key:**
   - Open extension options (right-click extension icon → Options)
   - Ensure Anthropic API key is properly set
   - Check that key has proper permissions

### Issue 5: Posts Not Being Hidden/Filtered

**Symptoms:**
- Posts get scored but remain visible
- Threshold settings not working

**Debug Steps:**

1. **Check Extension Settings:**
   - Open popup (click extension icon)
   - Verify extension is enabled
   - Check threshold value (default should be 25)

2. **Monitor Scoring:**
   - Open console while browsing LinkedIn
   - Look for scoring logs: "Analyzed post with score: X"
   - Verify scores are below/above threshold as expected

## 🧪 Testing Tools

### 1. Test Extension (test-extension.html)
Open the `test-extension.html` file to run comprehensive tests:
- Extension API availability
- Storage access
- Message passing
- LinkedIn post simulation

### 2. Debug Content Script (content-debug.js)
Use the debug manifest to run simplified testing:
1. Rename manifests as described above
2. Reload extension
3. Visit LinkedIn and check console for detailed logs

### 3. Manual Console Tests

**Test 1: Basic Extension Check**
```javascript
// Run in LinkedIn console
console.log('Chrome APIs available:', typeof chrome !== 'undefined');
console.log('Extension ID:', chrome?.runtime?.id);
```

**Test 2: Find Posts**
```javascript
// Run in LinkedIn console
const posts = document.querySelectorAll('[data-urn*="urn:li:activity:"]');
console.log('Posts found:', posts.length);
posts.forEach((post, i) => console.log(`Post ${i}:`, post));
```

**Test 3: Test Message to Background**
```javascript
// Run in LinkedIn console
chrome.runtime.sendMessage({
  action: 'analyzePost',
  postData: {
    text: 'Test post content',
    author: 'Test Author'
  }
}, response => {
  console.log('Background response:', response);
});
```

## 🔧 Advanced Debugging

### Enable Verbose Logging
Add this to the beginning of any JavaScript file for more detailed logs:
```javascript
const DEBUG = true;
function debugLog(...args) {
  if (DEBUG) console.log('[DEBUG]', ...args);
}
```

### Check Network Requests
1. Open Developer Tools
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Look for requests to `api.anthropic.com`
5. Check for 401, 403, or 500 errors

### Storage Inspection
```javascript
// Check stored settings
chrome.storage.local.get(null, (items) => {
  console.log('All stored data:', items);
});

// Reset settings
chrome.storage.local.clear(() => {
  console.log('Storage cleared');
});
```

## 📞 Getting Help

If you're still experiencing issues:

1. **Check the console logs** - Most issues show detailed error messages
2. **Verify all files are present** - Missing files cause loading errors
3. **Test with debug version** - Use the simplified debug manifest
4. **Check permissions** - Ensure LinkedIn and API permissions are granted
5. **Reload the extension** - After any changes, reload in chrome://extensions/

## 🔄 Reset Extension

To completely reset the extension:

1. Go to chrome://extensions/
2. Remove the extension
3. Clear browser cache
4. Re-install the extension
5. Reconfigure API key and settings

---

**Still having issues?** Check the browser console for specific error messages and include them when seeking help. 