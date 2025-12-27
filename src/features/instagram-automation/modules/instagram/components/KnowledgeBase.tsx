import React, { useRef } from 'react';
import { KnowledgeDocument } from '../types';
import { FileText, Upload, Trash2, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface KnowledgeBaseProps {
  documents: KnowledgeDocument[];
  onAddDocument: (doc: KnowledgeDocument) => void;
  onUpdateDocument: (doc: KnowledgeDocument) => void;
  onDeleteDocument: (id: string) => void;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ documents, onAddDocument, onUpdateDocument, onDeleteDocument }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value
    e.target.value = '';

    // Attempt to read file text content for RAG
    let content = '';
    try {
        if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
            content = await file.text();
        } else {
            // Placeholder for PDF content in demo
            content = `[Binary File: ${file.name}]`; 
        }
    } catch (err) {
        console.error("Failed to read file", err);
        content = `[Error reading file: ${file.name}]`;
    }

    const newDoc: KnowledgeDocument = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'TXT',
        status: 'processing',
        size: formatFileSize(file.size),
        content: content
    };
    
    onAddDocument(newDoc);
    
    // Simulate RAG processing delay
    setTimeout(() => {
        onUpdateDocument({ ...newDoc, status: 'indexed' });
    }, 2500);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this document?')) {
        onDeleteDocument(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Knowledge Base (RAG)</h2>
            <p className="text-slate-500 dark:text-slate-400">Upload documents (PDF, TXT, MD) to train the AI Agent.</p>
        </div>
        <div>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.txt,.md" 
                onChange={handleFileChange}
            />
            <button 
                onClick={handleUploadClick}
                className="bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 flex items-center gap-2 transition shadow-lg shadow-brand-500/20"
            >
                <Upload className="w-4 h-4" /> Upload Document
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors min-h-[400px]">
                <div className="bg-slate-50 dark:bg-slate-700/50 px-6 py-3 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                    <span>Indexed Documents</span>
                    <span>{documents.length} Files</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {documents.map((doc) => (
                        <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition animate-in fade-in slide-in-from-left-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-lg flex items-center justify-center">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-slate-800 dark:text-white line-clamp-1">{doc.name}</h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        <span>{doc.size}</span>
                                        <span>•</span>
                                        <span className={`flex items-center gap-1 capitalize ${doc.status === 'indexed' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                            {doc.status === 'indexed' ? <CheckCircle2 className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />}
                                            {doc.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => handleDelete(e, doc.id)}
                                className="relative text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-2 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 z-10 cursor-pointer"
                                title="Delete Document"
                                type="button"
                            >
                                <Trash2 className="w-5 h-5 pointer-events-none" />
                            </button>
                        </div>
                    ))}
                    {documents.length === 0 && (
                        <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center h-full">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <Upload className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="font-medium">No documents yet</p>
                            <p className="text-sm mt-1">Upload a PDF or TXT file to start training your agent.</p>
                        </div>
                    )}
                </div>
            </div>
          </div>

          <div className="col-span-1">
             <div className="space-y-6 sticky top-6">
                 <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl p-6 text-white shadow-xl">
                     <h3 className="font-bold text-lg mb-2">Vector Database Status</h3>
                     <div className="space-y-4">
                         <div className="flex justify-between text-sm text-indigo-200 border-b border-indigo-800 pb-2">
                             <span>Vectors</span>
                             <span className="font-mono text-white">
                                 {(documents.filter(d => d.status === 'indexed').length * 142).toLocaleString()}
                             </span>
                         </div>
                         <div className="flex justify-between text-sm text-indigo-200 border-b border-indigo-800 pb-2">
                             <span>Last Sync</span>
                             <span className="font-mono text-white">Just now</span>
                         </div>
                         <div className="flex justify-between text-sm text-indigo-200 border-b border-indigo-800 pb-2">
                             <span>Model</span>
                             <span className="font-mono text-white">text-embedding-004</span>
                         </div>
                     </div>
                     <div className="mt-6 pt-4 border-t border-indigo-800">
                         <div className="text-xs text-indigo-300 mb-2">System Health</div>
                         <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                             <span className="font-medium">Operational</span>
                         </div>
                     </div>
                 </div>

                 <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                     <h3 className="font-bold text-slate-800 dark:text-white mb-3 text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-brand-500" />
                        How it works (RAG)
                     </h3>
                     <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                        We use Retrieval-Augmented Generation to make your AI smarter.
                     </p>
                     <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                         <li className="flex gap-3">
                             <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs">1</span>
                             <span>Upload product manuals, FAQs, or brand guidelines (txt/md).</span>
                         </li>
                         <li className="flex gap-3">
                             <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs">2</span>
                             <span>We read the text content securely in your browser.</span>
                         </li>
                         <li className="flex gap-3">
                             <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs">3</span>
                             <span>When a DM comes in, we send relevant context to Gemini.</span>
                         </li>
                         <li className="flex gap-3">
                             <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs">4</span>
                             <span>The AI uses this context to write accurate replies.</span>
                         </li>
                     </ol>
                 </div>
             </div>
          </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;