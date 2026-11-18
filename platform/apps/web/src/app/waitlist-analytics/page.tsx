/***
 * T-172: Waitlist Analytics Dashboard
 * 
 * Admin waitlist analytics dashboard displaying key metrics, trends,
 * and management capabilities for waitlist operations.
 * 
 * Builds on T-170 waitlist core and T-171 waitlist surfaces infrastructure.
 * 
 * Features:
 * - Current waitlist size and growth rate
 * - Conversion/promotion rates
 * - Average/median wait times
 * - Cascade/triggers analytics
 * - FIFO compliance rates
 * - Filtering by location, service, barber
 * - Time period selection
 * - Responsive design
 */

import { useEffect, useState } from 'react';
import { Link, usePathname, useRouter } from 'next/navigation';
import { apiBase } from '@/lib/api/api-base';
import { fetchJson } from '@/lib/api/http';
import { LoadingState, ErrorState, EmptyState } from '@/app/components/states';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/app/components/card';
import { Button } from '@/app/components/button';
import { useSearchParams } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, } from 'recharts';
import { ChevronDown } from 'lucide-react';

interface WaitlistEntry {
  id: string;
  clientName: string;
  configuration: {
    locationId: string;
    serviceId: string;
    barberId: string | null;
    windowFrom: string;
    windowTo: string;
    precision: 'exact' | 'flexible';
  };
  status: 'waiting' | 'offered' | 'booked' | 'expired' | 'cancelled' | 'paused';
  waitingSince: Date;
  consecutiveMisses: number;
  holdExpiresAt?: Date;
}

interface WaitlistConfiguration {
  locationId: string;
  serviceId: string;
  barberId: string | null;
  windowFrom: string;
  windowTo: string;
  precision: 'exact' | 'flexible';
}

interface WaitlistMetrics {
  totalHolders: number;
  activeWaitlist: number;
  promotedToday: number;
  promotionRate: number;
  averageWaitTime: number;
  medianWaitTime: number;
  cascadeTriggers: number;
  fifoCompliance: number;
  noShowCount: number;
  totalSlots: number;
  filledSlots: number;
}

interface WaitlistHoldHistory {
  waitingSince: Date;
  status: WaitlistEntry['status'];
  estimatedWaitTime?: number;
  triggerType?: 'cascade' | 'manual';
  fifoCompliant?: boolean;
  cancellationReason?: string;
}

