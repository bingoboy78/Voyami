import { useRef, useCallback } from 'react';

export interface Activity {
  id: string;
  time: string;
  category: string;
  title: string;
  description: string | null;
  tags: string;
  latitude: number | null;
  longitude: number | null;
  locationQuery: string | null;
  dayId: string;
}

export interface Day {
  id: string;
  dayNumber: number;
  title: string;
  activities: Activity[];
}

interface MarkerRef {
  activityId: string;
  dayNumber: number;
  marker: any; // AdvancedMarkerElement
  pin: any; // PinElement
}

export function getDayColor(dayNumber: number) {
  const colors = [
    '#E87461', // Coral (Day 1)
    '#5B8DEF', // Blue (Day 2)
    '#4CAF82', // Green (Day 3)
    '#A478E8', // Purple (Day 4)
    '#E8A84C', // Amber (Day 5)
    '#E85B8D', // Pink (Day 6)
    '#5BC0DE', // Cyan (Day 7)
    '#8D6E63'  // Brown (Day 8)
  ];
  return colors[(dayNumber - 1) % colors.length];
}

export function getCategoryEmoji(category: string) {
  const cat = category.toLowerCase();
  if (cat.includes('транспорт') || cat.includes('рейс') || cat.includes('вылет')) return '✈';
  if (cat.includes('отель') || cat.includes('ночлег') || cat.includes('check-in')) return '🏨';
  if (cat.includes('обед') || cat.includes('ужин') || cat.includes('ресторан') || cat.includes('еда')) return '🍽';
  if (cat.includes('кофе') || cat.includes('кафе')) return '☕';
  if (cat.includes('музей') || cat.includes('арт') || cat.includes('выставка')) return '🏛';
  if (cat.includes('достопримечательность') || cat.includes('место') || cat.includes('крепость') || cat.includes('замок')) return '🏰';
  if (cat.includes('прогулка') || cat.includes('парк') || cat.includes('квартал')) return '🚶';
  return '📍';
}

export function getCountryCode(country: string): string | null {
  const c = country.toLowerCase();
  if (c.includes('albania') || c.includes('албания')) return 'AL';
  if (c.includes('georgia') || c.includes('грузия')) return 'GE';
  if (c.includes('russia') || c.includes('россия')) return 'RU';
  if (c.includes('italy') || c.includes('италия')) return 'IT';
  if (c.includes('france') || c.includes('франция')) return 'FR';
  if (c.includes('spain') || c.includes('испания')) return 'ES';
  if (c.includes('turkey') || c.includes('турция')) return 'TR';
  if (c.includes('montenegro') || c.includes('черногория')) return 'ME';
  if (c.includes('greece') || c.includes('греция')) return 'GR';
  return null;
}

