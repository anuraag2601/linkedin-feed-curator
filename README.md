# LinkedIn Feed Curator

An AI-powered Chrome extension that filters LinkedIn feed posts based on quality, helping you focus on high-value content with advanced features for scoring, auto-scrolling, content export, **AI-generated audio summaries**, and **smart audio notifications**.

## 🚀 Key Features

### 🎧 **AI Audio Summaries (NEW)**
- **Intelligent Audio Generation**: Generate AI-powered audio summaries of your filtered LinkedIn posts using ElevenLabs text-to-speech
- **Persistent Audio Storage**: Save audio summaries to browser storage with automatic download
- **Audio History Management**: View, replay, and manage previously generated summaries with date/time stamps
- **One-Click Playback**: Play stored audio summaries directly from the popup interface
- **Download & Delete**: Download audio files as MP3s or delete unwanted summaries
- **Smart Duration Estimation**: Automatic calculation of summary duration based on content length

### 🔔 **Smart Audio Notifications (NEW)**
- **Auto-Scroll Completion Alerts**: Gentle audio notification when target post limit is reached
- **Pleasant 3-Tone Sequence**: Soft major chord (C5-E5-G5) notification using Web Audio API
- **User-Controllable**: Enable/disable audio notifications in extension settings
- **Non-Intrusive**: Subtle volume levels designed not to disturb your workflow
- **Graceful Fallback**: Works even if Web Audio API features aren't fully supported

### 🧠 **AI-Powered Content Analysis**
- **Dual AI Integration**: Uses Anthropic's Claude AI for content analysis and ElevenLabs for audio generation
- **Real-time Filtering**: Automatically hides low-quality posts as you scroll
- **Post Score Display**: Visual indicators showing quality scores with color-coded emojis
- **Custom Filtering**: Keyword-based filtering for personalized content preferences

### ⚡ **Advanced Automation**
- **Auto-Scroll Processing**: Automatically scrolls to process more posts without manual intervention
- **Smart Post Limiting**: Configurable limits to prevent infinite scrolling with audio completion alerts
- **Real-Time Statistics**: Live display of hidden/visible post counts with toggle controls

### 📊 **Export & Reporting**
- **Markdown Export**: Export filtered posts to downloadable markdown files with comprehensive statistics
- **Audio Summary Export**: Automatic download of generated audio summaries as MP3 files
- **Session Analytics**: Detailed reports including post statistics, scores, and engagement metrics

## 📋 Prerequisites

