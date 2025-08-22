'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '@/hooks/useAuthSession';
import { toast } from 'react-toastify';
import {
  Search,
  Building2,
  Target,
  Clock,
  Gift,
  CheckCircle,
  PlayCircle,
  XCircle,
  TrendingUp,
  Calendar,
  MapPin,
  Sparkles
} from 'lucide-react';

interface Mission {
  id: number;
  business_id: number;
  title: string;
  description: string;
  offer: string;
  applicable_tiers: string[];
  expires_at: string;
  filters: {
    gender?: ('Male' | 'Female' | 'Other')[];
    age_range?: { min: number; max: number };
    location?: string[];
    customer_type?: string[];
  };
  business_name: string;
  business_address: string;
}

interface MissionRegistry {
  id: number;
  mission_id: number;
  status: 'in_progress' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  discount_amount: string;
  discount_percentage: string;
  notes?: string;
  mission_title: string;
  mission_description: string;
  mission_offer: string;
  business_name: string;
}

interface CompanyMissions {
  business_id: number;
  business_name: string;
  business_address: string;
  missions: Mission[];
}

export default function CustomerMissionsPage() {
  const { user, role, loading } = useAuthSession();
  const router = useRouter();

  // State for available missions
  const [companyMissions, setCompanyMissions] = useState<CompanyMissions[]>([]);

  // State for mission progress
  const [missionProgress, setMissionProgress] = useState<MissionRegistry[]>([]);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [missionsLoading, setMissionsLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || role !== 'user')) {
      toast.info('Please log in to view your missions.');
      router.push('/login/customer');
    }
  }, [loading, user, role, router]);

  useEffect(() => {
    if (user && role === 'user') {
      void fetchAvailableMissions();
      void fetchMissionProgress();
    }
  }, [user, role]);

  const fetchAvailableMissions = async () => {
    setMissionsLoading(true);
    try {
      const response = await fetch('/api/customer/missions');
      if (!response.ok) {
        throw new Error('Failed to fetch missions.');
      }
      const data = await response.json() as Mission[];

      // Group missions by company
      const grouped = data.reduce((acc: CompanyMissions[], mission) => {
        const existing = acc.find(c => c.business_id === mission.business_id);
        if (existing) {
          existing.missions.push(mission);
        } else {
          acc.push({
            business_id: mission.business_id,
            business_name: mission.business_name,
            business_address: mission.business_address,
            missions: [mission]
          });
        }
        return acc;
      }, []);

      setCompanyMissions(grouped);
    } catch (err: unknown) {
      const errorMessage = (err as Error)?.message ?? 'Error loading missions';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setMissionsLoading(false);
    }
  };

  const fetchMissionProgress = async () => {
    setProgressLoading(true);
    try {
      const response = await fetch('/api/customer/mission-registry');
      if (!response.ok) {
        throw new Error('Failed to fetch mission progress.');
      }
      const data = await response.json() as { registries: MissionRegistry[] };
      setMissionProgress(data.registries ?? []);
    } catch (err: unknown) {
      console.error('Error fetching mission progress:', err);
    } finally {
      setProgressLoading(false);
    }
  };

  const startMission = async (mission: Mission) => {
    try {
      const response = await fetch('/api/customer/mission-registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mission_id: mission.id,
          business_id: mission.business_id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? 'Failed to start mission');
      }

      toast.success(`Mission "${mission.title}" started successfully!`);
      void fetchMissionProgress(); // Refresh progress
    } catch (err: unknown) {
      const errorMessage = (err as Error)?.message ?? 'Error starting mission';
      toast.error(errorMessage);
    }
  };

  const filteredCompanyMissions = companyMissions.filter(company => {
    if (selectedCompany !== 'all' && company.business_name !== selectedCompany) {
      return false;
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return company.missions.some(mission =>
        mission.title.toLowerCase().includes(searchLower) ||
        mission.description.toLowerCase().includes(searchLower) ||
        mission.offer.toLowerCase().includes(searchLower) ||
        company.business_name.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <PlayCircle className="w-5 h-5 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || missionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto py-12 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-xl text-gray-700">Loading your mission dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto py-12 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-xl text-red-600">Error: {error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || role !== 'user') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto py-12 px-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Mission Dashboard
            </h1>
          </div>

          {/* Compact Search and Filter */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search missions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 w-64 border border-gray-200 focus:border-blue-500 rounded-lg"
              />
            </div>

            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="h-9 px-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
            >
              <option value="all">All Companies</option>
              {companyMissions.map(company => (
                <option key={company.business_id} value={company.business_name}>
                  {company.business_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Tabs defaultValue="available" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 bg-white rounded-xl p-1 shadow-lg">
            <TabsTrigger value="available" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Target className="w-4 h-4 mr-2" />
              Available Missions
            </TabsTrigger>
            <TabsTrigger value="progress" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              My Progress
            </TabsTrigger>
          </TabsList>

          {/* Available Missions Tab */}
          <TabsContent value="available" className="space-y-8">
            {filteredCompanyMissions.length === 0 ? (
              <div className="text-center py-16">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-500">No missions found matching your criteria.</p>
                <p className="text-gray-400">Try adjusting your search or filters.</p>
              </div>
            ) : (
              filteredCompanyMissions.map(company => (
                <div key={company.business_id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  {/* Company Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className="w-6 h-6" />
                      <h2 className="text-2xl font-bold">{company.business_name}</h2>
                    </div>
                    <div className="flex items-center gap-2 text-blue-100">
                      <MapPin className="w-4 h-4" />
                      <span>{company.business_address}</span>
                    </div>
                  </div>

                  {/* Missions Grid */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {company.missions.map(mission => {
                        const isInProgress = missionProgress.some(p => p.mission_id === mission.id && p.status === 'in_progress');
                        const isCompleted = missionProgress.some(p => p.mission_id === mission.id && p.status === 'completed');

                        return (
                          <Card key={mission.id} className="border-2 hover:border-blue-300 transition-all duration-300 hover:shadow-xl">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-lg font-semibold text-gray-800 line-clamp-2">
                                  {mission.title}
                                </CardTitle>
                                {isInProgress && (
                                  <Badge className="bg-blue-100 text-blue-800">
                                    <PlayCircle className="w-3 h-3 mr-1" />
                                    In Progress
                                  </Badge>
                                )}
                                {isCompleted && (
                                  <Badge className="bg-green-100 text-green-800">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Completed
                                  </Badge>
                                )}
                              </div>
                              <CardDescription className="text-gray-600 line-clamp-3">
                                {mission.description}
                              </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                              {/* Offer Badge */}
                              <div className="flex items-center gap-2">
                                <Gift className="w-4 h-4 text-green-600" />
                                <Badge className="bg-green-100 text-green-800 font-medium">
                                  {mission.offer}
                                </Badge>
                              </div>

                              {/* Expiry Date */}
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar className="w-4 h-4" />
                                <span>Expires: {new Date(mission.expires_at).toLocaleDateString()}</span>
                              </div>

                              {/* Action Button */}
                              {!isInProgress && !isCompleted ? (
                                <Button
                                  onClick={() => startMission(mission)}
                                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 rounded-xl transition-all duration-300"
                                >
                                  <PlayCircle className="w-4 h-4 mr-2" />
                                  Start Mission
                                </Button>
                              ) : isCompleted ? (
                                <Button disabled className="w-full bg-green-100 text-green-800 font-semibold py-2 rounded-xl">
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Mission Completed
                                </Button>
                              ) : (
                                <Button disabled className="w-full bg-blue-100 text-blue-800 font-semibold py-2 rounded-xl">
                                  <Clock className="w-4 h-4 mr-2" />
                                  Mission in Progress
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Mission Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                Mission Progress
              </h3>

              {progressLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading your progress...</p>
                </div>
              ) : missionProgress.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-xl text-gray-500">No missions in progress yet.</p>
                  <p className="text-gray-400">Start a mission to see your progress here!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {missionProgress.map(registry => (
                    <Card key={registry.id} className="border-2 hover:shadow-lg transition-all duration-300">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg font-semibold text-gray-800 line-clamp-2">
                            {registry.mission_title}
                          </CardTitle>
                          <Badge className={getStatusColor(registry.status)}>
                            {getStatusIcon(registry.status)}
                            <span className="ml-1 capitalize">{registry.status.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        <CardDescription className="text-gray-600 line-clamp-2">
                          {registry.mission_description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Business Name */}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Building2 className="w-4 h-4" />
                          <span className="font-medium">{registry.business_name}</span>
                        </div>

                        {/* Offer */}
                        <div className="flex items-center gap-2">
                          <Gift className="w-4 h-4 text-green-600" />
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            {registry.mission_offer}
                          </Badge>
                        </div>

                        {/* Progress Details */}
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Started: {new Date(registry.started_at).toLocaleDateString()}</span>
                          </div>

                          {registry.completed_at && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span>Completed: {new Date(registry.completed_at).toLocaleDateString()}</span>
                            </div>
                          )}

                          {registry.discount_amount && parseFloat(registry.discount_amount) > 0 && (
                            <div className="flex items-center gap-2">
                              <Gift className="w-4 h-4 text-green-600" />
                              <span>Discount: ₹{parseFloat(registry.discount_amount).toFixed(2)}</span>
                            </div>
                          )}

                          {registry.discount_percentage && parseFloat(registry.discount_percentage) > 0 && (
                            <div className="flex items-center gap-2">
                              <Gift className="w-4 h-4 text-green-600" />
                              <span>Discount: {parseFloat(registry.discount_percentage).toFixed(1)}%</span>
                            </div>
                          )}

                          {registry.notes && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-gray-100 p-2 rounded">
                                <strong>Notes:</strong> {registry.notes}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}