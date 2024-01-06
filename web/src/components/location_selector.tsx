import { divIcon, Marker as MarkerLeaflet } from "leaflet";
import React, { Dispatch, SetStateAction, useMemo, useRef } from "react";
import { renderToString } from "react-dom/server";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { MapPin } from "./icons";
import { useTheme } from "@nextui-org/react";
import 'leaflet/dist/leaflet.css';

// Define types for map position
export type Position = {
  lat: number;
  lng: number;
};

export const LocationSelector = (props: {
  position: Position;
  setPosition: Dispatch<SetStateAction<Position>>;
  markerVisible?: boolean;
  zoomLevel?: number;
  css?: React.CSSProperties;
}) => {
  const { theme } = useTheme();

  // Marker visible by default
  const markerVisible = props.markerVisible ?? true;

  // Fine-grain control over selected location
  const DraggableMarker = () => {
    const markerRef = useRef<MarkerLeaflet | null>(null);
    const eventHandlers = useMemo(
      () => ({
        dragend() {
          const marker = markerRef.current;
          if (marker != null) {
            props.setPosition(marker.getLatLng());
          }
        },
      }),
      [],
    );

    // Create a custom icon
    const customIcon = divIcon({
      className: "custom-icon",
      html: renderToString(
        <MapPin
          style={{ width: "60px", height: "60px" }}
          color={theme?.colors.primary.value}
        />,
      ),
      iconSize: [60, 60], // Size of the icon
    });

    return (
      <Marker
        draggable={true}
        eventHandlers={eventHandlers}
        position={props.position}
        ref={markerRef}
        icon={customIcon}
      ></Marker>
    );
  };

  return (
    <MapContainer
      center={props.position}
      zoom={props.zoomLevel ?? 4}
      style={{ ...props.css, width: "100%", borderRadius: "1em" }}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
      <ChangeView newPosition={props.position} zoomLevel={props.zoomLevel} />
      {markerVisible && <DraggableMarker />}
    </MapContainer>
  );
};

// Leaflet doesn't respond to changes in the position state, so we need
// use this helper function to update the map's view.
const ChangeView = (props: { newPosition: Position; zoomLevel?: number }) => {
  const map = useMap();
  map.setView(props.newPosition, props.zoomLevel ?? map.getZoom(), {
    animate: true,
  });
  return null;
};

export default LocationSelector;
