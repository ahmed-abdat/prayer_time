'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from 'next/link'

export function AboutComponent() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" passHref>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">About Prayer Times App</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              The Prayer Times App is designed to help Muslims keep track of daily prayer times.
              Our app provides accurate prayer times based on your location and preferred calculation method.
            </p>
            <h3 className="text-lg font-semibold">Features:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Accurate prayer times for your location</li>
              <li>Multiple calculation methods</li>
              <li>Customizable notifications</li>
              <li>Qibla direction</li>
              <li>Islamic calendar</li>
            </ul>
            <h3 className="text-lg font-semibold">Version</h3>
            <p>1.0.0</p>
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <p>
              If you have any questions or feedback, please don't hesitate to reach out to us at{' '}
              <a href="mailto:support@prayertimesapp.com" className="text-green-600 hover:underline">
                support@prayertimesapp.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}