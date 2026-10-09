import React, { useState } from 'react';
import { API_ORIGIN } from '../../api/origin';
import { ExternalLink, FileText, Image, Video, Volume2, Paperclip } from 'lucide-react';

interface MediaAsset {
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
}

interface EmbedCardProps {
  media: MediaAsset;
  onRemove?: () => void;
  compact?: boolean;
}

export const EmbedCard: React.FC<EmbedCardProps> = ({ media, onRemove, compact = false }) => {
  const [showLightbox, setShowLightbox] = useState(false);
  
  const meta = media.meta ? JSON.parse(media.meta) : {};

  const renderIcon = () => {
    switch (media.kind) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Volume2 className="w-4 h-4" />;
      case 'pdf': return <FileText className="w-4 h-4" />;
      case 'link': return <ExternalLink className="w-4 h-4" />;
      default: return <Paperclip className="w-4 h-4" />;
    }
  };

  const renderContent = () => {
    if (compact) {
      return (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
          {renderIcon()}
          <span className="text-sm truncate">{media.name}</span>
        </div>
      );
    }

    switch (media.kind) {
      case 'image':
        return (
          <div className="relative">
            <img
              src={media.url.startsWith('http') ? media.url : `${API_ORIGIN}${media.url}`}
              alt={media.name}
              className="w-full h-48 object-cover rounded cursor-pointer"
              onClick={() => setShowLightbox(true)}
            />
            {showLightbox && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
                onClick={() => setShowLightbox(false)}
              >
                <img src={media.url.startsWith('http') ? media.url : `${API_ORIGIN}${media.url}`} alt={media.name} className="max-w-full max-h-full" />
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <video controls className="w-full h-48 rounded">
            <source src={media.url.startsWith('http') ? media.url : `${API_ORIGIN}${media.url}`} type={media.mimeType} />
          </video>
        );

      case 'audio':
        return (
          <div className="p-4 bg-gray-50 rounded">
            <audio controls className="w-full">
              <source src={media.url.startsWith('http') ? media.url : `${API_ORIGIN}${media.url}`} type={media.mimeType} />
            </audio>
          </div>
        );

      case 'pdf':
        return (
          <div className="p-4 bg-gray-50 rounded flex items-center gap-3">
            <FileText className="w-8 h-8 text-red-500" />
            <div>
              <div className="font-medium">{media.name}</div>
              <a href={media.url.startsWith('http') ? media.url : `${API_ORIGIN}${media.url}`} target="_blank" rel="noopener noreferrer" 
                 className="text-blue-500 hover:underline text-sm">
                Open PDF
              </a>
            </div>
          </div>
        );

      case 'link':
        return (
          <a href={media.url} target="_blank" rel="noopener noreferrer" 
             className="block p-4 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
            <div className="flex gap-3">
              {meta.image && (
                <img src={meta.image} alt="" className="w-16 h-16 object-cover rounded" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{meta.title || media.name}</div>
                <div className="text-sm text-gray-600 truncate">{meta.description}</div>
                <div className="text-xs text-gray-500 mt-1">{meta.siteName}</div>
              </div>
            </div>
          </a>
        );

      case 'text':
        return (
          <div className="p-4 bg-gray-50 rounded">
            <div className="prose prose-sm max-w-none" 
                 dangerouslySetInnerHTML={{ __html: meta.content }} />
          </div>
        );

      default:
        return (
          <div className="p-4 bg-gray-50 rounded flex items-center gap-3">
            {renderIcon()}
            <span>{media.name}</span>
          </div>
        );
    }
  };

  return (
    <div className="relative group">
      {renderContent()}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
        >
          ×
        </button>
      )}
    </div>
  );
};