### Required API Keys
1. **Anthropic API Key**: For content analysis - Get from [Anthropic Console](https://console.anthropic.com/)
2. **ElevenLabs API Key**: For audio summaries - Get from [ElevenLabs Platform](https://elevenlabs.io/)

**Cost Considerations:**
- **Anthropic**: ~$0.0001-0.0005 per post analyzed
- **ElevenLabs**: ~$0.0001-0.0002 per character converted to speech
- **Typical Session**: 100-500 posts + audio summary ≈ $0.02-0.30 total

## 🛠 Installation & Setup

### Step 1: Install Extension
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked" and select the `LI feed curator` folder

### Step 2: Configure API Keys
1. Click the extension icon in your toolbar
2. Click "⚙️ Options" to open the configuration page
3. Enter your **Anthropic API key** for content analysis
4. Enter your **ElevenLabs API key** for audio summaries
5. Test both connections and save settings

### Step 3: Customize Settings
- **Quality Threshold**: Adjust filtering sensitivity (1-50 scale)
- **Auto-Scroll**: Enable automatic feed processing
- **Post Limit**: Set maximum posts to process per session
- **Audio Notifications**: Enable/disable completion sound alerts
- **Custom Keywords**: Add topics you want to prioritize

## 🎯 Complete Usage Guide

### Basic LinkedIn Filtering
1. Navigate to [linkedin.com/feed](https://linkedin.com/feed)
2. The extension automatically starts analyzing posts
3. High-quality posts show color-coded score indicators:
   - 🔥 **Red (35-50)**: Excellent, must-read content
   - 🟡 **Yellow (25-34)**: Good content worth reading
   - ⚪ **White (15-24)**: Average content
   - 🔵 **Blue (1-14)**: Low-quality (hidden by default)

### 🎧 Audio Summary Generation

#### Creating Audio Summaries
1. **Process Posts**: Let the extension filter your LinkedIn feed (or enable auto-scroll)
2. **Generate Audio**: Click the extension icon → "🎧 Generate Audio Summary"
3. **Automatic Processing**: The extension will:
   - Collect all filtered high-quality posts
   - Generate an intelligent summary using Claude AI
   - Convert the summary to speech using ElevenLabs
   - Automatically download the MP3 file
   - Save the audio to browser storage for future access

#### Managing Audio History
**Access Previous Summaries:**
- Open the extension popup
- Scroll to "📚 Previous Summaries" section
- View all stored audio summaries with timestamps and metadata

**Available Actions:**
- **▶️ Play**: Stream audio directly in the popup
- **⬇️ Download**: Re-download the MP3 file
- **🗑️ Delete**: Remove unwanted summaries (with confirmation)

**Storage Details:**
- Stores up to 10 most recent audio summaries
- Each summary includes: date/time, post count, estimated duration, full audio data
- Persistent storage survives browser restarts and updates

### Advanced Features

#### Auto-Scroll Processing
- **Enable**: Toggle in popup or options page
- **Smart Processing**: Automatically scrolls every 3 seconds
- **Configurable Limits**: Set maximum posts to prevent endless scrolling
- **Audio Completion**: Gentle 3-tone notification when target is reached
- **Manual Override**: Can be toggled on/off during browsing

#### Audio Notifications
- **Completion Alerts**: Soft musical notification (C5-E5-G5 major chord) when auto-scroll reaches post limit
- **User Control**: Enable/disable in popup or options page (enabled by default)
- **Technical Details**: Uses Web Audio API for browser-native sound generation
- **Fallback Support**: Simple beep fallback for limited browser support
- **Volume**: Designed to be subtle and non-intrusive (max 0.08 volume)

#### Markdown Export
- **Comprehensive Reports**: Complete post data with scores and statistics
- **File Format**: `linkedin-filtered-posts-[date].md`
- **Includes**: Post content, quality scores, author info, engagement metrics

#### Enhanced Control Panel
- **Real-Time Stats**: Live counts of hidden vs visible posts
- **Quick Toggles**: Enable/disable features directly on LinkedIn
- **Status Updates**: Live feedback on processing and feature states

## 🔧 Configuration Options

### Popup Interface Controls
- **Extension Toggle**: Master on/off switch
- **Auto-Scroll Toggle**: Enable automatic feed processing
- **Quality Threshold**: Adjust filtering sensitivity with live preview
- **Post Limit**: Control auto-scroll stopping point with audio notifications
- **Audio Notifications**: Toggle completion sound alerts on/off
- **Real-Time Stats**: View current session statistics
- **Audio Generation**: One-click summary creation
- **Audio History**: Access to all stored summaries
- **Export**: Instant markdown report generation

### Quality Scoring System

**Scoring Criteria (1-50 scale):**
- **Content Originality**: Unique insights vs generic posts
- **Professional Value**: Career/industry relevance
- **Writing Quality**: Clarity, structure, engagement
- **Thought Leadership**: Expert insights and analysis
- **Actionable Content**: Practical value and takeaways
- **Custom Keywords**: Bonus points for matching interests

**Visual Indicators:**
- Color-coded emojis show quality levels
- Hidden posts include explanation tooltips
- Control panel displays filtering statistics

## 🧪 Testing & Validation

### Quick Test Procedure
1. **Setup**: Configure both API keys, set threshold to 25-30
2. **LinkedIn Test**: Visit feed, verify posts are being scored and filtered
3. **Auto-Scroll Test**: Enable auto-scroll, watch automatic processing
4. **Audio Test**: Generate an audio summary, verify download and storage
5. **History Test**: Check audio history in popup, test play/download/delete
6. **Export Test**: Generate markdown report

### Developer Testing
```javascript
// Test extension functionality in LinkedIn console
console.log('Extension Status:', window.linkedInCurator?.enabled);
console.log('Visible Posts:', window.linkedInCurator?.visiblePosts?.length);
console.log('Hidden Posts:', window.linkedInCurator?.hiddenPosts?.length);
console.log('Auto-scroll:', window.linkedInCurator?.autoScrollEnabled);

// Test audio storage
chrome.storage.local.get(['audioSummaries'], (result) => {
  console.log('Stored Audio Summaries:', result.audioSummaries?.length || 0);
});
```

## 🚨 Troubleshooting

### Common Issues

**Extension Not Working:**
- Verify you're on linkedin.com (not mobile version)
- Check extension is enabled in popup
- Confirm both API keys are configured and tested
- Refresh the LinkedIn page

**Audio Generation Issues:**
- Ensure ElevenLabs API key is configured
- Check you have processed posts first (see popup counter)
- Verify API key has sufficient credits
- Look for error messages in popup status

**Audio History Problems:**
- Check browser storage permissions
- Verify audio files aren't corrupted (try re-downloading)
- Clear storage if experiencing playback issues

**Audio Notification Issues:**
- Ensure browser allows audio playback (some browsers block auto-play)
- Check audio notifications are enabled in extension settings
- Try refreshing the page if notifications don't work initially
- Verify browser supports Web Audio API (fallback will activate if not)

**Performance Issues:**
- Lower the post limit for auto-scroll
- Increase quality threshold to filter more aggressively
- Disable auto-scroll for manual control

### Debug Information
1. Open Chrome DevTools (F12) on LinkedIn
2. Check Console for "LinkedIn Feed Curator" messages
3. Monitor Network tab for API requests
4. Review Storage tab for saved data

## 🔒 Privacy & Security

- **API Key Storage**: Encrypted in Chrome's sync storage
- **Data Processing**: Content sent only to configured AI services for analysis
- **No Data Collection**: Extension doesn't collect personal information
- **Local Storage**: Audio files and settings stored locally in browser
- **No Tracking**: No analytics or usage tracking implemented

## 💰 Detailed Cost Analysis

### Anthropic (Content Analysis)
- **Model**: Claude-3-Haiku (cost-optimized)
- **Cost**: ~$0.25 per million tokens
- **Usage**: ~50-200 tokens per post
- **Estimate**: $0.0001-0.0005 per post

### ElevenLabs (Audio Generation)
- **Model**: High-quality text-to-speech
- **Cost**: ~$0.18 per million characters
- **Usage**: ~500-2000 characters per summary
- **Estimate**: $0.0001-0.0004 per summary

### Typical Usage Scenarios
- **Light Use** (50 posts + 1 audio): ~$0.01-0.03 per session
- **Heavy Use** (500 posts + 1 audio): ~$0.10-0.30 per session
- **Daily Usage** (200 posts + audio): ~$1-3 per month

## 🤝 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Test thoroughly using the provided test procedures
4. Submit a pull request with detailed description

### Development Setup
```bash
git clone [repository-url]
cd "LI feed curator"
# Load in Chrome developer mode
# Make changes and test
```

## 🔄 Version History

### v2.0 (Current) - Audio Summaries Update
#### New Features
- **🎧 AI Audio Summaries**: Complete integration with ElevenLabs for text-to-speech conversion
- **📚 Audio History Management**: Persistent storage and playback of generated summaries
- **⬇️ Audio Download System**: Automatic MP3 downloads with smart file naming
- **🗑️ Audio Cleanup Tools**: Delete unwanted summaries with confirmation prompts
- **⏱️ Duration Estimation**: Smart calculation of audio summary lengths

#### Technical Improvements
- Enhanced storage management with 10-summary limit
- Improved error handling for audio generation failures
- Better UI feedback during audio processing
- Optimized base64 audio storage and blob conversion
- Comprehensive audio history interface

### v1.1 - Enhanced Filtering
- Post score display with visual indicators
- Auto-scroll processing capabilities
- Markdown export functionality
- Enhanced popup interface
- Custom filtering with keywords
- Real-time statistics and controls

### v1.0 - Initial Release
- Basic AI-powered content filtering
- Quality threshold controls
- LinkedIn integration
- Chrome extension framework

## 🚀 Roadmap

### Upcoming Features
- **Multiple Voice Options**: Choose from different ElevenLabs voices
- **Summary Customization**: Control audio summary length and style
- **Playlist Creation**: Combine multiple summaries into playlists
- **Background Playback**: Continue audio while browsing other tabs
- **Export Integration**: Include audio links in markdown exports
- **Advanced Analytics**: Track listening patterns and preferences

### Technical Enhancements
- **Offline Audio Storage**: Local file system integration
- **Compression Options**: Reduce storage usage for audio files
- **Sync Across Devices**: Cloud synchronization of audio history
- **Mobile Support**: Audio summaries for mobile LinkedIn browsing

## 📄 License

This project is open source under the MIT License. See LICENSE file for details.

## 🆘 Support

For issues and support:
1. Check this comprehensive README
2. Review the troubleshooting section
3. Test using provided JavaScript commands
4. Examine browser console for errors
5. Open a GitHub issue with detailed problem description

**When reporting audio issues, please include:**
- Browser version and operating system
- Error messages from popup or console
- Steps to reproduce the problem
- API key configuration status (without sharing actual keys)

---

Transform your LinkedIn experience with AI-powered filtering and audio summaries! 🚀🎧 