"use client";

import { useEffect, useRef } from "react";
import { BOGOR_BOUNDS, BOGOR_CENTER } from "../../lib/mapboxRouting";

function collection(destinations) {
  return { type: "FeatureCollection", features: destinations.map((item) => ({ type: "Feature", properties: { externalId: item.externalId, score: item.accessibilityScore ?? -1 }, geometry: { type: "Point", coordinates: item.coordinates } })) };
}

export default function DestinationMap({ destinations, selectedId, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const destinationsRef = useRef(destinations);
  const onSelectRef = useRef(onSelect);
  const selectedIdRef = useRef(selectedId);

  useEffect(() => { destinationsRef.current = destinations; onSelectRef.current = onSelect; selectedIdRef.current = selectedId; }, [destinations, onSelect, selectedId]);
  useEffect(() => { const map=mapRef.current; if(map?.isStyleLoaded()) map.getSource("destinations")?.setData(collection(destinations)); }, [destinations]);
  useEffect(() => {
    const map=mapRef.current; if(!map?.getLayer("destination-selected")) return;
    map.setFilter("destination-selected", ["==", ["get", "externalId"], selectedId || ""]);
    const selected=destinations.find((item)=>item.externalId===selectedId);
    if(selected) map.flyTo({center:selected.coordinates,zoom:16,essential:true});
  }, [destinations, selectedId]);

  useEffect(() => {
    if(!containerRef.current || mapRef.current) return;
    let disposed=false; let observer;
    async function initialize() {
      const mapboxgl=(await import("mapbox-gl")).default;
      if(!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return;
      mapboxgl.accessToken=process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const map=new mapboxgl.Map({container:containerRef.current,style:"mapbox://styles/mapbox/standard",config:{basemap:{theme:"faded",lightPreset:"day",show3dObjects:true}},center:BOGOR_CENTER,zoom:12.7,minZoom:11.2,maxBounds:[[BOGOR_BOUNDS[0],BOGOR_BOUNDS[1]],[BOGOR_BOUNDS[2],BOGOR_BOUNDS[3]]],attributionControl:true});
      mapRef.current=map; map.addControl(new mapboxgl.NavigationControl({showCompass:false}),"bottom-right");
      map.once("load",()=>{
        if(disposed)return;
        map.addSource("destinations",{type:"geojson",data:collection(destinationsRef.current),cluster:true,clusterRadius:42});
        map.addLayer({id:"destination-clusters",type:"circle",source:"destinations",filter:["has","point_count"],paint:{"circle-color":"#173c61","circle-radius":["step",["get","point_count"],17,25,22,60,28],"circle-stroke-color":"#fff","circle-stroke-width":3}});
        map.addLayer({id:"destination-cluster-count",type:"symbol",source:"destinations",filter:["has","point_count"],layout:{"text-field":["get","point_count_abbreviated"],"text-size":11},paint:{"text-color":"#fff"}});
        map.addLayer({id:"destination-points",type:"circle",source:"destinations",filter:["!",["has","point_count"]],paint:{"circle-radius":8,"circle-color":["case",[">=",["get","score"],75],"#12a594","#f59e0b"],"circle-stroke-color":"#fff","circle-stroke-width":3}});
        map.addLayer({id:"destination-selected",type:"circle",source:"destinations",filter:["==",["get","externalId"],selectedIdRef.current||""],paint:{"circle-radius":14,"circle-color":"#0c6478","circle-opacity":.25,"circle-stroke-color":"#0c6478","circle-stroke-width":3}});
        map.on("click","destination-points",(event)=>{const id=event.features?.[0]?.properties?.externalId;const item=destinationsRef.current.find((row)=>row.externalId===id);if(item)onSelectRef.current(item);});
        map.on("mouseenter","destination-points",()=>{map.getCanvas().style.cursor="pointer"});
        map.on("mouseleave","destination-points",()=>{map.getCanvas().style.cursor=""});
      });
      observer=new ResizeObserver(()=>map.resize()); observer.observe(containerRef.current);
    }
    initialize().catch(()=>undefined);
    return()=>{disposed=true;observer?.disconnect();mapRef.current?.remove();mapRef.current=null};
  }, []);

  return <div ref={containerRef} className="size-full" aria-label="Peta destinasi Kota Bogor"/>;
}
