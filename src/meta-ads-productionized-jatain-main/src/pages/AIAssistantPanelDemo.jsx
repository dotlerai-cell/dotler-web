import { useState } from 'react';
import AIAssistantPanel from '../components/ai-assistant/AIAssistantPanel';

/**
 * Demo page for AIAssistantPanel component
 */
export default function AIAssistantPanelDemo() {
  const [chatHistory, setChatHistory] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [isIterating, setIsIterating] = useState(false);

  /**
   * Handles campaign generation
   */
  function handleGenerate(context) {
    console.log('Generate campaign with context:', context);
    
    setIsGenerating(true);
    setGenerationComplete(false);

    // Simulate generation process
    setTimeout(() => {
      setIsGenerating(false);
      setGenerationComplete(true);
      
      // Add initial assistant message
      setChatHistory([
        {
          id: '1',
          role: 'assistant',
          content: 'I\'ve generated your campaign! The form has been populated with optimized parameters based on your business information. Feel free to ask me to make any changes.',
          timestamp: new Date().toISOString(),
          affectedFields: ['Campaign Name', 'Objective', 'Budget', 'Audience', 'Ad Copy'],
        },
      ]);
    }, 3000);
  }

  /**
   * Handles chat messages
   */
  function handleChatMessage(message) {
    console.log('Chat message:', message);

    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    setChatHistory(prev => [...prev, userMessage]);
    setIsIterating(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: `I've updated the campaign based on your request: "${message}". The changes have been applied to the form.`,
        timestamp: new Date().toISOString(),
        affectedFields: ['Ad Copy', 'Budget'],
      };

      setChatHistory(prev => [...prev, assistantMessage]);
      setIsIterating(false);
    }, 2000);
  }

  /**
   * Resets the demo
   */
  function handleReset() {
    setChatHistory([]);
    setIsGenerating(false);
    setGenerationComplete(false);
    setIsIterating(false);
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh',
      background: '#f3f4f6'
    }}>
      {/* Header */}
      <div style={{
        padding: '1.5rem',
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
            AI Assistant Panel Demo
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
            Test the complete AI assistant panel with all integrated components
          </p>
        </div>
        <button
          onClick={handleReset}
          style={{
            padding: '0.5rem 1rem',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Reset Demo
        </button>
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Left Side - Placeholder for Campaign Form */}
        <div style={{
          flex: 1,
          padding: '2rem',
          overflowY: 'auto',
          background: 'white',
          borderRight: '1px solid #e5e7eb'
        }}>
          <h2 style={{ marginTop: 0 }}>Campaign Form</h2>
          <p style={{ color: '#6b7280' }}>
            This is where the campaign form would be displayed. 
            The AI Assistant Panel on the right will generate and populate this form.
          </p>
          
          {generationComplete && (
            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              background: '#d1fae5',
              border: '1px solid #10b981',
              borderRadius: '0.5rem',
              color: '#065f46'
            }}>
              ✓ Campaign form has been populated with AI-generated values!
            </div>
          )}

          <div style={{ marginTop: '2rem' }}>
            <h3>Demo Fields:</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Campaign Name
                </label>
                <input 
                  type="text" 
                  placeholder="Generated campaign name..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Daily Budget
                </label>
                <input 
                  type="text" 
                  placeholder="Generated budget..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Ad Copy
                </label>
                <textarea 
                  placeholder="Generated ad copy..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - AI Assistant Panel */}
        <div style={{
          width: '500px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <AIAssistantPanel
            onGenerate={handleGenerate}
            onChatMessage={handleChatMessage}
            chatHistory={chatHistory}
            isGenerating={isGenerating}
            generationComplete={generationComplete}
            isIterating={isIterating}
          />
        </div>
      </div>
    </div>
  );
}
