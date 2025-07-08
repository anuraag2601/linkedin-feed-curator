document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Popup loaded');
    
    // Get references to UI elements
    const enableToggle = document.getElementById('enableToggle');
    const statusText = document.getElementById('statusText');
    const thresholdInput = document.getElementById('thresholdInput');
    const thresholdValue = document.getElementById('thresholdValue');
    const autoScrollToggle = document.getElementById('autoScrollToggle');
    const autoScrollText = document.getElementById('autoScrollText');
    const hiddenToday = document.getElementById('hiddenToday');
    const totalProcessed = document.getElementById('totalProcessed');
    const currentThreshold = document.getElementById('currentThreshold');
    const optionsBtn = document.getElementById('optionsBtn');
    const exportBtn = document.getElementById('exportBtn');
    const debugBtn = document.getElementById('debugBtn');
    const apiStatus = document.getElementById('apiStatus');

    // Load current settings
    await loadSettings();
    await loadStats();

    // Event listeners
    enableToggle.addEventListener('change', async () => {
        const enabled = enableToggle.checked;
        await chrome.storage.sync.set({ enabled });
        updateStatus(enabled);
        console.log('🔄 Extension', enabled ? 'enabled' : 'disabled');
    });

    thresholdInput.addEventListener('input', () => {
        const threshold = parseInt(thresholdInput.value);
        thresholdValue.textContent = threshold;
        currentThreshold.textContent = threshold;
    });

    thresholdInput.addEventListener('change', async () => {
        const threshold = parseInt(thresholdInput.value);
        await chrome.storage.sync.set({ threshold });
        console.log('🎯 Threshold updated to', threshold);
    });

    autoScrollToggle.addEventListener('change', async () => {
        const autoScroll = autoScrollToggle.checked;
        await chrome.storage.sync.set({ autoScroll });
        updateAutoScrollStatus(autoScroll);
        console.log('🔄 Auto-scroll', autoScroll ? 'enabled' : 'disabled');
    });

    optionsBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    exportBtn.addEventListener('click', async () => {
        await exportMarkdown();
    });

    debugBtn.addEventListener('click', () => {
        chrome.tabs.create({
            url: chrome.runtime.getURL('debug-viewer.html')
        });
    });

    async function loadSettings() {
        try {
            const settings = await chrome.storage.sync.get(['enabled', 'threshold', 'autoScroll']);
            const enabled = settings.enabled !== false; // Default to true
            const threshold = settings.threshold || 25;
            const autoScroll = settings.autoScroll || false;

            enableToggle.checked = enabled;
            thresholdInput.value = threshold;
            thresholdValue.textContent = threshold;
            currentThreshold.textContent = threshold;
            autoScrollToggle.checked = autoScroll;
            
            updateStatus(enabled);
            updateAutoScrollStatus(autoScroll);
            
            // Check API key status
            const apiKeyCheck = await chrome.storage.sync.get(['apiKey']);
            if (!apiKeyCheck.apiKey) {
                apiStatus.textContent = 'Configure API key in options first';
                apiStatus.style.color = '#ffeb3b';
            }
            
        } catch (error) {
            console.error('Error loading settings:', error);
            apiStatus.textContent = 'Error loading settings';
            apiStatus.style.color = '#f44336';
        }
    }

    async function loadStats() {
        try {
            const stats = await chrome.storage.local.get(['daily_stats', 'total_processed']);
            const today = new Date().toDateString();
            const dailyStats = stats.daily_stats || {};
            const todayStats = dailyStats[today] || { hidden: 0, processed: 0 };
            
            hiddenToday.textContent = todayStats.hidden;
            totalProcessed.textContent = stats.total_processed || 0;
            
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    function updateStatus(enabled) {
        if (enabled) {
            statusText.textContent = 'Active';
            statusText.style.color = '#4CAF50';
        } else {
            statusText.textContent = 'Disabled';
            statusText.style.color = '#f44336';
        }
    }

    function updateAutoScrollStatus(enabled) {
        if (enabled) {
            autoScrollText.textContent = 'Enabled';
            autoScrollText.style.color = '#4CAF50';
        } else {
            autoScrollText.textContent = 'Disabled';
            autoScrollText.style.color = '#f44336';
        }
    }

    async function exportMarkdown() {
        try {
            exportBtn.disabled = true;
            exportBtn.textContent = '⏳ Exporting...';

            // Find active LinkedIn tab
            const tabs = await chrome.tabs.query({
                url: ['*://www.linkedin.com/*', '*://linkedin.com/*']
            });

            if (tabs.length === 0) {
                throw new Error('No LinkedIn tabs found. Please open LinkedIn first.');
            }

            // Try to get markdown from the most recent LinkedIn tab
            let markdownContent = null;
            for (const tab of tabs) {
                try {
                    const response = await chrome.tabs.sendMessage(tab.id, { 
                        action: 'exportMarkdown' 
                    });
                    
                    if (response && response.success && response.markdown) {
                        markdownContent = response.markdown;
                        break;
                    }
                } catch (tabError) {
                    console.log('Tab not responsive:', tab.id);
                    continue;
                }
            }

            if (!markdownContent) {
                throw new Error('No data found. Process some posts first.');
            }

            // Create and download the file
            const blob = new Blob([markdownContent], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `linkedin-filtered-posts-${new Date().toISOString().split('T')[0]}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            apiStatus.textContent = 'Report downloaded successfully!';
            apiStatus.style.color = '#4CAF50';

        } catch (error) {
            console.error('Export failed:', error);
            apiStatus.textContent = `Export failed: ${error.message}`;
            apiStatus.style.color = '#f44336';
        } finally {
            exportBtn.disabled = false;
            exportBtn.textContent = '📄 Export Report';
            
            // Reset status after 3 seconds
            setTimeout(() => {
                apiStatus.textContent = 'Ready to filter your LinkedIn feed';
                apiStatus.style.color = '';
            }, 3000);
        }
    }
}); 