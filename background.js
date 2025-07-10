class PostAnalyzer {
  constructor() {
    console.log('🧠 Background: PostAnalyzer initializing...');
    this.ANTHROPIC_API_KEY = null;
    this.debugLog = [];
    this.initializeApiKey();
  }

  async initializeApiKey() {
    console.log('🧠 Background: Loading API key from storage...');
    const result = await chrome.storage.sync.get(['apiKey']);
    this.ANTHROPIC_API_KEY = result.apiKey;
    console.log('🧠 Background: API key loaded:', this.ANTHROPIC_API_KEY ? 'Yes' : 'No');
  }

  async logDebugData(postData, score, reasoning = '') {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      postData: {
        content: postData.content.substring(0, 200) + (postData.content.length > 200 ? '...' : ''),
        authorName: postData.authorName,
        authorTitle: postData.authorTitle,
        likes: postData.likes,
        comments: postData.comments,
        shares: postData.shares,
        hasMedia: postData.hasMedia,
        postLength: postData.postLength
      },
      score,
      reasoning
    };
    
    this.debugLog.push(logEntry);
    
    // Keep only last 50 entries to prevent memory issues
    if (this.debugLog.length > 50) {
      this.debugLog = this.debugLog.slice(-50);
    }
    
    // Save to file
    try {
      const logContent = this.debugLog.map(entry => 
        `=== ${entry.timestamp} ===\n` +
        `AUTHOR: ${entry.postData.authorName} (${entry.postData.authorTitle})\n` +
        `CONTENT: ${entry.postData.content}\n` +
        `ENGAGEMENT: ${entry.postData.likes} likes, ${entry.postData.comments} comments, ${entry.postData.shares} shares\n` +
        `MEDIA: ${entry.postData.hasMedia}, LENGTH: ${entry.postData.postLength} chars\n` +
        `SCORE: ${entry.score}/50\n` +
        `REASONING: ${entry.reasoning}\n\n`
      ).join('');
      
      // Create downloadable blob and save to local storage for now
      chrome.storage.local.set({
        'li_curator_debug_log': logContent
      });
      
      console.log('🧠 Background: Debug log updated, total entries:', this.debugLog.length);
    } catch (error) {
      console.error('🧠 Background: Error saving debug log:', error);
    }
  }

  async analyzePost(postData) {
    if (!this.ANTHROPIC_API_KEY) {
      await this.initializeApiKey();
      if (!this.ANTHROPIC_API_KEY) {
        console.log('🧠 Background: No API key - using default score');
        await this.logDebugData(postData, 25, 'No API key configured');
        return 25;
      }
    }

    const prompt = await this.buildAnalysisPrompt(postData);
    
    try {
      console.log('🧠 Background: Sending API request...');
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 50,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🧠 Background: API error:', response.status, errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const responseText = data.content[0].text.trim();
      console.log('🧠 Background: AI response:', responseText);
      
      // Better score extraction - try multiple patterns
      let score = 25; // Default
      
      // Try to find just a number
      const numberMatch = responseText.match(/\b(\d+)\b/);
      if (numberMatch) {
        score = parseInt(numberMatch[1]);
      }
      
      // Ensure score is in valid range
      const finalScore = Math.min(Math.max(score, 1), 50);
      
      console.log('🧠 Background: Extracted score:', finalScore);
      
      // Log debug data with full response
      await this.logDebugData(postData, finalScore, `Full response: "${responseText}" | Extracted: ${finalScore}`);
      
      return finalScore;
    } catch (error) {
      console.error('🧠 Background: Error analyzing post:', error);
      await this.logDebugData(postData, 25, `API Error: ${error.message}`);
      return 25; // Default score on error
    }
  }

  async buildAnalysisPrompt(postData) {
    // Get custom filtering preferences from settings
    let customFiltering = '';
    try {
      const result = await chrome.storage.sync.get(['customFiltering']);
      if (result.customFiltering && result.customFiltering.trim()) {
        customFiltering = result.customFiltering.trim();
      }
    } catch (error) {
      console.error('🧠 Background: Error getting custom filtering:', error);
    }

    let prompt = `Rate this LinkedIn post quality from 1-50. Be balanced - not everything is spam.

POST DATA:
- Text: "${postData.content}"
- Author: ${postData.authorName} (${postData.authorTitle})
- Length: ${postData.postLength} chars
- Media: ${postData.hasMedia}
- Engagement: ${postData.likes} likes, ${postData.comments} comments, ${postData.shares} shares`;

    // Add custom filtering preferences if they exist
    if (customFiltering) {
      prompt += `

USER PREFERENCES:
The user wants to see content that: ${customFiltering}

Please give HIGHER scores (35-50) to posts that match these preferences and LOWER scores (1-25) to posts that don't align with what the user wants to see.`;
    }

    prompt += `

SCORING GUIDELINES:
🔥 EXCELLENT (40-50): 
- Unique insights, valuable expertise
- Thought leadership, industry analysis
- Helpful tutorials, genuine knowledge sharing

✅ GOOD (30-39):
- Solid professional content
- Meaningful discussions, good engagement
- Career advice, industry news with insight

⚡ AVERAGE (20-29):
- Standard professional posts
- Basic insights, moderate value
- Personal updates with professional relevance

⚠️ POOR (10-19):
- Generic content, low effort
- Mild self-promotion mixed with value
- Basic announcements, simple updates

🚫 TERRIBLE (1-9):
- Heavy sales pitches, obvious ads
- Pure self-promotion with no value
- Spam, irrelevant, or harmful content

CONSIDER:
- Does this help other professionals?
- Is there genuine insight vs. just promotion?
- Quality of writing and engagement`;

    if (customFiltering) {
      prompt += `
- Does this match the user's specific interests and preferences?`;
    }

    prompt += `

Reply with ONLY the numerical score (1-50). Example: 35`;

    return prompt;
  }

  // Method to export debug log
  async exportDebugLog() {
    try {
      const result = await chrome.storage.local.get(['li_curator_debug_log']);
      return result.li_curator_debug_log || 'No debug data available';
    } catch (error) {
      console.error('🧠 Background: Error exporting debug log:', error);
      return 'Error exporting debug log';
    }
  }

  // Method to generate audio summary
  async generateAudioSummary(filteredPosts, elevenLabsApiKey) {
    if (!this.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured');
    }

    try {
      console.log('🧠 Background: Generating text summary for', filteredPosts.length, 'posts');
      
      // Generate newsreader-style summary text using Claude 4
      const summaryText = await this.generateSummaryText(filteredPosts);
      console.log('🧠 Background: Summary text generated, length:', summaryText.length);

      // Convert text to speech if ElevenLabs API key is provided
      if (elevenLabsApiKey && elevenLabsApiKey.trim()) {
        console.log('🧠 Background: Converting text to speech...');
        const base64Audio = await this.convertTextToSpeech(summaryText, elevenLabsApiKey);
        return {
          success: true,
          summaryText: summaryText,
          audioBase64: base64Audio
        };
      } else {
        console.log('🧠 Background: No ElevenLabs API key provided, returning text only');
        return {
          success: true,
          summaryText: summaryText,
          audioBase64: null
        };
      }
    } catch (error) {
      console.error('🧠 Background: Error generating audio summary:', error);
      throw error;
    }
  }

  // Generate newsreader-style summary text using Claude 4
  async generateSummaryText(filteredPosts) {
    const postsText = filteredPosts.map((post, index) => {
      return `Post ${index + 1}:
Author: ${post.authorName} (${post.authorTitle})
Content: ${post.content}
Engagement: ${post.likes} likes, ${post.comments} comments, ${post.shares} shares
${post.hasMedia ? 'Includes media content' : ''}
---`;
    }).join('\n\n');

    const prompt = `You are a professional news presenter creating a concise, engaging summary of LinkedIn posts for audio consumption. 

Here are ${filteredPosts.length} high-quality LinkedIn posts that have been curated and filtered:

${postsText}

Create a newsreader-style summary that:
- Starts with a brief overview of the key themes and trends
- Highlights the most valuable insights and professional perspectives
- Groups related content together logically
- Uses conversational, flowing language suitable for audio
- Keeps each post summary to 1-2 sentences maximum
- Ends with a brief conclusion about overall themes
- Aim for 2-3 minutes of speaking time (roughly 300-450 words)

Write in a professional but accessible tone, as if you're presenting the morning business news. Use transition phrases like "Meanwhile," "In related news," "Another interesting perspective comes from..." to create smooth flow.

Do not include any formatting, just pure text ready for text-to-speech conversion.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.content[0].text.trim();
  }

  // Convert text to speech using ElevenLabs API
  async convertTextToSpeech(text, apiKey) {
    const VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam voice - professional male voice
    const XI_API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

    const response = await fetch(XI_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API request failed: ${response.status} - ${errorText}`);
    }

    // Convert response to array buffer, then to base64 using a safe method
    const audioBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(audioBuffer);
    
    // Convert to base64 in chunks to avoid stack overflow
    let binaryString = '';
    const chunkSize = 8192; // Process in 8KB chunks
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, chunk);
    }
    
    const base64Audio = btoa(binaryString);
    return base64Audio;
  }
}

