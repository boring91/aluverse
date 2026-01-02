import { clsx, type ClassValue } from "clsx";
import { FieldValues, UseFormReturn, Path } from "react-hook-form";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const fillForm = <T extends FieldValues>(
  form: UseFormReturn<T>,
  data: Partial<{ [K in keyof T]: T[K] | undefined | null }>
) => {
  const values = form.getValues();
  Object.keys(values).forEach((tmp) => {
    const key = tmp as Path<T>;
    form.setValue(key, (data[key] ?? undefined)!);
  });
};
