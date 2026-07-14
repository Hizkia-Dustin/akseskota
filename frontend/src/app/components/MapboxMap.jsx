"use client";

import { useEffect, useRef, useState } from "react";

const MAP_STYLE = "mapbox://styles/mapbox/standard";
const CENTER = [110.4167, -6.9872];

const routeFeatures = [
  { type: "Feature", properties: { routeId: "A", color: "#0c6478" }, geometry: { type: "LineString", coordinates: [[110.4227,-6.9904],[110.4205,-6.9900],[110.4180,-6.9887],[110.4154,-6.9872],[110.4130,-6.9856],[110.4108,-6.9839]] } },
  { type: "Feature", properties: { routeId: "B", color: "#f59e0b" }, geometry: { type: "LineString", coordinates: [[110.4227,-6.9904],[110.4210,-6.9878],[110.4183,-6.9859],[110.4155,-6.9845],[110.4108,-6.9839]] } },
  { type: "Feature", properties: { routeId: "C", color: "#3b82f6" }, geometry: { type: "LineString", coordinates: [[110.4227,-6.9904],[110.4199,-6.9880],[110.4172,-6.9860],[110.4140,-6.9844],[110.4108,-6.9839]] } },
];

const routeData = { type: "FeatureCollection", features: routeFeatures };
const pointData = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { kind: "start" }, geometry: { type: "Point", coordinates: [110.4227, -6.9904] } },
    { type: "Feature", properties: { kind: "destination" }, geometry: { type: "Point", coordinates: [110.4108, -6.9839] } },
    { type: "Feature", properties: { kind: "report" }, geometry: { type: "Point", coordinates: [110.4172, -6.9860] } },
  ],
};

