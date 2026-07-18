"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BOGOR_BOUNDS, BOGOR_CENTER } from "../../lib/mapboxRouting";

const MAP_STYLE = "mapbox://styles/mapbox/standard";

function routeCollection(routes) {
  return {
    type: "FeatureCollection",
    features: routes.filter((route) => route.geometry).map((route) => ({
      type: "Feature",
      properties: { routeId: route.id, color: route.color },
      geometry: route.geometry,
    })),
  };
}

function pointCollection(origin, destination) {
  const features = [];
  if (origin) features.push({ type: "Feature", properties: { kind: "start" }, geometry: { type: "Point", coordinates: origin } });
  if (destination) features.push({ type: "Feature", properties: { kind: "destination" }, geometry: { type: "Point", coordinates: destination } });
  return { type: "FeatureCollection", features };
}

function reportCollection(reports) {
  return {
    type: "FeatureCollection",
    features: reports.filter((report) => report.geometry?.type === "Point").map((report) => ({
      type: "Feature",
      properties: {
        id: report.id,
        title: report.title || "Laporan hambatan",
        description: report.description || "Laporan hambatan",
        photoUrl: report.photoUrl || "",
        obstacleType: report.obstacleType,
        verificationStatus: report.verificationStatus,
      },
      geometry: report.geometry,
    })),
  };
}

