'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Users,
  MessageSquare,
  Key,
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Settings,
  Cpu,
  Copy,
  Check,
  RefreshCw,
  Server,
  Activity,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface AdminDashboardProps {
  admin: any;
  onLogout: () => void;
}

// Tier defaults
const tierDefaults = {
  basic: { rpm: 30, rpd: 200, tpm: 60000, tpd: 200000, imagesPerDay: 20 },
  pro: { rpm: 60, rpd: 1000, tpm: 120000, tpd: 500000, imagesPerDay: 50 },
  enterprise: { rpm: 200, rpd: 10000, tpm: 500000, tpd: 5000000, imagesPerDay: 200 },
};

export function AdminDashboard({ admin, onLogout }: AdminDashboardProps) {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [dailyActivity, setDailyActivity] = useState<any[]>([]);
  const [modelUsage, setModelUsage] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  
  // Providers state
  const [providers, setProviders] = useState<any[]>([]);
  const [showProviderDialog, setShowProviderDialog] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  const [providerForm, setProviderForm] = useState({
    name: '',
    displayName: '',
    apiKey: '',
    baseUrl: '',
    defaultRpm: 60,
    defaultRpd: 1000,
    defaultTpm: 100000,
    defaultTpd: 500000,
    isActive: true,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Access codes state
  const [codes, setCodes] = useState<any[]>([]);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [editingCode, setEditingCode] = useState<any>(null);
  const [codeForm, setCodeForm] = useState({
    code: '',
    name: '',
    tier: 'basic',
    maxUsers: 1,
    expirationDays: null as number | null,
    rpm: 30,
    rpd: 200,
    tpm: 60000,
    tpd: 200000,
    imagesPerDay: 20,
    isActive: true,
  });
  const [autoGenerateCode, setAutoGenerateCode] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = { 'x-admin-id': admin.id };
      
      const [statsRes, providersRes, codesRes] = await Promise.all([
        fetch('/api/admin', { headers }),
        fetch('/api/admin/providers', { headers }),
        fetch('/api/admin/codes', { headers }),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
        setDailyActivity(data.dailyActivity || []);
        setModelUsage(data.modelUsage || []);
        setTopUsers(data.topUsers || []);
      }
      
      if (providersRes.ok) {
        const data = await providersRes.json();
        setProviders(data.providers);
      }
      
      if (codesRes.ok) {
        const data = await codesRes.json();
        setCodes(data.codes);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [admin.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Provider handlers
  const handleSaveProvider = async () => {
    try {
      const headers: any = {
        'Content-Type': 'application/json',
        'x-admin-id': admin.id,
      };
      
      const url = '/api/admin/providers';
      const body = editingProvider 
        ? { id: editingProvider.id, ...providerForm }
        : providerForm;
      
      const response = await fetch(url, {
        method: editingProvider ? 'PATCH' : 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowProviderDialog(false);
        setEditingProvider(null);
        setProviderForm({
          name: '',
          displayName: '',
          apiKey: '',
          baseUrl: '',
          defaultRpm: 60,
          defaultRpd: 1000,
          defaultTpm: 100000,
          defaultTpd: 500000,
          isActive: true,
        });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to save provider:', error);
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;
    
    try {
      await fetch(`/api/admin/providers?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-id': admin.id },
      });
      fetchData();
    } catch (error) {
      console.error('Failed to delete provider:', error);
    }
  };

  const toggleProviderActive = async (id: string, isActive: boolean) => {
    try {
      await fetch('/api/admin/providers', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': admin.id,
        },
        body: JSON.stringify({ id, isActive }),
      });
      fetchData();
    } catch (error) {
      console.error('Failed to toggle provider:', error);
    }
  };

  // Access code handlers
  const handleTierChange = (tier: string) => {
    const defaults = tierDefaults[tier as keyof typeof tierDefaults];
    setCodeForm(prev => ({
      ...prev,
      tier,
      ...defaults,
    }));
  };

  const handleSaveCode = async () => {
    try {
      const headers: any = {
        'Content-Type': 'application/json',
        'x-admin-id': admin.id,
      };
      
      const body = {
        ...codeForm,
        code: autoGenerateCode ? '' : codeForm.code,
      };
      
      const response = await fetch('/api/admin/codes', {
        method: editingCode ? 'PATCH' : 'POST',
        headers,
        body: JSON.stringify(editingCode ? { id: editingCode.id, ...codeForm } : body),
      });

      if (response.ok) {
        setShowCodeDialog(false);
        setEditingCode(null);
        setCodeForm({
          code: '',
          name: '',
          tier: 'basic',
          maxUsers: 1,
          expirationDays: null,
          rpm: 30,
          rpd: 200,
          tpm: 60000,
          tpd: 200000,
          imagesPerDay: 20,
          isActive: true,
        });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to save code:', error);
    }
  };

  const handleDeleteCode = async (id: string) => {
    if (!confirm('Are you sure? This will delete the code and all associated users.')) return;
    
    try {
      await fetch(`/api/admin/codes?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-id': admin.id },
      });
      fetchData();
    } catch (error) {
      console.error('Failed to delete code:', error);
    }
  };

  const toggleCodeActive = async (id: string, isActive: boolean) => {
    try {
      await fetch('/api/admin/codes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': admin.id,
        },
        body: JSON.stringify({ id, isActive }),
      });
      fetchData();
    } catch (error) {
      console.error('Failed to toggle code:', error);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const openEditProvider = (provider: any) => {
    setEditingProvider(provider);
    setProviderForm({
      name: provider.name,
      displayName: provider.displayName,
      apiKey: '',
      baseUrl: provider.baseUrl || '',
      defaultRpm: provider.defaultRpm,
      defaultRpd: provider.defaultRpd,
      defaultTpm: provider.defaultTpm,
      defaultTpd: provider.defaultTpd,
      isActive: provider.isActive,
    });
    setShowProviderDialog(true);
  };

  const openEditCode = (code: any) => {
    setEditingCode(code);
    setCodeForm({
      code: code.code,
      name: code.name || '',
      tier: code.tier,
      maxUsers: code.maxUsers,
      expirationDays: code.expirationDays,
      rpm: code.rpm,
      rpd: code.rpd,
      tpm: code.tpm,
      tpd: code.tpd,
      imagesPerDay: code.imagesPerDay,
      isActive: code.isActive,
    });
    setAutoGenerateCode(false);
    setShowCodeDialog(true);
  };

  const tierColors: Record<string, string> = {
    basic: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    pro: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    enterprise: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-slate-400">Welcome, {admin.name || admin.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="border-slate-700 text-slate-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={onLogout}
              className="border-slate-700 text-slate-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.totalUsers || 0}</p>
                      <p className="text-xs text-slate-400">Total Users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.totalSessions || 0}</p>
                      <p className="text-xs text-slate-400">Sessions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.totalMessages || 0}</p>
                      <p className="text-xs text-slate-400">Messages</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Key className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.activeCodes || 0}</p>
                      <p className="text-xs text-slate-400">Active Codes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.totalRequests || 0}</p>
                      <p className="text-xs text-slate-400">Total Requests</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Daily Activity Chart */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-violet-400" />
                    Daily Activity (7 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyActivity}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="dayName" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="messages" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
                        <Line type="monotone" dataKey="sessions" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Model Usage Chart */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-blue-400" />
                    Top Models Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={modelUsage.slice(0, 6)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis type="number" stroke="#94a3b8" />
                        <YAxis type="category" dataKey="model" stroke="#94a3b8" width={120} tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                        />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="providers" className="space-y-4">
              <TabsList className="bg-slate-800 border-slate-700">
                <TabsTrigger value="providers" className="data-[state=active]:bg-slate-700">
                  <Server className="w-4 h-4 mr-2" />
                  API Providers
                </TabsTrigger>
                <TabsTrigger value="codes" className="data-[state=active]:bg-slate-700">
                  <Key className="w-4 h-4 mr-2" />
                  Access Codes
                </TabsTrigger>
                <TabsTrigger value="users" className="data-[state=active]:bg-slate-700">
                  <Users className="w-4 h-4 mr-2" />
                  Top Users
                </TabsTrigger>
              </TabsList>

              {/* Providers Tab */}
              <TabsContent value="providers">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-white">API Providers</CardTitle>
                      <CardDescription className="text-slate-400">
                        Configure API endpoints, keys, and rate limits
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => {
                        setEditingProvider(null);
                        setProviderForm({
                          name: '',
                          displayName: '',
                          apiKey: '',
                          baseUrl: '',
                          defaultRpm: 60,
                          defaultRpd: 1000,
                          defaultTpm: 100000,
                          defaultTpd: 500000,
                          isActive: true,
                        });
                        setShowProviderDialog(true);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Provider
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700 hover:bg-transparent">
                            <TableHead className="text-slate-400">Provider</TableHead>
                            <TableHead className="text-slate-400">Endpoint URL</TableHead>
                            <TableHead className="text-slate-400">API Key</TableHead>
                            <TableHead className="text-slate-400">Rate Limits</TableHead>
                            <TableHead className="text-slate-400">Status</TableHead>
                            <TableHead className="text-slate-400 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {providers.map((provider) => (
                            <TableRow key={provider.id} className="border-slate-700">
                              <TableCell className="text-white font-medium">
                                {provider.displayName}
                              </TableCell>
                              <TableCell className="text-slate-300 text-sm">
                                {provider.baseUrl || 'Default'}
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {provider.hasApiKey ? (
                                  <Badge variant="outline" className="text-green-400 border-green-500/30">
                                    {provider.apiKeyPreview}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-red-400 border-red-500/30">
                                    Not Set
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-slate-300 text-xs">
                                <div className="space-y-1">
                                  <div>RPM: {provider.defaultRpm} | RPD: {provider.defaultRpd}</div>
                                  <div>TPM: {(provider.defaultTpm / 1000).toFixed(0)}K | TPD: {(provider.defaultTpd / 1000).toFixed(0)}K</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Switch
                                  checked={provider.isActive}
                                  onCheckedChange={(checked) => toggleProviderActive(provider.id, checked)}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-400 hover:text-white"
                                    onClick={() => openEditProvider(provider)}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-400 hover:text-red-300"
                                    onClick={() => handleDeleteProvider(provider.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Access Codes Tab */}
              <TabsContent value="codes">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-white">Access Codes</CardTitle>
                      <CardDescription className="text-slate-400">
                        Manage user access codes and tier limits
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => {
                        setEditingCode(null);
                        setCodeForm({
                          code: '',
                          name: '',
                          tier: 'basic',
                          maxUsers: 1,
                          expirationDays: null,
                          rpm: 30,
                          rpd: 200,
                          tpm: 60000,
                          tpd: 200000,
                          imagesPerDay: 20,
                          isActive: true,
                        });
                        setAutoGenerateCode(true);
                        setShowCodeDialog(true);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Access Code
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700 hover:bg-transparent">
                            <TableHead className="text-slate-400">Code</TableHead>
                            <TableHead className="text-slate-400">Name</TableHead>
                            <TableHead className="text-slate-400">Tier</TableHead>
                            <TableHead className="text-slate-400">Limits</TableHead>
                            <TableHead className="text-slate-400">Users</TableHead>
                            <TableHead className="text-slate-400">Status</TableHead>
                            <TableHead className="text-slate-400 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {codes.map((code) => (
                            <TableRow key={code.id} className="border-slate-700">
                              <TableCell className="text-white font-mono">
                                <div className="flex items-center gap-2">
                                  {code.code}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-slate-400 hover:text-white"
                                    onClick={() => copyToClipboard(code.code)}
                                  >
                                    {copiedCode === code.code ? (
                                      <Check className="w-3 h-3 text-green-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {code.name || '-'}
                              </TableCell>
                              <TableCell>
                                <Badge className={tierColors[code.tier]}>
                                  {code.tier}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-slate-300 text-xs">
                                <div className="space-y-1">
                                  <div>RPM: {code.rpm} | RPD: {code.rpd}</div>
                                  <div>IMG: {code.imagesPerDay}/day</div>
                                </div>
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {code.userCount}/{code.maxUsers}
                              </TableCell>
                              <TableCell>
                                <Switch
                                  checked={code.isActive}
                                  onCheckedChange={(checked) => toggleCodeActive(code.id, checked)}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-400 hover:text-white"
                                    onClick={() => openEditCode(code)}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-400 hover:text-red-300"
                                    onClick={() => handleDeleteCode(code.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Top Users by Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700 hover:bg-transparent">
                          <TableHead className="text-slate-400">User ID</TableHead>
                          <TableHead className="text-slate-400">Access Code</TableHead>
                          <TableHead className="text-slate-400">Tier</TableHead>
                          <TableHead className="text-slate-400">Sessions</TableHead>
                          <TableHead className="text-slate-400">Requests</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topUsers.map((user) => (
                          <TableRow key={user.id} className="border-slate-700">
                            <TableCell className="text-slate-300 font-mono text-sm">
                              {user.id.slice(0, 8)}...
                            </TableCell>
                            <TableCell className="text-white font-mono">
                              {user.code}
                            </TableCell>
                            <TableCell>
                              <Badge className={tierColors[user.tier]}>
                                {user.tier}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {user.sessions}
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {user.usedRequests}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      {/* Provider Dialog */}
      <Dialog open={showProviderDialog} onOpenChange={setShowProviderDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProvider ? 'Edit Provider' : 'Add Provider'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Configure API endpoint and rate limits
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Provider Name</Label>
                <Input
                  value={providerForm.name}
                  onChange={(e) => setProviderForm(prev => ({ ...prev, name: e.target.value.toLowerCase() }))}
                  placeholder="openai"
                  className="bg-slate-900 border-slate-600"
                  disabled={!!editingProvider}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Display Name</Label>
                <Input
                  value={providerForm.displayName}
                  onChange={(e) => setProviderForm(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="OpenAI"
                  className="bg-slate-900 border-slate-600"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">API Key</Label>
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={providerForm.apiKey}
                  onChange={(e) => setProviderForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="sk-..."
                  className="bg-slate-900 border-slate-600 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full text-slate-400"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">Custom Endpoint URL (optional)</Label>
              <Input
                value={providerForm.baseUrl}
                onChange={(e) => setProviderForm(prev => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="https://api.example.com/v1"
                className="bg-slate-900 border-slate-600"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Requests/Min (RPM)</Label>
                <Input
                  type="number"
                  value={providerForm.defaultRpm}
                  onChange={(e) => setProviderForm(prev => ({ ...prev, defaultRpm: parseInt(e.target.value) }))}
                  className="bg-slate-900 border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Requests/Day (RPD)</Label>
                <Input
                  type="number"
                  value={providerForm.defaultRpd}
                  onChange={(e) => setProviderForm(prev => ({ ...prev, defaultRpd: parseInt(e.target.value) }))}
                  className="bg-slate-900 border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Tokens/Min (TPM)</Label>
                <Input
                  type="number"
                  value={providerForm.defaultTpm}
                  onChange={(e) => setProviderForm(prev => ({ ...prev, defaultTpm: parseInt(e.target.value) }))}
                  className="bg-slate-900 border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Tokens/Day (TPD)</Label>
                <Input
                  type="number"
                  value={providerForm.defaultTpd}
                  onChange={(e) => setProviderForm(prev => ({ ...prev, defaultTpd: parseInt(e.target.value) }))}
                  className="bg-slate-900 border-slate-600"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Active</Label>
              <Switch
                checked={providerForm.isActive}
                onCheckedChange={(checked) => setProviderForm(prev => ({ ...prev, isActive: checked }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProviderDialog(false)} className="border-slate-600">
              Cancel
            </Button>
            <Button onClick={handleSaveProvider} className="bg-violet-600 hover:bg-violet-700">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Code Dialog */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCode ? 'Edit Access Code' : 'Add Access Code'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Create or modify access code with tier limits
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {!editingCode && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={autoGenerateCode}
                  onCheckedChange={setAutoGenerateCode}
                />
                <Label className="text-slate-300">Auto-generate code</Label>
              </div>
            )}
            
            {!autoGenerateCode && (
              <div className="space-y-2">
                <Label className="text-slate-300">Access Code</Label>
                <Input
                  value={codeForm.code}
                  onChange={(e) => setCodeForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="MYCODE123"
                  className="bg-slate-900 border-slate-600"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label className="text-slate-300">Name/Description</Label>
              <Input
                value={codeForm.name}
                onChange={(e) => setCodeForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Pro User Access"
                className="bg-slate-900 border-slate-600"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Tier</Label>
                <Select value={codeForm.tier} onValueChange={handleTierChange}>
                  <SelectTrigger className="bg-slate-900 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Max Users</Label>
                <Input
                  type="number"
                  value={codeForm.maxUsers}
                  onChange={(e) => setCodeForm(prev => ({ ...prev, maxUsers: parseInt(e.target.value) }))}
                  className="bg-slate-900 border-slate-600"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">Expiration (days, optional)</Label>
              <Input
                type="number"
                value={codeForm.expirationDays || ''}
                onChange={(e) => setCodeForm(prev => ({ ...prev, expirationDays: e.target.value ? parseInt(e.target.value) : null }))}
                placeholder="Leave empty for no expiration"
                className="bg-slate-900 border-slate-600"
              />
            </div>
            
            <div className="border-t border-slate-700 pt-4">
              <p className="text-sm text-slate-400 mb-3">Rate Limits (customized from tier defaults)</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs">Requests/Min</Label>
                  <Input
                    type="number"
                    value={codeForm.rpm}
                    onChange={(e) => setCodeForm(prev => ({ ...prev, rpm: parseInt(e.target.value) }))}
                    className="bg-slate-900 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs">Requests/Day</Label>
                  <Input
                    type="number"
                    value={codeForm.rpd}
                    onChange={(e) => setCodeForm(prev => ({ ...prev, rpd: parseInt(e.target.value) }))}
                    className="bg-slate-900 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs">Tokens/Min</Label>
                  <Input
                    type="number"
                    value={codeForm.tpm}
                    onChange={(e) => setCodeForm(prev => ({ ...prev, tpm: parseInt(e.target.value) }))}
                    className="bg-slate-900 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs">Tokens/Day</Label>
                  <Input
                    type="number"
                    value={codeForm.tpd}
                    onChange={(e) => setCodeForm(prev => ({ ...prev, tpd: parseInt(e.target.value) }))}
                    className="bg-slate-900 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs">Images/Day</Label>
                  <Input
                    type="number"
                    value={codeForm.imagesPerDay}
                    onChange={(e) => setCodeForm(prev => ({ ...prev, imagesPerDay: parseInt(e.target.value) }))}
                    className="bg-slate-900 border-slate-600"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Active</Label>
              <Switch
                checked={codeForm.isActive}
                onCheckedChange={(checked) => setCodeForm(prev => ({ ...prev, isActive: checked }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCodeDialog(false)} className="border-slate-600">
              Cancel
            </Button>
            <Button onClick={handleSaveCode} className="bg-violet-600 hover:bg-violet-700">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
