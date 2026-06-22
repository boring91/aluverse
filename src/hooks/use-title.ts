import { useEffect } from "react";

export const useTitle = (title: string) => {
  const fullTitle = title + " - AluVerse";

  useEffect(() => {
    document.title = fullTitle;

    // Next.js replaces the <title> element during same-route navigation,
    // resetting it to the layout metadata. Observe <head> for child changes
    // so we can re-apply the correct title when that happens.
    const observer = new MutationObserver(() => {
      if (document.title !== fullTitle) {
        document.title = fullTitle;
      }
    });

    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [fullTitle]);
};