export function useMapMarkers() {
  const markersRef = useRef<MarkerRef[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(({ marker }) => {
      marker.map = null;
    });
    markersRef.current = [];

    polylinesRef.current.forEach((polyline) => {
      polyline.setMap(null);
    });
    polylinesRef.current = [];

    if (infoWindowRef.current) {
      infoWindowRef.current.close();
      infoWindowRef.current = null;
    }
  }, []);

  const renderAllMarkers = useCallback(async (
    days: Day[],
    mapInstance: any,
    onActivityClick?: (activity: Activity) => void,
    onGeocodeSuccess?: () => void,
    tripCountry: string = 'Albania'
  ) => {
    clearMarkers();
    if (!mapInstance || !days || days.length === 0) return;

    const google = (window as any).google;
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary('marker');
    
    // Lazy initialize InfoWindow
    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
    }

    const bounds = new google.maps.LatLngBounds();
    let hasValidBounds = false;

    // Helper to geocode and update db
    const geocodeActivity = async (activity: Activity, dayNumber: number) => {
      const addressQuery = activity.locationQuery || activity.title;
      if (!addressQuery) return null;

      try {
        const geocoder = new google.maps.Geocoder();
        const geocodeOptions: any = { address: addressQuery };

        const countryCode = getCountryCode(tripCountry);
        if (countryCode) {
          geocodeOptions.componentRestrictions = { country: countryCode };
        } else {
          geocodeOptions.address = `${addressQuery}, ${tripCountry}`;
        }

        const response = await geocoder.geocode(geocodeOptions);

        if (response.results?.[0]?.geometry?.location) {
          const result = response.results[0];
          const types = result.types || [];

          // If the result is country-level or region-level but query is not just country name, reject it.
          const isGeneric = types.includes('country') || types.includes('administrative_area_level_1') || types.includes('administrative_area_level_2');
          const isQueryJustCountry = addressQuery.trim().toLowerCase() === tripCountry.toLowerCase();
          
          if (isGeneric && !isQueryJustCountry) {
            console.log(`Rejecting generic geocoding result for: "${addressQuery}" (type: ${types.join(', ')})`);
            return null;
          }

          const loc = result.geometry.location;
          const lat = loc.lat();
          const lng = loc.lng();

          // Update via PUT API to cache in database
          await fetch('/api/activities', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: activity.id,
              latitude: lat,
              longitude: lng
            })
          });

          if (onGeocodeSuccess) {
            onGeocodeSuccess();
          }

          return { lat, lng };
        }
      } catch (e) {
        console.warn(`Geocoding failed for: ${activity.title} using query: ${addressQuery}`, e);
      }
      return null;
    };

    // Render markers and accumulate coordinates for polylines
    for (const day of days) {
      const color = getDayColor(day.dayNumber);
      const dayCoordinates: { lat: number; lng: number }[] = [];

      for (const activity of day.activities) {
        let lat = activity.latitude !== null && activity.latitude !== undefined ? Number(activity.latitude) : null;
        let lng = activity.longitude !== null && activity.longitude !== undefined ? Number(activity.longitude) : null;

        // Geocode if missing coordinates
        if (lat === null || isNaN(lat) || lng === null || isNaN(lng)) {
          const coords = await geocodeActivity(activity, day.dayNumber);
          if (coords) {
            lat = coords.lat;
            lng = coords.lng;
          } else {
            lat = null;
            lng = null;
          }
        }

        if (lat !== null && lng !== null) {
          const position = { lat, lng };
          dayCoordinates.push(position);
          bounds.extend(position);
          hasValidBounds = true;

          const pin = new PinElement({
            background: color,
            borderColor: '#FFFFFF',
            glyphColor: '#FFFFFF',
            glyph: getCategoryEmoji(activity.category),
            scale: 1.0,
          });

          const marker = new AdvancedMarkerElement({
            map: mapInstance,
            position,
            content: pin.element,
            title: activity.title,
          });

          // Click handler to open InfoWindow
          marker.addListener('click', () => {
            const contentString = `
              <div style="font-family: var(--font-body); padding: 4px; max-width: 240px; color: var(--fg);">
                <div style="font-size: 11px; font-weight: 800; font-family: var(--font-mono); color: ${color}; text-transform: uppercase; margin-bottom: 2px;">
                  День ${day.dayNumber} • ${activity.time}
                </div>
                <h4 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: #1e293b;">
                  ${getCategoryEmoji(activity.category)} ${activity.title}
                </h4>
                ${activity.description ? `<p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.4;">${activity.description}</p>` : ''}
              </div>
            `;
            infoWindowRef.current.setContent(contentString);
            infoWindowRef.current.open(mapInstance, marker);

            if (onActivityClick) {
              onActivityClick(activity);
            }
          });

          markersRef.current.push({
            activityId: activity.id,
            dayNumber: day.dayNumber,
            marker,
            pin
          });
        }
      }

      // Draw polyline route for the day if it has at least 2 points
      if (dayCoordinates.length >= 2) {
        const polyline = new google.maps.Polyline({
          path: dayCoordinates,
          geodesic: true,
          strokeColor: color,
          strokeOpacity: 0.8,
          strokeWeight: 3.5,
          map: mapInstance,
          icons: [{
            icon: {
              path: 'M 0,-1 0,1',
              strokeOpacity: 1,
              scale: 2
            },
            offset: '0',
            repeat: '10px'
          }]
        });

        polylinesRef.current.push(polyline);
      }
    }

    if (hasValidBounds) {
      mapInstance.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
    }
  }, [clearMarkers]);

  const setDayFilter = useCallback((dayNumber: number | null, mapInstance: any) => {
    const bounds = new (window as any).google.maps.LatLngBounds();
    let hasValidBounds = false;

    markersRef.current.forEach(({ dayNumber: markerDay, marker }) => {
      const el = marker.content as HTMLElement;
      if (!el) return;

      if (dayNumber === null || markerDay === dayNumber) {
        el.style.opacity = '1';
        el.style.filter = 'none';
        el.style.transform = 'scale(1.05)';
        
        if (marker.position) {
          bounds.extend(marker.position);
          hasValidBounds = true;
        }
      } else {
        el.style.opacity = '0.25';
        el.style.filter = 'grayscale(90%)';
        el.style.transform = 'scale(0.8)';
      }
      el.style.transition = 'all 0.3s ease';
    });

    // Update polylines visibility
    polylinesRef.current.forEach((polyline, index) => {
      // Index matches day color. Let's make sure polyline matches dayNumber.
      // Day is 1-indexed. index matches days that have paths.
      // So let's store day number in the polyline reference or adjust opacity.
      // For now, let's just make non-active polylines transparent.
      // Wait, we can store dayNumber on polyline if we want, or do it by strokeOpacity:
      const strokeColor = polyline.get('strokeColor');
      // Find matching color
      if (dayNumber === null) {
        polyline.setOptions({ strokeOpacity: 0.8 });
      } else {
        const targetColor = getDayColor(dayNumber);
        if (strokeColor === targetColor) {
          polyline.setOptions({ strokeOpacity: 0.8 });
        } else {
          polyline.setOptions({ strokeOpacity: 0.05 });
        }
      }
    });

    if (hasValidBounds && mapInstance) {
      mapInstance.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
    }
  }, []);

  const focusMarker = useCallback((activityId: string, mapInstance: any) => {
    const match = markersRef.current.find(m => m.activityId === activityId);
    if (match && mapInstance && match.marker.position) {
      mapInstance.panTo(match.marker.position);
      mapInstance.setZoom(15);

      const color = getDayColor(match.dayNumber);
      // Find activity description from somewhere or just show title
      // We can also trigger a click event on the marker
      const google = (window as any).google;
      google.maps.event.trigger(match.marker, 'click');
    }
  }, []);

  return { renderAllMarkers, setDayFilter, focusMarker, clearMarkers };
}