const analyzer = new PostAnalyzer();

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🧠 Background: Received message:', request.action);
  
  if (request.action === 'analyzePost') {
    console.log('🧠 Background: Analyzing post...');
    analyzer.analyzePost(request.postData)
      .then(score => {
        console.log('🧠 Background: Analysis complete, score:', score);
        sendResponse({ score });
      })
      .catch(error => {
        console.error('🧠 Background: Analysis error:', error);
        sendResponse({ score: 25 }); // Default score on error
      });
    return true; // Will respond asynchronously
  }
  
  if (request.action === 'testApiConnection') {
    console.log('🧠 Background: Testing API connection...');
    testApiConnection(request.apiKey)
      .then(success => {
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('🧠 Background: API test failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  }
  
  if (request.action === 'generateAudioSummary') {
    console.log('🧠 Background: Generating audio summary for', request.posts.length, 'posts');
    analyzer.generateAudioSummary(request.posts, request.elevenLabsApiKey)
      .then(result => {
        console.log('🧠 Background: Audio summary generated successfully');
        sendResponse(result);
      })
      .catch(error => {
        console.error('🧠 Background: Audio summary generation failed:', error);
        sendResponse({ 
          success: false, 
          error: error.message || 'Failed to generate audio summary'
        });
      });
    return true; // Will respond asynchronously
  }
  
  if (request.action === 'getFilteredPostsData') {
    console.log('🧠 Background: Requesting filtered posts from content script...');
    // Forward the request to the active tab's content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getFilteredPostsData' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('🧠 Background: Error getting filtered posts:', chrome.runtime.lastError);
            sendResponse({ success: false, error: 'Failed to get filtered posts from content script' });
          } else {
            console.log('🧠 Background: Received', response?.filteredPosts?.length || 0, 'filtered posts');
            sendResponse(response);
          }
        });
      } else {
        sendResponse({ success: false, error: 'No active tab found' });
      }
    });
    return true; // Will respond asynchronously
  }
  
  if (request.action === 'updateBadge') {
    console.log('🧠 Background: Updating badge:', request.count);
    chrome.action.setBadgeText({
      text: request.count > 0 ? request.count.toString() : '',
      tabId: sender.tab.id
    });
    chrome.action.setBadgeBackgroundColor({ color: '#ff6b6b' });
  }
});

// Test API connection function
async function testApiConnection(apiKey) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: 'Test message. Respond with just "OK".'
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    return true;
  } catch (error) {
    throw error;
  }
}

// Initialize extension settings on install
chrome.runtime.onInstalled.addListener(async () => {
  // Set default settings
  await chrome.storage.sync.set({
    enabled: true,
    threshold: 25,
    autoScroll: false,
    customFiltering: '',
    apiKey: '',
    postLimit: 50, // Added postLimit
    elevenLabsApiKey: '', // Added elevenLabsApiKey
    audioNotifications: true // Added audio notifications setting
  });
  
  // Open options page to set API key
  chrome.tabs.create({
    url: chrome.runtime.getURL('options.html')
  });
}); 