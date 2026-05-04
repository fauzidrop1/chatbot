// MFXAI Chat - Seed Data
// Default models, access codes, admin users, and providers

import { db } from './db';

// Default Tier Limits
export const tierDefaults = {
  basic: {
    rpm: 30,
    rpd: 200,
    tpm: 60000,
    tpd: 200000,
    imagesPerDay: 20,
  },
  pro: {
    rpm: 60,
    rpd: 1000,
    tpm: 120000,
    tpd: 500000,
    imagesPerDay: 50,
  },
  enterprise: {
    rpm: 200,
    rpd: 10000,
    tpm: 500000,
    tpd: 5000000,
    imagesPerDay: 200,
  },
};

// Default API Providers
export const defaultProviders = [
  {
    name: 'openai',
    displayName: 'OpenAI',
    defaultRpm: 60,
    defaultRpd: 1000,
    defaultTpm: 100000,
    defaultTpd: 500000,
    isActive: true,
  },
  {
    name: 'anthropic',
    displayName: 'Anthropic',
    defaultRpm: 60,
    defaultRpd: 1000,
    defaultTpm: 100000,
    defaultTpd: 500000,
    isActive: true,
  },
  {
    name: 'google',
    displayName: 'Google AI',
    defaultRpm: 60,
    defaultRpd: 1500,
    defaultTpm: 100000,
    defaultTpd: 500000,
    isActive: true,
  },
  {
    name: 'mistral',
    displayName: 'Mistral AI',
    defaultRpm: 60,
    defaultRpd: 1000,
    defaultTpm: 100000,
    defaultTpd: 500000,
    isActive: true,
  },
  {
    name: 'together',
    displayName: 'Together AI',
    defaultRpm: 60,
    defaultRpd: 1000,
    defaultTpm: 100000,
    defaultTpd: 500000,
    isActive: true,
  },
];

// Default AI Models
export const defaultModels = [
  // OpenAI Models
  {
    name: 'gpt-4o',
    displayName: 'GPT-4o',
    provider: 'openai',
    type: 'multimodal',
    capabilities: JSON.stringify(['chat', 'image', 'vision']),
    maxTokens: 128000,
    isActive: true,
    sortOrder: 1,
  },
  {
    name: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    provider: 'openai',
    type: 'chat',
    capabilities: JSON.stringify(['chat', 'vision']),
    maxTokens: 128000,
    isActive: true,
    sortOrder: 2,
  },
  {
    name: 'gpt-4-turbo',
    displayName: 'GPT-4 Turbo',
    provider: 'openai',
    type: 'chat',
    capabilities: JSON.stringify(['chat', 'vision']),
    maxTokens: 128000,
    isActive: true,
    sortOrder: 3,
  },
  {
    name: 'gpt-3.5-turbo',
    displayName: 'GPT-3.5 Turbo',
    provider: 'openai',
    type: 'chat',
    capabilities: JSON.stringify(['chat']),
    maxTokens: 16384,
    isActive: true,
    sortOrder: 4,
  },
  
  // Anthropic Models
  {
    name: 'claude-sonnet-4-20250514',
    displayName: 'Claude Sonnet 4',
    provider: 'anthropic',
    type: 'chat',
    capabilities: JSON.stringify(['chat', 'vision']),
    maxTokens: 200000,
    isActive: true,
    sortOrder: 10,
  },
  {
    name: 'claude-3-5-sonnet-20241022',
    displayName: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    type: 'chat',
    capabilities: JSON.stringify(['chat', 'vision']),
    maxTokens: 200000,
    isActive: true,
    sortOrder: 11,
  },
  {
    name: 'claude-3-opus-20240229',
    displayName: 'Claude 3 Opus',
    provider: 'anthropic',
    type: 'chat',
    capabilities: JSON.stringify(['chat', 'vision']),
    maxTokens: 200000,
    isActive: true,
    sortOrder: 12,
  },
  
  // Google Models
  {
    name: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash',
    provider: 'google',
    type: 'multimodal',
    capabilities: JSON.stringify(['chat', 'image', 'vision']),
    maxTokens: 1048576,
    isActive: true,
    sortOrder: 20,
  },
  {
    name: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    provider: 'google',
    type: 'chat',
    capabilities: JSON.stringify(['chat', 'vision']),
    maxTokens: 2097152,
    isActive: true,
    sortOrder: 21,
  },
  
  // Mistral Models
  {
    name: 'mistral-large-latest',
    displayName: 'Mistral Large',
    provider: 'mistral',
    type: 'chat',
    capabilities: JSON.stringify(['chat']),
    maxTokens: 128000,
    isActive: true,
    sortOrder: 30,
  },
  {
    name: 'mistral-small-latest',
    displayName: 'Mistral Small',
    provider: 'mistral',
    type: 'chat',
    capabilities: JSON.stringify(['chat']),
    maxTokens: 128000,
    isActive: true,
    sortOrder: 31,
  },
  
  // Together AI Models (Llama, etc.)
  {
    name: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    displayName: 'Llama 3.3 70B',
    provider: 'together',
    type: 'chat',
    capabilities: JSON.stringify(['chat']),
    maxTokens: 131072,
    isActive: true,
    sortOrder: 40,
  },
  {
    name: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
    displayName: 'Llama 3.2 90B Vision',
    provider: 'together',
    type: 'chat',
    capabilities: JSON.stringify(['chat', 'vision']),
    maxTokens: 131072,
    isActive: true,
    sortOrder: 41,
  },
  
  // Image Generation Models
  {
    name: 'dall-e-3',
    displayName: 'DALL-E 3',
    provider: 'openai',
    type: 'image',
    capabilities: JSON.stringify(['image-generation']),
    maxTokens: 4096,
    isActive: true,
    sortOrder: 100,
  },
  {
    name: 'stable-diffusion-xl-1024-v1-0',
    displayName: 'Stable Diffusion XL',
    provider: 'together',
    type: 'image',
    capabilities: JSON.stringify(['image-generation']),
    maxTokens: 4096,
    isActive: true,
    sortOrder: 101,
  },
  {
    name: 'black-forest-labs/FLUX.1-schnell-Free',
    displayName: 'FLUX.1 Schnell (Free)',
    provider: 'together',
    type: 'image',
    capabilities: JSON.stringify(['image-generation']),
    maxTokens: 4096,
    isActive: true,
    sortOrder: 102,
  },
];

