document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Popup loaded');
    
    // Get references to UI elements
    const enableToggle = document.getElementById('enableToggle');
    const statusText = document.getElementById('statusText');
    const thresholdInput = document.getElementById('thresholdInput');
    const thresholdValue = document.getElementById('thresholdValue');
    const limitInput = document.getElementById('limitInput');
    const limitValue = document.getElementById('limitValue');
    const autoScrollToggle = document.getElementById('autoScrollToggle');
    const autoScrollText = document.getElementById('autoScrollText');
    const hiddenToday = document.getElementById('hiddenToday');
    const totalProcessed = document.getElementById('totalProcessed');
    const currentThreshold = document.getElementById('currentThreshold');
    const optionsBtn = document.getElementById('optionsBtn');
    const exportBtn = document.getElementById('exportBtn');
    const postCountPill = document.getElementById('postCountPill');
    const generateAudioBtn = document.getElementById('generateAudioBtn');
    const audioPlayer = document.getElementById('audioPlayer');
    const audioStatus = document.getElementById('audioStatus');
    const apiStatus = document.getElementById('apiStatus');
    const audioHistorySection = document.getElementById('audioHistorySection');
    const audioHistoryList = document.getElementById('audioHistoryList');

    // Load current settings
    await loadSettings();
    await loadStats();
    await loadAudioHistory();
    
    // Start live counter updates
    startLiveCounterUpdates();

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

    limitInput.addEventListener('input', () => {
        const limit = parseInt(limitInput.value);
        limitValue.textContent = limit;
    });

    limitInput.addEventListener('change', async () => {
        const limit = parseInt(limitInput.value);
        await chrome.storage.sync.set({ postLimit: limit });
        console.log('🔢 Post limit updated to', limit);
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

    generateAudioBtn.addEventListener('click', async () => {
        await generateAudioSummary();
    });

    async function loadSettings() {
        try {
            const settings = await chrome.storage.sync.get(['enabled', 'threshold', 'autoScroll', 'postLimit']);
            const enabled = settings.enabled !== false; // Default to true
            const threshold = settings.threshold || 25;
            const autoScroll = settings.autoScroll || false;
            const postLimit = settings.postLimit || 50;

            enableToggle.checked = enabled;
            thresholdInput.value = threshold;
            thresholdValue.textContent = threshold;
            currentThreshold.textContent = threshold;
            limitInput.value = postLimit;
            limitValue.textContent = postLimit;
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

    async function updateLiveCounter() {
        try {
            // Find active LinkedIn tab
            const tabs = await chrome.tabs.query({
                url: ['*://www.linkedin.com/*', '*://linkedin.com/*']
            });

            if (tabs.length === 0) {
                postCountPill.style.display = 'none';
                return;
            }

            // Get current filtered posts count
            for (const tab of tabs) {
                try {
                    const response = await chrome.tabs.sendMessage(tab.id, { 
                        action: 'getFilteredPostsData' 
                    });
                    
                    if (response && response.success && response.posts) {
                        const count = response.posts.length;
                        if (count > 0) {
                            postCountPill.textContent = count;
                            postCountPill.style.display = 'block';
                        } else {
                            postCountPill.style.display = 'none';
                        }
                        break;
                    }
                } catch (tabError) {
                    // Tab not responsive, continue to next
                    continue;
                }
            }
        } catch (error) {
            console.error('Error updating live counter:', error);
        }
    }

    function startLiveCounterUpdates() {
        // Update immediately
        updateLiveCounter();
        
        // Update every 5 seconds
        setInterval(updateLiveCounter, 5000);
    }

    async function loadAudioHistory() {
        try {
            const result = await chrome.storage.local.get(['audioSummaries']);
            const audioSummaries = result.audioSummaries || [];
            
            if (audioSummaries.length === 0) {
                audioHistorySection.style.display = 'none';
                return;
            }

            audioHistorySection.style.display = 'block';
            audioHistoryList.innerHTML = '';

            // Sort by date (newest first)
            audioSummaries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            audioSummaries.forEach((summary, index) => {
                const item = createAudioHistoryItem(summary, index);
                audioHistoryList.appendChild(item);
            });

        } catch (error) {
            console.error('Error loading audio history:', error);
        }
    }

    function createAudioHistoryItem(summary, index) {
        const item = document.createElement('div');
        item.className = 'audio-history-item';
        
        const date = new Date(summary.timestamp);
        const dateStr = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        item.innerHTML = `
            <div class="audio-history-info">
                <div class="audio-history-date">${dateStr}</div>
                <div class="audio-history-posts">${summary.postCount} posts • ${summary.duration || 'Unknown'}</div>
            </div>
            <div class="audio-history-controls">
                <button class="btn-audio-small play" data-action="play" data-index="${index}" title="Play">▶️</button>
                <button class="btn-audio-small download" data-action="download" data-index="${index}" title="Download">⬇️</button>
                <button class="btn-audio-small delete" data-action="delete" data-index="${index}" title="Delete">🗑️</button>
            </div>
        `;

        return item;
    }

    // Add event delegation for audio control buttons
    audioHistoryList.addEventListener('click', async (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const index = parseInt(button.dataset.index);

        try {
            switch (action) {
                case 'play':
                    await playStoredAudio(index);
                    break;
                case 'download':
                    await downloadStoredAudio(index);
                    break;
                case 'delete':
                    await deleteStoredAudio(index);
                    break;
            }
        } catch (error) {
            console.error(`Error handling ${action} action:`, error);
            audioStatus.style.display = 'block';
            audioStatus.textContent = `Error: ${error.message}`;
            audioStatus.style.color = '#f44336';
        }
    });

    async function playStoredAudio(index) {
        try {
            const result = await chrome.storage.local.get(['audioSummaries']);
            const audioSummaries = result.audioSummaries || [];
            const summary = audioSummaries[index];

            if (!summary || !summary.audioBase64) {
                throw new Error('Audio data not found');
            }

            // Convert base64 to blob and play
            const audioBytes = Uint8Array.from(atob(summary.audioBase64), c => c.charCodeAt(0));
            const audioBlob = new Blob([audioBytes], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            audioPlayer.src = audioUrl;
            audioPlayer.style.display = 'block';
            audioStatus.style.display = 'block';
            audioStatus.textContent = `🎧 Playing summary from ${new Date(summary.timestamp).toLocaleDateString()}`;
            audioStatus.style.color = '#4CAF50';

            // Clean up URL when audio ends
            audioPlayer.addEventListener('ended', () => {
                URL.revokeObjectURL(audioUrl);
            }, { once: true });

        } catch (error) {
            console.error('Error playing stored audio:', error);
            audioStatus.style.display = 'block';
            audioStatus.textContent = `Error: ${error.message}`;
            audioStatus.style.color = '#f44336';
        }
    }

    async function downloadStoredAudio(index) {
        try {
            const result = await chrome.storage.local.get(['audioSummaries']);
            const audioSummaries = result.audioSummaries || [];
            const summary = audioSummaries[index];

            if (!summary || !summary.audioBase64) {
                throw new Error('Audio data not found');
            }

            // Convert base64 to blob and download
            const audioBytes = Uint8Array.from(atob(summary.audioBase64), c => c.charCodeAt(0));
            const audioBlob = new Blob([audioBytes], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            const a = document.createElement('a');
            a.href = audioUrl;
            a.download = `linkedin-summary-${new Date(summary.timestamp).toISOString().split('T')[0]}-${summary.postCount}posts.mp3`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(audioUrl);

            audioStatus.style.display = 'block';
            audioStatus.textContent = '📁 Audio file downloaded!';
            audioStatus.style.color = '#4CAF50';

        } catch (error) {
            console.error('Error downloading stored audio:', error);
            audioStatus.style.display = 'block';
            audioStatus.textContent = `Download error: ${error.message}`;
            audioStatus.style.color = '#f44336';
        }
    }

    async function deleteStoredAudio(index) {
        try {
            if (!confirm('Delete this audio summary?')) {
                return;
            }

            const result = await chrome.storage.local.get(['audioSummaries']);
            const audioSummaries = result.audioSummaries || [];
            
            audioSummaries.splice(index, 1);
            await chrome.storage.local.set({ audioSummaries });
            
            await loadAudioHistory(); // Refresh the list

            audioStatus.style.display = 'block';
            audioStatus.textContent = '🗑️ Audio summary deleted';
            audioStatus.style.color = '#ff6b6b';

        } catch (error) {
            console.error('Error deleting stored audio:', error);
            audioStatus.style.display = 'block';
            audioStatus.textContent = `Delete error: ${error.message}`;
            audioStatus.style.color = '#f44336';
        }
    }

    async function saveAudioSummary(audioBase64, summaryText, postCount) {
        try {
            const result = await chrome.storage.local.get(['audioSummaries']);
            const audioSummaries = result.audioSummaries || [];

            // Estimate duration (rough calculation: ~150 words per minute, ~5 characters per word)
            const estimatedWords = summaryText.length / 5;
            const estimatedMinutes = Math.round(estimatedWords / 150);
            const duration = estimatedMinutes > 0 ? `~${estimatedMinutes}min` : '<1min';

            const newSummary = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                audioBase64: audioBase64,
                summaryText: summaryText,
                postCount: postCount,
                duration: duration
            };

            audioSummaries.unshift(newSummary); // Add to beginning

            // Keep only last 10 summaries to prevent storage bloat
            if (audioSummaries.length > 10) {
                audioSummaries.splice(10);
            }

            await chrome.storage.local.set({ audioSummaries });
            await loadAudioHistory(); // Refresh the list

        } catch (error) {
            console.error('Error saving audio summary:', error);
        }
    }

    async function generateAudioSummary() {
        try {
            generateAudioBtn.disabled = true;
            generateAudioBtn.textContent = '⏳ Generating...';
            audioStatus.style.display = 'block';
            audioStatus.textContent = 'Checking for filtered posts...';
            audioPlayer.style.display = 'none';

            // Get ElevenLabs API key
            const result = await chrome.storage.sync.get(['elevenLabsApiKey']);
            const elevenLabsApiKey = result.elevenLabsApiKey;

            if (!elevenLabsApiKey) {
                throw new Error('Please configure your ElevenLabs API key in Options first');
            }

            // Find active LinkedIn tab
            const tabs = await chrome.tabs.query({
                url: ['*://www.linkedin.com/*', '*://linkedin.com/*']
            });

            if (tabs.length === 0) {
                throw new Error('No LinkedIn tabs found. Please open LinkedIn and process some posts first.');
            }

            // Get filtered posts data
            let postsData = null;
            for (const tab of tabs) {
                try {
                    audioStatus.textContent = 'Collecting filtered posts data...';
                    const response = await chrome.tabs.sendMessage(tab.id, { 
                        action: 'getFilteredPostsData' 
                    });
                    
                    if (response && response.success && response.posts && response.posts.length > 0) {
                        postsData = response.posts;
                        break;
                    }
                } catch (tabError) {
                    console.log('Tab not responsive:', tab.id);
                    continue;
                }
            }

            if (!postsData || postsData.length === 0) {
                throw new Error('No filtered posts found. Please visit LinkedIn and let the extension process some posts first.');
            }

            audioStatus.textContent = `Generating AI summary for ${postsData.length} posts...`;

            // Generate summary using background script
            const summaryResponse = await chrome.runtime.sendMessage({
                action: 'generateAudioSummary',
                posts: postsData,
                elevenLabsApiKey: elevenLabsApiKey
            });

            if (!summaryResponse.success) {
                throw new Error(summaryResponse.error || 'Failed to generate audio summary');
            }

            // Display audio player if we have audio data
            if (summaryResponse.audioBase64) {
                // Save the audio summary to storage
                await saveAudioSummary(summaryResponse.audioBase64, summaryResponse.summaryText || '', postsData.length);
                
                // Automatically download the audio file
                const audioBytes = Uint8Array.from(atob(summaryResponse.audioBase64), c => c.charCodeAt(0));
                const audioBlob = new Blob([audioBytes], { type: 'audio/mpeg' });
                const audioUrl = URL.createObjectURL(audioBlob);
                
                const a = document.createElement('a');
                a.href = audioUrl;
                a.download = `linkedin-summary-${new Date().toISOString().split('T')[0]}-${postsData.length}posts.mp3`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(audioUrl);
                
                audioPlayer.style.display = 'none';
                audioStatus.textContent = `🎧 Audio summary downloaded! (${postsData.length} posts) - Check previous summaries below to replay.`;
                audioStatus.style.color = '#4CAF50';
            } else if (summaryResponse.summaryText) {
                // No audio but we have text summary
                audioStatus.textContent = `Text summary generated! (${postsData.length} posts) - Configure ElevenLabs API key for audio.`;
                audioStatus.style.color = '#ffeb3b';
                audioPlayer.style.display = 'none';
            } else {
                throw new Error('No summary content received');
            }

        } catch (error) {
            console.error('Audio generation failed:', error);
            audioStatus.textContent = `Error: ${error.message}`;
            audioStatus.style.color = '#f44336';
        } finally {
            generateAudioBtn.disabled = false;
            generateAudioBtn.textContent = '🎧 Generate Audio Summary';
            
            // Clear status after 5 seconds
            setTimeout(() => {
                audioStatus.textContent = 'Ready to generate audio summary';
                audioStatus.style.color = '';
            }, 5000);
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