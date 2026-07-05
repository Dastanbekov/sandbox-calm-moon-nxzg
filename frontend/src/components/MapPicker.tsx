'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

interface MapPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MapPicker({ value, onChange }: MapPickerProps) {
  useEffect(() => {
    // Dynamically inject leaflet CSS if not present
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const internalValue = useRef<string>('');
  const LRef = useRef<any>(null);

  const parseCoords = (val: string): [number, number] => {
    if (val && !val.includes('<iframe')) {
      const parts = val.split(',');
      if (parts.length === 2) {
        return [parseFloat(parts[0]), parseFloat(parts[1])]; // [lat, lng]
      }
    }
    return [42.8746, 74.5698]; // Bishkek center
  };

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    import('leaflet').then((module) => {
      const L = module.default || module;
      LRef.current = L;
      
      // Fix default icon issue with webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      if (!mapContainerRef.current || mapRef.current) return;

      const currentValue = valueRef.current;
      const coords = parseCoords(currentValue);
      
      const map = L.map(mapContainerRef.current).setView(coords, 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      mapRef.current = map;

      if (currentValue && !currentValue.includes('<iframe')) {
        internalValue.current = currentValue;
        markerRef.current = L.marker(coords).addTo(map);
      }

      map.on('click', (e: any) => {
        const clickedCoords = e.latlng;
        if (markerRef.current) {
          map.removeLayer(markerRef.current);
        }
        markerRef.current = L.marker(clickedCoords).addTo(map);
        
        const newVal = `${clickedCoords.lat},${clickedCoords.lng}`;
        internalValue.current = newVal;
        onChangeRef.current(newVal);
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Run once

  useEffect(() => {
    if (mapRef.current && LRef.current && value && value !== internalValue.current && !value.includes('<iframe')) {
      const coords = parseCoords(value);
      mapRef.current.setView(coords, 13);
      
      if (markerRef.current) {
        mapRef.current.removeLayer(markerRef.current);
      }
      markerRef.current = LRef.current.marker(coords).addTo(mapRef.current);
      internalValue.current = value;
    }
  }, [value]);

  if (value && value.includes('<iframe')) {
    return (
      <div className="space-y-2">
        <div className="w-full h-[250px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
          <div 
            className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:absolute [&>iframe]:inset-0 [&>a]:hidden" 
            dangerouslySetInnerHTML={{ __html: value }} 
          />
        </div>
        <button 
          type="button"
          onClick={() => onChange('')}
          className="text-xs text-rose-600 hover:text-rose-700 font-medium"
        >
          Удалить карту и использовать интерактивную
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="w-full h-[300px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 z-0" ref={mapContainerRef}>
      </div>
      <p className="text-xs text-slate-500">
        Кликните на карту, чтобы указать местоположение.
      </p>
    </div>
  );
}
