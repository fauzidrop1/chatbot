'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Image as ImageIcon, 
  Sparkles,
  ChevronDown,
  Check
} from 'lucide-react';
import type { ChatModel } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ModelSelectorProps {
  models: {
    chatModels: ChatModel[];
    imageModels: ChatModel[];
    multimodalModels: ChatModel[];
  };
  selectedModel: string | null;
  selectedImageModel: string | null;
  onSelectModel: (modelId: string) => void;
  onSelectImageModel: (modelId: string) => void;
  mode: 'chat' | 'image';
  onModeChange: (mode: 'chat' | 'image') => void;
}

const providerColors: Record<string, string> = {
  openai: 'bg-green-500/20 text-green-400',
  anthropic: 'bg-orange-500/20 text-orange-400',
  google: 'bg-blue-500/20 text-blue-400',
  mistral: 'bg-purple-500/20 text-purple-400',
  together: 'bg-pink-500/20 text-pink-400',
};

export function ModelSelector({
  models,
  selectedModel,
  selectedImageModel,
  onSelectModel,
  onSelectImageModel,
  mode,
  onModeChange,
}: ModelSelectorProps) {
  const selectedChatModel = useMemo(() => {
    return [...models.chatModels, ...models.multimodalModels].find(
      (m) => m.id === selectedModel
    );
  }, [models, selectedModel]);

  const selectedImgModel = useMemo(() => {
    return models.imageModels.find((m) => m.id === selectedImageModel);
  }, [models, selectedImageModel]);

  return (
    <div className="flex items-center gap-2">
      {/* Mode Toggle */}
      <div className="flex items-center bg-slate-800 rounded-lg p-1">
        <Button
          variant="ghost"
          size="sm"
          className={`gap-2 ${mode === 'chat' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
          onClick={() => onModeChange('chat')}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Chat</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`gap-2 ${mode === 'image' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
          onClick={() => onModeChange('image')}
        >
          <ImageIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Image</span>
        </Button>
      </div>

      {/* Model Dropdown */}
      {mode === 'chat' ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 gap-2"
            >
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="max-w-[150px] truncate">
                {selectedChatModel?.displayName || 'Select Model'}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 bg-slate-800 border-slate-700"
          >
            <DropdownMenuLabel className="text-slate-400">
              Multimodal Models
            </DropdownMenuLabel>
            {models.multimodalModels.map((model) => (
              <DropdownMenuItem
                key={model.id}
                className="text-white hover:bg-slate-700 focus:bg-slate-700 cursor-pointer"
                onClick={() => onSelectModel(model.id)}
              >
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="font-medium">{model.displayName}</p>
                    <p className="text-xs text-slate-400">{model.provider}</p>
                  </div>
                  {selectedModel === model.id && (
                    <Check className="w-4 h-4 text-violet-400" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator className="bg-slate-700" />
            
            <DropdownMenuLabel className="text-slate-400">
              Chat Models
            </DropdownMenuLabel>
            {models.chatModels
              .filter((m) => m.type !== 'multimodal')
              .map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  className="text-white hover:bg-slate-700 focus:bg-slate-700 cursor-pointer"
                  onClick={() => onSelectModel(model.id)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <p className="font-medium">{model.displayName}</p>
                      <p className="text-xs text-slate-400">{model.provider}</p>
                    </div>
                    {selectedModel === model.id && (
                      <Check className="w-4 h-4 text-violet-400" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 gap-2"
            >
              <ImageIcon className="w-4 h-4 text-pink-400" />
              <span className="max-w-[150px] truncate">
                {selectedImgModel?.displayName || 'Select Model'}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 bg-slate-800 border-slate-700"
          >
            <DropdownMenuLabel className="text-slate-400">
              Image Models
            </DropdownMenuLabel>
            {models.imageModels.map((model) => (
              <DropdownMenuItem
                key={model.id}
                className="text-white hover:bg-slate-700 focus:bg-slate-700 cursor-pointer"
                onClick={() => onSelectImageModel(model.id)}
              >
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="font-medium">{model.displayName}</p>
                    <p className="text-xs text-slate-400">{model.provider}</p>
                  </div>
                  {selectedImageModel === model.id && (
                    <Check className="w-4 h-4 text-pink-400" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
