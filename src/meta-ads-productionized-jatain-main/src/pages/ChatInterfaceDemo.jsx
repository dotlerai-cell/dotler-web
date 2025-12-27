import { useState } from 'react';
import ChatInterface from '../components/ai-assistant/ChatInterface';

/**
 * ChatInterfaceDemo Page
 * 
 * Demo page for testing the ChatInterface component with simulated AI responses.
 */
export default function ChatInterfaceDemo() {
  const [chatHistory, setChatHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [disabled, setDisabled] = useState(false);

  /**
   * Simulates AI processing and response
   */
  async function simulateAIResponse(userMessage) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock response based on user message
    const lowerMessage = userMessage.toLowerCase();
    let response = {
      content: '',
      affectedFields: [],
    };

    if (lowerMessage.includes('budget')) {
      response.content = "I've updated the daily budget to $500 and adjusted the total budget accordingly. This should give you better reach while staying within your constraints.";
      response.affectedFields = ['dailyBudget', 'totalBudget'];
    } else if (lowerMessage.includes('audience') || lowerMessage.includes('target')) {
      response.content = "I've refined the target audience to focus on young professionals aged 25-35 in urban areas. I've also added interests related to technology and entrepreneurship.";
      response.affectedFields = ['targeting.ageMin', 'targeting.ageMax', 'targeting.locations', 'targeting.interests'];
    } else if (lowerMessage.includes('ad copy') || lowerMessage.includes('copy')) {
      response.content = "I've made the ad copy more casual and conversational. The new version uses a friendly tone while maintaining professionalism. I've also updated the headlines to be more attention-grabbing.";
      response.affectedFields = ['adCopy', 'headlines'];
    } else if (lowerMessage.includes('casual') || lowerMessage.includes('tone')) {
      response.content = "I've adjusted the tone to be more casual and relatable. The messaging now feels more conversational and less corporate.";
      response.affectedFields = ['adCopy', 'headlines', 'descriptions'];
    } else if (lowerMessage.includes('increase') || lowerMessage.includes('more')) {
      response.content = "I've increased the values as requested. The campaign should now have more reach and impact.";
      response.affectedFields = ['dailyBudget'];
    } else if (lowerMessage.includes('decrease') || lowerMessage.includes('less') || lowerMessage.includes('reduce')) {
      response.content = "I've reduced the values to be more conservative. This should help you test the waters before scaling up.";
      response.affectedFields = ['dailyBudget', 'totalBudget'];
    } else {
      response.content = "I understand your request. Let me help you with that. I've made the necessary adjustments to your campaign based on your feedback.";
      response.affectedFields = ['name', 'objective'];
    }

    return response;
  }

  /**
   * Handles sending a message
   */
  async function handleSendMessage(message) {
    // Add user message to history
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setChatHistory(prev => [...prev, userMessage]);

    // Simulate AI processing
    setIsProcessing(true);

    try {
      const response = await simulateAIResponse(message);

      // Add assistant response
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        affectedFields: response.affectedFields,
      };

      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error message
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };

      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }

  /**
   * Clears chat history
   */
  function handleClearChat() {
    setChatHistory([]);
  }

  /**
   * Adds a sample conversation
   */
  function handleLoadSampleConversation() {
    const sampleMessages = [
      {
        id: 'sample-1',
        role: 'assistant',
        content: "I've generated a comprehensive campaign for your product. The campaign includes targeted audience segments, optimized ad copy, and a strategic budget allocation. Feel free to ask me to adjust any aspect of the campaign!",
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
        affectedFields: ['name', 'objective', 'dailyBudget', 'targeting', 'adCopy'],
      },
      {
        id: 'sample-2',
        role: 'user',
        content: "Can you make the ad copy more casual and increase the budget to $500 per day?",
        timestamp: new Date(Date.now() - 240000), // 4 minutes ago
      },
      {
        id: 'sample-3',
        role: 'assistant',
        content: "I've updated the ad copy to use a more casual, conversational tone. The daily budget has been increased to $500, and I've adjusted the total budget to $15,000 for a 30-day campaign. The new copy should resonate better with your target audience!",
        timestamp: new Date(Date.now() - 180000), // 3 minutes ago
        affectedFields: ['adCopy', 'headlines', 'dailyBudget', 'totalBudget'],
      },
      {
        id: 'sample-4',
        role: 'user',
        content: "Great! Can you also target a younger audience, maybe 18-30 instead?",
        timestamp: new Date(Date.now() - 120000), // 2 minutes ago
      },
      {
        id: 'sample-5',
        role: 'assistant',
        content: "I've adjusted the target audience to ages 18-30. I've also updated the interests to include more youth-oriented categories like gaming, social media, and trending topics. This should help you reach a younger demographic more effectively.",
        timestamp: new Date(Date.now() - 60000), // 1 minute ago
        affectedFields: ['targeting.ageMin', 'targeting.ageMax', 'targeting.interests'],
      },
    ];

    setChatHistory(sampleMessages);
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>ChatInterface Component Demo</h1>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        Test the ChatInterface component with simulated AI responses. Try asking to adjust the budget, 
        change the tone, or modify the target audience.
      </p>

      {/* Controls */}
      <div style={{ 
        marginBottom: '20px', 
        display: 'flex', 
        gap: '10px', 
        flexWrap: 'wrap',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
      }}>
        <button
          onClick={handleClearChat}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Clear Chat
        </button>
        <button
          onClick={handleLoadSampleConversation}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Load Sample Conversation
        </button>
        <button
          onClick={() => setDisabled(!disabled)}
          style={{
            padding: '8px 16px',
            backgroundColor: disabled ? '#ffc107' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {disabled ? 'Enable Chat' : 'Disable Chat'}
        </button>
      </div>

      {/* Chat Interface */}
      <div style={{ 
        height: '600px', 
        border: '1px solid #e0e0e0', 
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: 'white',
      }}>
        <ChatInterface
          chatHistory={chatHistory}
          onSendMessage={handleSendMessage}
          isProcessing={isProcessing}
          disabled={disabled}
        />
      </div>

      {/* Instructions */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#e7f3ff',
        borderRadius: '8px',
        border: '1px solid #b3d9ff',
      }}>
        <h3 style={{ marginTop: 0 }}>Try these example messages:</h3>
        <ul style={{ marginBottom: 0 }}>
          <li>"Increase the budget to $500 per day"</li>
          <li>"Make the ad copy more casual"</li>
          <li>"Target a younger audience aged 18-25"</li>
          <li>"Adjust the tone to be more professional"</li>
          <li>"Reduce the daily budget"</li>
        </ul>
      </div>

      {/* Debug Info */}
      <details style={{ marginTop: '20px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
          Debug Info (Click to expand)
        </summary>
        <pre style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '15px', 
          borderRadius: '6px',
          overflow: 'auto',
          fontSize: '12px',
        }}>
          {JSON.stringify({ 
            messageCount: chatHistory.length,
            isProcessing,
            disabled,
            chatHistory 
          }, null, 2)}
        </pre>
      </details>
    </div>
  );
}
