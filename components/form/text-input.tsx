import {
  Controller,
  FieldPath,
  FieldValues,
  UseFormReturn,
} from "react-hook-form";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

type Props<T extends FieldValues> = {
  name: FieldPath<T>;
  label: string;
  control: UseFormReturn<T>["control"];
  placeholder?: string;
  type?: "number" | "text" | "password";
  isAutoComplete?: boolean;
};

export const TextInput = <T extends FieldValues>({
  name,
  label,
  control,
  placeholder,
  type = "text",
  isAutoComplete = true,
}: Props<T>) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        return (
          <Field>
            <FieldLabel>{label}</FieldLabel>
            <Input
              {...field}
              value={field.value ?? ""}
              type={type}
              placeholder={placeholder}
              autoComplete={isAutoComplete ? "on" : "off"}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
};
