import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-5 text-center">
      <div>
        <p className="text-7xl font-black sm:text-8xl">404</p>
        <h1 className="mt-4 text-2xl font-black sm:text-3xl">Page not found</h1>
        <p className="mt-2 text-balance text-muted-foreground">
          The page you requested does not exist or is no longer available.
        </p>
        <Button size="lg" className="mt-6" render={<Link to="/" />}>
          Back home
        </Button>
      </div>
    </div>
  );
}
