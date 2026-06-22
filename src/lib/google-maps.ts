type PlacesLibrary = google.maps.PlacesLibrary;
type GoogleMapsBootstrap = Partial<typeof google.maps> & {
  importLibrary?: (name: string) => Promise<unknown>;
};
type GoogleBootstrap = {
  maps?: GoogleMapsBootstrap;
};
type GoogleWindow = Window & {
  google?: GoogleBootstrap;
  __googleMapsCallback?: () => void;
};

let loadPromise: Promise<PlacesLibrary> | null = null;

export function loadGoogleMapsPlaces(): Promise<PlacesLibrary> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn("Google Maps API key not configured");
      reject(new Error("Google Maps API key not configured"));
      return;
    }

    // Bootstrap loader approach - creates importLibrary function before script loads
    const googleWindow = window as GoogleWindow;
    const g =
      googleWindow.google || (googleWindow.google = {} as GoogleBootstrap);
    const m = g.maps || (g.maps = {} as GoogleMapsBootstrap);

    if (m.importLibrary) {
      // Already initialized
      m.importLibrary("places")
        .then((lib) => resolve(lib as PlacesLibrary))
        .catch(reject);
      return;
    }

    // Queue for libraries to load
    const importQueue: Array<{
      name: string;
      resolve: (lib: PlacesLibrary) => void;
    }> = [];

    m.importLibrary = (name: string) => {
      return new Promise((res: (library: PlacesLibrary) => void) => {
        importQueue.push({ name, resolve: res });
      });
    };

    // Start loading places immediately
    const placesPromise = m.importLibrary("places") as Promise<PlacesLibrary>;
    placesPromise.then(resolve).catch(reject);

    // Load the script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&callback=__googleMapsCallback`;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);

    // Callback to process queued imports when script loads
    googleWindow.__googleMapsCallback = () => {
      // Script is loaded, now the real importLibrary is available
      for (const { name, resolve: res } of importQueue) {
        google.maps.importLibrary(name).then(res as (lib: unknown) => void);
      }
    };
  });

  return loadPromise;
}
