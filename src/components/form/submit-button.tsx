import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { useFormContext } from "./form-context";

type Props = {
  label?: string;
};

export function SubmitButton({ label = "Save" }: Props) {
  const form = useFormContext();

  return (
    <form.Subscribe
      selector={(state) => state.isSubmitting}
      children={(isSubmitting) => {
        return (
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting && <Loader2 className="animate-spin" />}
            {label}
          </Button>
        );
      }}
    />
  );
}
