'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Settings page error:', error)
  }, [error])

  return (
    <div className="container max-w-2xl mx-auto py-8 flex flex-col items-center">
      <div className="mb-6 self-start">
        <Button
          variant="ghost"
          asChild
          className="gap-2 pl-0 text-muted-foreground hover:text-foreground"
        >
          <Link href="/rides">
            <ArrowLeft className="h-4 w-4" />
            Back to Rides
          </Link>
        </Button>
      </div>
      
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 w-full text-center">
        <h2 className="text-xl font-semibold text-red-800 mb-4">
          Error Loading Settings
        </h2>
        <p className="text-red-700 mb-6">
          There was an error loading the settings page. This might be due to an outdated Node.js version (current: {process.version}).
          Next.js requires Node.js version 18.18.0 or newer.
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={reset} variant="outline">
            Try Again
          </Button>
          <Button asChild>
            <Link href="/rides">
              Return to Rides
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 