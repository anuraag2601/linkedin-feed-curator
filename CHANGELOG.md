# Changelog

All notable changes to the LinkedIn Feed Curator extension will be documented in this file.

## [2.1.2] - 2024-07-10

### 🔔 New Features
- **Audio Completion Notifications**: Added gentle audio alerts when auto-scroll reaches target post limit
  - Pleasant 3-tone musical sequence (C5-E5-G5 major chord) using Web Audio API
  - Soft, non-intrusive volume levels (max 0.08) designed not to disturb workflow
  - 0.15s duration per tone with 0.05s gaps for smooth musical progression
  - User-controllable setting (enabled by default) in extension options
  - Graceful fallback for limited Web Audio API support
  - Console logging for debugging enabled/disabled states

### 🔧 Technical Improvements
- **Enhanced Auto-Scroll Completion**: Audio notification plays before modal appears
- **Browser-Native Audio**: Uses Web Audio API for consistent cross-platform sound generation
- **Error Handling**: Multiple fallback layers for audio generation failures
- **Settings Integration**: Audio notifications preference stored in chrome.storage.sync
- **Performance Optimized**: Minimal resource usage with efficient oscillator-based audio

### 🎨 User Experience
- **Non-Disruptive Alerts**: Know when feed processing is complete without actively monitoring
- **Musical Harmony**: Pleasant major chord sequence instead of harsh beeping
- **Instant Feedback**: Immediate audio confirmation when target posts are collected
- **User Control**: Easy toggle in popup and options page for personal preference

## [2.1.1] - 2024-07-10

### 🐛 Bug Fixes
- **Audio Control Buttons**: Fixed audio history play, download, and delete buttons not working due to onclick timing issues
  - Replaced `onclick` attributes with proper event delegation using data attributes
  - Functions now properly attach after DOM is loaded and ready
- **Badge Counter**: Fixed extension badge to show count of filtered/visible posts instead of hidden posts
  - Badge now displays the number of high-quality posts that passed the quality threshold
  - Provides more useful information about content available for consumption
- **Statistics Tracking**: Fixed "Posts Hidden Today" and "Total Processed" counters not updating correctly
  - Added proper `updateDailyHiddenStats()` and `updateTotalProcessedStats()` functions
  - Statistics now sync correctly with chrome.storage.local
  - Daily and total counters update in real-time as posts are processed

### 🔧 Technical Improvements
- Improved event handling with event delegation pattern for audio controls
- Enhanced statistics synchronization between content script and popup
- Better separation of concerns for badge updates vs. statistics tracking

## [2.1.0] - 2024-07-09

## [2.0.0] - 2025-01-14 - 🎧 Audio Summaries Major Update

### 🎧 Major New Features
- **AI Audio Summaries**: Complete integration with ElevenLabs text-to-speech API
  - Generate intelligent audio summaries of filtered LinkedIn posts
  - Automatic conversion of curated content into spoken summaries
  - Smart content synthesis using Claude AI + ElevenLabs voice generation

- **Persistent Audio Storage System**: 
  - Save up to 10 audio summaries in browser local storage
  - Base64 audio encoding for reliable storage and playback
  - Automatic cleanup with storage limit management
  - Survives browser restarts and extension updates

- **Audio History Management**:
  - Complete audio history interface in popup
  - Play stored summaries directly from extension popup
  - Download audio files as MP3s with smart file naming
  - Delete unwanted summaries with confirmation prompts
  - Date/time stamps and metadata for each summary

- **Smart Audio Features**:
  - Duration estimation based on content length (~150 words per minute)
  - Automatic MP3 download upon generation
  - One-click replay functionality
  - File naming: `linkedin-summary-[date]-[posts]posts.mp3`

### 🔧 Technical Improvements
- Enhanced storage management with 10-summary limit to prevent bloat
- Improved error handling for audio generation failures
- Better UI feedback during audio processing stages
- Optimized base64 audio storage and blob URL conversion
- Comprehensive audio history interface with modern controls

### 🎨 UI/UX Enhancements
- New "📚 Previous Summaries" section in popup
- Color-coded audio control buttons (play ▶️/download ⬇️/delete 🗑️)
- Real-time status updates during audio generation
- Enhanced popup layout for audio features
- Improved error messaging and user feedback

### 📚 Documentation Updates
- Complete README overhaul with audio feature documentation
- Detailed API cost analysis for both Anthropic and ElevenLabs
- Comprehensive setup guide for dual API integration
- Enhanced troubleshooting section for audio issues
- Step-by-step audio feature usage instructions

