import { CheckedState } from "@radix-ui/react-checkbox";
import { Checkbox } from "../ui/checkbox";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { useFieldContext } from "./form-context";

type Props = {
  label: string;
  onChange?: (checked: CheckedState) => void;
};

export function CheckboxField({ label, onChange }: Props) {
  const field = useFieldContext<boolean | undefined>();
  const showErrors =
    !field.state.meta.isValid &&
    (field.state.meta.isTouched || field.form.state.submissionAttempts > 0);

  return (
    <Field orientation="horizontal">
      <Checkbox
        checked={field.state.value ?? false}
        onCheckedChange={(checked) => {
          field.handleChange(checked === true);
          onChange?.(checked);
        }}
      />
      <FieldLabel>{label}</FieldLabel>
      {showErrors && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
