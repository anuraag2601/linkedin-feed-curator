# LinkedIn Feed Curator

An AI-powered Chrome extension that filters LinkedIn feed posts based on quality, helping you focus on high-value content with advanced features for scoring, auto-scrolling, and content export.

## 🚀 Features

- **AI-Powered Analysis**: Uses Anthropic's Claude AI to analyze post quality
- **Real-time Filtering**: Automatically hides low-quality posts as you scroll
- **Post Score Display**: Visual indicators showing quality scores with color-coded emojis
- **Auto-Scroll Processing**: Automatically scrolls to process more posts without manual intervention
- **Markdown Export**: Export filtered posts to downloadable markdown files with statistics
- **Enhanced Control Panel**: Real-time display of hidden/visible post counts with toggle controls
- **Customizable Threshold**: Adjust filtering sensitivity (1-50 scale)
- **Custom Filtering**: Keyword-based filtering for personalized content preferences
- **Enhanced Popup Interface**: Quick access to all features from browser toolbar
- **Easy Toggle**: Quick enable/disable from browser popup
- **No Login Required**: Works immediately after installation

## 📋 Prerequisites

1. **Anthropic API Key**: You'll need an API key from [Anthropic Console](https://console.anthropic.com/)
   - Sign up for an account if you don't have one
   - Generate an API key from your dashboard
   - Note: API usage will incur charges based on Anthropic's pricing

## 🛠 Installation

### Step 1: Download the Extension
1. Download or clone this repository
2. Ensure all files are in the `LI feed curator` folder

### Step 2: Install in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `LI feed curator` folder
5. The extension should now appear in your extensions list

### Step 3: Configure API Key
1. After installation, the options page will open automatically
2. Enter your Anthropic API key in the designated field
3. Click "Test API Connection" to verify it works
4. Configure your preferences (quality threshold, auto-scroll, custom filtering)
5. Click "Save Settings"

## 🎯 Usage

