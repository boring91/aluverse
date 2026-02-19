"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { loadGoogleMapsPlaces } from "@/lib/google-maps";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "../ui/popover";
import { useFieldContext } from "./form-context";

type Prediction = {
  placeId: string;
  description: string;
};

type Props = {
  label: string;
  placeholder?: string;
};

export function AddressField({ label, placeholder }: Props) {
  const field = useFieldContext<string>();
  const showErrors =
    !field.state.meta.isValid &&
    (field.state.meta.isTouched || field.form.state.submissionAttempts > 0);

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

  const handleSelect = (description: string) => {
    field.handleChange(description);
    setPredictions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    if (placesLibRef.current) {
      sessionTokenRef.current =
        new placesLibRef.current.AutocompleteSessionToken();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
          handleSelect(predictions[selectedIndex].description);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      {isGoogleLoaded ? (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverAnchor asChild>
            <Input
              value={field.state.value ?? ""}
              placeholder={placeholder}
              autoComplete="off"
              onChange={(e) => {
                field.handleChange(e.target.value);
                fetchPredictions(e.target.value);
              }}
              onFocus={() => {
                if (predictions.length > 0) {
                  setIsOpen(true);
                }
              }}
              onKeyDown={handleKeyDown}
            />
          </PopoverAnchor>
          <PopoverContent className="w-(--anchor-width) p-0">
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
                        onSelect={() => handleSelect(prediction.description)}
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
          value={field.state.value ?? ""}
          placeholder={placeholder}
          autoComplete="on"
          onChange={(e) => field.handleChange(e.target.value)}
        />
      )}
      {showErrors && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