// Default Access Codes with tier limits
export const defaultAccessCodes = [
  {
    code: 'DEMO2024',
    name: 'Demo Pro Access',
    tier: 'pro',
    ...tierDefaults.pro,
    maxUsers: 10,
    userCount: 0,
    maxRequests: 1000,
    usedRequests: 0,
    isActive: true,
  },
  {
    code: 'TEST123',
    name: 'Test Basic Access',
    tier: 'basic',
    ...tierDefaults.basic,
    maxUsers: 5,
    userCount: 0,
    maxRequests: 100,
    usedRequests: 0,
    isActive: true,
  },
  {
    code: 'ADMIN2024',
    name: 'Admin Dashboard Access',
    tier: 'enterprise',
    ...tierDefaults.enterprise,
    maxUsers: 1,
    userCount: 0,
    maxRequests: 10000,
    usedRequests: 0,
    isActive: true,
  },
];

// Default Admin User
export const defaultAdminUsers = [
  {
    username: 'admin',
    password: 'admin123', // In production, this should be hashed
    name: 'Administrator',
    role: 'superadmin',
    isActive: true,
  },
];

// Seed the database
export async function seedDatabase() {
  try {
    // Seed Providers
    const existingProviders = await db.chatApiProvider.count();
    if (existingProviders === 0) {
      console.log('Seeding providers...');
      await db.chatApiProvider.createMany({
        data: defaultProviders,
      });
      console.log(`Created ${defaultProviders.length} providers`);
    }
    
    // Seed Models
    const existingModels = await db.chatModel.count();
    if (existingModels === 0) {
      console.log('Seeding models...');
      await db.chatModel.createMany({
        data: defaultModels,
      });
      console.log(`Created ${defaultModels.length} models`);
    }
    
    // Seed Access Codes
    const existingCodes = await db.chatAccessCode.count();
    if (existingCodes === 0) {
      console.log('Seeding access codes...');
      await db.chatAccessCode.createMany({
        data: defaultAccessCodes,
      });
      console.log(`Created ${defaultAccessCodes.length} access codes`);
    }
    
    // Seed Admin Users
    const existingAdmins = await db.adminUser.count();
    if (existingAdmins === 0) {
      console.log('Seeding admin users...');
      await db.adminUser.createMany({
        data: defaultAdminUsers,
      });
      console.log(`Created ${defaultAdminUsers.length} admin users`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Seed error:', error);
    return { success: false, error };
  }
}

// Get tier defaults
export function getTierDefaults(tier: string) {
  return tierDefaults[tier as keyof typeof tierDefaults] || tierDefaults.basic;
}
