"use client";

import { useAppForm } from "@/components/form/form-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTitle } from "@/hooks/use-title";
import { signIn, useSession } from "@/lib/auth-client";
import type { Route } from "next";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

type FormSchema = z.infer<typeof formSchema>;

export default function Login() {
  useTitle("Login");
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  const { data, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (data?.user && !isPending) {
      router.push("/");
    }
  }, [data?.user, isPending, router]);

  const signInMutation = useMutation({
    mutationFn: (data: FormSchema) => {
      return signIn.email(data);
    },
    onSuccess: (data) => {
      if (data.error && data.error.code === "INVALID_EMAIL_OR_PASSWORD") {
        toast.error("Invalid email or password");
        return;
      }

      if (data.error) {
        toast.error("Unknown error has occurred");
        return;
      }

      const redirectTo =
        returnUrl && returnUrl.startsWith("/") ? returnUrl : "/";
      router.push(redirectTo as Route);
      toast.success("Logged in successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useAppForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      await signInMutation.mutateAsync(value as FormSchema);
    },
  });

  if (data?.user || isPending) {
    return null;
  }

  return (
    <div className="flex items-center justify-center h-screen w-screen">
      <Card className="w-10/12 md:w-96">
        <CardHeader>
          <CardTitle className="text-center flex flex-col gap-4">
            <h1 className="text-lg">AluVerse</h1>
            <h2 className="text-muted-foreground">Login</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="flex flex-col gap-8"
          >
            <form.AppForm>
              <form.AppField
                name="email"
                children={(field) => (
                  <field.TextField
                    label="Email"
                    placeholder="john.doe@aluverse.com.au"
                    isAutoComplete={false}
                  />
                )}
              />

              <form.AppField
                name="password"
                children={(field) => (
                  <field.TextField
                    label="Password"
                    type="password"
                    isAutoComplete={false}
                  />
                )}
              />

              <form.SubmitButton label="Login" />
            </form.AppForm>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
