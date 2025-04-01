import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CaseWithDetails } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/utils/case-utils";

import { 
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import StatusBadge from "@/components/ui/status-badge";
import DeleteConfirmationModal from "@/components/delete-confirmation-modal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Printer,
  Pencil,
  Trash,
  User,
  Info,
  Clock,
  ListChecks,
  FileText,
  Paperclip,
  Plus,
} from "lucide-react";

interface CaseDetailProps {
  id: number;
}

export default function CaseDetail({ id }: CaseDetailProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [noteContent, setNoteContent] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch case details
  const { data: caseData, isLoading, isError } = useQuery<CaseWithDetails>({
    queryKey: [`/api/cases/${id}`],
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/cases/${id}/notes`, { content });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [`/api/cases/${id}`] });
      setNoteContent("");
      toast({
        title: "Success",
        description: "Note added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add note",
        variant: "destructive",
      });
    },
  });

  // Delete case mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/cases/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Success",
        description: "Case deleted successfully",
      });
      setLocation("/cases");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete case",
        variant: "destructive",
      });
    },
  });

  // Handle adding a note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (noteContent.trim()) {
      addNoteMutation.mutate(noteContent);
    }
  };

  // Handle delete case
  const handleDeleteCase = () => {
    setIsDeleteModalOpen(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    deleteMutation.mutate();
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Generate avatar background color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-primary", 
      "bg-green-600", 
      "bg-blue-500", 
      "bg-amber-500", 
      "bg-rose-500"
    ];
    
    const hash = name.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    return colors[hash % colors.length];
  };

  if (isError) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="text-destructive mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Error Loading Case</h2>
            <p className="text-muted-foreground mb-4">Unable to load case details. The case may not exist or you don't have permission to view it.</p>
            <Button onClick={() => setLocation("/cases")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cases
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <Button 
            variant="outline" 
            className="mb-2"
            onClick={() => setLocation("/cases")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cases
          </Button>
          <h1 className="text-2xl font-bold">
            Case Details: {isLoading ? <Skeleton className="inline-block h-8 w-40" /> : caseData?.victimName}
          </h1>
          <p className="text-muted-foreground">
            Case ID: {isLoading ? <Skeleton className="inline-block h-4 w-24" /> : `#VAWC-${caseData?.id.toString().padStart(3, '0')}`}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <Button variant="outline" disabled>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button variant="outline" onClick={() => setLocation(`/cases/${id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="outline" className="text-destructive hover:text-destructive" onClick={handleDeleteCase}>
            <Trash className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Victim information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <User className="mr-2 h-5 w-5" /> Victim Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Victim's Name</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-40" />
                  ) : (
                    <p className="font-medium">{caseData?.victimName}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Barangay</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-32" />
                  ) : (
                    <p className="font-medium">{caseData?.barangay}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date Reported</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-32" />
                  ) : (
                    <p className="font-medium">
                      {formatDate(new Date(caseData?.dateReported!))}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Case Status</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    <StatusBadge status={caseData?.status!} size="md" />
                  )}
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Alleged Perpetrator's Name</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-48" />
                  ) : (
                    <p className="font-medium">{caseData?.perpetratorName}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services provided */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <ListChecks className="mr-2 h-5 w-5" /> Services Provided
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : caseData?.services && caseData.services.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service Type</TableHead>
                        <TableHead>Date Provided</TableHead>
                        <TableHead>Service Provider</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {caseData.services.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell className="font-medium">{service.type}</TableCell>
                          <TableCell>{formatDate(new Date(service.dateProvided))}</TableCell>
                          <TableCell>{service.provider}</TableCell>
                          <TableCell>{service.notes || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No services have been provided yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Case notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <FileText className="mr-2 h-5 w-5" /> Case Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : caseData?.notes && caseData.notes.length > 0 ? (
                <div className="space-y-6">
                  {caseData.notes.map((note, index) => (
                    <div key={note.id} className={index < caseData.notes.length - 1 ? "pb-6 border-b" : ""}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center">
                          <Avatar className="mr-3">
                            <AvatarFallback className={getAvatarColor(note.author.fullName)}>
                              {getInitials(note.author.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{note.author.fullName}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(new Date(note.createdAt))}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm bg-secondary/20 px-2 py-1 rounded">
                          {index === 0 ? "Case Opened" : "Update"}
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-line">{note.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No notes have been added yet
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-2 pb-4">
              <form onSubmit={handleAddNote} className="w-full">
                <div className="mb-3">
                  <label htmlFor="caseNote" className="block text-sm font-medium mb-1">
                    Add New Note
                  </label>
                  <Textarea
                    id="caseNote"
                    rows={3}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Enter case update or note"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={!noteContent.trim() || addNoteMutation.isPending}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Note
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Case information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Info className="mr-2 h-5 w-5" /> Case Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Report Encoder</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-32" />
                  ) : (
                    <p className="font-medium">{caseData?.encoderName}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Position</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-40" />
                  ) : (
                    <p className="font-medium">{caseData?.encoderPosition}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Office</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-48" />
                  ) : (
                    <p className="font-medium">{caseData?.encoderOffice}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Entry Date</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-32" />
                  ) : (
                    <p className="font-medium">{formatDate(new Date(caseData?.entryDate!))}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Case timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Clock className="mr-2 h-5 w-5" /> Case Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : caseData?.notes && caseData.notes.length > 0 ? (
                <div>
                  {caseData.notes.map((note, index) => (
                    <div 
                      key={note.id} 
                      className={`
                        border-l-4 px-4 py-3 
                        ${index === 0 ? 'border-primary' : index % 3 === 1 ? 'border-blue-500' : index % 3 === 2 ? 'border-amber-500' : 'border-green-600'}
                      `}
                    >
                      <div className="flex justify-between">
                        <h6 className="font-medium">
                          {index === 0 ? "Case Opened" : `Update ${index}`}
                        </h6>
                        <small className="text-muted-foreground">
                          {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </small>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {note.content.length > 50 
                          ? `${note.content.substring(0, 50)}...` 
                          : note.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No timeline events available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Paperclip className="mr-2 h-5 w-5" /> Attachments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6">
                <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground mb-3">No attachments yet</p>
                <Button variant="outline" size="sm">
                  <Paperclip className="mr-2 h-4 w-4" /> Add Attachment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        caseToDelete={caseData}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
