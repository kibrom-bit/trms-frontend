import React, { useState, useRef } from 'react';
import { IconCamera, IconUpload, IconX, IconLoader2 } from '@tabler/icons-react';
import { apiClient } from '../services/api';
import { getBackendUrl } from '../utils/url-utils';

interface AvatarUploadProps {
  currentImageUrl?: string;
  onUploadSuccess: (url: string) => void;
  label?: string;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ 
  currentImageUrl, 
  onUploadSuccess,
  label = "Profile Picture"
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      const response = await apiClient.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      onUploadSuccess(response.data.url);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const displayUrl = previewUrl || currentImageUrl;

  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-black text-primary-400 uppercase tracking-[0.2em] ml-1">
        {label}
      </label>
      
      <div 
        onClick={triggerUpload}
        className="group relative w-32 h-32 rounded-[2rem] border-2 border-dashed border-primary-100 hover:border-primary-500 transition-all cursor-pointer overflow-hidden flex items-center justify-center bg-primary-50/30"
      >
        {displayUrl ? (
          <img 
            src={getBackendUrl(displayUrl)} 
            alt="Profile" 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-primary-300 group-hover:text-primary-600 transition-colors">
            <IconCamera size={28} stroke={1.5} />
            <span className="text-[9px] font-black uppercase">Upload</span>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-primary-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
          <IconUpload size={24} className="text-white" />
        </div>

        {/* Loading State */}
        {isUploading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center">
            <IconLoader2 size={24} className="text-primary-600 animate-spin" />
          </div>
        )}

        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden" 
          accept="image/*"
        />
      </div>
    </div>
  );
};
