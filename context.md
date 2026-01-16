# Development Context - Ride App

## Current Session Summary (2026-01-16)

This file contains context for continuing development work on the ride-app.

## Completed Tasks

1. **Fixed profile picture size on ride card** - Avatars now properly sized (h-8 w-8) with `object-cover`

2. **Added team creation with good UX** (`src/components/group-selector.tsx`)
   - Inline "Create Team" card at end of team list
   - Expandable input field on click
   - Keyboard shortcuts (Enter to create, Escape to cancel)
   - Auto-selects newly created team
   - Fixed RLS policy to allow any authenticated user to create groups (was admin-only)

3. **Fixed rides not updating after creation** (`src/app/rides/page.tsx`)
   - Added optimistic UI updates - ride appears immediately
   - Added animation for newly created rides (slide-in + pulse highlight)
   - Updated `CreateRideForm` to return created ride data

4. **Fixed create ride selector colors** (`src/components/create-ride-form.tsx`)
   - Active selectors now show `bg-slate-900 text-white` instead of white-on-white

5. **Added map preview to ride cards** (`src/components/ride-card.tsx`)
   - Integrated `RideMapPreview` component
   - Updated Ride interface to include latitude, longitude, radius_km
   - Updated rides page fetch query to include location fields

## In Progress Tasks

### Add location selection to create-ride-form

**What's done:**
- Imported `RideMap` component and icons (`MapPin`, `Navigation`)
- Updated `CreatedRide` interface to include latitude, longitude, radius_km

**What's needed:**
1. Add state variables for location:
   ```tsx
   const [latitude, setLatitude] = useState<number | null>(null)
   const [longitude, setLongitude] = useState<number | null>(null)
   const [showMap, setShowMap] = useState(false)
   ```

2. Add map section to form (after start location input):
   ```tsx
   {/* Location Map */}
   <div className="space-y-2">
     <div className="flex items-center justify-between">
       <label className="text-sm font-medium flex items-center gap-2">
         <MapPin className="h-4 w-4" />
         Pin location on map (optional)
       </label>
       <Button
         type="button"
         variant="outline"
         size="sm"
         onClick={() => setShowMap(!showMap)}
       >
         {showMap ? 'Hide Map' : 'Show Map'}
       </Button>
     </div>
     {showMap && (
       <RideMap
         latitude={latitude}
         longitude={longitude}
         radiusKm={10}
         startLocation={startLocation}
         className="h-48"
         interactive
         onLocationSelect={(lat, lng) => {
           setLatitude(lat)
           setLongitude(lng)
         }}
       />
     )}
     {latitude && longitude && (
       <p className="text-xs text-muted-foreground">
         Location selected: {latitude.toFixed(4)}, {longitude.toFixed(4)}
       </p>
     )}
   </div>
   ```

3. Update the insert query to include location:
   ```tsx
   .insert({
     // ... existing fields
     latitude: latitude,
     longitude: longitude,
     radius_km: 10, // default radius
   })
   ```

## Database Schema Notes

### rides table includes:
- latitude (double precision, nullable)
- longitude (double precision, nullable)
- radius_km (integer, nullable, default 10)

### groups table RLS policies:
- SELECT: any authenticated user
- INSERT: any authenticated user (updated from admin-only)
- UPDATE: any authenticated user
- DELETE: admin only

## Key Files Modified This Session

1. `src/components/group-selector.tsx` - Team creation UI
2. `src/components/ride-card.tsx` - Map preview, avatar sizing
3. `src/components/create-ride-form.tsx` - Location selection (in progress)
4. `src/app/rides/page.tsx` - Optimistic updates, animation, location fields
5. `tailwind.config.ts` - Added ride-appear animation keyframes
6. `supabase/migrations/` - RLS policy for group creation

## Animation Added (tailwind.config.ts)

```ts
keyframes: {
  'ride-appear': {
    '0%': { opacity: '0', transform: 'translateY(-20px) scale(0.95)' },
    '50%': { transform: 'translateY(0) scale(1.02)' },
    '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
  },
  'pulse-highlight': {
    '0%, 100%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' },
    '50%': { boxShadow: '0 0 0 8px rgba(59, 130, 246, 0.3)' },
  },
},
animation: {
  'ride-appear': 'ride-appear 0.5s ease-out forwards, pulse-highlight 1s ease-in-out 0.5s',
}
```

## User Requests Not Yet Addressed

1. **Use shadcn components with context7 MCP** - User wants to ensure all UI uses shadcn and to use context7 for documentation

## Dev Server

Running on `http://localhost:3000` via `npm run dev`

## Next Steps

1. Complete location selection in create-ride-form
2. Test team creation flow
3. Test ride creation with map/animation
4. Verify all components use shadcn patterns
