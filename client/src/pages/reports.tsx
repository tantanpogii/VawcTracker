import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Case } from "@shared/schema";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils/case-utils";
import RoleRestricted from "@/components/layout/role-restricted";

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CustomTabs as Tabs, 
  CustomTabsContent as TabsContent, 
  CustomTabsList as TabsList, 
  CustomTabsTrigger as TabsTrigger 
} from "@/components/ui/custom-tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  FileText,
  BarChart3,
  Filter,
  Download,
  Calendar,
  PieChart as PieChartIcon,
  ChevronDown,
  Printer,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import StatusBadge from "@/components/ui/status-badge";

export default function Reports() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [reportType, setReportType] = useState("incident");
  const [timeframe, setTimeframe] = useState("all");
  const [selectedBarangay, setSelectedBarangay] = useState<string>("all");

  // Fetch all cases for reports
  const { data: cases, isLoading, isError } = useQuery<Case[]>({
    queryKey: ["/api/cases"],
  });

  // Filtered cases based on selection
  const filteredCases = cases?.filter(caseItem => {
    // Filter by barangay if selected
    if (selectedBarangay && selectedBarangay !== "all" && caseItem.barangay !== selectedBarangay) {
      return false;
    }

    // Filter by timeframe
    if (timeframe === "month") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return new Date(caseItem.createdAt) >= oneMonthAgo;
    } else if (timeframe === "quarter") {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return new Date(caseItem.createdAt) >= threeMonthsAgo;
    } else if (timeframe === "year") {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return new Date(caseItem.createdAt) >= oneYearAgo;
    }
    
    // Include all if timeframe is "all"
    return true;
  }) || [];

  // Generate data for incident type chart
  const incidentTypeData = (() => {
    const counts: Record<string, number> = {};
    
    filteredCases.forEach(caseItem => {
      counts[caseItem.incidentType] = (counts[caseItem.incidentType] || 0) + 1;
    });
    
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  // Generate data for case status chart
  const statusData = (() => {
    const counts = {
      active: 0,
      pending: 0,
      closed: 0
    };
    
    filteredCases.forEach(caseItem => {
      counts[caseItem.status as keyof typeof counts] += 1;
    });
    
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  // Generate data for barangay chart
  const barangayData = (() => {
    const counts: Record<string, number> = {};
    
    filteredCases.forEach(caseItem => {
      const barangay = caseItem.barangay || "Unknown";
      counts[barangay] = (counts[barangay] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();

  // Generate unique barangay list for filter
  const barangayList = (() => {
    const barangays = new Set<string>();
    
    cases?.forEach(caseItem => {
      if (caseItem.barangay) {
        barangays.add(caseItem.barangay);
      }
    });
    
    return Array.from(barangays).sort();
  })();

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Handle download report
  const handleDownloadReport = () => {
    toast({
      title: "Download Started",
      description: "Your report is being prepared for download."
    });
  };

  // Handle print report
  const handlePrintReport = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <RoleRestricted allowedRoles={["administrator"]}>
        <div className="container py-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Reports</h1>
              <p className="text-muted-foreground">
                View and generate VAWC case reports
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="bg-muted/30">
                  <div className="h-6 w-24 bg-muted rounded" />
                </CardHeader>
                <CardContent className="pt-6 pb-10">
                  <div className="h-48 bg-muted/50 rounded-md flex items-center justify-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </RoleRestricted>
    );
  }

  if (isError) {
    return (
      <RoleRestricted allowedRoles={["administrator"]}>
        <div className="container py-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <div className="text-destructive mb-4">
                <AlertTriangle size={64} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Error Loading Reports</h2>
              <p className="text-muted-foreground mb-4">
                Unable to load report data. Please try again later.
              </p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </RoleRestricted>
    );
  }

  return (
    <RoleRestricted allowedRoles={["administrator"]}>
      <div className="container py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Reports</h1>
            <p className="text-muted-foreground">
              View and generate VAWC case reports and statistics
            </p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <Button variant="outline" onClick={handlePrintReport}>
            <Printer className="mr-2 h-4 w-4" /> Print Report
          </Button>
          <Button onClick={handleDownloadReport}>
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Filter className="mr-2 h-5 w-5" /> Report Filters
          </CardTitle>
          <CardDescription>
            Customize your report by selecting filters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="report-type" className="mt-1">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incident">Incident Type Report</SelectItem>
                  <SelectItem value="status">Case Status Report</SelectItem>
                  <SelectItem value="barangay">Barangay Distribution</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timeframe">Time Period</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger id="timeframe" className="mt-1">
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="month">Past Month</SelectItem>
                  <SelectItem value="quarter">Past Quarter</SelectItem>
                  <SelectItem value="year">Past Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="barangay">Barangay</Label>
              <Select 
                value={selectedBarangay} 
                onValueChange={setSelectedBarangay}
              >
                <SelectTrigger id="barangay" className="mt-1">
                  <SelectValue placeholder="All Barangays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Barangays</SelectItem>
                  {barangayList.map(barangay => (
                    <SelectItem key={barangay} value={barangay}>
                      {barangay}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              Total Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{filteredCases.length}</div>
            <p className="text-muted-foreground text-sm">
              {timeframe === "all" 
                ? "All time" 
                : timeframe === "month" 
                  ? "Past month" 
                  : timeframe === "quarter" 
                    ? "Past quarter" 
                    : "Past year"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              Active Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {filteredCases.filter(c => c.status === 'active').length}
            </div>
            <p className="text-muted-foreground text-sm">
              {((filteredCases.filter(c => c.status === 'active').length / filteredCases.length) * 100).toFixed(1)}% of total cases
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              Most Common Incident
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {incidentTypeData.length > 0 
                ? incidentTypeData.sort((a, b) => b.value - a.value)[0]?.name 
                : "N/A"}
            </div>
            <p className="text-muted-foreground text-sm">
              {incidentTypeData.length > 0 
                ? `${incidentTypeData.sort((a, b) => b.value - a.value)[0]?.value} cases` 
                : "No data available"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Report Content */}
      <Tabs defaultValue="charts" className="w-full">
        <TabsList className="mb-4 bg-slate-200">
          <TabsTrigger 
            value="charts" 
            className="data-[state=active]:bg-blue-200 data-[state=active]:text-black font-medium"
          >
            <PieChartIcon className="h-4 w-4 mr-2" />
            Charts
          </TabsTrigger>
          <TabsTrigger 
            value="table"
            className="data-[state=active]:bg-blue-200 data-[state=active]:text-black font-medium"
          >
            <FileText className="h-4 w-4 mr-2" />
            Data Table
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="charts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {reportType === "incident" && "Incident Type Distribution"}
                {reportType === "status" && "Case Status Distribution"}
                {reportType === "barangay" && "Cases by Barangay"}
              </CardTitle>
              <CardDescription>
                {reportType === "incident" && "Breakdown of cases by type of incident"}
                {reportType === "status" && "Current status of all cases"}
                {reportType === "barangay" && "Distribution of cases across barangays"}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                {reportType === "barangay" ? (
                  <BarChart
                    data={barangayData.slice(0, 10)} // Show top 10 for clarity
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={80} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Number of Cases">
                      {barangayData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={reportType === "incident" ? incidentTypeData : statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(reportType === "incident" ? incidentTypeData : statusData).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} cases`, "Count"]} />
                    <Legend />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              {selectedBarangay !== "all" ? `Filtered to ${selectedBarangay} barangay` : 'Showing all barangays'} |
              {timeframe === "all" 
                ? " All time" 
                : timeframe === "month" 
                  ? " Past month" 
                  : timeframe === "quarter" 
                    ? " Past quarter" 
                    : " Past year"}
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Case Records</CardTitle>
              <CardDescription>
                Detailed listing of all VAWC cases in the selected timeframe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Case ID</TableHead>
                      <TableHead>Victim Name</TableHead>
                      <TableHead>Incident Type</TableHead>
                      <TableHead>Barangay</TableHead>
                      <TableHead>Date Reported</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCases.length > 0 ? (
                      filteredCases.map((caseItem) => (
                        <TableRow key={caseItem.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setLocation(`/cases/${caseItem.id}`)}>
                          <TableCell className="font-medium">#{caseItem.id.toString().padStart(3, '0')}</TableCell>
                          <TableCell>{caseItem.victimName}</TableCell>
                          <TableCell>{caseItem.incidentType}</TableCell>
                          <TableCell>{caseItem.barangay || 'Unknown'}</TableCell>
                          <TableCell>{formatDate(new Date(caseItem.createdAt))}</TableCell>
                          <TableCell>
                            <StatusBadge status={caseItem.status} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No cases found for the selected filters
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              Showing {filteredCases.length} of {cases?.length || 0} total cases
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </RoleRestricted>
  );
}