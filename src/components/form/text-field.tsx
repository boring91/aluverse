import { Field, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { useFieldContext } from "./form-context";

type Props = {
  label: string;
  isAutoComplete?: boolean;
  type?: "text" | "email" | "password";
  placeholder?: string;
};

export function TextField({
  label,
  isAutoComplete = true,
  type = "text",
  placeholder,
}: Props) {
  const field = useFieldContext<string | null | undefined>();
  const showErrors =
    !field.state.meta.isValid &&
    (field.state.meta.isTouched || field.form.state.submissionAttempts > 0);

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Input
        value={field.state.value ?? ""}
        onChange={(e) => field.handleChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        autoComplete={isAutoComplete ? "on" : "off"}
      />
      {showErrors && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
