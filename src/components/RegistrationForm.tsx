import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { login, register, type Student } from "@/lib/prep-api";

const schema = z.object({
  name: z.string().trim().max(120),
  email: z.string().trim().email("Please enter a valid email address").max(150),
  password: z.string().min(8, "Use at least 8 characters").max(128),
});

type Credentials = z.infer<typeof schema>;

export const RegistrationForm = ({ onRegistrationComplete }: { onRegistrationComplete: (user: Student) => void }) => {
  const [returning, setReturning] = useState(false);
  const [error, setError] = useState("");
  const form = useForm<Credentials>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const submitting = form.formState.isSubmitting;

  const onSubmit = async (data: Credentials) => {
    setError("");
    if (!returning && data.name.length < 2) {
      form.setError("name", { message: "Enter at least 2 characters" });
      return;
    }
    try {
      const { name, email, password } = data;
      const user = returning ? await login({ email, password }) : await register({ name, email, password });
      if (user) onRegistrationComplete(user);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-0" style={{ boxShadow: "var(--shadow-card)" }}>
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-brand-red to-brand-green rounded-full flex items-center justify-center mb-4">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-brand-black">
          {returning ? "Sign in to Achievers Club" : "Join Achievers Club"}
        </CardTitle>
        <CardDescription>{returning ? "Pick up where you left off" : "Start your KCET preparation"}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!returning && (
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl><Input autoComplete="name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl><Input type="email" autoComplete="email" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl><Input type="password" autoComplete={returning ? "current-password" : "new-password"} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full bg-brand-red hover:bg-brand-red/90 text-white font-semibold py-6" disabled={submitting}>
              {submitting ? "Please wait…" : returning ? "Sign in" : "Create account"}
            </Button>
          </form>
        </Form>
        <Button
          type="button" variant="link" className="mt-4 w-full" disabled={submitting}
          onClick={() => { setReturning(!returning); setError(""); form.clearErrors(); }}
        >
          {returning ? "Create a student account" : "Already registered? Sign in"}
        </Button>
      </CardContent>
    </Card>
  );
};
