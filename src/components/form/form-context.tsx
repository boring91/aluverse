import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { AddressField } from "./address-field";
import { CheckboxField } from "./checkbox-field";
import { DatePickerField } from "./date-picker-field";
import { NumberField } from "./number-field";
import { SelectField } from "./select-field";
import { SubmitButton } from "./submit-button";
import { TextField } from "./text-field";
import { TextareaField } from "./textarea-field";

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    TextareaField,
    DatePickerField,
    SelectField,
    CheckboxField,
    NumberField,
    AddressField,
  },
  formComponents: {
    SubmitButton,
  },
});
