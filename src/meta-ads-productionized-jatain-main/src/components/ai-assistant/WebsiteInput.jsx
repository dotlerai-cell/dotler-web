import { useState } from 'react';
import { scrapeUrl } from '../../services/webScraper';
import './WebsiteInput.css';

/**
 * WebsiteInput Component
 * 
 * Handles website URL input with validation, triggers web scraping,
 * displays scraping status and results, and allows manual information entry on failure.
 */
export default function WebsiteInput({ onScrapedData, onManualEntry }) {
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState(null);
  const [error, setError] = useState(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualInfo, setManualInfo] = useState('');

  /**
   * Validates URL format
   */
  function validateUrl(urlString) {
    if (!urlString || urlString.trim() === '') {
      return true; // Empty is valid (not required)
    }

    try {
      // Add protocol if missing
      let testUrl = urlString.trim();
      if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
        testUrl = 'https://' + testUrl;
      }
      new URL(testUrl);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Handles URL input change
   */
  function handleUrlChange(e) {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setIsValidUrl(validateUrl(newUrl));
    setError(null);
    setScrapedData(null);
    setShowManualEntry(false);
  }

  /**
   * Handles scraping trigger
   */
  async function handleScrape() {
    if (!url || !url.trim()) {
      setError('Please enter a website URL.');
      return;
    }

    if (!isValidUrl) {
      setError('Please enter a valid URL.');
      return;
    }

    setError(null);
    setScraping(true);
    setScrapedData(null);
    setShowManualEntry(false);

    try {
      const data = await scrapeUrl(url);
      setScrapedData(data);
      
      // Notify parent component
      if (onScrapedData) {
        onScrapedData(data);
      }
    } catch (err) {
      console.error('Scraping error:', err);
      setError(err.message || 'Failed to scrape website. Please try again or enter information manually.');
      setShowManualEntry(true);
    } finally {
      setScraping(false);
    }
  }

  /**
   * Handles manual information entry
   */
  function handleManualInfoChange(e) {
    setManualInfo(e.target.value);
  }

  /**
   * Submits manual information
   */
  function handleManualSubmit() {
    if (!manualInfo.trim()) {
      setError('Please enter some information about your product or service.');
      return;
    }

    const manualData = {
      url: url || 'manual-entry',
      title: 'Manual Entry',
      metaTags: {},
      productInfo: {
        descriptions: [manualInfo],
        features: [],
        benefits: [],
        categories: [],
        productNames: [],
      },
      pricing: {
        prices: [],
        currency: null,
        hasDiscount: false,
      },
      scrapedAt: new Date().toISOString(),
      isManualEntry: true,
    };

    setScrapedData(manualData);
    setShowManualEntry(false);
    setError(null);

    // Notify parent component
    if (onManualEntry) {
      onManualEntry(manualData);
    }
  }

  /**
   * Clears scraped data and resets form
   */
  function handleClear() {
    setUrl('');
    setScrapedData(null);
    setError(null);
    setShowManualEntry(false);
    setManualInfo('');
    setIsValidUrl(true);
  }

  return (
    <div className="website-input">
      <h3>Website Information</h3>

      {/* URL Input */}
      <div className="url-input-group">
        <input
          type="text"
          className={`url-input ${!isValidUrl ? 'invalid' : ''}`}
          placeholder="Enter your website URL (e.g., example.com)"
          value={url}
          onChange={handleUrlChange}
          disabled={scraping}
        />
        <button
          className="scrape-button"
          onClick={handleScrape}
          disabled={scraping || !url.trim() || !isValidUrl}
        >
          {scraping ? (
            <>
              <span className="button-spinner" />
              Scraping...
            </>
          ) : (
            'Scrape Website'
          )}
        </button>
      </div>

      {!isValidUrl && url && (
        <p className="validation-error">Please enter a valid URL</p>
      )}

      {/* Scraping Status */}
      {scraping && (
        <div className="scraping-status">
          <div className="status-spinner" />
          <p>Extracting information from website...</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button 
            className="error-close"
            onClick={() => setError(null)}
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}

      {/* Scraped Results */}
      {scrapedData && !scrapedData.isManualEntry && (
        <div className="scraped-results">
          <div className="results-header">
            <h4>✓ Website Information Extracted</h4>
            <button
              className="clear-button"
              onClick={handleClear}
              aria-label="Clear results"
            >
              Clear
            </button>
          </div>

          <div className="results-content">
            {scrapedData.title && (
              <div className="result-item">
                <strong>Title:</strong> {scrapedData.title}
              </div>
            )}

            {scrapedData.metaTags?.description && (
              <div className="result-item">
                <strong>Description:</strong> {scrapedData.metaTags.description}
              </div>
            )}

            {scrapedData.productInfo?.descriptions?.length > 0 && (
              <div className="result-item">
                <strong>Product Info:</strong>
                <ul className="result-list">
                  {scrapedData.productInfo.descriptions.slice(0, 3).map((desc, idx) => (
                    <li key={idx}>{desc}</li>
                  ))}
                </ul>
              </div>
            )}

            {scrapedData.productInfo?.features?.length > 0 && (
              <div className="result-item">
                <strong>Features:</strong>
                <ul className="result-list">
                  {scrapedData.productInfo.features.slice(0, 5).map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            {scrapedData.pricing?.prices?.length > 0 && (
              <div className="result-item">
                <strong>Pricing:</strong>{' '}
                {scrapedData.pricing.currency || 'USD'}{' '}
                {scrapedData.pricing.prices.join(', ')}
                {scrapedData.pricing.hasDiscount && ' (Discount available)'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Entry Success */}
      {scrapedData && scrapedData.isManualEntry && (
        <div className="scraped-results">
          <div className="results-header">
            <h4>✓ Manual Information Added</h4>
            <button
              className="clear-button"
              onClick={handleClear}
              aria-label="Clear results"
            >
              Clear
            </button>
          </div>
          <div className="results-content">
            <div className="result-item">
              <strong>Information:</strong> {scrapedData.productInfo.descriptions[0]}
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Form */}
      {showManualEntry && !scrapedData && (
        <div className="manual-entry">
          <h4>Enter Information Manually</h4>
          <p className="manual-hint">
            Describe your product or service, including key features, benefits, and target audience.
          </p>
          <textarea
            className="manual-textarea"
            placeholder="Example: We sell premium organic coffee beans sourced directly from farmers. Our coffee is fair-trade certified and roasted fresh weekly. Perfect for coffee enthusiasts who value quality and sustainability."
            value={manualInfo}
            onChange={handleManualInfoChange}
            rows={6}
          />
          <div className="manual-actions">
            <button
              className="manual-submit-button"
              onClick={handleManualSubmit}
              disabled={!manualInfo.trim()}
            >
              Submit Information
            </button>
            <button
              className="manual-cancel-button"
              onClick={() => {
                setShowManualEntry(false);
                setManualInfo('');
                setError(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