export default function MapboxMap({ routes = [], reports = [], activeRoute = "A", origin, destination, reportDraft, onMapClick, highContrast = false }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const routesRef = useRef(routes);
  const pointsRef = useRef({ origin, destination });
  const reportsRef = useRef(reports);
  const reportDraftRef = useRef(reportDraft);
  const onMapClickRef = useRef(onMapClick);
  const activeRouteRef = useRef(activeRoute);
  const routeTransitionRef = useRef(null);
  const [status, setStatus] = useState("loading");

  const fitActiveRoute = useCallback((map, routeId, animate = true) => {
    const coordinates = routesRef.current.find((route) => route.id === routeId)?.geometry?.coordinates;
    if (!coordinates?.length) return;
    const lngs = coordinates.map(([lng]) => lng);
    const lats = coordinates.map(([, lat]) => lat);
    const bounds = [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    map.fitBounds(bounds, {
      padding: { top: 95, right: 390, bottom: 95, left: 105 },
      duration: !animate || reducedMotion ? 0 : 900,
      maxZoom: 17,
      pitch: 42,
      bearing: 0,
      essential: true,
    });
  }, []);

  useEffect(() => {
    routesRef.current = routes;
    pointsRef.current = { origin, destination };
    activeRouteRef.current = activeRoute;
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    map.getSource("akseskota-routes")?.setData(routeCollection(routes));
    map.getSource("akseskota-points")?.setData(pointCollection(origin, destination));
    if (map.getLayer("akseskota-route-active")) map.setFilter("akseskota-route-active", ["==", ["get", "routeId"], activeRoute]);
    fitActiveRoute(map, activeRoute);
  }, [activeRoute, destination, fitActiveRoute, origin, routes]);

  useEffect(() => {
    reportsRef.current = reports;
    reportDraftRef.current = reportDraft;
    onMapClickRef.current = onMapClick;
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    map.getSource("akseskota-reports")?.setData(reportCollection(reports));
    map.getSource("akseskota-report-draft")?.setData(pointCollection(reportDraft, null));
    map.getCanvas().style.cursor = onMapClick ? "crosshair" : "";
  }, [onMapClick, reportDraft, reports]);

  useEffect(() => {
    const map = mapRef.current;
    activeRouteRef.current = activeRoute;
    if (!map?.getLayer("akseskota-route-active")) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.clearTimeout(routeTransitionRef.current);
    map.setPaintProperty("akseskota-route-active", "line-opacity", 0.15);
    routeTransitionRef.current = window.setTimeout(() => {
      if (mapRef.current !== map) return;
      map.setFilter("akseskota-route-active", ["==", ["get", "routeId"], activeRoute]);
      map.setPaintProperty("akseskota-route-active", "line-opacity", 0.98);
      fitActiveRoute(map, activeRoute);
    }, reducedMotion ? 0 : 120);
  }, [activeRoute, fitActiveRoute]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let disposed = false;
    let resizeObserver;

    async function initialize() {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!accessToken) throw new Error("NEXT_PUBLIC_MAPBOX_TOKEN belum tersedia");
        mapboxgl.accessToken = accessToken;

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          config: { basemap: { theme: "faded", lightPreset: "day", show3dObjects: true, show3dBuildings: true, showPointOfInterestLabels: true } },
          center: BOGOR_CENTER,
          zoom: 13.2,
          minZoom: 11.5,
          maxBounds: [[BOGOR_BOUNDS[0], BOGOR_BOUNDS[1]], [BOGOR_BOUNDS[2], BOGOR_BOUNDS[3]]],
          pitch: 42,
          bearing: 0,
          antialias: true,
          attributionControl: true,
        });
        mapRef.current = map;
        map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "bottom-right");
        map.addControl(new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true, showUserHeading: true }), "bottom-right");

        map.once("load", () => {
          if (disposed) return;
          map.addSource("akseskota-routes", { type: "geojson", data: routeCollection(routesRef.current) });
          map.addLayer({
            id: "akseskota-route-alternatives",
            type: "line",
            source: "akseskota-routes",
            slot: "middle",
            paint: { "line-color": ["get", "color"], "line-width": 5, "line-opacity": 0.34 },
            layout: { "line-cap": "round", "line-join": "round" },
          });
          map.addLayer({
            id: "akseskota-route-active",
            type: "line",
            source: "akseskota-routes",
            slot: "middle",
            filter: ["==", ["get", "routeId"], activeRouteRef.current],
            paint: { "line-color": ["get", "color"], "line-width": 9, "line-opacity": 0.98 },
            layout: { "line-cap": "round", "line-join": "round" },
          });
          map.addSource("akseskota-points", { type: "geojson", data: pointCollection(pointsRef.current.origin, pointsRef.current.destination) });
          map.addLayer({
            id: "akseskota-points",
            type: "circle",
            source: "akseskota-points",
            slot: "top",
            paint: {
              "circle-radius": 10,
              "circle-color": ["match", ["get", "kind"], "start", "#0c6478", "#f59e0b"],
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 4,
            },
          });
          map.addSource("akseskota-reports", { type: "geojson", data: reportCollection(reportsRef.current) });
          map.addLayer({
            id: "akseskota-reports",
            type: "circle",
            source: "akseskota-reports",
            slot: "top",
            paint: {
              "circle-radius": 8,
              "circle-color": ["match", ["get", "verificationStatus"], "VERIFIED", "#dc2626", "NEEDS_RECHECK", "#7c3aed", "#f59e0b"],
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 3,
            },
          });
          map.addSource("akseskota-report-draft", { type: "geojson", data: pointCollection(reportDraftRef.current, null) });
          map.addLayer({
            id: "akseskota-report-draft",
            type: "circle",
            source: "akseskota-report-draft",
            slot: "top",
            paint: {
              "circle-radius": 11,
              "circle-color": "#7c3aed",
              "circle-opacity": 0.82,
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 4,
            },
          });
          map.getCanvas().style.cursor = onMapClickRef.current ? "crosshair" : "";
          setStatus("ready");
          fitActiveRoute(map, activeRouteRef.current, false);
        });

        map.on("click", "akseskota-reports", (event) => {
          const feature = event.features?.[0];
          if (!feature) return;
          const content = document.createElement("div");
          const title = document.createElement("strong");
          const description = document.createElement("p");
          const statusText = document.createElement("small");
          title.textContent = feature.properties?.title || String(feature.properties?.obstacleType || "Hambatan").replaceAll("_", " ");
          description.textContent = feature.properties?.description || "Laporan hambatan";
          statusText.textContent = feature.properties?.verificationStatus === "VERIFIED" ? "Terverifikasi" : feature.properties?.verificationStatus === "NEEDS_RECHECK" ? "Perlu diperiksa ulang" : "Menunggu verifikasi";
          content.className = "space-y-1 p-1 text-[11px] text-[#344054]";
          title.className = "block text-[12px]";
          description.className = "m-0";
          statusText.className = "font-bold text-[#0c6478]";
          const photoUrl = feature.properties?.photoUrl;
          if (photoUrl) {
            const photo = document.createElement("img");
            photo.src = photoUrl;
            photo.alt = `Foto ${feature.properties?.title || "laporan hambatan"}`;
            photo.loading = "lazy";
            photo.referrerPolicy = "no-referrer";
            photo.className = "mb-2 h-28 w-56 rounded-lg object-cover";
            content.append(photo);
          }
          const action = document.createElement("button");
          action.type = "button";
          action.textContent = "Lihat & verifikasi komunitas";
          action.className = "mt-2 block rounded-full bg-[#0c6478] px-3 py-2 text-[10px] font-bold text-white";
          action.addEventListener("click", () => window.dispatchEvent(new CustomEvent("akseskota:open-report", { detail: { id: feature.properties?.id } })));
          content.append(title, description, statusText, action);
          new mapboxgl.Popup({ closeButton: true, offset: 12 }).setLngLat(feature.geometry.coordinates).setDOMContent(content).addTo(map);
        });
        map.on("mouseenter", "akseskota-reports", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "akseskota-reports", () => { map.getCanvas().style.cursor = onMapClickRef.current ? "crosshair" : ""; });
        map.on("click", (event) => {
          if (!onMapClickRef.current) return;
          const reportHits = map.queryRenderedFeatures(event.point, { layers: ["akseskota-reports"] });
          if (reportHits.length) return;
          onMapClickRef.current([event.lngLat.lng, event.lngLat.lat]);
        });

        map.on("error", (event) => {
          if (!map.isStyleLoaded() && event?.error?.message) setStatus("error");
        });
        const locate = () => navigator.geolocation?.getCurrentPosition(({ coords }) => map.flyTo({ center: [coords.longitude, coords.latitude], zoom: 16.4, essential: true }), () => undefined, { enableHighAccuracy: true, timeout: 8000 });
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
      resizeObserver?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [fitActiveRoute]);

  return <div data-active-route={activeRoute} className={`absolute inset-0 ${highContrast ? "contrast-[1.12] saturate-[.82]" : ""}`}>
    <div ref={containerRef} aria-label="Peta interaktif AksesKota dengan rute jalan kaki Mapbox" className="size-full" />
    {status === "loading" && <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[#dfe5e8]"><span className="rounded-full bg-white px-4 py-2 text-[11px] font-bold text-[#0c6478] shadow-lg">Memuat peta…</span></div>}
    {status === "error" && <div role="alert" className="absolute bottom-24 left-1/2 z-10 -translate-x-1/2 rounded-xl bg-white px-4 py-3 text-center text-[11px] font-bold text-[#b42318] shadow-xl">Peta gagal dimuat. Periksa token Mapbox dan koneksi.</div>}
  </div>;
}
