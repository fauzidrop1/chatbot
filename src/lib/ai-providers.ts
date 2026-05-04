// MFXAI Chat - AI Providers Configuration
// Handles API calls to different AI providers

import type { ChatModel } from '@/types';

// Provider base URLs
const PROVIDER_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  google: 'https://generativelanguage.googleapis.com/v1beta',
  mistral: 'https://api.mistral.ai/v1',
  together: 'https://api.together.xyz/v1',
};

// Get API key from environment
export function getApiKey(provider: string): string | null {
  const keys: Record<string, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    google: process.env.GOOGLE_API_KEY,
    mistral: process.env.MISTRAL_API_KEY,
    together: process.env.TOGETHER_API_KEY,
  };
  return keys[provider] || null;
}

// Get provider base URL
export function getProviderUrl(provider: string): string {
  return PROVIDER_URLS[provider] || '';
}

// Build chat request based on provider
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  imageUrls?: string[];
}

export async function sendChatRequest(
  model: ChatModel,
  messages: ChatMessage[],
  onStream?: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const apiKey = getApiKey(model.provider);
  if (!apiKey) {
    throw new Error(`API key not configured for provider: ${model.provider}`);
  }

  switch (model.provider) {
    case 'openai':
      return sendOpenAIRequest(model.name, messages, apiKey, onStream, signal);
    case 'anthropic':
      return sendAnthropicRequest(model.name, messages, apiKey, onStream, signal);
    case 'google':
      return sendGoogleRequest(model.name, messages, apiKey, onStream, signal);
    case 'mistral':
      return sendMistralRequest(model.name, messages, apiKey, onStream, signal);
    case 'together':
      return sendTogetherRequest(model.name, messages, apiKey, onStream, signal);
    default:
      throw new Error(`Unsupported provider: ${model.provider}`);
  }
}

// OpenAI Chat Request
async function sendOpenAIRequest(
  modelName: string,
  messages: ChatMessage[],
  apiKey: string,
  onStream?: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const formattedMessages = messages.map(msg => {
    if (msg.imageUrls && msg.imageUrls.length > 0) {
      // Multimodal message with images
      const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
        { type: 'text', text: msg.content }
      ];
      msg.imageUrls.forEach(url => {
        content.push({
          type: 'image_url',
          image_url: { url }
        });
      });
      return { role: msg.role, content };
    }
    return { role: msg.role, content: msg.content };
  });

  if (onStream) {
    // Streaming request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: formattedMessages,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

      for (const line of lines) {
        const data = line.replace('data: ', '');
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            fullText += content;
            onStream(content);
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }

    return fullText;
  } else {
    // Non-streaming request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: formattedMessages,
      }),
      signal,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }
}

// Anthropic Chat Request
async function sendAnthropicRequest(
  modelName: string,
  messages: ChatMessage[],
  apiKey: string,
  onStream?: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  // Convert messages to Anthropic format
  const systemMessage = messages.find(m => m.role === 'system');
  const otherMessages = messages.filter(m => m.role !== 'system');

  const formattedMessages = otherMessages.map(msg => {
    if (msg.imageUrls && msg.imageUrls.length > 0) {
      const content: Array<{ type: string; text?: string; source?: { type: string; media_type: string; data: string } }> = [
        { type: 'text', text: msg.content }
      ];
      msg.imageUrls.forEach(url => {
        // Extract base64 data from data URL or use URL
        if (url.startsWith('data:')) {
          const [header, data] = url.split(',');
          const mediaType = header.match(/data:([^;]+)/)?.[1] || 'image/png';
          content.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data,
            },
          });
        }
      });
      return { role: msg.role, content };
    }
    return { role: msg.role, content: msg.content };
  });

  if (onStream) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: modelName,
        max_tokens: 4096,
        system: systemMessage?.content,
        messages: formattedMessages,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Anthropic API error');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

      for (const line of lines) {
        const data = line.replace('data: ', '');
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            fullText += parsed.delta.text;
            onStream(parsed.delta.text);
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }

    return fullText;
  } else {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: modelName,
        max_tokens: 4096,
        system: systemMessage?.content,
        messages: formattedMessages,
      }),
      signal,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Anthropic API error');
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
  }
}

// Google Gemini Request
async function sendGoogleRequest(
  modelName: string,
  messages: ChatMessage[],
  apiKey: string,
  onStream?: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  // Convert messages to Gemini format
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

  const systemInstruction = messages.find(m => m.role === 'system');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:${onStream ? 'streamGenerateContent' : 'generateContent'}?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction.content }] } : undefined,
        generationConfig: {
          maxOutputTokens: 8192,
        },
      }),
      signal,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Google API error');
  }

  if (onStream) {
    // Handle streaming response
    const text = await response.text();
    // Parse SSE format
    const lines = text.split('\n').filter(line => line.trim());
    let fullText = '';
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.replace('data: ', ''));
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (content) {
            fullText += content;
            onStream(content);
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
    
    return fullText;
  } else {
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
}

// Mistral Request
async function sendMistralRequest(
  modelName: string,
  messages: ChatMessage[],
  apiKey: string,
  onStream?: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const formattedMessages = messages.map(m => ({
    role: m.role,
    content: m.content,
  }));

  if (onStream) {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: formattedMessages,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Mistral API error');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

      for (const line of lines) {
        const data = line.replace('data: ', '');
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            fullText += content;
            onStream(content);
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }

    return fullText;
  } else {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: formattedMessages,
      }),
      signal,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Mistral API error');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }
}

// Together AI Request
async function sendTogetherRequest(
  modelName: string,
  messages: ChatMessage[],
  apiKey: string,
  onStream?: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const formattedMessages = messages.map(m => ({
    role: m.role,
    content: m.content,
  }));

  if (onStream) {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: formattedMessages,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Together API error');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

      for (const line of lines) {
        const data = line.replace('data: ', '');
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            fullText += content;
            onStream(content);
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }

    return fullText;
  } else {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: formattedMessages,
      }),
      signal,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Together API error');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }
}

// Image Generation
export async function generateImage(
  model: string,
  prompt: string,
  size: string = '1024x1024',
  signal?: AbortSignal
): Promise<{ url?: string; base64?: string }> {
  const apiKey = getApiKey('openai') || getApiKey('together');
  if (!apiKey) {
    throw new Error('API key not configured for image generation');
  }

  // DALL-E 3 via OpenAI
  if (model === 'dall-e-3') {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
        quality: 'standard',
        response_format: 'url',
      }),
      signal,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI Image API error');
    }

    const data = await response.json();
    return { url: data.data[0]?.url };
  }

  // Stable Diffusion / FLUX via Together AI
  const response = await fetch('https://api.together.xyz/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size,
      response_format: 'url',
    }),
    signal,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Together Image API error');
  }

  const data = await response.json();
  return { url: data.data[0]?.url };
}
