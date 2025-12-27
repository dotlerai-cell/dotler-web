import { useState } from 'react';
import AdCopyVariations from '../components/ai-assistant/AdCopyVariations';

/**
 * AdCopyVariationsDemo Page
 * 
 * Demo page for testing the AdCopyVariations component
 */
export default function AdCopyVariationsDemo() {
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [variations, setVariations] = useState([
    "Transform your business with our premium solution. Save time and boost productivity today!",
    "Discover the power of advanced features designed for professionals. Get started in minutes.",
    "Limited time offer! Join thousands of satisfied customers. Don't miss out on this opportunity.",
    "Why settle for less? Our solution delivers results you can measure. See the difference now.",
    "Trusted by industry leaders worldwide. Experience the quality that sets us apart from the rest."
  ]);

  function handleSelect(variation, index) {
    setSelectedVariation(variation);
    console.log('Selected variation:', variation, 'at index:', index);
  }

  function handleGenerateMore() {
    setIsGeneratingMore(true);
    
    // Simulate API call
    setTimeout(() => {
      const newVariations = [
        "Ready to level up? Our innovative platform makes it easy. Start your free trial today!",
        "Join the revolution. Thousands are already benefiting from our cutting-edge technology.",
        "Stop wasting time on outdated methods. Upgrade to the future of productivity now!"
      ];
      
      setVariations([...variations, ...newVariations]);
      setIsGeneratingMore(false);
    }, 2000);
  }

  function handleLoadVariations() {
    setIsLoading(true);
    
    setTimeout(() => {
      setVariations([
        "Transform your business with our premium solution. Save time and boost productivity today!",
        "Discover the power of advanced features designed for professionals. Get started in minutes.",
        "Limited time offer! Join thousands of satisfied customers. Don't miss out on this opportunity.",
        "Why settle for less? Our solution delivers results you can measure. See the difference now.",
        "Trusted by industry leaders worldwide. Experience the quality that sets us apart from the rest."
      ]);
      setIsLoading(false);
    }, 1500);
  }

  function handleClearVariations() {
    setVariations([]);
    setSelectedVariation(null);
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Ad Copy Variations Demo</h1>
      
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={handleLoadVariations}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Load Variations
        </button>
        
        <button
          onClick={handleClearVariations}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Clear Variations
        </button>
      </div>

      {selectedVariation && (
        <div style={{
          padding: '1rem',
          background: '#f0fdf4',
          border: '2px solid #86efac',
          borderRadius: '0.5rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#166534' }}>Selected Variation:</h3>
          <p style={{ margin: 0, color: '#15803d' }}>{selectedVariation}</p>
        </div>
      )}

      <AdCopyVariations
        variations={variations}
        onSelect={handleSelect}
        onGenerateMore={handleGenerateMore}
        selectedVariation={selectedVariation}
        isLoading={isLoading}
        isGeneratingMore={isGeneratingMore}
      />
    </div>
  );
}
