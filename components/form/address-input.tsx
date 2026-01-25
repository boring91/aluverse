"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Controller,
  FieldPath,
  FieldValues,
  UseFormReturn,
} from "react-hook-form";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "../ui/command";
import { loadGoogleMapsPlaces } from "@/lib/google-maps";
import { MapPin } from "lucide-react";

type Prediction = {
  placeId: string;
  description: string;
};

type Props<T extends FieldValues> = {
  name: FieldPath<T>;
  label: string;
  control: UseFormReturn<T>["control"];
  placeholder?: string;
};

export const AddressInput = <T extends FieldValues>({
  name,
  label,
  control,
  placeholder,
}: Props<T>) => {
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const placesLibRef = useRef<google.maps.PlacesLibrary | null>(null);
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadGoogleMapsPlaces()
      .then((placesLib) => {
        placesLibRef.current = placesLib;
        sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
        setIsGoogleLoaded(true);
      })
      .catch(() => {
        setIsGoogleLoaded(false);
      });

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const fetchPredictions = useCallback((input: string) => {
    if (!placesLibRef.current || !input.trim()) {
      setPredictions([]);
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { suggestions } =
          await placesLibRef.current!.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            {
              input,
              sessionToken: sessionTokenRef.current!,
            }
          );

        if (suggestions && suggestions.length > 0) {
          setPredictions(
            suggestions
              .filter((s) => s.placePrediction)
              .map((s) => ({
                placeId: s.placePrediction!.placeId,
                description: s.placePrediction!.text.text,
              }))
          );
          setIsOpen(true);
          setSelectedIndex(0);
        } else {
          setPredictions([]);
          setIsOpen(false);
          setSelectedIndex(-1);
        }
      } catch {
        setPredictions([]);
        setIsOpen(false);
        setSelectedIndex(-1);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, []);

  const handleSelect = (
    description: string,
    onChange: (value: string) => void
  ) => {
    onChange(description);
    setPredictions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    // Reset session token after selection for billing optimization
    if (placesLibRef.current) {
      sessionTokenRef.current =
        new placesLibRef.current.AutocompleteSessionToken();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    onChange: (value: string) => void
  ) => {
    if (!isOpen || predictions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < predictions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : predictions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < predictions.length) {
          handleSelect(predictions[selectedIndex].description, onChange);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        return (
          <Field>
            <FieldLabel>{label}</FieldLabel>
            {isGoogleLoaded ? (
              <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverAnchor asChild>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder={placeholder}
                    autoComplete="off"
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      fetchPredictions(e.target.value);
                    }}
                    onFocus={() => {
                      if (predictions.length > 0) {
                        setIsOpen(true);
                      }
                    }}
                    onKeyDown={(e) => handleKeyDown(e, field.onChange)}
                  />
                </PopoverAnchor>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <Command>
                    <CommandList>
                      {isLoading ? (
                        <CommandEmpty>Loading...</CommandEmpty>
                      ) : predictions.length === 0 ? (
                        <CommandEmpty>No addresses found</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {predictions.map((prediction, index) => (
                            <CommandItem
                              key={prediction.placeId}
                              value={prediction.description}
                              onSelect={() =>
                                handleSelect(
                                  prediction.description,
                                  field.onChange
                                )
                              }
                              data-selected={index === selectedIndex}
                              className={
                                index === selectedIndex
                                  ? "bg-accent text-accent-foreground"
                                  : ""
                              }
                              onMouseEnter={() => setSelectedIndex(index)}
                            >
                              <MapPin className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                              <span className="truncate">
                                {prediction.description}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <Input
                {...field}
                value={field.value ?? ""}
                placeholder={placeholder}
                autoComplete="on"
              />
            )}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
};
