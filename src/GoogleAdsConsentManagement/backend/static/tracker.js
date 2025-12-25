// Website Analytics Tracker - Privacy-First Analytics
// Usage: <script src="https://your-backend.com/static/tracker.js" data-site-id="your-site-id"></script>

(function() {
    'use strict';
    
    // Configuration
    const script = document.currentScript;
    const siteId = script.getAttribute('data-site-id');
    const backendUrl = script.src.replace('/static/tracker.js', '');
    
    if (!siteId) {
        console.warn('Tracker: No site-id provided');
        return;
    }
    
    // Generate session ID
    let sessionId = sessionStorage.getItem('tracker_session_id');
    if (!sessionId) {
        sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('tracker_session_id', sessionId);
    }
    
    // Track page start time
    let pageStartTime = Date.now();
    
    // Cookie consent management
    let consentGiven = localStorage.getItem('tracker_consent');
    
    function showConsentBanner() {
        if (consentGiven !== null) return; // Already decided
        
        const banner = document.createElement('div');
        banner.id = 'tracker-consent-banner';
        banner.innerHTML = `
            <div style="position: fixed; bottom: 0; left: 0; right: 0; background: #333; color: white; padding: 20px; z-index: 10000; font-family: Arial, sans-serif; box-shadow: 0 -2px 10px rgba(0,0,0,0.3);">
                <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
                    <div style="flex: 1; min-width: 300px;">
                        <strong>🍪 We use cookies</strong><br>
                        <span style="font-size: 14px; opacity: 0.9;">We use cookies to analyze website traffic and improve your experience. Your data helps us understand how visitors interact with our site.</span>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button id="tracker-accept" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">Accept</button>
                        <button id="tracker-decline" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">Decline</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        document.getElementById('tracker-accept').onclick = function() {
            consentGiven = 'true';
            localStorage.setItem('tracker_consent', 'true');
            banner.remove();
            trackEvent('consent_decision', { consent_given: true });
        };
        
        document.getElementById('tracker-decline').onclick = function() {
            consentGiven = 'false';
            localStorage.setItem('tracker_consent', 'false');
            banner.remove();
            trackEvent('consent_decision', { consent_given: false });
        };
    }
    
    // Event tracking function
    function trackEvent(eventType, additionalData = {}) {
        // Skip tracking if consent was declined
        if (consentGiven === 'false' && eventType !== 'consent_decision') {
            return;
        }
        
        const eventData = {
            site_id: siteId,
            session_id: sessionId,
            event_type: eventType,
            page_url: window.location.href,
            page_title: document.title,
            referrer: document.referrer || null,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            screen_width: screen.width,
            screen_height: screen.height,
            ...additionalData
        };
        
        // Send to backend
        fetch(`${backendUrl}/api/tracking/track`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
            keepalive: true
        }).catch(err => {
            console.warn('Tracker: Failed to send event', err);
        });
    }
    
    // Track pageview
    function trackPageview() {
        trackEvent('pageview');
    }
    
    // Track page exit with time on page
    function trackPageExit() {
        const timeOnPage = Math.round((Date.now() - pageStartTime) / 1000);
        trackEvent('page_exit', { time_on_page: timeOnPage });
    }
    
    // Track clicks
    function trackClick(event) {
        const element = event.target;
        const tagName = element.tagName.toLowerCase();
        
        let clickData = {
            click_id: 'click_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            element_tag: tagName,
            element_text: element.textContent?.trim().substring(0, 100) || null
        };
        
        // Special handling for links
        if (tagName === 'a' || element.closest('a')) {
            const link = tagName === 'a' ? element : element.closest('a');
            const href = link.href;
            
            if (href) {
                clickData.link_url = href;
                clickData.link_text = link.textContent?.trim().substring(0, 100) || null;
                clickData.is_external = !href.startsWith(window.location.origin);
                
                trackEvent('link_click', clickData);
            }
        } else {
            trackEvent('click', clickData);
        }
    }
    
    // Initialize tracking
    function initTracker() {
        // Show consent banner
        showConsentBanner();
        
        // Track initial pageview
        trackPageview();
        
        // Track clicks
        document.addEventListener('click', trackClick, true);
        
        // Track page exit
        window.addEventListener('beforeunload', trackPageExit);
        window.addEventListener('pagehide', trackPageExit);
        
        // Track visibility changes
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'hidden') {
                trackPageExit();
            }
        });
        
        console.log('Tracker initialized for site:', siteId);
    }
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTracker);
    } else {
        initTracker();
    }
    
})();