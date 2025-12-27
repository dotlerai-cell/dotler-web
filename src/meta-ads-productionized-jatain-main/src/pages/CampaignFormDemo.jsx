import { useState } from 'react';
import CampaignForm from '../components/campaign/CampaignForm';

/**
 * Demo page for CampaignForm component
 */
export default function CampaignFormDemo() {
  const [formData, setFormData] = useState({
    name: '',
    objective: '',
    status: 'PAUSED',
    dailyBudget: null,
    totalBudget: null,
    startDate: '',
    endDate: '',
    bidStrategy: 'LOWEST_COST',
    targeting: {
      ageMin: 18,
      ageMax: 65,
      genders: ['all'],
      locations: [],
      interests: [],
      behaviors: [],
    },
    adCopy: '',
    headlines: [''],
    descriptions: [],
    callToAction: '',
    targetUrl: '',
    images: [],
    videos: [],
    placements: {
      automatic: true,
    },
    optimizationGoal: '',
    conversionEvent: '',
    attributionWindow: '7_DAY_CLICK',
    enableCreativeRefresh: false,
    enableInventorySync: false,
    enableArbitrage: false,
    enableWeatherBidding: false,
  });

  const [highlightedFields, setHighlightedFields] = useState([]);
  const [manuallyEditedFields, setManuallyEditedFields] = useState(new Set());
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  function handleChange(field, value) {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleFieldManuallyEdited(fieldName) {
    setManuallyEditedFields(prev => new Set([...prev, fieldName]));
  }

  function handleSubmit() {
    console.log('Form submitted:', formData);
    console.log('Manually edited fields:', Array.from(manuallyEditedFields));
    alert('Campaign saved! Check console for data.');
  }

  // Simulate auto-fill for testing
  function simulateAutoFill() {
    setIsAutoFilling(true);
    
    // Simulate AI-generated data
    const aiGeneratedData = {
      name: 'Summer Sale Campaign 2024',
      objective: 'OUTCOME_SALES',
      status: 'PAUSED',
      dailyBudget: 50,
      totalBudget: 1500,
      startDate: '2024-06-01',
      endDate: '2024-06-30',
      bidStrategy: 'LOWEST_COST',
      targeting: {
        ageMin: 25,
        ageMax: 45,
        genders: ['all'],
        locations: [{ country: 'US', region: 'California' }],
        interests: [{ id: '123', name: 'Technology' }],
        behaviors: [{ id: '456', name: 'Online Shoppers' }],
      },
      adCopy: 'Get 50% off on all summer products! Limited time offer. Shop now and save big!',
      headlines: [
        'Summer Sale - 50% Off',
        'Limited Time Offer',
        'Shop Now & Save Big'
      ],
      descriptions: [
        'Exclusive summer deals on all products',
        'Free shipping on orders over $50'
      ],
      callToAction: 'SHOP_NOW',
      targetUrl: 'https://example.com/summer-sale',
      images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      videos: [],
      placements: {
        automatic: true,
      },
      optimizationGoal: 'CONVERSIONS',
      conversionEvent: 'Purchase',
      attributionWindow: '7_DAY_CLICK',
      enableCreativeRefresh: true,
      enableInventorySync: false,
      enableArbitrage: false,
      enableWeatherBidding: false,
    };

    // Only update fields that haven't been manually edited
    const updatedData = { ...formData };
    Object.keys(aiGeneratedData).forEach(key => {
      if (!manuallyEditedFields.has(key)) {
        if (key === 'targeting') {
          // Handle nested targeting object
          const updatedTargeting = { ...formData.targeting };
          Object.keys(aiGeneratedData.targeting).forEach(nestedKey => {
            if (!manuallyEditedFields.has(`targeting.${nestedKey}`)) {
              updatedTargeting[nestedKey] = aiGeneratedData.targeting[nestedKey];
            }
          });
          updatedData.targeting = updatedTargeting;
        } else {
          updatedData[key] = aiGeneratedData[key];
        }
      }
    });

    setFormData(updatedData);

    // End auto-fill after a short delay
    setTimeout(() => {
      setIsAutoFilling(false);
    }, 100);
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Campaign Form Demo</h1>
        <button
          onClick={simulateAutoFill}
          disabled={isAutoFilling}
          style={{
            padding: '0.5rem 1rem',
            background: isAutoFilling ? '#d1d5db' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: isAutoFilling ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          {isAutoFilling ? 'Auto-filling...' : 'Simulate Auto-Fill'}
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <CampaignForm
          formData={formData}
          onChange={handleChange}
          onSubmit={handleSubmit}
          isAutoFilling={isAutoFilling}
          highlightedFields={highlightedFields}
          manuallyEditedFields={manuallyEditedFields}
          onFieldManuallyEdited={handleFieldManuallyEdited}
        />
      </div>
    </div>
  );
}
