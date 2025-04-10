import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  const now = new Date()
  const rideDate = new Date(date)
  
  // If it's today
  if (rideDate.toDateString() === now.toDateString()) {
    return 'Today'
  }

  // For other dates, return the date
  return rideDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })
}

export function getTimePeriod(time: string): string {
  const hours = new Date(time).getHours()
  
  if (hours === new Date().getHours()) {
    return 'Now'
  } else if (hours === 9) {
    return 'Morning'
  } else if (hours === 14) {
    return 'Afternoon'
  } else if (hours === 18) {
    return 'Evening'
  } else {
    // For any other hour, return the closest time period
    if (hours >= 5 && hours < 12) {
      return 'Morning'
    } else if (hours >= 12 && hours < 16) {
      return 'Afternoon'
    } else {
      return 'Evening'
    }
  }
}
