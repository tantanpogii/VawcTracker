import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Case, CaseFormData, caseFormSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save } from "lucide-react";

interface EditCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: Case | null;
}

export default function EditCaseModal({ isOpen, onClose, caseData }: EditCaseModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [servicesState, setServicesState] = useState([
    { type: "Medical Assistance", selected: false },
    { type: "Legal Services", selected: false },
    { type: "Counseling", selected: false },
    { type: "Temporary Shelter", selected: false },
    { type: "Referral to Other Agencies", selected: false },
  ]);

  // Initialize form with default values
  const form = useForm<CaseFormData>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      victimName: "",
      victimAge: undefined,
      victimGender: undefined,
      barangay: null,
      incidentDate: new Date(),
      incidentType: "",
      incidentLocation: "",
      perpetratorName: "",
      perpetratorRelationship: "",
      status: "active",
      priority: "Medium",
      encoderName: user?.fullName || "",
      services: servicesState,
      otherServices: "",
      caseNotes: ""
    },
  });

  // Update form when caseData changes
  useEffect(() => {
    if (caseData) {
      form.reset({
        victimName: caseData.victimName,
        victimAge: caseData.victimAge,
        victimGender: caseData.victimGender,
        barangay: caseData.barangay,
        incidentDate: new Date(caseData.incidentDate),
        incidentType: caseData.incidentType,
        incidentLocation: caseData.incidentLocation,
        perpetratorName: caseData.perpetratorName,
        perpetratorRelationship: caseData.perpetratorRelationship,
        status: caseData.status,
        priority: caseData.priority,
        encoderName: caseData.encoderName,
        services: servicesState,
        otherServices: "",
        caseNotes: "",
      });
    }
  }, [caseData, form]);

  // Update case mutation
  const updateCaseMutation = useMutation({
    mutationFn: async (data: CaseFormData) => {
      if (!caseData) throw new Error("No case data available");
      return apiRequest("PUT", `/api/cases/${caseData.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: [`/api/cases/${caseData?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      toast({
        title: "Success",
        description: "Case updated successfully",
      });
      
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update case",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CaseFormData) => {
    updateCaseMutation.mutate(data);
  };

  const handleServiceChange = (type: string, checked: boolean) => {
    const updatedServices = servicesState.map(service => 
      service.type === type ? { ...service, selected: checked } : service
    );
    setServicesState(updatedServices);
    form.setValue("services", updatedServices);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit VAWC Case</DialogTitle>
          <DialogDescription>
            Update the details of this case record
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Encoder Information Section */}
            <div>
              <h6 className="text-sm font-medium mb-3 pb-1 border-b">Encoder Information</h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="encoderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:text-destructive after:ml-1">
                        Name of Report Encoder
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Victim Information Section */}
            <div>
              <h6 className="text-sm font-medium mb-3 pb-1 border-b">Victim Information</h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="victimName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:text-destructive after:ml-1">
                        Victim's Name
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="victimAge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Victim's Age
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          value={field.value === null ? '' : field.value} 
                          onChange={(e) => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="victimGender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Victim's Gender
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="barangay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Barangay
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Barangay" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Barangay 1">Barangay 1</SelectItem>
                          <SelectItem value="Barangay 2">Barangay 2</SelectItem>
                          <SelectItem value="Barangay 3">Barangay 3</SelectItem>
                          <SelectItem value="Barangay 4">Barangay 4</SelectItem>
                          <SelectItem value="Barangay 5">Barangay 5</SelectItem>
                          <SelectItem value="Barangay 6">Barangay 6</SelectItem>
                          <SelectItem value="Barangay 7">Barangay 7</SelectItem>
                          <SelectItem value="Barangay 8">Barangay 8</SelectItem>
                          <SelectItem value="Barangay 9">Barangay 9</SelectItem>
                          <SelectItem value="Barangay 10">Barangay 10</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="incidentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:text-destructive after:ml-1">
                        Incident Date
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value instanceof Date 
                            ? field.value.toISOString().split('T')[0]
                            : ''}
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            field.onChange(date);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="incidentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:text-destructive after:ml-1">
                        Incident Type
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Incident Type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Physical Violence">Physical Violence</SelectItem>
                          <SelectItem value="Sexual Violence">Sexual Violence</SelectItem>
                          <SelectItem value="Psychological Violence">Psychological Violence</SelectItem>
                          <SelectItem value="Economic abuse">Economic Abuse</SelectItem>
                          <SelectItem value="Trafficking">Trafficking</SelectItem>
                          <SelectItem value="Neglect">Neglect</SelectItem>
                          <SelectItem value="Child Abuse">Child Abuse</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="incidentLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incident Location</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Perpetrator Information Section */}
            <div>
              <h6 className="text-sm font-medium mb-3 pb-1 border-b">Perpetrator Information</h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="perpetratorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:text-destructive after:ml-1">
                        Alleged Perpetrator's Name
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="perpetratorRelationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship to Victim</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Case Status Section */}
            <div>
              <h6 className="text-sm font-medium mb-3 pb-1 border-b">Case Status</h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:text-destructive after:ml-1">
                        Case Status
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "Medium"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Services Provided Section */}
            <div>
              <h6 className="text-sm font-medium mb-3 pb-1 border-b">Additional Services</h6>
              <div className="space-y-2">
                {servicesState.map((service) => (
                  <div key={service.type} className="flex items-center space-x-2">
                    <Checkbox
                      id={service.type.replace(/\s+/g, '-').toLowerCase()}
                      checked={service.selected}
                      onCheckedChange={(checked) => handleServiceChange(service.type, checked as boolean)}
                    />
                    <label
                      htmlFor={service.type.replace(/\s+/g, '-').toLowerCase()}
                      className="text-sm leading-none cursor-pointer"
                    >
                      {service.type}
                    </label>
                  </div>
                ))}
                
                <FormField
                  control={form.control}
                  name="otherServices"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Services</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Specify other services if any" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Case Note Section */}
            <div>
              <h6 className="text-sm font-medium mb-3 pb-1 border-b">Case Update</h6>
              <FormField
                control={form.control}
                name="caseNotes"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Update Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="Add a new note about this case" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={updateCaseMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={updateCaseMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {updateCaseMutation.isPending ? "Saving..." : "Update Case"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}