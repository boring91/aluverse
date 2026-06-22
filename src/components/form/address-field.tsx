"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { loadGoogleMapsPlaces } from "@/lib/google-maps";
import { cn } from "@/lib/client-utils";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
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
  const field = useFieldContext<string | null | undefined>();
  const showErrors =
    !field.state.meta.isValid &&
    (field.state.meta.isTouched || field.form.state.submissionAttempts > 0);

  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
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
      try {
        const { suggestions } =
          await placesLibRef.current!.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            {
              input,
              sessionToken: sessionTokenRef.current!,
            },
          );

        if (suggestions.length > 0) {
          setPredictions(
            suggestions
              .filter(
                (suggestion: google.maps.places.AutocompleteSuggestion) =>
                  suggestion.placePrediction,
              )
              .map((suggestion: google.maps.places.AutocompleteSuggestion) => ({
                placeId: suggestion.placePrediction!.placeId,
                description: suggestion.placePrediction!.text.text,
              })),
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
          prev < predictions.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : predictions.length - 1,
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
        <div className="relative">
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
            onBlur={() => {
              setTimeout(() => setIsOpen(false), 150);
            }}
            onKeyDown={handleKeyDown}
          />
          {isOpen && predictions.length > 0 && (
            <div className="bg-popover text-popover-foreground ring-foreground/10 absolute z-50 mt-1 w-full shadow-md ring-1">
              <div className="max-h-72 overflow-y-auto">
                {predictions.map((prediction, index) => (
                  <div
                    key={prediction.placeId}
                    className={cn(
                      "flex cursor-default items-center gap-2 px-2 py-2 text-xs select-none",
                      index === selectedIndex
                        ? "bg-accent text-accent-foreground"
                        : "",
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(prediction.description);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <MapPin className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <span className="truncate">{prediction.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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
