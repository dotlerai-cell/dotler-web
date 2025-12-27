import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import DocumentUploader from '../components/ai-assistant/DocumentUploader';

/**
 * Demo page for testing the DocumentUploader component
 */
export default function DocumentUploaderDemo() {
  const [documents, setDocuments] = useState([]);

  function handleDocumentsChange(docs) {
    console.log('Documents changed:', docs);
    setDocuments(docs);
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Header title="Document Uploader Demo" />
        
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2>DocumentUploader Component Test</h2>
            <p>This page demonstrates the DocumentUploader component functionality:</p>
            <ul>
              <li>✅ File input with drag-and-drop support</li>
              <li>✅ Upload progress indicator</li>
              <li>✅ Display uploaded document list</li>
              <li>✅ Delete document functionality</li>
              <li>✅ Error messages for failed uploads</li>
            </ul>
          </div>

          <DocumentUploader onDocumentsChange={handleDocumentsChange} />

          <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <h3>Current Documents State:</h3>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {JSON.stringify(documents, null, 2)}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
