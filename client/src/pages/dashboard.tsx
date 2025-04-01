import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { type DashboardStats } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/ui/status-badge";
import { 
  ArrowRight, 
  ArrowUp, 
  ArrowDown, 
  ClipboardCheck, 
  Clock, 
  Eye, 
  Pencil, 
  Folder, 
  Hourglass, 
  FolderCheck,
  BarChart2
} from "lucide-react";
import { formatDate } from "@/lib/utils/case-utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard"],
  });

  // Handle case view
  const handleViewCase = (id: number) => {
    setLocation(`/cases/${id}`);
  };

  // Function to render stat cards
  const renderStatCard = (
    title: string,
    value: number | undefined,
    change: string | undefined,
    bgColor: string,
    icon: JSX.Element
  ) => (
    <Card className={`${bgColor} text-white h-full`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h6 className="text-white/70 text-sm font-medium mb-1">{title}</h6>
            {isLoading ? (
              <Skeleton className="h-10 w-16 bg-white/20" />
            ) : (
              <h2 className="text-3xl font-bold">{value}</h2>
            )}
          </div>
          <div className="bg-white rounded-full p-2 text-center">
            {icon}
          </div>
        </div>
        <div className="mt-3">
          {isLoading ? (
            <Skeleton className="h-6 w-32 bg-white/20" />
          ) : (
            <span className="badge bg-white/90 text-xs px-2 py-1 rounded font-medium text-black">
              {change?.startsWith('-') ? (
                <ArrowDown className="h-3 w-3 inline mr-1 text-red-600" />
              ) : (
                <ArrowUp className="h-3 w-3 inline mr-1 text-green-600" />
              )}
              {change} from last month
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Function to get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center mb-1">
            <BarChart2 className="mr-2 h-6 w-6" />
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview of VAWC case statistics and recent activities
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {renderStatCard(
          "Total Cases",
          stats?.totalCases,
          stats?.totalCasesChange,
          "bg-primary",
          <Folder className="h-5 w-5 text-primary" />
        )}
        {renderStatCard(
          "Active Cases",
          stats?.activeCases,
          stats?.activeCasesChange,
          "bg-green-600",
          <ClipboardCheck className="h-5 w-5 text-green-600" />
        )}
        {renderStatCard(
          "Pending Cases",
          stats?.pendingCases,
          stats?.pendingCasesChange,
          "bg-amber-500",
          <Hourglass className="h-5 w-5 text-amber-500" />
        )}
        {renderStatCard(
          "Closed Cases",
          stats?.closedCases,
          stats?.closedCasesChange,
          "bg-gray-500",
          <FolderCheck className="h-5 w-5 text-gray-500" />
        )}
      </div>

      {/* Recent cases and staff activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl">
                <Clock className="h-5 w-5 inline mr-2" />
                Recent Cases
              </CardTitle>
              <Link href="/cases">
                <Button variant="outline" size="sm">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-sm font-medium text-left p-3">Incident Date</th>
                      <th className="text-sm font-medium text-left p-3">Victim's Name</th>
                      <th className="text-sm font-medium text-left p-3">Location</th>
                      <th className="text-sm font-medium text-left p-3">Status</th>
                      <th className="text-sm font-medium text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {isLoading ? (
                      Array(5).fill(0).map((_, i) => (
                        <tr key={i}>
                          <td className="p-3"><Skeleton className="h-5 w-20" /></td>
                          <td className="p-3"><Skeleton className="h-5 w-32" /></td>
                          <td className="p-3"><Skeleton className="h-5 w-24" /></td>
                          <td className="p-3"><Skeleton className="h-5 w-16" /></td>
                          <td className="p-3"><Skeleton className="h-8 w-20" /></td>
                        </tr>
                      ))
                    ) : stats?.recentCases && stats.recentCases.length > 0 ? (
                      stats.recentCases.map((caseItem) => (
                        <tr key={caseItem.id}>
                          <td className="p-3">{formatDate(new Date(caseItem.incidentDate))}</td>
                          <td className="p-3 font-medium">{caseItem.victimName}</td>
                          <td className="p-3">{caseItem.incidentLocation || 'Not specified'}</td>
                          <td className="p-3">
                            <StatusBadge status={caseItem.status} />
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleViewCase(caseItem.id)}
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleViewCase(caseItem.id)}
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-3 text-center">
                          No recent cases found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Staff Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y">
                {isLoading ? (
                  Array(4).fill(0).map((_, i) => (
                    <li key={i} className="flex items-start p-4">
                      <Skeleton className="h-10 w-10 rounded-full mr-3" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-24 mb-1" />
                        <Skeleton className="h-4 w-48 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </li>
                  ))
                ) : stats?.staffActivities && stats.staffActivities.length > 0 ? (
                  stats.staffActivities.map((activity, index) => (
                    <li key={index} className="flex items-start p-4">
                      <Avatar className="mr-3">
                        <AvatarFallback className={index % 2 === 0 ? "bg-primary text-white" : "bg-green-600 text-white"}>
                          {getInitials(activity.authorName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{activity.authorName}</div>
                        <div>
                          {activity.action} {activity.victimName && `for ${activity.victimName}`}
                        </div>
                        <small className="text-muted-foreground">
                          {formatDate(new Date(activity.timestamp))}
                        </small>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="p-4 text-center">No recent activities</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
