import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { ArrowLeft, TrendingUp, Users, FolderKanban, MessageSquare, Activity } from 'lucide-react';
 import { CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProjects } from '@/hooks/useProjects';
import { StatsCard } from '@/components/StatsCard';
import { ThemeToggle } from '@/components/ThemeToggle';
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
        (p.activities || []).forEach(a => {
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
      (p.activities || []).forEach(a => {
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

   // Deadline overview (next 14 days)
   const deadlineData = useMemo(() => {
     const now = new Date();
     now.setHours(0, 0, 0, 0);
 
     const categories = {
       overdue: 0,
       today: 0,
       thisWeek: 0,
       nextWeek: 0,
       later: 0,
       noDueDate: 0,
     };
 
     projects.forEach((p) => {
       if (!p.due_date) {
         categories.noDueDate++;
         return;
       }
 
       const dueDate = new Date(p.due_date);
       dueDate.setHours(0, 0, 0, 0);
       const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
 
       if (diffDays < 0) {
         categories.overdue++;
       } else if (diffDays === 0) {
         categories.today++;
       } else if (diffDays <= 7) {
         categories.thisWeek++;
       } else if (diffDays <= 14) {
         categories.nextWeek++;
       } else {
         categories.later++;
       }
     });
 
     return [
       { name: 'Overdue', value: categories.overdue, fill: 'hsl(var(--destructive))' },
       { name: 'Hari Ini', value: categories.today, fill: 'hsl(var(--chart-3))' },
       { name: 'Minggu Ini', value: categories.thisWeek, fill: 'hsl(var(--chart-2))' },
       { name: 'Minggu Depan', value: categories.nextWeek, fill: 'hsl(var(--primary))' },
       { name: 'Nanti', value: categories.later, fill: 'hsl(var(--muted-foreground))' },
     ].filter((d) => d.value > 0);
   }, [projects]);
 
   // Upcoming deadlines list
   const upcomingDeadlines = useMemo(() => {
     const now = new Date();
     now.setHours(0, 0, 0, 0);
 
     return projects
       .filter((p) => p.due_date && p.status !== 'completed' && p.status !== 'archived')
       .map((p) => {
         const dueDate = new Date(p.due_date!);
         const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
         return {
           ...p,
           daysUntilDue: diffDays,
         };
       })
       .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
       .slice(0, 5);
   }, [projects]);
 
  // Summary stats
  const stats = useMemo(() => {
    const totalActivities = projects.reduce((sum, p) => sum + (p.activities?.length || 0), 0);
    const totalComments = projects.reduce((sum, p) => sum + (p.comments?.length || 0), 0);
    const uniqueHandlers = new Set(projects.flatMap(p => (p.all_handlers || []).map(h => h.id))).size;
    
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
          className="mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Statistik proyek dan aktivitas tim</p>
            </div>
          </div>
          <ThemeToggle />
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

         {/* Deadline Overview */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5 }}
         >
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <CalendarClock className="h-5 w-5 text-primary" />
                 Deadline Overview
               </CardTitle>
               <CardDescription>Distribusi deadline proyek</CardDescription>
             </CardHeader>
             <CardContent>
               {deadlineData.length > 0 ? (
                 <div className="space-y-4">
                   <ResponsiveContainer width="100%" height={180}>
                     <BarChart data={deadlineData} layout="vertical">
                       <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                       <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                       <YAxis
                         dataKey="name"
                         type="category"
                         width={90}
                         stroke="hsl(var(--muted-foreground))"
                         fontSize={12}
                       />
                       <Tooltip
                         contentStyle={{
                           backgroundColor: 'hsl(var(--card))',
                           border: '1px solid hsl(var(--border))',
                           borderRadius: '8px',
                         }}
                       />
                       <Bar dataKey="value" name="Proyek" radius={[0, 4, 4, 0]}>
                         {deadlineData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.fill} />
                         ))}
                       </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                   
                   {/* Upcoming deadlines list */}
                   {upcomingDeadlines.length > 0 && (
                     <div className="space-y-2 pt-2 border-t border-border">
                       <p className="text-xs font-medium text-muted-foreground uppercase">Deadline Terdekat</p>
                       {upcomingDeadlines.map((p) => (
                         <div
                           key={p.id}
                           className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                         >
                           <span className="text-sm font-medium truncate max-w-[180px]">{p.name}</span>
                           <span
                             className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                               p.daysUntilDue < 0
                                 ? 'bg-destructive/20 text-destructive'
                                 : p.daysUntilDue === 0
                                 ? 'bg-chart-3/20 text-chart-3'
                                 : p.daysUntilDue <= 3
                                 ? 'bg-chart-2/20 text-chart-2'
                                 : 'bg-primary/20 text-primary'
                             }`}
                           >
                             {p.daysUntilDue < 0
                               ? `${Math.abs(p.daysUntilDue)}d overdue`
                               : p.daysUntilDue === 0
                               ? 'Hari ini'
                               : `${p.daysUntilDue}d left`}
                           </span>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               ) : (
                 <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                   Belum ada proyek dengan deadline
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
