import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Users, Mail, FileText } from "lucide-react";

const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  alternativeEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  requestedLab: z.string().min(1, "Please select a lab"),
  requestedRole: z.string().min(1, "Please select a role"),
  researchInterests: z.string().min(20, "Please describe your research interests (at least 20 characters)"),
  qualifications: z.string().min(20, "Please describe your qualifications (at least 20 characters)"),
  referredBy: z.string().optional(),
  additionalNotes: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export default function RegistrationRequest() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      alternativeEmail: "",
      phoneNumber: "",
      requestedLab: "",
      requestedRole: "",
      researchInterests: "",
      qualifications: "",
      referredBy: "",
      additionalNotes: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      return apiRequest("POST", "/api/registration-request", data);
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Registration Request Submitted",
        description: "Your request has been sent to Dr. J.C. Rojas for approval.",
      });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit registration request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegistrationFormData) => {
    submitMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-teal-200 dark:border-teal-800 shadow-xl">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-3xl font-bold text-teal-900 dark:text-teal-100">
              Registration Request Submitted
            </CardTitle>
            <CardDescription className="text-lg mt-4 text-gray-600 dark:text-gray-300">
              Thank you for your interest in joining our research team!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                What happens next?
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li>Dr. J.C. Rojas will receive your registration request via email</li>
                <li>Your application will be reviewed within 24-48 hours</li>
                <li>You'll receive an email notification about your approval status</li>
                <li>If approved, you can immediately log in using Replit authentication</li>
              </ol>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Important:</strong> Make sure to check your email (including spam folder) for the approval notification.
                You can log in with either your Rush email or the personal email you provided.
              </p>
            </div>

            <div className="text-center">
              <Button
                onClick={() => window.location.href = "/"}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="border-teal-200 dark:border-teal-800 shadow-xl">
          <CardHeader className="text-center pb-8 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-t-lg">
            <div className="mx-auto mb-4 w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              <Users className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold">Lab Member Registration Request</CardTitle>
            <CardDescription className="text-lg mt-2 text-teal-50">
              Join the Rush Research Labs Team
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-8">
            <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Registration Process
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                This form will be sent to Dr. J.C. Rojas (juan_rojas@rush.edu) for approval. 
                Once approved, you'll be added to the team and can log in using your email credentials.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your first name" {...field} data-testid="input-firstName" />
                        </FormControl>
                        <FormDescription>As it appears in official documents</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your last name" {...field} data-testid="input-lastName" />
                        </FormControl>
                        <FormDescription>As it appears in official documents</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your.name@rush.edu" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormDescription>Preferably your Rush email</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="alternativeEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alternative Email (Optional)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="personal@gmail.com" {...field} data-testid="input-alternativeEmail" />
                        </FormControl>
                        <FormDescription>Personal email for backup access</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="(312) 555-1234" {...field} data-testid="input-phoneNumber" />
                      </FormControl>
                      <FormDescription>For urgent communications</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="requestedLab"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requested Lab *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-requestedLab">
                              <SelectValue placeholder="Select a lab" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="RICCC">RICCC - Critical Care Trials</SelectItem>
                            <SelectItem value="RHEDAS">RHEDAS - Health Equity Analytics</SelectItem>
                            <SelectItem value="BOTH">Both Labs</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requestedRole"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requested Role *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-requestedRole">
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="RESEARCH_ASSISTANT">Research Assistant</SelectItem>
                            <SelectItem value="DATA_ANALYST">Data Analyst</SelectItem>
                            <SelectItem value="DATA_SCIENTIST">Data Scientist</SelectItem>
                            <SelectItem value="VOLUNTEER_RESEARCH_ASSISTANT">Volunteer Research Assistant</SelectItem>
                            <SelectItem value="REGULATORY_COORDINATOR">Regulatory Coordinator</SelectItem>
                            <SelectItem value="STAFF_COORDINATOR">Staff Coordinator</SelectItem>
                            <SelectItem value="POSTDOC">Postdoctoral Fellow</SelectItem>
                            <SelectItem value="GRADUATE_STUDENT">Graduate Student</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="researchInterests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Research Interests *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your research interests and why you want to join our lab..."
                          className="min-h-[100px]"
                          {...field}
                          data-testid="textarea-researchInterests"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="qualifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qualifications & Experience *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your relevant qualifications, education, and experience..."
                          className="min-h-[100px]"
                          {...field}
                          data-testid="textarea-qualifications"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referredBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referred By (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Name of current lab member who referred you" {...field} data-testid="input-referredBy" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="additionalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional information you'd like to share..."
                          className="min-h-[80px]"
                          {...field}
                          data-testid="textarea-additionalNotes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.location.href = "/"}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                    data-testid="button-submit"
                  >
                    {submitMutation.isPending ? "Submitting..." : "Submit Registration Request"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}