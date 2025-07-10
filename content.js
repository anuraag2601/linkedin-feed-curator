// Immediate verification that script is loading
console.log('🧠 LinkedIn Feed Curator: Content script loaded!');
console.log('🧠 Current URL:', window.location.href);
console.log('🧠 Is LinkedIn?', window.location.hostname.includes('linkedin.com'));

class LinkedInFeedCurator {
  constructor() {
    console.log('🧠 LinkedIn Feed Curator: Starting initialization...');
    this.isEnabled = true;
    this.threshold = 25;
    this.postLimit = 50;
    this.processedPosts = new Set();
    this.hiddenPostsCount = 0;
    this.visiblePosts = []; // Track posts that passed the filter
    this.observer = null;
    this.autoScrollEnabled = false;
    this.autoScrollInterval = null;
    this.isProcessing = false;
    this.lastScrollPosition = 0;
    this.limitReached = false;
    this.init();
  }

  async init() {
    console.log('🧠 LinkedIn Feed Curator: Initializing...');
    // Check if extension is enabled and get settings
    const result = await chrome.storage.sync.get(['enabled', 'threshold', 'autoScroll', 'postLimit']);
    this.isEnabled = result.enabled !== false; // Default to true
    this.threshold = result.threshold || 25;
    this.postLimit = result.postLimit || 50;
    this.autoScrollEnabled = result.autoScroll || false;
    
    console.log('🧠 Settings loaded:', { 
      enabled: this.isEnabled, 
      threshold: this.threshold, 
      autoScroll: this.autoScrollEnabled,
      postLimit: this.postLimit
    });

    if (this.isEnabled) {
      this.startObserving();
      this.processFeed();
      this.addControlButtons();
      
      if (this.autoScrollEnabled) {
        this.startAutoScroll();
      }
    }

    // Listen for storage changes (when user toggles extension or changes settings)
    chrome.storage.onChanged.addListener((changes) => {
      console.log('🧠 Storage changed:', changes);
      if (changes.enabled) {
        this.isEnabled = changes.enabled.newValue;
        if (this.isEnabled) {
          this.startObserving();
          this.processFeed();
          this.restoreHiddenPosts();
          this.addControlButtons();
        } else {
          this.stopObserving();
          this.restoreHiddenPosts();
          this.stopAutoScroll();
          this.removeControlButtons();
          this.removeAllScoreIndicators();
        }
      }
      
      if (changes.threshold) {
        this.threshold = changes.threshold.newValue;
        // Re-process all posts with new threshold
        this.reprocessWithNewThreshold();
      }

      if (changes.postLimit) {
        this.postLimit = changes.postLimit.newValue;
        this.limitReached = false; // Reset limit when it changes
        this.updateControlPanel();
      }

      if (changes.autoScroll) {
        this.autoScrollEnabled = changes.autoScroll.newValue;
        if (this.autoScrollEnabled && !this.limitReached) {
          this.startAutoScroll();
        } else {
          this.stopAutoScroll();
        }
      }
    });

    // Listen for messages from options/popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'exportMarkdown') {
        const markdown = this.generateMarkdownReport();
        sendResponse({ success: true, markdown: markdown });
      } else if (request.action === 'getFilteredPostsData') {
        sendResponse({ 
          success: true, 
          posts: this.visiblePosts.map(post => ({
            content: post.content,
            authorName: post.authorName,
            authorTitle: post.authorTitle,
            likes: post.likes,
            comments: post.comments,
            shares: post.shares,
            url: post.url || window.location.href,
            timestamp: post.timestamp || new Date().toISOString()
          }))
        });
      }
      return true;
    });
  }

  addControlButtons() {
    // Remove existing buttons first
    this.removeControlButtons();

    // Add control panel to LinkedIn header
    const headerContainer = document.querySelector('.global-nav__content, .authentication-nav, header') || 
                           document.querySelector('.scaffold-layout__header') ||
                           document.body;

    if (headerContainer) {
      const controlPanel = document.createElement('div');
      controlPanel.id = 'li-curator-controls';
      controlPanel.innerHTML = `
        <div style="
          position: fixed;
          top: 80px;
          right: 20px;
          z-index: 9999;
          background: white;
          border: 2px solid #0073b1;
          border-radius: 12px;
          padding: 15px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          min-width: 200px;
        ">
          <div style="font-weight: bold; color: #0073b1; margin-bottom: 10px;">
            📊 Feed Curator
          </div>
          <div style="margin-bottom: 8px;">
            Hidden: <span id="hidden-count" style="font-weight: bold; color: #ff6b6b;">${this.hiddenPostsCount}</span>
          </div>
          <div style="margin-bottom: 8px;">
            Visible: <span id="visible-count" style="font-weight: bold; color: #28a745;">${this.visiblePosts.length}</span>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 10px;">
            <button id="auto-scroll-btn" style="
              background: ${this.autoScrollEnabled ? '#28a745' : '#6c757d'};
              color: white;
              border: none;
              padding: 6px 12px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 12px;
              font-weight: 500;
            ">
              ${this.autoScrollEnabled ? '⏸️ Stop' : '▶️ Auto'} Scroll
            </button>
            <button id="export-markdown-btn" style="
              background: #0073b1;
              color: white;
              border: none;
              padding: 6px 12px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 12px;
              font-weight: 500;
            ">
              📄 Export
            </button>
          </div>
        </div>
      `;

      headerContainer.appendChild(controlPanel);

      // Add event listeners
      document.getElementById('auto-scroll-btn').addEventListener('click', () => {
        this.toggleAutoScroll();
      });

      document.getElementById('export-markdown-btn').addEventListener('click', () => {
        this.exportFilteredPosts();
      });
    }
  }

  removeControlButtons() {
    const existingPanel = document.getElementById('li-curator-controls');
    if (existingPanel) {
      existingPanel.remove();
    }
  }

  updateControlPanel() {
    const hiddenCount = document.getElementById('hidden-count');
    const visibleCount = document.getElementById('visible-count');
    const autoScrollBtn = document.getElementById('auto-scroll-btn');

    if (hiddenCount) hiddenCount.textContent = this.hiddenPostsCount;
    if (visibleCount) visibleCount.textContent = this.visiblePosts.length;
    
    if (autoScrollBtn) {
      autoScrollBtn.style.background = this.autoScrollEnabled ? '#28a745' : '#6c757d';
      autoScrollBtn.textContent = this.autoScrollEnabled ? '⏸️ Stop Scroll' : '▶️ Auto Scroll';
    }
  }

  startAutoScroll() {
    if (this.autoScrollInterval || this.limitReached) return;

    console.log('🧠 🔄 Starting auto-scroll...');
    this.autoScrollInterval = setInterval(() => {
      if (this.isProcessing || this.limitReached) {
        if (this.limitReached) {
          this.stopAutoScroll();
        }
        console.log('🧠 ⏳ Still processing posts or limit reached, skipping scroll...');
        return;
      }

      const currentScrollPos = window.pageYOffset;
      
      // Only scroll if we haven't moved much manually
      if (Math.abs(currentScrollPos - this.lastScrollPosition) < 100) {
        window.scrollBy(0, 300); // Scroll down 300px
        this.lastScrollPosition = window.pageYOffset;
        
        // Trigger feed processing after scroll
        setTimeout(() => {
          this.processFeed();
        }, 1000);
      } else {
        this.lastScrollPosition = currentScrollPos;
      }
    }, 3000); // Scroll every 3 seconds

    this.updateControlPanel();
  }

  stopAutoScroll() {
    if (this.autoScrollInterval) {
      console.log('🧠 ⏹️ Stopping auto-scroll...');
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
    this.updateControlPanel();
  }

  toggleAutoScroll() {
    this.autoScrollEnabled = !this.autoScrollEnabled;
    
    // Save to storage
    chrome.storage.sync.set({ autoScroll: this.autoScrollEnabled });

    if (this.autoScrollEnabled) {
      this.startAutoScroll();
    } else {
      this.stopAutoScroll();
    }
  }

  async exportFilteredPosts() {
    console.log('🧠 📄 Exporting filtered posts to markdown...');
    
    if (this.visiblePosts.length === 0) {
      alert('No filtered posts to export yet. Browse LinkedIn to generate some data first!');
      return;
    }

    const markdown = this.generateMarkdownReport();
    
    // Create and download the file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkedin-filtered-posts-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('🧠 ✅ Markdown file downloaded successfully');
  }

  generateMarkdownReport() {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    
    let report = `# LinkedIn Feed Curator Report\n\n`;
    report += `**Generated:** ${dateStr} at ${timeStr}\n`;
    report += `**Total Filtered Posts:** ${this.visiblePosts.length}\n`;
    report += `**Quality Threshold:** ${this.threshold}/50\n`;
    report += `**Posts Hidden:** ${this.hiddenPostsCount}\n\n`;
    
    if (this.visiblePosts.length === 0) {
      report += `No posts met your quality criteria yet. Try lowering your threshold or processing more content.\n`;
      return report;
    }
    
    report += `## High-Quality Posts (${this.visiblePosts.length} posts)\n\n`;
    
    this.visiblePosts.forEach((post, index) => {
      const score = post.score || 'N/A';
      report += `### ${index + 1}. ${post.authorName || 'Unknown Author'}\n`;
      if (post.authorTitle) {
        report += `**Title:** ${post.authorTitle}\n`;
      }
      report += `**Quality Score:** ${score}/50\n`;
      if (post.likes || post.comments || post.shares) {
        report += `**Engagement:** ${post.likes || 0} likes, ${post.comments || 0} comments, ${post.shares || 0} shares\n`;
      }
      report += `\n${post.content}\n\n`;
      report += `---\n\n`;
    });
    
    report += `\n*This report was generated by LinkedIn Feed Curator extension.*`;
    return report;
  }

  async reprocessWithNewThreshold() {
    console.log('🧠 🔄 Reprocessing posts with new threshold:', this.threshold);
    
    // Clear processed posts to allow reprocessing
    this.processedPosts.clear();
    this.visiblePosts = [];
    
    // Remove all existing indicators
    this.removeAllScoreIndicators();
    this.removeAllHiddenPostIndicators();
    
    // Reset counters
    this.hiddenPostsCount = 0;
    
    // Reprocess the feed
    this.processFeed();
  }

  startObserving() {
    if (this.observer) return;

    console.log('🧠 Starting DOM observer...');
    this.observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          shouldProcess = true;
        }
      });
      
      if (shouldProcess) {
        console.log('🧠 DOM changes detected, processing feed in 1 second...');
        setTimeout(() => this.processFeed(), 1000);
      }
    });

    const feedContainer = document.querySelector('[role="main"]') || document.body;
    this.observer.observe(feedContainer, {
      childList: true,
      subtree: true
    });
    console.log('🧠 DOM observer started successfully');
  }

  stopObserving() {
    if (this.observer) {
      console.log('🧠 Stopping DOM observer...');
      this.observer.disconnect();
      this.observer = null;
    }
  }

  async processFeed() {
    if (!this.isEnabled) {
      console.log('🧠 Extension disabled, skipping feed processing');
      return;
    }

    console.log('🧠 ==> PROCESSING LINKEDIN FEED...');
    
    // Updated selectors based on LinkedIn's current structure
    const selectors = [
      '[data-activity-urn]',                                    // Main activity posts
      'article[data-id*="urn:li:activity:"]',                  // Alternative article selector
      '.feed-shared-update-v2',                                // Legacy selector
      '.main-feed-activity-card',                              // Current main feed cards
      'div[data-id="main-feed-card"]'                          // Another current selector
    ];
    
    let posts = [];
    let selectorUsed = '';
    
    // Try each selector until we find posts
    for (const selector of selectors) {
      posts = document.querySelectorAll(selector);
      console.log(`🧠 Trying selector "${selector}": found ${posts.length} posts`);
      if (posts.length > 0) {
        selectorUsed = selector;
        break;
      }
    }
    
    console.log(`🧠 FINAL RESULT: Found ${posts.length} posts using selector: "${selectorUsed}"`);
    
    if (posts.length === 0) {
      console.log('🧠 ❌ NO POSTS FOUND - LinkedIn structure may have changed');
      // Try to find any feed-related elements for debugging
      const feedElements = document.querySelectorAll('.feed-container, .scaffold-finite-scroll__content, [class*="feed"]');
      console.log(`🧠 DEBUG: Found ${feedElements.length} feed-related elements for debugging`);
      if (feedElements.length > 0) {
        console.log('🧠 DEBUG: First feed element:', feedElements[0]);
      }
      return;
    }
    
    console.log(`🧠 ✅ SUCCESS: Processing ${posts.length} posts...`);
    
    let processedCount = 0;
    let skippedCount = 0;
    
    for (const post of posts) {
      const postId = this.getPostId(post);
      if (!postId) {
        console.log('🧠 ⚠️ Skipping post without ID');
        skippedCount++;
        continue;
      }
      
      if (this.processedPosts.has(postId)) {
        skippedCount++;
        continue;
      }

      console.log(`🧠 📝 Processing NEW post: ${postId.substring(0, 50)}...`);
      await this.analyzeAndFilterPost(post);
      processedCount++;
    }
    
    console.log(`🧠 ✅ PROCESSING COMPLETE: ${processedCount} new posts analyzed, ${skippedCount} skipped (already processed)`);
    this.checkPostLimit();
  }

  getPostId(post) {
    // Try multiple ways to get a unique ID for the post
    const selectors = [
      'data-activity-urn',
      'data-id',
      'data-urn'
    ];
    
    for (const attr of selectors) {
      const id = post.getAttribute(attr);
      if (id) {
        console.log(`🧠 Found post ID using ${attr}: ${id.substring(0, 50)}...`);
        return id;
      }
    }
    
    // Fallback: use a combination of content and position
    const fallbackId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🧠 No standard ID found, using fallback: ${fallbackId}`);
    return fallbackId;
  }

  async analyzeAndFilterPost(postElement) {
    if (!this.isEnabled) return;

    const postId = this.getPostId(postElement);
    if (!postId) {
      console.log('🧠 ⚠️ Skipping post without ID');
      return;
    }

    if (this.processedPosts.has(postId)) {
      return; // Already processed
    }

    this.isProcessing = true;
    this.processedPosts.add(postId);

    try {
      console.log(`🧠 📝 Analyzing post: ${postId}`);
      
      const postData = this.extractPostData(postElement);
      console.log('🧠 📊 Extracted post data:', {
        content_length: postData.content?.length || 0,
        author: postData.authorName,
        has_media: postData.hasMedia,
        engagement: {
          likes: postData.likes,
          comments: postData.comments,
          shares: postData.shares
        }
      });

      if (!postData.content && !postData.hasMedia) {
        console.log('🧠 ⚠️ Skipping post with no meaningful content or media');
        this.isProcessing = false;
        return;
      }

      // Update total processed count
      await this.updateTotalProcessedStats();

      const score = await this.getPostQualityScore(postData);
      console.log(`🧠 🎯 Post scored: ${score}/50 (threshold: ${this.threshold})`);

      if (score < this.threshold) {
        console.log(`🧠 ❌ HIDING POST: Score ${score} < threshold ${this.threshold}`);
        this.hidePost(postElement, score);
        await this.updateDailyHiddenStats();
      } else {
        console.log(`🧠 ✅ KEEPING POST: Score ${score} >= threshold ${this.threshold}`);
        
        // Add post to visible posts array
        const visiblePost = { 
          ...postData, 
          score, 
          postId,
          timestamp: new Date().toISOString()
        };
        
        // Remove any existing entry for this post
        this.visiblePosts = this.visiblePosts.filter(p => p.postId !== postId);
        this.visiblePosts.push(visiblePost);
        
        // Show score indicator on visible post
        this.showScoreIndicator(postElement, score);
        
        // Update control panel counts
        this.updateControlPanel();
        
        // Update badge with visible posts count
        this.updateBadge();
      }
    } catch (error) {
      console.error('🧠 💥 Error analyzing post:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  showScoreIndicator(postElement, score) {
    // Remove any existing score indicator
    const existingIndicator = postElement.querySelector('.li-curator-score-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }

    // Create score indicator
    const scoreIndicator = document.createElement('div');
    scoreIndicator.className = 'li-curator-score-indicator';
    
    // Determine color and emoji based on score
    let color, emoji;
    if (score >= 40) {
      color = '#ff6b6b'; // Red for excellent
      emoji = '🔥';
    } else if (score >= 35) {
      color = '#ffa500'; // Orange for very good
      emoji = '⭐';
    } else if (score >= 30) {
      color = '#28a745'; // Green for good
      emoji = '✅';
    } else {
      color = '#17a2b8'; // Blue for average
      emoji = '⚡';
    }

    scoreIndicator.innerHTML = `
      <div style="
        position: absolute;
        top: 10px;
        right: 10px;
        background: ${color};
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: bold;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        ${emoji} ${score}
      </div>
    `;

    // Make sure the post element has relative positioning
    const currentPosition = window.getComputedStyle(postElement).position;
    if (currentPosition === 'static') {
      postElement.style.position = 'relative';
    }

    postElement.appendChild(scoreIndicator);
  }

  extractPostData(postElement) {
    try {
      console.log('🔍 Extracting post data...');

      // Extract text content with updated selectors for 2024
      let content = '';
      const textSelectors = [
        '.attributed-text-segment-list__content',
        '.update-components-text .attributed-text-segment-list__content',
        '.feed-shared-text .attributed-text-segment-list__content',
        '.update-components-text span[dir="ltr"]',
        '.feed-shared-text',
        '.update-components-text'
      ];

      for (const selector of textSelectors) {
        const element = postElement.querySelector(selector);
        if (element && element.innerText?.trim()) {
          content = element.innerText.trim();
          console.log(`✅ Found text content using: ${selector}`);
          break;
        }
      }

      // Fallback: search for any substantial text content
      if (!content) {
        console.log('🔍 Trying fallback text extraction...');
        const allSpans = postElement.querySelectorAll('span');
        for (const span of allSpans) {
          const text = span.innerText?.trim();
          if (text && text.length > 50 && !text.includes('•') && !text.includes('like') && !text.includes('comment')) {
            content = text;
            console.log('✅ Found text via fallback method');
            break;
          }
        }
      }

      // Extract author name using the working selector from DOM inspection
      let authorName = '';
      let authorTitle = '';
      
      // Strategy 1: Use the link selector that works (from our successful test)
      const authorLink = postElement.querySelector('a[href*="/in/"]');
      if (authorLink && authorLink.innerText?.trim()) {
        authorName = authorLink.innerText.trim();
        console.log(`✅ Found author via link: ${authorName}`);
        
        // Try to find author title near the author name
        const authorContainer = authorLink.closest('.update-components-actor, .feed-shared-actor');
        if (authorContainer) {
          const titleSelectors = [
            '.update-components-actor__description',
            '.feed-shared-actor__description',
            '.update-components-actor__meta',
            '.feed-shared-actor__meta'
          ];
          
          for (const selector of titleSelectors) {
            const titleElement = authorContainer.querySelector(selector);
            if (titleElement && titleElement.innerText?.trim()) {
              authorTitle = titleElement.innerText.trim();
              console.log(`✅ Found author title: ${authorTitle}`);
              break;
            }
          }
        }
      }

      // Strategy 2: Enhanced fallback author detection with multiple approaches
      if (!authorName) {
        console.log('🔍 Trying enhanced fallback author extraction...');
        
        // Try multiple author selectors in order of reliability
        const authorSelectors = [
          // Visible text selectors
          '.update-components-actor__name span:not(.visually-hidden)',
          '.feed-shared-actor__name span:not(.visually-hidden)',
          '.update-components-actor__name .t-black',
          '.feed-shared-actor__name .t-black',
          
          // Hidden but accessible selectors
          '.update-components-actor__name .visually-hidden',
          '.update-components-actor__name span[aria-hidden="true"]',
          '.feed-shared-actor__name .visually-hidden',
          
          // General container selectors
          '.update-components-actor__name',
          '.feed-shared-actor__name',
          '.update-components-actor__name span',
          '.feed-shared-actor__name span',
          
          // Broader search
          '.update-components-actor span[dir="ltr"]',
          '.feed-shared-actor span[dir="ltr"]',
          '.update-components-actor a span',
          '.feed-shared-actor a span'
        ];

        for (const selector of authorSelectors) {
          const elements = postElement.querySelectorAll(selector);
          for (const element of elements) {
            const text = element.innerText?.trim();
            if (text && text.length > 2 && text.length < 100 && 
                !text.includes('•') && !text.includes('like') && !text.includes('comment') && 
                !text.includes('share') && !text.includes('follow') && !text.includes('@') &&
                !text.match(/^\d+/) && !text.includes('ago') && !text.includes('hour') && 
                !text.includes('day') && !text.includes('week') && !text.includes('month')) {
              authorName = text;
              console.log(`✅ Found author via fallback (${selector}): ${authorName}`);
              break;
            }
          }
          if (authorName) break;
        }
      }

      // Strategy 3: Search for author in any clickable profile links if still not found
      if (!authorName) {
        console.log('🔍 Trying profile link text extraction...');
        const profileLinks = postElement.querySelectorAll('a[href*="/in/"], a[href*="linkedin.com/in/"]');
        for (const link of profileLinks) {
          const linkText = link.innerText?.trim();
          if (linkText && linkText.length > 2 && linkText.length < 100 && 
              !linkText.includes('linkedin.com') && !linkText.includes('/in/') &&
              !linkText.match(/^\d+/) && !linkText.includes('•')) {
            authorName = linkText;
            console.log(`✅ Found author via profile link text: ${authorName}`);
            break;
          }
        }
      }

      // Strategy 4: Look for any strong/bold text that might be a name
      if (!authorName) {
        console.log('🔍 Trying bold/strong text extraction...');
        const boldSelectors = ['strong', 'b', '.t-bold', '.t-16', '.t-black--light'];
        for (const selector of boldSelectors) {
          const elements = postElement.querySelectorAll(selector);
          for (const element of elements) {
            const text = element.innerText?.trim();
            if (text && text.length > 2 && text.length < 50 && 
                !text.includes('•') && !text.includes('like') && !text.includes('comment') &&
                !text.match(/^\d+/) && text.match(/^[A-Za-z\s\-'\.]+$/)) {
              authorName = text;
              console.log(`✅ Found author via bold text (${selector}): ${authorName}`);
              break;
            }
          }
          if (authorName) break;
        }
      }

      // Extract engagement metrics with improved detection
      let likes = 0;
      let comments = 0;
      let shares = 0;
      
      // Strategy 1: Look for aria-labels with engagement counts
      const buttons = postElement.querySelectorAll('button');
      for (const button of buttons) {
        const ariaLabel = button.getAttribute('aria-label');
        if (ariaLabel) {
          // Extract likes from aria-label patterns
          const likeMatch = ariaLabel.match(/(\d+)\s*(?:people\s+)?(?:liked|like|reaction)/i);
          if (likeMatch) {
            likes = parseInt(likeMatch[1]);
            console.log(`✅ Found likes from aria-label: ${likes}`);
          }
          
          // Extract comments from aria-label patterns
          const commentMatch = ariaLabel.match(/(\d+)\s*comment/i);
          if (commentMatch) {
            comments = parseInt(commentMatch[1]);
            console.log(`✅ Found comments from aria-label: ${comments}`);
          }
          
          // Extract shares from aria-label patterns
          const shareMatch = ariaLabel.match(/(\d+)\s*(?:share|repost)/i);
          if (shareMatch) {
            shares = parseInt(shareMatch[1]);
            console.log(`✅ Found shares from aria-label: ${shares}`);
          }
        }
      }
      
      // Strategy 2: Look for engagement in social action containers
      const socialContainers = [
        '.update-components-footer__social-actions',
        '.feed-shared-social-action-bar',
        '.update-components-footer',
        '.feed-shared-footer'
      ];
      
      for (const containerSelector of socialContainers) {
        const container = postElement.querySelector(containerSelector);
        if (container) {
          console.log(`✅ Found social container: ${containerSelector}`);
          
          // Look for any spans with numbers that might be engagement counts
          const spans = container.querySelectorAll('span');
          for (const span of spans) {
            const text = span.innerText?.trim();
            if (text && text.match(/^\d+$/)) {
              const num = parseInt(text);
              console.log(`🔢 Found number in social container: ${num}`);
              
              // Heuristic: assume first number is likes, second is comments
              if (likes === 0) {
                likes = num;
              } else if (comments === 0) {
                comments = num;
              }
            }
          }
          break;
        }
      }
      
      // Strategy 3: Parse all numbers from post and make educated guesses
      if (likes === 0 && comments === 0) {
        console.log('🔍 Trying numeric engagement extraction...');
        const allText = postElement.innerText;
        const numbers = allText.match(/\b\d+\b/g);
        if (numbers) {
          const nums = numbers.map(n => parseInt(n)).filter(n => n > 0 && n < 10000);
          if (nums.length >= 1) {
            likes = nums[0];
            console.log(`🔢 Guessed likes: ${likes}`);
          }
          if (nums.length >= 2) {
            comments = nums[1];
            console.log(`🔢 Guessed comments: ${comments}`);
          }
        }
      }

      // Check for media content
      const hasMedia = !!(
        postElement.querySelector('img, video, .feed-shared-image, .feed-shared-video, .update-components-image, .update-components-video, [data-test-id="media"]') ||
        postElement.querySelector('.feed-shared-article, .update-components-article') ||
        postElement.querySelector('.feed-shared-poll, .update-components-poll')
      );

      console.log(`📊 Extracted data - Content: ${content.length} chars, Author: "${authorName}", Likes: ${likes}, Comments: ${comments}, Media: ${hasMedia}`);

      const postData = {
        content: content,
        authorName: authorName,
        authorTitle: authorTitle,
        likes: likes,
        comments: comments,
        shares: shares,
        hasMedia: hasMedia,
        postLength: content.length
      };

      // Only process posts with meaningful content or media
      if (!content && !hasMedia) {
        console.log('⚠️ Skipping post - no meaningful content or media found');
        return null;
      }

      return postData;

    } catch (error) {
      console.error('❌ Error extracting post data:', error);
      return null;
    }
  }

  extractNumber(text) {
    if (!text) return 0;
    const match = text.match(/(\d+(?:,\d+)*)/);
    return match ? parseInt(match[1].replace(/,/g, '')) : 0;
  }

  async getPostQualityScore(postData) {
    try {
      console.log('🧠 📤 Sending message to background script for AI analysis...');
      const response = await chrome.runtime.sendMessage({
        action: 'analyzePost',
        postData: postData
      });
      
      console.log('🧠 📥 Received response from background script:', response);
      return response.score || 0;
    } catch (error) {
      console.error('🧠 ❌ Error getting quality score:', error);
      return this.threshold; // Default to threshold if analysis fails (don't hide)
    }
  }

  hidePost(postElement, score) {
    console.log(`🧠 🚫 Hiding post with score ${score}`);
    postElement.style.display = 'none';
    postElement.dataset.curatorHidden = 'true';
    postElement.dataset.curatorScore = score;
    
    // Create hidden post indicator
    const indicator = document.createElement('div');
    indicator.className = 'li-curator-hidden-post';
    indicator.dataset.curatorIndicator = 'true';
    indicator.innerHTML = `
      <div class="li-curator-hidden-content">
        <span class="li-curator-icon">🚫</span>
        <span class="li-curator-text">Low quality post hidden (Score: ${score}/${this.threshold} threshold)</span>
        <button class="li-curator-show-btn" data-post-id="${this.processedPosts.size}">Show anyway</button>
      </div>
    `;
    
    // Add click handler to show post
    indicator.querySelector('.li-curator-show-btn').addEventListener('click', () => {
      console.log('🧠 👁️ User clicked to show hidden post');
      postElement.style.display = 'block';
      postElement.removeAttribute('data-curator-hidden');
      indicator.remove();
      this.hiddenPostsCount--;
      this.updateBadge();
    });
    
    postElement.parentNode.insertBefore(indicator, postElement);
    this.hiddenPostsCount++;
    this.updateBadge();
    console.log(`🧠 ✅ Post hidden successfully. Total hidden: ${this.hiddenPostsCount}`);
  }

  restoreHiddenPosts() {
    console.log('🧠 🔄 Restoring all hidden posts...');
    // Show all hidden posts
    const hiddenPosts = document.querySelectorAll('[data-curator-hidden="true"]');
    hiddenPosts.forEach(post => {
      post.style.display = 'block';
      post.removeAttribute('data-curator-hidden');
      post.removeAttribute('data-curator-score');
    });
    
    // Remove all indicators
    const indicators = document.querySelectorAll('[data-curator-indicator="true"]');
    indicators.forEach(indicator => indicator.remove());
    
    console.log(`🧠 ✅ Restored ${hiddenPosts.length} hidden posts`);
    this.hiddenPostsCount = 0;
    this.updateBadge();
  }

  async updateDailyHiddenStats() {
    try {
      const today = new Date().toDateString();
      const result = await chrome.storage.local.get(['daily_stats']);
      const dailyStats = result.daily_stats || {};
      
      if (!dailyStats[today]) {
        dailyStats[today] = { hidden: 0, processed: 0 };
      }
      
      dailyStats[today].hidden++;
      await chrome.storage.local.set({ daily_stats: dailyStats });
      
      console.log(`📊 Updated daily hidden stats: ${dailyStats[today].hidden} hidden today`);
    } catch (error) {
      console.error('Error updating daily hidden stats:', error);
    }
  }

  async updateTotalProcessedStats() {
    try {
      const today = new Date().toDateString();
      const result = await chrome.storage.local.get(['daily_stats', 'total_processed']);
      const dailyStats = result.daily_stats || {};
      const totalProcessed = (result.total_processed || 0) + 1;
      
      if (!dailyStats[today]) {
        dailyStats[today] = { hidden: 0, processed: 0 };
      }
      
      dailyStats[today].processed++;
      
      await chrome.storage.local.set({ 
        daily_stats: dailyStats,
        total_processed: totalProcessed
      });
      
      console.log(`📊 Updated processed stats: ${dailyStats[today].processed} processed today, ${totalProcessed} total`);
    } catch (error) {
      console.error('Error updating processed stats:', error);
    }
  }

  updateBadge() {
    chrome.runtime.sendMessage({
      action: 'updateBadge',
      count: this.visiblePosts.length
    });
  }

  removeAllScoreIndicators() {
    const scoreIndicators = document.querySelectorAll('.li-curator-score-indicator');
    scoreIndicators.forEach(indicator => indicator.remove());
  }

  removeAllHiddenPostIndicators() {
    const hiddenIndicators = document.querySelectorAll('.li-curator-hidden-post');
    hiddenIndicators.forEach(indicator => indicator.remove());
  }

  checkPostLimit() {
    if (this.visiblePosts.length >= this.postLimit && !this.limitReached) {
      this.limitReached = true;
      this.stopAutoScroll();
      this.showPostLimitNotification();
      console.log(`🧠 Post limit reached: ${this.visiblePosts.length}/${this.postLimit}`);
    }
  }

  showPostLimitNotification() {
    // Play soft audio notification first
    this.playCompletionAudioNotification();
    
    // Create notification overlay
    const notification = document.createElement('div');
    notification.id = 'li-curator-limit-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #0073b1 0%, #005885 100%);
        color: white;
        padding: 30px;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 420px;
        z-index: 10000;
        animation: slideInScale 0.3s ease-out;
      ">
        <div style="font-size: 48px; margin-bottom: 16px;">🎯</div>
        <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">
          Target Reached!
        </h2>
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.5; opacity: 0.9;">
          Successfully collected <strong>${this.visiblePosts.length}</strong> high-quality posts<br>
          Auto-scroll has been paused
        </p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button id="continue-scrolling" style="
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.3);
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">Continue Scrolling</button>
          <button id="view-posts" style="
            background: rgba(255, 255, 255, 0.9);
            color: #0073b1;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">View Posts</button>
          <button id="close-notification" style="
            background: transparent;
            color: rgba(255, 255, 255, 0.7);
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">Close</button>
        </div>
      </div>
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
      "></div>
    `;

    document.body.appendChild(notification);

    // Add event listeners
    document.getElementById('continue-scrolling').addEventListener('click', () => {
      this.limitReached = false;
      this.startAutoScroll();
      notification.remove();
    });

    document.getElementById('view-posts').addEventListener('click', () => {
      this.exportFilteredPosts();
      notification.remove();
    });

    document.getElementById('close-notification').addEventListener('click', () => {
      notification.remove();
    });

    // Auto-close after 10 seconds
    setTimeout(() => {
      if (document.getElementById('li-curator-limit-notification')) {
        notification.remove();
      }
    }, 10000);
  }

  async playCompletionAudioNotification() {
    try {
      // Check if audio notifications are enabled
      const result = await chrome.storage.sync.get(['audioNotifications']);
      const audioEnabled = result.audioNotifications !== false; // Default to true
      
      if (!audioEnabled) {
        console.log('🧠 🔇 Audio notifications disabled by user');
        return;
      }

      // Create a soft, pleasant notification sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create a sequence of gentle tones for a pleasant notification
      const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 - major chord
      const duration = 0.15; // Each tone duration in seconds
      const gap = 0.05; // Gap between tones
      
      frequencies.forEach((frequency, index) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          // Soft sine wave for pleasant sound
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
          
          // Gentle volume envelope
          const now = audioContext.currentTime;
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(0.08, now + 0.02); // Soft attack
          gainNode.gain.linearRampToValueAtTime(0.06, now + duration * 0.7); // Sustain
          gainNode.gain.linearRampToValueAtTime(0, now + duration); // Gentle release
          
          oscillator.start(now);
          oscillator.stop(now + duration);
        }, index * (duration + gap) * 1000);
      });
      
      console.log('🧠 🎵 Played completion audio notification');
      
    } catch (error) {
      console.log('🧠 Audio notification not available:', error.message);
      // Fallback: create a simple beep with oscillator if Web Audio API partially works
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        
        const now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.1, now + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
        
        oscillator.start(now);
        oscillator.stop(now + 0.2);
        
        console.log('🧠 🎵 Played fallback audio notification');
      } catch (fallbackError) {
        console.log('🧠 Silent mode - audio notification disabled');
      }
    }
  }
}

// Add message listener for communication with popup and options
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'exportMarkdown') {
    console.log('🧠 Received exportMarkdown request from', sender.tab ? 'popup' : 'options');
    
    // Find the curator instance and export
    const curatorInstance = window.linkedInCurator;
    if (curatorInstance) {
      curatorInstance.exportFilteredPosts()
        .then(() => {
          sendResponse({ success: true, message: 'Markdown export completed' });
        })
        .catch((error) => {
          console.error('❌ Export failed:', error);
          sendResponse({ success: false, error: error.message });
        });
    } else {
      sendResponse({ success: false, error: 'Curator not initialized' });
    }
    
    return true; // Keep message channel open for async response
  }
});

// Initialize the curator when DOM is ready
console.log('🧠 Setting up DOM ready listener...');
if (document.readyState === 'loading') {
  console.log('🧠 DOM still loading, waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🧠 DOM loaded, initializing curator...');
    window.linkedInCurator = new LinkedInFeedCurator();
  });
} else {
  console.log('🧠 DOM already loaded, initializing curator immediately...');
  window.linkedInCurator = new LinkedInFeedCurator();
} 