'use client';

import { cn } from '@/lib/utils';
import { User, Bot, Image as ImageIcon, Loader2 } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/types';
import Image from 'next/image';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isImage = message.metadata?.type === 'image';

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-xl',
        isUser ? 'bg-violet-600/10' : 'bg-slate-800/50'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
          isUser ? 'bg-violet-600' : 'bg-slate-700'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-slate-300">
            {isUser ? 'You' : 'Assistant'}
          </span>
          {message.model && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
              {message.model}
            </span>
          )}
        </div>

        {isImage && message.content ? (
          <div className="mt-2">
            <Image
              src={message.content}
              alt="Generated image"
              width={512}
              height={512}
              className="rounded-lg max-w-full h-auto"
              unoptimized
            />
            {message.metadata?.prompt && (
              <p className="text-xs text-slate-500 mt-2 italic">
                "{message.metadata.prompt}"
              </p>
            )}
          </div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-slate-200 whitespace-pre-wrap break-words">
              {message.content}
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-violet-400 animate-pulse" />
              )}
            </p>
          </div>
        )}

        {message.imageUrls && message.imageUrls.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {message.imageUrls.map((url, i) => (
              <Image
                key={i}
                src={url}
                alt={`Attachment ${i + 1}`}
                width={128}
                height={128}
                className="rounded-lg object-cover"
                unoptimized
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Loading message component
export function LoadingMessage() {
  return (
    <div className="flex gap-3 p-4 rounded-xl bg-slate-800/50">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-slate-700">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-slate-300">Assistant</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Thinking...</span>
        </div>
      </div>
    </div>
  );
}