## [1.1.0] - 2024-12-20 - Enhanced Filtering & Export

### ✨ New Features
- **Post Score Display**: Visual quality indicators on all visible posts
  - Color-coded emoji system (🔥🟡⚪🔵) for quality levels
  - Real-time score display as posts are processed
  - Threshold-based visibility controls

- **Auto-Scroll Processing**: Automated feed processing
  - Configurable auto-scroll with 3-second intervals
  - Smart stopping at feed end or manual disable
  - Configurable post limits to prevent infinite scrolling
  - Real-time toggle controls in popup and LinkedIn interface

- **Markdown Export System**:
  - One-click export of filtered posts to downloadable markdown files
  - Comprehensive reports with post statistics and metadata
  - File format: `linkedin-filtered-posts-[date].md`
  - Includes post content, scores, author info, and engagement metrics

- **Enhanced Control Panel**:
  - Real-time display of hidden vs visible post counts
  - Quick toggles for auto-scroll and export directly on LinkedIn
  - Live status updates and processing feedback
  - Improved visual design and user experience

### 🔧 Technical Improvements
- Better error handling and API connection testing
- Improved message passing between extension components
- Enhanced post processing and quality analysis algorithms
- Optimized performance for large feed processing
- Comprehensive logging and debugging capabilities

### 🎨 UI Improvements
- Enhanced popup interface with better controls
- Real-time statistics display
- Improved visual feedback for all operations
- Better integration with LinkedIn's interface
- Modern gradient design and responsive layout

## [1.0.0] - 2024-11-15 - Initial Release

### 🚀 Core Features
- **AI-Powered Content Analysis**: 
  - Integration with Anthropic's Claude-3-Haiku for post quality analysis
  - Intelligent scoring system (1-50 scale) based on content quality
  - Professional relevance and value assessment

- **Real-time Feed Filtering**:
  - Automatic hiding of low-quality posts as user scrolls
  - Customizable quality threshold (1-50)
  - Real-time processing of LinkedIn feed content
  - Manual override options for hidden posts

- **Chrome Extension Framework**:
  - Complete manifest v3 implementation
  - Secure API key storage in Chrome sync storage
  - Cross-browser compatibility and sync
  - Popup interface for quick controls

- **Basic Configuration**:
  - Options page for API key configuration
  - Threshold adjustment controls
  - Enable/disable toggle for extension
  - Basic statistics tracking

### 🔧 Technical Foundation
- Manifest v3 Chrome extension architecture
- Content script injection for LinkedIn integration
- Background service worker for API communication
- Secure storage using Chrome's sync storage API
- Message passing system between components

### 🎨 Initial UI
- Clean, professional popup interface
- LinkedIn-themed color scheme and branding
- Basic controls for extension management
- Simple statistics display

---

## Upcoming Features (Roadmap)

### v2.1 - Audio Enhancements (Planned)
- **Multiple Voice Options**: Choose from different ElevenLabs voices and styles
- **Summary Customization**: Control audio summary length, style, and focus areas
- **Playlist Creation**: Combine multiple summaries into organized playlists
- **Background Playback**: Continue audio while browsing other tabs

### v2.2 - Advanced Analytics (Planned)
- **Listening Patterns**: Track audio summary usage and preferences
- **Content Analytics**: Detailed insights into filtered content trends
- **Export Integration**: Include audio links in markdown exports
- **Usage Dashboard**: Comprehensive analytics and insights

### v3.0 - Multi-Platform (Future)
- **Offline Audio Storage**: Local file system integration for audio management
- **Compression Options**: Reduce storage usage for audio files
- **Cloud Sync**: Synchronization of audio history across devices
- **Mobile Support**: Audio summaries for mobile LinkedIn browsing

---

## Technical Notes

### API Integration History
- **v1.0**: Anthropic Claude-3-Haiku integration
- **v2.0**: Added ElevenLabs text-to-speech integration
- **Future**: Planned support for multiple AI providers

### Storage Evolution
- **v1.0**: Basic settings in Chrome sync storage
- **v1.1**: Added local storage for filtered posts data
- **v2.0**: Advanced audio storage with base64 encoding and metadata

### Performance Improvements
- **v1.1**: Optimized post processing for large feeds
- **v2.0**: Enhanced storage management and audio handling
- **Future**: Planned background processing optimizations

---

*For detailed technical documentation, setup instructions, and troubleshooting, see the main [README.md](README.md)* 