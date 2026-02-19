import {
  SearchableSelect,
  SearchableSelectContent,
  SearchableSelectEmpty,
  SearchableSelectGroup,
  SearchableSelectItem,
  SearchableSelectSeparator,
  SearchableSelectTrigger,
  SearchableSelectValue,
} from "../ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { useFieldContext } from "./form-context";

type Props = {
  label: string;
  items: { value: string; label: React.ReactNode }[];
  isSearchable?: boolean;
  onChange?: (value: string) => void;
  onCreate?: () => void;
  placeholder?: string;
};

const CREATE_SENTINEL = "__create_new__";

export function SelectField({
  label,
  items,
  isSearchable = false,
  onChange,
  onCreate,
  placeholder,
}: Props) {
  const field = useFieldContext<string | undefined>();
  const showErrors =
    !field.state.meta.isValid &&
    (field.state.meta.isTouched || field.form.state.submissionAttempts > 0);

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      {isSearchable ? (
        <SearchableSelect
          value={field.state.value ?? ""}
          onValueChange={(value) => {
            if (value === CREATE_SENTINEL && onCreate) {
              onCreate();
              return;
            }

            field.handleChange(value);
            onChange?.(value);
          }}
        >
          <SearchableSelectTrigger className="w-full">
            <SearchableSelectValue placeholder={placeholder ?? "Select..."} />
          </SearchableSelectTrigger>
          <SearchableSelectContent searchPlaceholder="Search">
            <SearchableSelectGroup>
              <SearchableSelectEmpty>No results</SearchableSelectEmpty>
              {items.map((item) => {
                return (
                  <SearchableSelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SearchableSelectItem>
                );
              })}
              {items.length > 0 && !!onCreate && <SearchableSelectSeparator />}
              {!!onCreate && (
                <SearchableSelectItem value={CREATE_SENTINEL}>
                  Create new
                </SearchableSelectItem>
              )}
            </SearchableSelectGroup>
          </SearchableSelectContent>
        </SearchableSelect>
      ) : (
        <Select
          value={field.state.value ?? ""}
          onValueChange={(value) => {
            if (value == null) {
              return;
            }

            if (value === CREATE_SENTINEL && onCreate) {
              onCreate();
              return;
            }

            field.handleChange(value);
            onChange?.(value);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder ?? "Select..."} />
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
                <SelectItem value={CREATE_SENTINEL}>Create new</SelectItem>
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
      {showErrors && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
