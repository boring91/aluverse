import {
  Controller,
  FieldPath,
  FieldValues,
  UseFormReturn,
} from "react-hook-form";
import { Field, FieldError, FieldLabel } from "../ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { projects } from "@/db/schemas/projects";
import form from "next/form";
import {
  SearchableSelect,
  SearchableSelectTrigger,
  SearchableSelectValue,
  SearchableSelectContent,
  SearchableSelectGroup,
  SearchableSelectEmpty,
  SearchableSelectItem,
  SearchableSelectSeparator,
} from "../ui/searchable-select";
import { useTranslations } from "next-intl";

type Props<T extends FieldValues> = {
  name: FieldPath<T>;
  label: string;
  control: UseFormReturn<T>["control"];
  items: { value: string; label: React.ReactNode }[];
  isSearchable?: boolean;
  canCreate?: boolean;
  onChange?: (value: string) => void;
  onCreate?: () => void;
};

export const SelectInput = <T extends FieldValues>({
  name,
  label,
  control,
  items,
  isSearchable = false,
  onChange,
  onCreate,
}: Props<T>) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        return (
          <Field>
            <FieldLabel>{label}</FieldLabel>
            {isSearchable ? (
              <SearchableSelectInput
                field={field}
                items={items}
                onChange={onChange}
                onCreate={onCreate}
              />
            ) : (
              <BasicSelectInput
                field={field}
                items={items}
                onChange={onChange}
                onCreate={onCreate}
              />
            )}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
};

const BasicSelectInput = <T extends FieldValues>({
  field,
  items,
  onChange,
  onCreate,
}: {
  field: { value: string; onChange: (value: string) => void };
  items: Props<T>["items"];
  onChange?: (value: string) => void;
  onCreate?: () => void;
}) => {
  const tc = useTranslations("Common");

  return (
    <Select
      value={field.value ?? ""}
      onValueChange={(value) => {
        if (onCreate && value === "__create_new__") {
          field.onChange("");
          onCreate();
          return;
        }

        field.onChange(value);
        onChange?.(value);
      }}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
          {!!onCreate && items.length > 0 && <SelectSeparator />}
          {!!onCreate && (
            <SelectItem value="__create_new__">{tc("createNew")}</SelectItem>
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

const SearchableSelectInput = <T extends FieldValues>({
  field,
  items,
  onChange,
  onCreate,
}: {
  field: { value: string; onChange: (value: string) => void };
  items: Props<T>["items"];
  onChange?: (value: string) => void;
  onCreate?: () => void;
}) => {
  const tc = useTranslations("Common");

  return (
    <SearchableSelect
      value={field.value ?? ""}
      onValueChange={(value) => {
        if (onCreate && value === "__create_new__") {
          field.onChange("");
          onCreate();
          return;
        }

        field.onChange(value);
        onChange?.(value);
      }}
    >
      <SearchableSelectTrigger className="w-full">
        <SearchableSelectValue />
      </SearchableSelectTrigger>
      <SearchableSelectContent searchPlaceholder={tc("search")}>
        <SearchableSelectGroup>
          <SearchableSelectEmpty>{tc("noResults")}</SearchableSelectEmpty>
          {items.map((item) => {
            return (
              <SearchableSelectItem key={item.value} value={item.value}>
                {item.label}
              </SearchableSelectItem>
            );
          })}
          {items.length > 0 && !!onCreate && <SearchableSelectSeparator />}
          {!!onCreate && (
            <SearchableSelectItem value="__create_new__">
              {tc("createNew")}
            </SearchableSelectItem>
          )}
        </SearchableSelectGroup>
      </SearchableSelectContent>
    </SearchableSelect>
  );
};
