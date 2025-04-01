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
      dateReported: new Date().toISOString(),
      entryDate: new Date().toISOString(),
      victimName: "",
      perpetratorName: "",
      barangay: "",
      status: "active",
      encoderId: user?.id || 0,
      encoderName: user?.fullName || "",
      encoderPosition: user?.position || "",
      encoderOffice: user?.office || "",
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
                  name="entryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:text-destructive after:ml-1">
                        Date of Entry
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value.split('T')[0]}
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            field.onChange(date.toISOString());
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <FormField
                  control={form.control}
                  name="encoderPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:text-destructive after:ml-1">
                        Position
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
                  name="encoderOffice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:text-destructive after:ml-1">
                        Office
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
                  name="barangay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:text-destructive after:ml-1">
                        Barangay
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || "Poblacion"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Barangay" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Poblacion">Poblacion</SelectItem>
                          <SelectItem value="San Isidro">San Isidro</SelectItem>
                          <SelectItem value="Santa Clara">Santa Clara</SelectItem>
                          <SelectItem value="San Miguel">San Miguel</SelectItem>
                          <SelectItem value="Malinta">Malinta</SelectItem>
                        </SelectContent>
                      </Select>
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
                  name="dateReported"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:text-destructive after:ml-1">
                        Date Reported
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value.split('T')[0]}
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            field.onChange(date.toISOString());
                          }}
                        />
                      </FormControl>
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
