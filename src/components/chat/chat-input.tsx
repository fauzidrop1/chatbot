'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Square, 
  ImagePlus, 
  X,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import Image from 'next/image';

interface ChatInputProps {
  onSend: (message: string, imageUrls?: string[]) => void;
  onCancel: () => void;
  isLoading: boolean;
  mode: 'chat' | 'image';
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onCancel,
  isLoading,
  mode,
  placeholder,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = useCallback(() => {
    if (!message.trim() && imageUrls.length === 0) return;
    if (isLoading) return;

    onSend(message.trim(), imageUrls.length > 0 ? imageUrls : undefined);
    setMessage('');
    setImageUrls([]);
  }, [message, imageUrls, isLoading, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const urls: string[] = [];
      
      for (const file of Array.from(files)) {
        // Convert to base64 for preview and API
        const reader = new FileReader();
        const url = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        urls.push(url);
      }

      setImageUrls((prev) => [...prev, ...urls]);
    } catch (error) {
      console.error('Image upload error:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const defaultPlaceholder = mode === 'image' 
    ? 'Describe the image you want to generate...'
    : 'Type your message...';

  return (
    <div className="border-t border-slate-700 bg-slate-900/50 backdrop-blur-sm p-4">
      {/* Image previews */}
      {imageUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {imageUrls.map((url, index) => (
            <div
              key={index}
              className="relative group"
            >
              <Image
                src={url}
                alt={`Attachment ${index + 1}`}
                width={80}
                height={80}
                className="rounded-lg object-cover w-20 h-20"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Image upload button (only for chat mode) */}
        {mode === 'chat' && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ImagePlus className="w-5 h-5" />
              )}
            </Button>
          </>
        )}

        {/* Text input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || defaultPlaceholder}
            className="min-h-[44px] max-h-[200px] resize-none bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 pr-12"
            disabled={isLoading}
            rows={1}
          />
        </div>

        {/* Send/Cancel button */}
        {isLoading ? (
          <Button
            variant="destructive"
            size="icon"
            onClick={onCancel}
            className="flex-shrink-0"
          >
            <Square className="w-5 h-5" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!message.trim() && imageUrls.length === 0}
            className="flex-shrink-0 bg-violet-600 hover:bg-violet-700"
            size="icon"
          >
            {mode === 'image' ? (
              <ImageIcon className="w-5 h-5" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        )}
      </div>

      <p className="text-xs text-slate-500 mt-2 text-center">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
