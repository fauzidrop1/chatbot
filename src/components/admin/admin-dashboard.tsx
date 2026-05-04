'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  DialogTrigger,
} from '@/components/ui/dialog';
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
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AdminDashboardProps {
  onClose: () => void;
}

export function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSessions: 0,
    totalMessages: 0,
    activeCodes: 0,
    totalRequests: 0,
  });
  const [models, setModels] = useState<any[]>([]);
  const [codes, setCodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminToken, setAdminToken] = useState('');

  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

  useEffect(() => {
    setAdminToken(adminPassword);
    fetchData();
  }, [adminPassword]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, modelsRes, codesRes] = await Promise.all([
        fetch(`/api/admin?token=${adminPassword}`),
        fetch('/api/admin/models', {
          headers: { authorization: `Bearer ${adminPassword}` },
        }),
        fetch('/api/admin/codes', {
          headers: { authorization: `Bearer ${adminPassword}` },
        }),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
      if (modelsRes.ok) {
        const data = await modelsRes.json();
        setModels(data.models);
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
  };

  const toggleModelActive = async (modelId: string, isActive: boolean) => {
    try {
      await fetch('/api/admin/models', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${adminPassword}`,
        },
        body: JSON.stringify({ id: modelId, isActive }),
      });
      fetchData();
    } catch (error) {
      console.error('Failed to toggle model:', error);
    }
  };

  const toggleCodeActive = async (codeId: string, isActive: boolean) => {
    try {
      await fetch('/api/admin/codes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${adminPassword}`,
        },
        body: JSON.stringify({ id: codeId, isActive }),
      });
      fetchData();
    } catch (error) {
      console.error('Failed to toggle code:', error);
    }
  };

  const deleteCode = async (codeId: string) => {
    if (!confirm('Are you sure you want to delete this access code?')) return;
    try {
      await fetch(`/api/admin/codes?id=${codeId}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${adminPassword}` },
      });
      fetchData();
    } catch (error) {
      console.error('Failed to delete code:', error);
    }
  };

  const deleteModel = async (modelId: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return;
    try {
      await fetch(`/api/admin/models?id=${modelId}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${adminPassword}` },
      });
      fetchData();
    } catch (error) {
      console.error('Failed to delete model:', error);
    }
  };

  const tierColors: Record<string, string> = {
    basic: 'bg-gray-500/20 text-gray-400',
    pro: 'bg-violet-500/20 text-violet-400',
    enterprise: 'bg-amber-500/20 text-amber-400',
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Chat
            </Button>
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
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
                      <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                      <p className="text-xs text-slate-400">Users</p>
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
                      <p className="text-2xl font-bold text-white">{stats.totalSessions}</p>
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
                      <p className="text-2xl font-bold text-white">{stats.totalMessages}</p>
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
                      <p className="text-2xl font-bold text-white">{stats.activeCodes}</p>
                      <p className="text-xs text-slate-400">Active Codes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                      <Cpu className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.totalRequests}</p>
                      <p className="text-xs text-slate-400">Total Requests</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="models" className="space-y-4">
              <TabsList className="bg-slate-800 border-slate-700">
                <TabsTrigger value="models" className="data-[state=active]:bg-slate-700">
                  <Cpu className="w-4 h-4 mr-2" />
                  Models
                </TabsTrigger>
                <TabsTrigger value="codes" className="data-[state=active]:bg-slate-700">
                  <Key className="w-4 h-4 mr-2" />
                  Access Codes
                </TabsTrigger>
              </TabsList>

              {/* Models Tab */}
              <TabsContent value="models">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">AI Models</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700 hover:bg-transparent">
                            <TableHead className="text-slate-400">Name</TableHead>
                            <TableHead className="text-slate-400">Provider</TableHead>
                            <TableHead className="text-slate-400">Type</TableHead>
                            <TableHead className="text-slate-400">Status</TableHead>
                            <TableHead className="text-slate-400 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {models.map((model) => (
                            <TableRow key={model.id} className="border-slate-700">
                              <TableCell className="text-white font-medium">
                                {model.displayName}
                              </TableCell>
                              <TableCell className="text-slate-300 capitalize">
                                {model.provider}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-slate-300 border-slate-600">
                                  {model.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Switch
                                  checked={model.isActive}
                                  onCheckedChange={(checked) =>
                                    toggleModelActive(model.id, checked)
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-400 hover:text-red-300"
                                  onClick={() => deleteModel(model.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
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
                    <CardTitle className="text-white">Access Codes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700 hover:bg-transparent">
                            <TableHead className="text-slate-400">Code</TableHead>
                            <TableHead className="text-slate-400">Name</TableHead>
                            <TableHead className="text-slate-400">Tier</TableHead>
                            <TableHead className="text-slate-400">Usage</TableHead>
                            <TableHead className="text-slate-400">Users</TableHead>
                            <TableHead className="text-slate-400">Status</TableHead>
                            <TableHead className="text-slate-400 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {codes.map((code) => (
                            <TableRow key={code.id} className="border-slate-700">
                              <TableCell className="text-white font-mono">
                                {code.code}
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {code.name || '-'}
                              </TableCell>
                              <TableCell>
                                <Badge className={tierColors[code.tier]}>
                                  {code.tier}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {code.usedRequests} / {code.maxRequests}
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {code.userCount}
                              </TableCell>
                              <TableCell>
                                <Switch
                                  checked={code.isActive}
                                  onCheckedChange={(checked) =>
                                    toggleCodeActive(code.id, checked)
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-400 hover:text-red-300"
                                  onClick={() => deleteCode(code.id)}
                                  disabled={code.userCount > 0}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}
