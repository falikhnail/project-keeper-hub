import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { ArrowLeft, TrendingUp, Users, FolderKanban, MessageSquare, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProjects } from '@/hooks/useProjects';
import { StatsCard } from '@/components/StatsCard';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const Analytics = () => {
  const navigate = useNavigate();
  const { projects, loading } = useProjects();

  // Project status distribution
  const statusData = useMemo(() => {
    const statusCounts = { active: 0, completed: 0, 'on-hold': 0, archived: 0 };
    projects.forEach(p => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    });
    return [
      { name: 'Active', value: statusCounts.active, fill: 'hsl(var(--primary))' },
      { name: 'Completed', value: statusCounts.completed, fill: 'hsl(var(--chart-2))' },
      { name: 'On Hold', value: statusCounts['on-hold'], fill: 'hsl(var(--chart-3))' },
      { name: 'Archived', value: statusCounts.archived, fill: 'hsl(var(--chart-4))' },
    ].filter(d => d.value > 0);
  }, [projects]);

  // Activity over time (last 7 days)
  const activityData = useMemo(() => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    return last7Days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      let activities = 0;
      let comments = 0;

      projects.forEach(p => {
        p.activities.forEach(a => {
          const actDate = new Date(a.timestamp);
          if (actDate >= dayStart && actDate < dayEnd) {
            if (a.type === 'comment') {
              comments++;
            } else {
              activities++;
            }
          }
        });
      });

      return {
        date: format(day, 'EEE'),
        fullDate: format(day, 'MMM dd'),
        activities,
        comments,
        total: activities + comments
      };
    });
  }, [projects]);

  // Top contributors (handlers with most activities)
  const contributorData = useMemo(() => {
    const handlerCounts: Record<string, { name: string; activities: number; comments: number }> = {};

    projects.forEach(p => {
      p.activities.forEach(a => {
        if (a.handler) {
          const key = a.handler.id;
          if (!handlerCounts[key]) {
            handlerCounts[key] = {
              name: a.handler.display_name || a.handler.email || 'Unknown',
              activities: 0,
              comments: 0
            };
          }
          if (a.type === 'comment') {
            handlerCounts[key].comments++;
          } else {
            handlerCounts[key].activities++;
          }
        }
      });
    });

    return Object.values(handlerCounts)
      .map(h => ({ ...h, total: h.activities + h.comments }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [projects]);

  // Projects by tags
  const tagData = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    projects.forEach(p => {
      p.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [projects]);

  // Summary stats
  const stats = useMemo(() => {
    const totalActivities = projects.reduce((sum, p) => sum + p.activities.length, 0);
    const totalComments = projects.reduce((sum, p) => sum + p.comments.length, 0);
    const uniqueHandlers = new Set(projects.flatMap(p => p.all_handlers.map(h => h.id))).size;
    
    return {
      totalProjects: projects.length,
      totalActivities,
      totalComments,
      uniqueHandlers
    };
  }, [projects]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-4"
        >
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Statistik proyek dan aktivitas tim</p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Proyek"
            value={stats.totalProjects}
            icon={FolderKanban}
            index={0}
          />
          <StatsCard
            title="Total Aktivitas"
            value={stats.totalActivities}
            icon={Activity}
            index={1}
          />
          <StatsCard
            title="Total Komentar"
            value={stats.totalComments}
            icon={MessageSquare}
            index={2}
          />
          <StatsCard
            title="Anggota Tim"
            value={stats.uniqueHandlers}
            icon={Users}
            index={3}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Project Status Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5 text-primary" />
                  Distribusi Status Proyek
                </CardTitle>
                <CardDescription>Pembagian proyek berdasarkan status</CardDescription>
              </CardHeader>
              <CardContent>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                    Belum ada data proyek
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Over Time */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Aktivitas 7 Hari Terakhir
                </CardTitle>
                <CardDescription>Tren aktivitas dan komentar harian</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={activityData}>
                    <defs>
                      <linearGradient id="colorActivities" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="activities"
                      name="Aktivitas"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorActivities)"
                    />
                    <Area
                      type="monotone"
                      dataKey="comments"
                      name="Komentar"
                      stroke="hsl(var(--chart-2))"
                      fillOpacity={1}
                      fill="url(#colorComments)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Contributors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Top Kontributor
                </CardTitle>
                <CardDescription>Anggota tim paling aktif</CardDescription>
              </CardHeader>
              <CardContent>
                {contributorData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={contributorData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={100} 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        tickFormatter={(value) => value.length > 12 ? `${value.slice(0, 12)}...` : value}
                      />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="activities" name="Aktivitas" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="comments" name="Komentar" stackId="a" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                    Belum ada data kontributor
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Projects by Tags */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Proyek per Tag
                </CardTitle>
                <CardDescription>Distribusi proyek berdasarkan tag</CardDescription>
              </CardHeader>
              <CardContent>
                {tagData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={tagData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        tickFormatter={(value) => value.length > 8 ? `${value.slice(0, 8)}...` : value}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" name="Jumlah Proyek" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                    Belum ada data tag
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
