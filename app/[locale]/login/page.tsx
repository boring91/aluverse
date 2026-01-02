"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTitle } from "@/hooks/use-title";
import { useRouter } from "@/i18n/navigation";
import { signIn, useSession } from "@/lib/auth-client";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const formSchema = z.object({
  email: z.email(),
  password: z.string(),
});

type FormSchema = z.infer<typeof formSchema>;

const Login = () => {
  const tc = useTranslations("Common");
  const t = useTranslations("Login");
  useTitle(t("pageTitle"));
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  const { data, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (data?.user && !isPending) {
      router.push("/");
    }
  }, [data?.user, isPending, router]);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signInMutation = useMutation({
    mutationFn: (data: FormSchema) => {
      return signIn.email(data);
    },
    onSuccess: (data) => {
      if (data.error && data.error.code === "INVALID_EMAIL_OR_PASSWORD") {
        toast.error(t("invalidEmailOrPassword"));
        return;
      } else if (data.error) {
        toast.error(tc("unknownErrorHasOccurred"));
        return;
      }
      router.push(returnUrl ?? "/");
      toast.success(t("loggedInSuccessfully"));
    },
    onError: (error) => {
      toast.error(error.message);
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
            <h1 className="text-lg">{tc("appName")}</h1>
            <h2 className="text-muted-foreground">{t("login")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((data) => signInMutation.mutate(data))}
            className="flex flex-col gap-8"
          >
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => {
                  return (
                    <Field>
                      <FieldLabel>{t("email")}</FieldLabel>
                      <Input
                        {...field}
                        placeholder="john.doe@aluverse.com.au"
                        autoComplete="off"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  );
                }}
              />

              <Controller
                control={form.control}
                name="password"
                render={({ field, fieldState }) => {
                  return (
                    <Field>
                      <FieldLabel>{t("password")}</FieldLabel>
                      <Input {...field} autoComplete="off" type="password" />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  );
                }}
              />
            </FieldGroup>

            <Button disabled={signInMutation.isPending}>
              {signInMutation.isPending && <Loader2 className="animate-spin" />}
              {t("login")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
