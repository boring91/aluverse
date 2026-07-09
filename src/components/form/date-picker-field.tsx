import { Field, FieldError, FieldLabel } from "../ui/field";
import { DatePickerInput } from "../date-picker-input";
import { useFieldContext } from "./form-context";

type Props = {
  label: string;
  placeholder?: string;
};

export function DatePickerField({ label, placeholder }: Props) {
  const field = useFieldContext<string | null | undefined>();
  const showErrors =
    !field.state.meta.isValid &&
    (field.state.meta.isTouched || field.form.state.submissionAttempts > 0);

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <DatePickerInput
        value={field.state.value}
        onChange={(value) => field.handleChange(value)}
        placeholder={placeholder}
      />
      {showErrors && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
