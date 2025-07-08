console.log('🚀 LinkedIn Feed Curator DEBUG - Content script loaded!');
console.log('📍 Current URL:', window.location.href);
console.log('🌐 Hostname check:', window.location.hostname.includes('linkedin.com'));

function testBasicFunctionality() {
    console.log('🧪 Testing basic functionality...');
    
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        console.log('✅ Chrome runtime API available');
        console.log('🆔 Extension ID:', chrome.runtime.id);
    } else {
        console.log('❌ Chrome runtime API not available');
    }
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
        console.log('✅ Chrome storage API available');
        chrome.storage.local.get(['enabled', 'threshold'], (result) => {
            console.log('⚙️ Current settings:', result);
        });
    } else {
        console.log('❌ Chrome storage API not available');
    }
    
    const posts = document.querySelectorAll('[data-urn*="urn:li:activity:"]');
    console.log(`📝 Found ${posts.length} posts with data-urn attribute`);
}

testBasicFunctionality();

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded - Running tests again...');
    setTimeout(testBasicFunctionality, 1000);
}); 