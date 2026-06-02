"use client";

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Info, ChevronRight, Compass } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMapMarkers, getDayColor, getCategoryEmoji, Day, Activity } from './useMapMarkers';
import { cn } from '@/lib/utils';

interface MapClientProps {
  days: Day[];
  tripCountry: string;
}

export function MapClient({ days, tripCountry }: MapClientProps) {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(true);

  const { renderAllMarkers, setDayFilter, focusMarker } = useMapMarkers();

  // Load Google Map
  useEffect(() => {
    if (!mapRef.current) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    async function initMap() {
      try {
        const { setOptions, importLibrary } = await import('@googlemaps/js-api-loader');

        setOptions({
          key: apiKey,
          v: 'weekly',
        } as any);

        const { Map } = await importLibrary('maps') as any;
        await importLibrary('marker');

        if (!mapRef.current) return;

        // Premium silver/light styling for a stunning visual experience
        const mapOptions = {
          center: { lat: 41.3275, lng: 19.8187 }, // Initial center (Tirana)
          zoom: 12,
          mapId: 'DEMO_MAP_ID', // Required for AdvancedMarkerElement
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
            { elementType: "labels.icon", stylers: [{ visibility: "on" }, { saturation: -80 }, { opacity: 40 }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { weight: 2 }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#e2e8f0" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
            { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#cbd5e1" }] },
            { featureType: "poi", elementType: "geometry", stylers: [{ color: "#f1f5f9" }] },
            { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#f0fdf4" }] }
          ]
        };

        const map = new Map(mapRef.current, mapOptions);
        setMapInstance(map);
        setIsLoadingMap(false);
      } catch (err) {
        console.error("Failed to load Google Maps:", err);
        setIsLoadingMap(false);
      }
    }

    initMap();
  }, []);

  // Render markers when map is ready or days update
  useEffect(() => {
    if (!mapInstance || days.length === 0) return;

    renderAllMarkers(
      days, 
      mapInstance, 
      (activity) => {
        setActiveActivityId(activity.id);
      }, 
      () => {
        router.refresh();
      },
      tripCountry
    );
  }, [mapInstance, days, renderAllMarkers, tripCountry, router]);

  // Handle Day Filter Change
  const handleDaySelect = (dayNumber: number | null) => {
    setSelectedDayNumber(dayNumber);
    setActiveActivityId(null);
    setDayFilter(dayNumber, mapInstance);
  };

  // Handle Activity Click
  const handleActivityClick = (activity: Activity) => {
    setActiveActivityId(activity.id);
    focusMarker(activity.id, mapInstance);
  };

  // Get active day object
  const activeDay = selectedDayNumber ? days.find(d => d.dayNumber === selectedDayNumber) : null;
  const visibleActivities = activeDay 
    ? activeDay.activities 
    : days.flatMap(d => d.activities);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-5 items-start">
      {/* Left Column: Map Visualization */}
      <div className="bg-surface border border-border rounded-[20px] shadow-soft p-4 lg:p-5 h-full flex flex-col overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-5">
          <div>
            <h3 className="m-0 font-display font-[760] text-lg lg:text-xl leading-none text-text-primary">
              Интерактивная карта
            </h3>
            <p className="m-0 mt-1 text-text-secondary text-xs lg:text-sm">
              Маршрут по Албании, раскрашенный по дням
            </p>
          </div>
          {/* Scrollable days bar on mobile */}
          <div className="flex flex-row overflow-x-auto pb-2 sm:pb-0 scrollbar-none gap-2 w-full sm:w-auto shrink-0 snap-x snap-mandatory">
            <button 
              onClick={() => handleDaySelect(null)}
              className={cn(
                "px-3 py-1.5 rounded-[12px] border font-semibold text-xs transition-all shrink-0 snap-align-start",
                selectedDayNumber === null
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface-elevated text-text-secondary border-border hover:bg-primary/5 hover:border-primary/20"
              )}
            >
              Все дни
            </button>
            {days.map((day) => {
              const color = getDayColor(day.dayNumber);
              const isSelected = selectedDayNumber === day.dayNumber;
              return (
                <button
                  key={day.id}
                  onClick={() => handleDaySelect(day.dayNumber)}
                  style={{
                    backgroundColor: isSelected ? `${color}15` : undefined,
                    borderColor: isSelected ? color : undefined,
                    color: isSelected ? color : undefined
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-[12px] border font-semibold text-xs transition-all flex items-center gap-1.5 shrink-0 snap-align-start",
                    !isSelected && "bg-surface-elevated text-text-secondary border-border hover:bg-surface hover:text-text-primary"
                  )}
                >
                  <span 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: color }}
                  />
                  День {day.dayNumber}
                </button>
              );
            })}
          </div>
        </div>

        {/* Map Container (Height reduced to 320px/350px on mobile) */}
        <div className="relative min-h-[320px] lg:min-h-[560px] flex-grow rounded-[18px] border border-border overflow-hidden bg-surface-elevated flex items-center justify-center">
          {isLoadingMap && (
            <div className="absolute inset-0 z-10 bg-surface/50 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-sm font-semibold text-text-secondary">Загрузка карты Google...</span>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full min-h-[320px] lg:min-h-[560px]" />
        </div>
      </div>

      {/* Right Column: Stops and Timeline of Visible / Selected Activities */}
      <div className="grid gap-5">
        <div className="bg-surface border border-border rounded-[20px] shadow-soft p-5">
          <div className="flex justify-between items-center gap-3 mb-[14px]">
            <h3 className="m-0 font-display font-[760] text-xl leading-none text-text-primary">
              {selectedDayNumber ? `День ${selectedDayNumber}: Точки` : 'Все точки маршрута'}
            </h3>
            <p className="m-0 text-text-secondary text-sm">
              {visibleActivities.length} локаций
            </p>
          </div>

          <div className="grid gap-[11px] max-h-[530px] overflow-y-auto pr-1">
            {visibleActivities.length === 0 ? (
              <div className="text-center py-8 text-text-secondary text-sm">
                Нет точек на карте для отображения.
              </div>
            ) : (
              visibleActivities.map((activity, idx) => {
                const day = days.find(d => d.id === activity.dayId);
                const dayNum = day ? day.dayNumber : 1;
                const color = getDayColor(dayNum);
                const isActive = activeActivityId === activity.id;
                const hasCoords = activity.latitude !== null && activity.latitude !== undefined &&
                                  activity.longitude !== null && activity.longitude !== undefined;

                return (
                  <div
                    key={activity.id}
                    onClick={() => handleActivityClick(activity)}
                    style={{
                      borderColor: isActive ? (hasCoords ? color : '#94a3b8') : undefined,
                      backgroundColor: isActive ? (hasCoords ? `${color}08` : 'rgba(148, 163, 184, 0.05)') : undefined
                    }}
                    className={cn(
                      "flex gap-3 p-[14px] rounded-[16px] bg-surface-elevated border border-border items-start cursor-pointer hover:border-primary/30 transition-all group",
                      !hasCoords && "opacity-80 hover:opacity-100"
                    )}
                  >
                    <div 
                      style={hasCoords ? { backgroundColor: `${color}15`, color } : undefined}
                      className={cn(
                        "w-[32px] h-[32px] rounded-[11px] flex items-center justify-center font-mono font-extrabold text-[12px] flex-shrink-0",
                        !hasCoords && "bg-neutral-200 dark:bg-neutral-800 text-neutral-500"
                      )}
                    >
                      {hasCoords ? getCategoryEmoji(activity.category) : '❓'}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-baseline gap-2">
                        <strong className={cn(
                          "block text-sm font-semibold truncate",
                          hasCoords ? "text-text-primary" : "text-text-secondary"
                        )}>
                          {activity.title}
                        </strong>
                        <span className="font-mono text-[10px] font-bold text-text-secondary flex-shrink-0">
                          {activity.time}
                        </span>
                      </div>
                      <span className="block mt-1 text-text-secondary text-xs leading-[1.35] line-clamp-2">
                        {activity.description || 'Нет описания'}
                      </span>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span 
                          style={{ backgroundColor: hasCoords ? color : '#94a3b8' }}
                          className="w-1.5 h-1.5 rounded-full" 
                        />
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                          День {dayNum} • {activity.category}
                        </span>
                        {!hasCoords && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 font-extrabold uppercase tracking-wide">
                            Не на карте
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight 
                      style={{ color: isActive ? (hasCoords ? color : '#94a3b8') : undefined }}
                      className="w-4 h-4 text-text-tertiary self-center group-hover:translate-x-0.5 transition-transform" 
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Practical Tips */}
        <div className="bg-surface border border-border rounded-[20px] shadow-soft p-5">
          <div className="flex justify-between items-center gap-3 mb-[14px]">
            <h3 className="m-0 font-display font-[760] text-xl leading-none text-text-primary">
              Справка о путешествии
            </h3>
          </div>
          <div className="grid gap-[11px]">
            <div className="flex gap-3 items-start p-[14px] rounded-[16px] bg-surface-elevated border border-border">
              <span className="w-[10px] h-[10px] rounded-full bg-[var(--ok)] mt-[5px] flex-shrink-0"></span>
              <div>
                <strong className="block text-[14px]">Автоматический кэш</strong>
                <div className="text-text-secondary text-[13px] mt-1">
                  Все найденные на карте места сохраняются в базу, чтобы работать в оффлайне.
                </div>
              </div>
            </div>
            <div className="flex gap-3 items-start p-[14px] rounded-[16px] bg-surface-elevated border border-border">
              <span className="w-[10px] h-[10px] rounded-full bg-accent mt-[5px] flex-shrink-0"></span>
              <div>
                <strong className="block text-[14px]">Цветовая палитра</strong>
                <div className="text-text-secondary text-[13px] mt-1">
                  Каждый день маршрута раскрашен в свой цвет для легкой навигации по этапам.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
