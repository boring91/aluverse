import { Field, FieldError, FieldLabel } from "../ui/field";
import { Textarea } from "../ui/textarea";
import { useFieldContext } from "./form-context";

type Props = {
  label: string;
  placeholder?: string;
};

export function TextareaField({ label, placeholder }: Props) {
  const field = useFieldContext<string>();
  const showErrors =
    !field.state.meta.isValid &&
    (field.state.meta.isTouched || field.form.state.submissionAttempts > 0);

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Textarea
        value={field.state.value ?? ""}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder={placeholder}
      />
      {showErrors && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
