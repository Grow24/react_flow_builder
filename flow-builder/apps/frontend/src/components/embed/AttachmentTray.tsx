import React, { useState, useRef } from 'react';
import { API_BASE } from '../../api/origin';
import { Upload, Link, Type, Plus } from 'lucide-react';
import { EmbedCard } from './EmbedCard';
import { LinkUnfurlInput } from './LinkUnfurlInput';
import { Button } from '../ui/button';

interface Attachment {
  id: string;
  mediaId: string;
  order: number;
  media: {
    id: string;
    kind: string;
    name: string;
    mimeType?: string;
    url: string;
    thumbnail?: string;
    sizeBytes?: number;
    width?: number;
    height?: number;
    durationSec?: number;
    meta?: string;
  };
}

interface AttachmentTrayProps {
  scope: string;
  scopeId: string;
  attachments?: Attachment[];
  onAttachmentsChange?: (attachments: Attachment[]) => void;
}

export const AttachmentTray: React.FC<AttachmentTrayProps> = ({
  scope,
  scopeId,
  attachments = [],
  onAttachmentsChange
}) => {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [textContent, setTextContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList) => {
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch(`${API_BASE}/media/upload`, {
          method: 'POST',
          body: formData
        });
        const media = await response.json();
        
        await fetch(`${API_BASE}/attachments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scope, scopeId, mediaId: media.id })
        });
        
        refreshAttachments();
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  };

  const handleLinkAdd = async (url: string) => {
    try {
      const response = await fetch(`${API_BASE}/media/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const media = await response.json();
      
      await fetch(`${API_BASE}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, scopeId, mediaId: media.id })
      });
      
      setShowLinkInput(false);
      refreshAttachments();
    } catch (error) {
      console.error('Link add failed:', error);
    }
  };

  const handleTextAdd = async () => {
    if (!textContent.trim()) return;
    
    try {
      const response = await fetch(`${API_BASE}/media/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: textContent, title: 'Rich Text Note' })
      });
      const media = await response.json();
      
      await fetch(`${API_BASE}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, scopeId, mediaId: media.id })
      });
      
      setShowTextEditor(false);
      setTextContent('');
      refreshAttachments();
    } catch (error) {
      console.error('Text add failed:', error);
    }
  };

  const handleRemove = async (attachmentId: string) => {
    try {
      await fetch(`${API_BASE}/attachments/${attachmentId}`, { method: 'DELETE' });
      refreshAttachments();
    } catch (error) {
      console.error('Remove failed:', error);
    }
  };

  const refreshAttachments = async () => {
    try {
      const response = await fetch(`${API_BASE}/attachments?scope=${scope}&scopeId=${scopeId}`);
      const newAttachments = await response.json();
      onAttachmentsChange?.(newAttachments);
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowLinkInput(true)}
        >
          <Link className="w-4 h-4 mr-2" />
          Link
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowTextEditor(true)}
        >
          <Type className="w-4 h-4 mr-2" />
          Text
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,application/pdf"
        className="hidden"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
      />

      {showLinkInput && (
        <LinkUnfurlInput
          onSubmit={handleLinkAdd}
          onCancel={() => setShowLinkInput(false)}
        />
      )}

      {showTextEditor && (
        <div className="border rounded p-4 space-y-3">
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Enter your text content..."
            className="w-full h-32 p-2 border rounded resize-none"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleTextAdd}>Add Text</Button>
            <Button size="sm" variant="outline" onClick={() => setShowTextEditor(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {attachments.map((attachment) => (
          <EmbedCard
            key={attachment.id}
            media={attachment.media}
            onRemove={() => handleRemove(attachment.id)}
          />
        ))}
      </div>
    </div>
  );
};