export default function MapboxMap({ activeRoute = "A", highContrast = false }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const activeRouteRef = useRef(activeRoute);
  const routeTransitionRef = useRef(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    activeRouteRef.current = activeRoute;
    const map = mapRef.current;
    if (!map?.getLayer("akseskota-route-active")) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.clearTimeout(routeTransitionRef.current);
    map.setPaintProperty("akseskota-route-active", "line-opacity", 0.12);
    map.setPaintProperty("akseskota-route-active", "line-width", 5);
    routeTransitionRef.current = window.setTimeout(() => {
      if (mapRef.current !== map || !map.getLayer("akseskota-route-active")) return;
      map.setFilter("akseskota-route-active", ["==", ["get", "routeId"], activeRoute]);
      map.setPaintProperty("akseskota-route-active", "line-opacity", 0.96);
      map.setPaintProperty("akseskota-route-active", "line-width", 9);
    }, reducedMotion ? 0 : 190);

    const coordinates = routeFeatures.find((item) => item.properties.routeId === activeRoute)?.geometry.coordinates;
    if (!coordinates) return;
    const lngs = coordinates.map(([lng]) => lng);
    const lats = coordinates.map(([, lat]) => lat);
    map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], {
      padding: 110,
      duration: reducedMotion ? 0 : 1050,
      maxZoom: 15.8,
      pitch: 55,
      bearing: -20,
      essential: true,
      easing: (time) => time < 0.5 ? 4 * time ** 3 : 1 - ((-2 * time + 2) ** 3) / 2,
    });
  }, [activeRoute]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let disposed = false;
    let resizeObserver;
    let introTimer;

    async function initialize() {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        if (disposed || !containerRef.current) return;

        const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!accessToken) throw new Error("NEXT_PUBLIC_MAPBOX_TOKEN belum tersedia");
        mapboxgl.accessToken = accessToken;

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          config: {
            basemap: {
              theme: "faded",
              lightPreset: "day",
              show3dObjects: true,
              show3dBuildings: true,
              show3dFacades: true,
              show3dLandmarks: false,
              showPointOfInterestLabels: false,
            },
          },
          center: CENTER,
          zoom: 15.5,
          pitch: 55,
          bearing: -20,
          canvasContextAttributes: { antialias: true },
          attributionControl: true,
        });
        mapRef.current = map;

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
        map.addControl(new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true,
        }), "bottom-right");

        map.once("load", () => {
          if (disposed) return;

          map.addSource("akseskota-routes", { type: "geojson", data: routeData });
          map.addLayer({
            id: "akseskota-route-alternatives",
            type: "line",
            source: "akseskota-routes",
            slot: "middle",
            paint: {
              "line-color": ["get", "color"],
              "line-width": 5,
              "line-opacity": 0,
              "line-opacity-transition": { duration: 480, delay: 80 },
            },
            layout: { "line-cap": "round", "line-join": "round" },
          });
          map.addLayer({
            id: "akseskota-route-active",
            type: "line",
            source: "akseskota-routes",
            slot: "middle",
            filter: ["==", ["get", "routeId"], activeRouteRef.current],
            paint: {
              "line-color": ["get", "color"],
              "line-width": 5,
              "line-opacity": 0,
              "line-opacity-transition": { duration: 320, delay: 0 },
              "line-width-transition": { duration: 380, delay: 0 },
            },
            layout: { "line-cap": "round", "line-join": "round" },
          });
          map.addSource("akseskota-points", { type: "geojson", data: pointData });
          map.addLayer({
            id: "akseskota-points",
            type: "circle",
            source: "akseskota-points",
            slot: "top",
            paint: {
              "circle-radius": 0,
              "circle-radius-transition": { duration: 420, delay: 140 },
              "circle-color": ["match", ["get", "kind"], "start", "#0c6478", "destination", "#f59e0b", "#ef4444"],
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 4,
            },
          });

          const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          introTimer = window.setTimeout(() => {
            if (disposed || !map.getLayer("akseskota-route-active")) return;
            map.setPaintProperty("akseskota-route-alternatives", "line-opacity", 0.32);
            map.setPaintProperty("akseskota-route-active", "line-opacity", 0.96);
            map.setPaintProperty("akseskota-route-active", "line-width", 9);
            map.setPaintProperty("akseskota-points", "circle-radius", ["match", ["get", "kind"], "report", 8, 10]);
          }, reducedMotion ? 0 : 80);

          const syncMapState = () => {
            if (!containerRef.current) return;
            containerRef.current.dataset.zoom = map.getZoom().toFixed(2);
            containerRef.current.dataset.pitch = map.getPitch().toFixed(0);
            containerRef.current.dataset.buildings3d = "mapbox-standard";
          };
          map.on("idle", syncMapState);
          map.on("moveend", syncMapState);
          syncMapState();
          setStatus("ready");
        });

        map.on("error", (event) => {
          const message = event?.error?.message?.toLowerCase() ?? "";
          if (!map.isStyleLoaded() && message.includes("style")) setStatus("error");
        });

        const locate = () => navigator.geolocation?.getCurrentPosition(
          ({ coords }) => {
            const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            map.flyTo({
              center: [coords.longitude, coords.latitude],
              zoom: 16.4,
              pitch: 58,
              bearing: -20,
              duration: reducedMotion ? 0 : 1200,
              essential: true,
              easing: (time) => 1 - (1 - time) ** 3,
            });
          },
          () => undefined,
          { enableHighAccuracy: true, timeout: 8000 },
        );
        window.addEventListener("akseskota:locate", locate);
        map.once("remove", () => window.removeEventListener("akseskota:locate", locate));

        resizeObserver = new ResizeObserver(() => map.resize());
        resizeObserver.observe(containerRef.current);
      } catch {
        setStatus("error");
      }
    }

    initialize();
    return () => {
      disposed = true;
      window.clearTimeout(routeTransitionRef.current);
      window.clearTimeout(introTimer);
      resizeObserver?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return <div data-active-route={activeRoute} className={`absolute inset-0 ${highContrast ? "contrast-[1.12] saturate-[.82]" : ""}`}>
    <div ref={containerRef} aria-label="Peta interaktif AksesKota" className="size-full" />
    {status === "loading" && <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[#dfe5e8]"><span className="rounded-full bg-white px-4 py-2 text-[11px] font-bold text-[#0c6478] shadow-lg">Memuat peta…</span></div>}
    {status === "error" && <div role="alert" className="absolute bottom-24 left-1/2 z-10 -translate-x-1/2 rounded-xl bg-white px-4 py-3 text-center text-[11px] font-bold text-[#b42318] shadow-xl">Peta gagal dimuat. Periksa koneksi internet.</div>}
  </div>;
}
