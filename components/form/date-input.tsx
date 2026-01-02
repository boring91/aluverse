import {
  Controller,
  FieldPath,
  FieldValues,
  UseFormReturn,
} from "react-hook-form";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { DatePickerInput } from "../date-picker-input";

type Props<T extends FieldValues> = {
  name: FieldPath<T>;
  label: string;
  control: UseFormReturn<T>["control"];
};

export const DateInput = <T extends FieldValues>({
  name,
  label,
  control,
}: Props<T>) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        return (
          <Field>
            <FieldLabel>{label}</FieldLabel>
            <DatePickerInput value={field.value} onChange={field.onChange} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
};
