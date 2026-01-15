import { z } from 'zod'

export const timeOfDaySchema = z.enum(['Now', 'Morning', 'Afternoon', 'Evening'])
export const distanceSchema = z.enum(['50km', '80km', '100km'])
export const paceSchema = z.enum(['Chill', 'Speed', 'Race'])
export const bikeTypeSchema = z.enum(['Road', 'MTB'])

export const createRideSchema = z.object({
  timeOfDay: timeOfDaySchema,
  distance: distanceSchema,
  pace: paceSchema,
  bikeType: bikeTypeSchema,
  startLocation: z.string().min(1, 'Start location is required').max(200, 'Location too long'),
})

export type CreateRideInput = z.infer<typeof createRideSchema>
export type TimeOfDay = z.infer<typeof timeOfDaySchema>
export type Distance = z.infer<typeof distanceSchema>
export type Pace = z.infer<typeof paceSchema>
export type BikeType = z.infer<typeof bikeTypeSchema>
