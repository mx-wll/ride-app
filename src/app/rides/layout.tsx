import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rides | Group Ride App',
  description: 'Manage and participate in group rides',
}

export default function RidesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      {children}
    </div>
  )
} 