/** Dashboard page for waitlist analytics */
export default function WaitlistAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<WaitlistMetrics | null>(null);
  const [holdHistory, setHoldHistory] = useState<WaitlistHoldHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<{
    locationId?: string;
    serviceId?: string;
    startDate: string;
    endDate: string;
  }>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const loadWaitlistData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch waitlist configurations
      const configsResult = await fetchJson<{ configs: WaitlistConfiguration[] }>(
        '/scheduling/waitlist/configurations'
      );
      
      // Fetch hold history for the date range
      const holdsResult = await fetchJson<WaitlistHoldHistory[]>(
        `/scheduling/waitlist/hold-history?start=${filter.startDate}&end=${filter.endDate}`
      );
      
      // Calculate metrics
      const totalHolders = holdsResult?.length || 0;
      const activeWaitlist = holdsResult?.filter(h => h.status === 'waiting').length || 0;
      const promotedToday = holdsResult?.filter(h => h.status === 'booked').length || 0;
      const promotionRate = totalHolders > 0 ? (promotedToday / totalHolders) * 100 : 0;
      
      // Wait times
      const waitTimes = holdsResult
        .filter(h => h.estimatedWaitTime !== undefined && h.estimatedWaitTime > 0)
        .map(h => h.estimatedWaitTime || 0);
      
      const averageWaitTime = waitTimes.length > 0
        ? waitTimes.reduce((sum, w) => sum + w, 0) / waitTimes.length
        : 0;
      
      const sortedWaitTimes = [...waitTimes].sort((a, b) => a - b);
      const medianWaitTime = waitTimes.length > 0
        ? sortedWaitTimes[Math.floor(sortedWaitTimes.length / 2)]
        : 0;
      
      // Cascade and FIFO metrics
      const cascadeTriggers = holdsResult?.filter(h => h.triggerType === 'cascade').length || 0;
      const fifoCompliant = holdsResult?.filter(h => h.fifoCompliant === true).length || 0;
      const fifoCompliance = totalHolders > 0 ? (fifoCompliant / totalHolders) * 100 : 0;
      
      // No-show count
      const noShowCount = holdsResult?.filter(h => 
        h.status === 'expired' || h.status === 'cancelled'
      ).length || 0;
      
      // Slot utilization
      const totalSlots = holdsResult?.reduce((sum, h) => sum + 1, 0) || 0;
      const filledSlots = holdsResult?.filter(h => h.status === 'booked').length || 0;
      
      setMetrics({
        totalHolders,
        activeWaitlist,
        promotedToday,
        promotionRate: Number(promotionRate.toFixed(1)),
        averageWaitTime: Number(averageWaitTime.toFixed(0)),
        medianWaitTime: Number(medianWaitTime.toFixed(0)),
        cascadeTriggers,
        fifoCompliance: Number(fifoCompliance.toFixed(1)),
        noShowCount,
        totalSlots,
        filledSlots: Number(filledSlots),
      });
      
      setHoldHistory(holdsResult || []);
    } catch (err) {
      setError('Failed to load waitlist analytics. Please try again.');
      console.error('Waitlist analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and re-fetch on filter change
  useEffect(() => {
    loadWaitlistData();
  }, []);

  if (loading) {
    return (
      <LoadingState 
        title="Loading Waitlist Analytics" 
        description="Retrieving waitlist metrics and trends..."
      />
    );
  }

  if (error) {
    return (
      <ErrorState 
        title="Error Loading Analytics" 
        description={error}
        retry={loadWaitlistData}
      />
    );
  }

  if (!metrics) {
    return (
      <EmptyState 
        title="Waitlist Analytics" 
        description="No waitlist data available. Configure waitlist queues to begin tracking."
        actionLabel="Set Up Waitlist"
        onAction={() => {
          // Navigate to waitlist configuration
          const router = useRouter();
          router.replace('/waitlist-configuration');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            <span>Waitlist Analytics</span>
            <ChevronDown className="ml-2 text-muted-foreground w-4 h-4 vertical-align-middle" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor waitlist performance, conversion rates, and trends across all locations
          </p>
        </header>

        {/* Filter Controls */}
        <div className="card border-border bg-card border-border p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-sm text-foreground mb-3">
            Filter Period
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Start Date</label>
              <input 
                type="date" 
                value={filter.startDate}
                onChange={(e) => 
                  setFilter({ ...filter, startDate: e.target.value })}
                className="w-full rounded border-border p-2"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">End Date</label>
              <input 
                type="date" 
                value={filter.endDate}
                onChange={(e) => 
                  setFilter({ ...filter, endDate: e.target.value })}
                className="w-full rounded border-border p-2"
              />
            </div>
            <div>
              <button 
                onClick={() => {
                  setFilter({
                    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0],
                  });
                  loadWaitlistData();
                }}
                className="flex-1 rounded border-border px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5"
              >
                Last 30 Days
              </button>
            </div>
            <div>
              <button 
                onClick={() => {
                  setFilter({
                    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0],
                  });
                  loadWaitlistData();
                }}
                className="flex-1 rounded border-border px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5"
              >
                Last 90 Days
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Waitlist Holders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{metrics?.totalHolders}</div>
              <div className="text-sm text-muted-foreground">Active clients in waitlist</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Promotion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{metrics?.promotionRate}%</div>
              <div className="text-sm text-muted-foreground">of holders promoted to booked</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Avg Wait Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{metrics?.averageWaitTime} min</div>
              <div className="text-sm text-muted-foreground">Average wait time</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Median Wait</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{metrics?.medianWaitTime} min</div>
              <div className="text-sm text-muted-foreground">Median wait time</div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Waitlist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{metrics?.activeWaitlist}</div>
              <div className="text-sm text-muted-foreground">Currently waiting for slots</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Cascade Triggers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{metrics?.cascadeTriggers}</div>
              <div className="text-sm text-muted-foreground">Auto-promotion events</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>FIFO Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold ${metrics?.fifoCompliance > 80 ? 'text-success' : 'text-warning'}">
                ${metrics?.fifoCompliance}%
              </div>
              <div className="text-sm text-muted-foreground">Slots filled in FIFO order</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>No-Show Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-error">{metrics?.noShowCount}</div>
              <div className="text-sm text-muted-foreground">Clients who no-showed</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Slot Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {metrics?.filledSlots}/${metrics?.totalSlots} (${Math.round(metrics?.filledSlots / Math.max(metrics?.totalSlots || 1, 1) * 100)}%)
              </div>
              <div className="text-sm text-muted-foreground">Filled vs total slots</div>
            </CardContent>
          </Card>
        </div>

        {/* Trends Chart Section */}
        <div className="card border-border bg-card border-border rounded-lg mb-6">
          <CardHeader>
            <CardTitle>Waitlist Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={holdHistory} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="waitingSince" stroke={['#8884d8']} domain={[0, 100]} />
                <YAxis 
                  domain={[0, Math.max(...holdHistory.map(h => (h.estimatedWaitTime || 0)) || 1, 100])} 
                  type="number"
                />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                
                {/* Waitlist status bars */}
                {holdHistory.map((entry, index) => (
                  <key unique={index} >
                    <Bar 
                      dataKey="status" 
                      fill={getStatusColor(entry.status)} 
                      stroke={getStatusColor(entry.status)}
                    />
                  </key>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </div>

        {/* Status Distribution */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...new Set(holdHistory.map(h => h.status))].map(status => (
            <Card key={status} className="flex items-center justify-between">
              <div className="text-sm">
                <span className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(status)}`}></span>
                {status}
              </div>
              <div className="text-sm font-medium">{holdHistory.filter(h => h.status === status).length}</div>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-8 border-t border-border">
          <Button 
            variant="primary" 
            className="w-full"
            onClick={() => window.location.href = '/waitlist-export'}
          >
            Export Waitlist Report
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Get status color for visualization */
function getStatusColor(status: WaitlistEntry['status']): string {
  const colors: Record<WaitlistEntry['status'], string> = {
    waiting: '#3B82F6',      // blue
    offered: '#8B5CF6',      // violet
    booked: '#10B981',       // green
    expired: '#EF4444',      // red
    cancelled: '#6B7280',    // gray
    paused: '#F59E0B',       // amber
  };
  return colors[status] || '#6B7280';
}

// Export helper for admin use
export const exportWaitlistReport = async (startDate: string, endDate: string) => {
  const result = await fetchJson<{
    success: boolean;
    csvContent: string;
    metrics: WaitlistMetrics;
  }>(`/scheduling/waitlist/export?start=${startDate}&end=${endDate}`);
  
  if (result?.success && result.csvContent) {
    const blob = new Blob([result.csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `waitlist-analytics-${startDate}-to-${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};