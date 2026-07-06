import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";

import { useAppForm } from "@/components/form/form-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTitle } from "@/hooks/use-title";
import { signIn, useSession } from "@/lib/auth-client";

const formSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

type FormSchema = z.infer<typeof formSchema>;

export function LoginView() {
  useTitle("Login");

  const navigate = useNavigate();
  const search = useSearch({ strict: false });
  const returnUrl =
    "returnUrl" in search && typeof search.returnUrl === "string"
      ? search.returnUrl
      : undefined;
  const { data, isPending } = useSession();

  useEffect(() => {
    if (data?.user && !isPending) {
      void navigate({ to: "/" });
    }
  }, [data?.user, isPending, navigate]);

  const signInAction = useMutation({
    mutationFn: (formData: FormSchema) => signIn.email(formData),
    onSuccess: (result) => {
      if (result.error?.code === "INVALID_EMAIL_OR_PASSWORD") {
        toast.error("Invalid email or password");
        return;
      }

      if (result.error) {
        toast.error("Unknown error has occurred");
        return;
      }

      const redirectTo =
        returnUrl && returnUrl.startsWith("/") ? returnUrl : "/";
      window.location.assign(redirectTo);
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
      await signInAction.mutateAsync(value);
    },
  });

  if (data?.user || isPending) {
    return null;
  }

  return (
    <div className="flex min-h-dvh w-full items-center justify-center px-4">
      <Card className="w-10/12 md:w-96">
        <CardHeader>
          <CardTitle className="flex flex-col gap-4 text-center">
            <h1 className="text-lg">AluVerse</h1>
            <h2 className="text-muted-foreground">Login</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-8"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <form.AppForm>
              <form.AppField
                name="email"
                children={(field) => (
                  <field.TextField
                    isAutoComplete={false}
                    label="Email"
                    placeholder="john.doe@aluverse.com.au"
                  />
                )}
              />

              <form.AppField
                name="password"
                children={(field) => (
                  <field.TextField
                    isAutoComplete={false}
                    label="Password"
                    type="password"
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
