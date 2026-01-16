// Push notification utilities

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface RideNotificationPayload {
  title: string
  body: string
  url: string
  rideId: string
  icon?: string
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications')
    return 'denied'
  }

  return await Notification.requestPermission()
}

// Check if notifications are supported and enabled
export function canSendNotifications(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted'
  )
}

// Show a local notification (for when user is in the app)
export function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!canSendNotifications()) return null

  return new Notification(title, {
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    ...options,
  })
}

// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

// Check if a ride is within notification radius of a user
export function isRideNearUser(
  rideLatitude: number | null,
  rideLongitude: number | null,
  userLatitude: number,
  userLongitude: number,
  radiusKm: number
): boolean {
  if (!rideLatitude || !rideLongitude) return false

  const distance = calculateDistance(
    userLatitude,
    userLongitude,
    rideLatitude,
    rideLongitude
  )

  return distance <= radiusKm
}

// Format notification message for a new ride
export function formatRideNotification(ride: {
  title: string
  start_location?: string | null
  distance: number
  bike_type?: string | null
  pace?: string | null
  id: string
}): RideNotificationPayload {
  const details = [
    ride.start_location,
    `${ride.distance}km`,
    ride.pace,
    ride.bike_type,
  ]
    .filter(Boolean)
    .join(' • ')

  return {
    title: 'New Ride Near You!',
    body: `${ride.title}\n${details}`,
    url: `/rides/${ride.id}`,
    rideId: ride.id,
  }
}
