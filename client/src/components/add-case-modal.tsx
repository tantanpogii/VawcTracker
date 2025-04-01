import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { caseFormSchema, type CaseFormData } from "@shared/schema";

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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Save } from "lucide-react";

interface AddCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddCaseModal({ isOpen, onClose }: AddCaseModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
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
      caseNotes: "",
    },
  });

  // Create case mutation
  const createCaseMutation = useMutation({
    mutationFn: async (data: CaseFormData) => {
      return apiRequest("POST", "/api/cases", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Success",
        description: "Case created successfully",
      });
      onClose();
      form.reset();
      setServicesState(servicesState.map(s => ({ ...s, selected: false })));
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create case",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: CaseFormData) => {
    // Include services state in form data
    const formData = {
      ...data,
      services: servicesState,
    };
    createCaseMutation.mutate(formData);
  };

  // Handle service checkbox change
  const handleServiceChange = (index: number, checked: boolean) => {
    const updatedServices = [...servicesState];
    updatedServices[index].selected = checked;
    setServicesState(updatedServices);
    
    // Update form value
    form.setValue("services", updatedServices);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New VAWC Case</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new case record
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

            {/* Case Information Section */}
            <div>
              <h6 className="text-sm font-medium mb-3 pb-1 border-b">Case Information</h6>
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
                          value={field.value === undefined ? '' : field.value} 
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))}
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
                        defaultValue={field.value || ""}
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
                        defaultValue={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Incident Type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Physical abuse">Physical abuse</SelectItem>
                          <SelectItem value="Verbal abuse">Verbal abuse</SelectItem>
                          <SelectItem value="Economic abuse">Economic abuse</SelectItem>
                          <SelectItem value="Sexual assault">Sexual assault</SelectItem>
                          <SelectItem value="Workplace harassment">Workplace harassment</SelectItem>
                          <SelectItem value="Child abuse">Child abuse</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
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
                      <FormLabel>
                        Incident Location
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
                      <FormLabel>
                        Relationship to Victim
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:text-destructive after:ml-1">
                        Case Status
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || "active"}
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
                      <FormLabel>
                        Priority
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || "Medium"}
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
              <h6 className="text-sm font-medium mb-3 pb-1 border-b">Services Provided</h6>
              
              <div className="space-y-2 mb-4">
                {servicesState.map((service, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`service-${index}`}
                      checked={service.selected}
                      onCheckedChange={(checked) => 
                        handleServiceChange(index, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`service-${index}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {service.type}
                    </label>
                  </div>
                ))}
              </div>

              <FormField
                control={form.control}
                name="otherServices"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Services (Please specify)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="caseNotes"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Initial Case Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
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
                disabled={createCaseMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createCaseMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {createCaseMutation.isPending ? "Saving..." : "Save Case"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
