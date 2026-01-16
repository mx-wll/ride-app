'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Map as LeafletMap, Marker as LeafletMarker, Circle as LeafletCircle, LeafletMouseEvent } from 'leaflet'

interface RideMapProps {
  latitude?: number | null
  longitude?: number | null
  radiusKm?: number
  startLocation?: string
  className?: string
  interactive?: boolean
  onLocationSelect?: (lat: number, lng: number) => void
}

// Simple static map component with radius visualization
export function RideMap({
  latitude,
  longitude,
  radiusKm = 10,
  startLocation,
  className,
  interactive = false,
  onLocationSelect,
}: RideMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null)
  const [marker, setMarker] = useState<LeafletMarker | null>(null)
  const [circle, setCircle] = useState<LeafletCircle | null>(null)

  // Load Leaflet dynamically (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const loadLeaflet = async () => {
      try {
        // Dynamically import Leaflet
        const L = await import('leaflet')
        await import('leaflet/dist/leaflet.css')

        if (!mapRef.current || mapInstance) return

        // Default to a central location if no coordinates
        const defaultLat = latitude ?? 40.7128
        const defaultLng = longitude ?? -74.006

        // Create map
        const map = L.default.map(mapRef.current).setView([defaultLat, defaultLng], 12)

        // Add tile layer (OpenStreetMap - free)
        L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map)

        setMapInstance(map)

        // Add marker if we have coordinates
        if (latitude && longitude) {
          const customIcon = L.default.divIcon({
            className: 'custom-marker',
            html: `<div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
          })

          const newMarker = L.default.marker([latitude, longitude], { icon: customIcon }).addTo(map)
          if (startLocation) {
            newMarker.bindPopup(`<b>Start:</b> ${startLocation}`)
          }
          setMarker(newMarker)

          // Add radius circle
          const newCircle = L.default.circle([latitude, longitude], {
            radius: radiusKm * 1000, // Convert km to meters
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.15,
            weight: 2,
          }).addTo(map)
          setCircle(newCircle)

          // Fit bounds to show the circle
          map.fitBounds(newCircle.getBounds(), { padding: [20, 20] })
        }

        // Handle click for interactive mode
        if (interactive && onLocationSelect) {
          map.on('click', (e: LeafletMouseEvent) => {
            onLocationSelect(e.latlng.lat, e.latlng.lng)
          })
        }
      } catch (err) {
        console.error('Failed to load map:', err)
        setError('Failed to load map')
      }
    }

    loadLeaflet()

    return () => {
      if (mapInstance) {
        mapInstance.remove()
      }
    }
  }, []) // Only run once on mount

  // Update marker and circle when coordinates change
  useEffect(() => {
    if (!mapInstance || typeof window === 'undefined') return

    const updateMap = async () => {
      const L = await import('leaflet')

      // Remove existing marker and circle
      if (marker) marker.remove()
      if (circle) circle.remove()

      if (latitude && longitude) {
        const customIcon = L.default.divIcon({
          className: 'custom-marker',
          html: `<div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        })

        const newMarker = L.default.marker([latitude, longitude], { icon: customIcon }).addTo(mapInstance)
        if (startLocation) {
          newMarker.bindPopup(`<b>Start:</b> ${startLocation}`)
        }
        setMarker(newMarker)

        const newCircle = L.default.circle([latitude, longitude], {
          radius: radiusKm * 1000,
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.15,
          weight: 2,
        }).addTo(mapInstance)
        setCircle(newCircle)

        mapInstance.fitBounds(newCircle.getBounds(), { padding: [20, 20] })
      }
    }

    updateMap()
  }, [latitude, longitude, radiusKm, startLocation, mapInstance])

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      return
    }

    setIsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLoading(false)
        if (onLocationSelect) {
          onLocationSelect(position.coords.latitude, position.coords.longitude)
        }
        if (mapInstance) {
          mapInstance.setView([position.coords.latitude, position.coords.longitude], 13)
        }
      },
      (err) => {
        setIsLoading(false)
        setError('Could not get your location')
        console.error('Geolocation error:', err)
      }
    )
  }

  if (error) {
    return (
      <div className={cn('bg-slate-100 rounded-lg flex items-center justify-center', className)}>
        <div className="text-center p-4">
          <MapPin className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative rounded-lg overflow-hidden', className)}>
      <div ref={mapRef} className="w-full h-full min-h-[200px]" />

      {interactive && (
        <div className="absolute top-2 right-2 z-[1000]">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={getCurrentLocation}
            disabled={isLoading}
            className="shadow-md"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            <span className="ml-1.5">My Location</span>
          </Button>
        </div>
      )}

      {radiusKm && latitude && longitude && (
        <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 backdrop-blur-sm rounded-md px-2 py-1 text-xs font-medium shadow-sm">
          {radiusKm} km radius
        </div>
      )}
    </div>
  )
}

// Static map preview (no interactivity, for cards)
export function RideMapPreview({
  latitude,
  longitude,
  startLocation,
  className,
}: {
  latitude?: number | null
  longitude?: number | null
  startLocation?: string
  className?: string
}) {
  if (!latitude || !longitude) {
    return (
      <div className={cn('bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center', className)}>
        <div className="text-center p-4">
          <MapPin className="h-6 w-6 text-slate-400 mx-auto mb-1" />
          <p className="text-xs text-slate-500">{startLocation || 'No location'}</p>
        </div>
      </div>
    )
  }

  // Use static OpenStreetMap image
  const mapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=12&size=300x150&markers=${latitude},${longitude},red`

  return (
    <div className={cn('relative rounded-lg overflow-hidden bg-slate-100', className)}>
      <img
        src={mapUrl}
        alt={`Map showing ${startLocation || 'ride location'}`}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute bottom-1 left-1 bg-white/90 backdrop-blur-sm rounded px-1.5 py-0.5 text-xs">
        {startLocation}
      </div>
    </div>
  )
}
