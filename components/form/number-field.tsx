import { Field, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { useFieldContext } from "./form-context";

type Props = {
  label: string;
};

export function NumberField({ label }: Props) {
  const field = useFieldContext<number | "">();
  const showErrors =
    !field.state.meta.isValid &&
    (field.state.meta.isTouched || field.form.state.submissionAttempts > 0);

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Input
        type="number"
        value={field.state.value ?? ""}
        onChange={(event) => {
          const value = event.target.value;
          field.handleChange(value ? parseFloat(value) : "");
        }}
      />
      {showErrors && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
