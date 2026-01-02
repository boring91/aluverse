import {
  Controller,
  FieldPath,
  FieldValues,
  UseFormReturn,
} from "react-hook-form";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Checkbox } from "../ui/checkbox";
import { CheckedState } from "@radix-ui/react-checkbox";

type Props<T extends FieldValues> = {
  name: FieldPath<T>;
  label: string;
  control: UseFormReturn<T>["control"];
  onChange?: (checked: CheckedState) => void;
};

export const CheckboxInput = <T extends FieldValues>({
  name,
  label,
  control,
  onChange,
}: Props<T>) => {
  const id = `checkbox-${name}`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        return (
          <Field orientation="horizontal">
            <Checkbox
              id={id}
              checked={field.value ?? false}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                onChange?.(checked);
              }}
            />
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
};
