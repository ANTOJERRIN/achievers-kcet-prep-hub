import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { User, Mail, Phone, GraduationCap } from "lucide-react";

const registrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number too long"),
});

type RegistrationData = z.infer<typeof registrationSchema>;

interface RegistrationFormProps {
  onRegistrationComplete: (data: RegistrationData) => void;
}

export const RegistrationForm = ({ onRegistrationComplete }: RegistrationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const onSubmit = async (data: RegistrationData) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    onRegistrationComplete(data);
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-0" style={{ boxShadow: 'var(--shadow-card)' }}>
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-brand-red to-brand-green rounded-full flex items-center justify-center mb-4">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-brand-black">
          Join Achievers Club
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Your journey to KCET success starts here
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-brand-black font-medium">Full Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Enter your full name" 
                        className="pl-10 border-2 focus:border-brand-red transition-colors"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-brand-black font-medium">Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        type="email"
                        placeholder="your.email@example.com" 
                        className="pl-10 border-2 focus:border-brand-red transition-colors"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-brand-black font-medium">Phone Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        type="tel"
                        placeholder="Enter your phone number" 
                        className="pl-10 border-2 focus:border-brand-red transition-colors"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-brand-red hover:bg-brand-red/90 text-white font-semibold py-6 text-lg transition-all duration-200 hover:shadow-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Start Learning Journey"}
            </Button>
          </form>
        </Form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Ready to ace KCET? Let's master those weak topics together! 🎯
          </p>
        </div>
      </CardContent>
    </Card>
  );
};