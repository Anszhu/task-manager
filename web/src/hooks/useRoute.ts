import { useEffect, useState } from "preact/hooks";

const routeEvent = "app-route-change";

export const navigate = (path: string) => {
  if (window.location.pathname === path) {
    return;
  }

  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event(routeEvent));
};

export const useRoute = () => {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const update = () => setPath(window.location.pathname);

    window.addEventListener("popstate", update);
    window.addEventListener(routeEvent, update);

    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener(routeEvent, update);
    };
  }, []);

  return path;
};
