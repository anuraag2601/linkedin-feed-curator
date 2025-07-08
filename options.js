class OptionsManager {
  constructor() {
    this.init();
  }

  init() {
    this.initializeElements();
    this.bindEvents();
    this.loadSettings();
  }

  initializeElements() {
    this.enableToggle = document.getElementById('enableToggle');
    this.thresholdSlider = document.getElementById('threshold');
    this.thresholdValue = document.getElementById('threshold-value');
    this.autoScrollToggle = document.getElementById('autoScroll');
    this.customFilteringInput = document.getElementById('customFiltering');
    this.apiKeyInput = document.getElementById('apiKey');
    this.saveButton = document.getElementById('saveBtn');
    this.testButton = document.getElementById('testBtn');
    this.exportMarkdownBtn = document.getElementById('exportMarkdownBtn');
    this.exportStatus = document.getElementById('exportStatus');
    this.statusDiv = document.getElementById('statusMessage');
  }

  bindEvents() {
    // Custom toggle for enable/disable
    this.enableToggle.addEventListener('click', () => this.toggleEnable());
    
    this.thresholdSlider.addEventListener('input', () => this.updateThresholdDisplay());
    this.autoScrollToggle.addEventListener('change', () => this.saveSettings());
    this.customFilteringInput.addEventListener('input', () => this.saveSettings());
    this.saveButton.addEventListener('click', () => this.saveSettings());
    this.testButton.addEventListener('click', () => this.testApiConnection());
    this.exportMarkdownBtn.addEventListener('click', () => this.exportMarkdown());
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'enabled', 
        'threshold', 
        'autoScroll',
        'customFiltering', 
        'apiKey'
      ]);
      
      // Set enable toggle state
      const isEnabled = result.enabled !== false;
      this.setEnableToggle(isEnabled);
      
      this.thresholdSlider.value = result.threshold || 25;
      this.autoScrollToggle.checked = result.autoScroll || false;
      this.customFilteringInput.value = result.customFiltering || '';
      this.apiKeyInput.value = result.apiKey || '';
      
      this.updateThresholdDisplay();
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  setEnableToggle(enabled) {
    if (enabled) {
      this.enableToggle.classList.add('active');
    } else {
      this.enableToggle.classList.remove('active');
    }
    this.enabledState = enabled;
  }

  toggleEnable() {
    this.enabledState = !this.enabledState;
    this.setEnableToggle(this.enabledState);
    this.saveSettings();
  }

  updateThresholdDisplay() {
    this.thresholdValue.textContent = this.thresholdSlider.value;
    this.saveSettings();
  }

  async saveSettings() {
    try {
      const settings = {
        enabled: this.enabledState !== false,
        threshold: parseInt(this.thresholdSlider.value),
        autoScroll: this.autoScrollToggle.checked,
        customFiltering: this.customFilteringInput.value.trim(),
        apiKey: this.apiKeyInput.value.trim()
      };

      await chrome.storage.sync.set(settings);
      this.showStatus('Settings saved successfully!', 'success');
      
      console.log('Settings saved:', settings);
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showStatus('Error saving settings', 'error');
    }
  }

  async testApiConnection() {
    try {
      this.testButton.disabled = true;
      this.testButton.textContent = 'Testing...';

      // Get current API key
      const result = await chrome.storage.sync.get(['apiKey']);
      const apiKey = result.apiKey || this.apiKeyInput.value.trim();

      if (!apiKey) {
        throw new Error('Please enter an API key first');
      }

      // Test the API connection
      const response = await chrome.runtime.sendMessage({
        action: 'testApiConnection',
        apiKey: apiKey
      });

      if (response.success) {
        this.showStatus('API connection successful!', 'success');
      } else {
        throw new Error(response.error || 'Unknown error');
      }

    } catch (error) {
      console.error('API test failed:', error);
      this.showStatus(`Connection failed: ${error.message}`, 'error');
    } finally {
      this.testButton.disabled = false;
      this.testButton.textContent = 'Test API Connection';
    }
  }

  showStatus(message, type) {
    this.statusDiv.textContent = message;
    this.statusDiv.className = `status-message status-${type}`;
    this.statusDiv.style.display = 'block';

    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
      setTimeout(() => {
        this.statusDiv.style.display = 'none';
      }, 3000);
    }
  }

  async exportMarkdown() {
    try {
      this.exportMarkdownBtn.disabled = true;
      this.exportMarkdownBtn.textContent = 'Generating...';
      this.exportStatus.style.display = 'block';
      this.exportStatus.textContent = 'Checking for active LinkedIn tabs...';

      // Find active LinkedIn tab
      const tabs = await chrome.tabs.query({
        url: ['*://www.linkedin.com/*', '*://linkedin.com/*']
      });

      if (tabs.length === 0) {
        throw new Error('No LinkedIn tabs found. Please open LinkedIn and process some posts first.');
      }

      // Try to get markdown from the most recent LinkedIn tab
      let markdownContent = null;
      for (const tab of tabs) {
        try {
          this.exportStatus.textContent = 'Generating markdown report...';
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
        throw new Error('No filtered posts data found. Please visit LinkedIn and let the extension process some posts first.');
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

      this.exportStatus.textContent = 'Markdown report downloaded successfully!';
      this.exportStatus.style.color = '#155724';

    } catch (error) {
      console.error('Export failed:', error);
      this.exportStatus.textContent = `Export failed: ${error.message}`;
      this.exportStatus.style.color = '#721c24';
    } finally {
      this.exportMarkdownBtn.disabled = false;
      this.exportMarkdownBtn.textContent = '📄 Download Markdown Report';
      
      // Hide status after 5 seconds
      setTimeout(() => {
        this.exportStatus.style.display = 'none';
      }, 5000);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
}); 