### Basic Operation
1. **Navigate to LinkedIn**: Go to [linkedin.com](https://linkedin.com) and log in
2. **Control Panel**: Look for the LinkedIn Feed Curator control panel in the header
3. **Automatic Filtering**: The extension will automatically start analyzing and filtering posts
4. **Score Indicators**: High-quality posts display score indicators with color-coded emojis:
   - 🔥 **Red (35-50)**: Excellent, must-read content
   - 🟡 **Yellow (25-34)**: Good content worth reading
   - ⚪ **White (15-24)**: Average content
   - 🔵 **Blue (1-14)**: Low-quality content (typically hidden)
5. **Hidden Post Indicators**: You'll see notifications when low-quality posts are hidden
6. **Show Hidden Posts**: Click "Show anyway" on any hidden post indicator to reveal that specific post

### New Features

#### Auto-Scroll Processing
- **Enable Auto-Scroll**: Toggle in popup or options page
- **Automatic Processing**: Scrolls every 3 seconds to process new posts
- **Smart Control**: Automatically stops when it reaches the end or when disabled
- **Manual Override**: Can be toggled on/off anytime during browsing

#### Markdown Export
- **One-Click Export**: Available in both popup and options page
- **Comprehensive Reports**: Includes post statistics, scores, authors, and engagement metrics
- **File Format**: `linkedin-filtered-posts-[date].md`
- **Content Included**: 
  - Post summaries and full content
  - Quality scores and reasoning
  - Author information and post links
  - Engagement statistics (likes, comments, shares)
  - Filtering statistics and session summary

#### Enhanced Control Panel
- **Real-Time Counts**: Shows hidden vs visible posts as they're processed
- **Quick Toggles**: Auto-scroll and export buttons directly in LinkedIn interface
- **Status Updates**: Live feedback on processing status and feature states

### Settings & Controls

#### Popup Interface
- **Quick Controls**: Enable/disable extension, auto-scroll toggle
- **Statistics**: View current session stats (hidden/visible posts, threshold)
- **Export**: One-click markdown export of filtered posts
- **Settings Access**: Direct link to full options page

#### Options Page
- **Enable/Disable**: Master toggle for the entire extension
- **API Key Configuration**: Set and test your Anthropic API key
- **Quality Threshold**: Adjust filtering sensitivity (1-50)
  - Lower values = more permissive (shows more posts)
  - Higher values = stricter filtering (hides more posts)
  - Default: 25
- **Auto-Scroll**: Enable automatic scrolling for continuous processing
- **Custom Filtering**: Add keywords for content you want to prioritize
  - Examples: "AI companies, machine learning, startup funding, tech industry news"
  - Posts matching these keywords receive bonus points in scoring
- **Export Options**: Generate and download markdown reports

### Quality Scoring System

Posts are scored 1-50 based on:

- **Exceptional Content** (40-50): Unique insights, industry expertise, thought leadership
- **High Quality** (35-39): Valuable professional content with strong engagement
- **Good Content** (25-34): Meaningful insights worth reading
- **Average Content** (15-24): Some value but not exceptional
- **Low Quality** (1-14): Generic, promotional, or spam-like content

**Scoring Factors:**
- Content originality and uniqueness
- Professional relevance and value
- Writing quality and clarity
- Engagement quality vs quantity
- Actionable insights or thought-provoking ideas
- Match with custom filtering keywords (bonus points)

**Visual Indicators:**
- Posts above threshold show colored score indicators
- Posts below threshold are hidden with explanation
- Control panel shows real-time filtering statistics

## 🔧 Configuration

### Default Settings
- **Enabled**: Yes
- **Threshold**: 25 (moderate filtering)
- **Auto-Scroll**: Disabled
- **Custom Filtering**: Empty (no keywords)
- **API Key**: Not configured (requires user input)

### Advanced Configuration
- Settings sync across Chrome browsers when logged in
- All preferences stored securely in Chrome's sync storage
- Export preferences and filtering history available via markdown export

## 🧪 Testing Guide

### Quick Test Procedure
1. **Reload Extension**: Go to `chrome://extensions/` and reload
2. **Configure Settings**: Set threshold 25-30, enable auto-scroll, add keywords
3. **Test on LinkedIn**: Visit `https://www.linkedin.com/feed/`
4. **Verify Features**: Check control panel, score indicators, auto-scroll
5. **Test Export**: Use popup or options page to export filtered posts

### Developer Testing
Open Chrome DevTools on LinkedIn and run:
```javascript
// Test all features
window.linkedInCurator?.exportFilteredPosts();
console.log('Visible posts:', window.linkedInCurator?.visiblePosts?.length);
console.log('Auto-scroll enabled:', window.linkedInCurator?.autoScrollEnabled);
```

## 🚨 Troubleshooting

### Common Issues

**Extension not working on LinkedIn:**
- Ensure you're on linkedin.com (not mobile version)
- Check that the extension is enabled in popup
- Verify API key is configured correctly
- Try refreshing the LinkedIn page

**Auto-scroll not working:**
- Check if auto-scroll is enabled in popup or options
- Verify the control panel shows "Auto-scroll: ON"
- Check console for any JavaScript errors

**Scores not displaying:**
- Ensure posts are above the quality threshold
- Check if custom filtering keywords are too restrictive
- Verify API key is working correctly

**Export not working:**
- Make sure you have processed some posts first
- Check that browser allows downloads
- Verify there are visible posts to export

**API key errors:**
- Verify your API key is correct in options page
- Test the connection using "Test API Connection" button
- Check your Anthropic account has available credits
- Ensure API key has proper permissions

### Debug Mode
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Look for "LinkedIn Feed Curator" messages
4. Check Network tab for API requests
5. Any errors will be logged with detailed information

## 💰 Cost Considerations

- The extension uses Anthropic's Claude-3-Haiku model
- Cost is approximately $0.0001-0.0005 per post analyzed
- Typical usage with auto-scroll: ~100-500 posts per session = $0.01-0.25 per session
- Export feature doesn't incur additional API costs
- Monitor your usage in the Anthropic Console

## 🔒 Privacy & Security

- **API Key Storage**: Stored securely in Chrome's sync storage
- **Data Processing**: Post content sent to Anthropic for analysis only
- **No Data Collection**: Extension doesn't collect or store personal data
- **Local Processing**: All filtering decisions made locally in your browser
- **Export Data**: Markdown exports contain only filtered post data, stored locally

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve the extension.

### Development Setup
1. Clone the repository
2. Load the extension in Chrome developer mode
3. Make changes and test thoroughly
4. Follow the testing guide for validation

## 📄 License

This project is open source. Check the license file for details.

## 🆘 Support

If you encounter issues:
1. Check this README first
2. Look at the troubleshooting section
3. Test using the provided JavaScript commands
4. Check browser console for errors
5. Open an issue with detailed information about the problem

## 🔄 Recent Updates (v1.1)

### New Features Added
- **Post Score Display**: Visual quality indicators on all visible posts
- **Auto-Scroll Processing**: Automatic scrolling for hands-free browsing
- **Markdown Export**: Comprehensive post export with statistics and metadata
- **Enhanced UI**: Improved popup interface and LinkedIn control panel
- **Custom Filtering**: Keyword-based content prioritization
- **Real-Time Statistics**: Live counts and status updates

### Technical Improvements
- Better error handling and API connection testing
- Improved message passing between components
- Enhanced post processing and quality analysis
- Optimized performance for large feed processing
- Comprehensive logging and debugging capabilities

## 🚀 Future Enhancements

Planned improvements for future versions:
- Advanced filtering rules and conditions
- Multiple AI model support (OpenAI, local models)
- Content categorization and tagging
- Analytics dashboard with usage insights
- Bulk operations and batch processing
- Integration with productivity tools
- Mobile app companion 