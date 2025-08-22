'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { reportWebVitals } from '@/lib/monitoring/metrics'

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Report web vitals to our custom metrics system
    reportWebVitals(metric)
  })

  return null
}