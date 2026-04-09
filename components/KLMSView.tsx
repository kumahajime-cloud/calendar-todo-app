'use client'

import { KLMSSettings } from './KLMSSettings'

interface KLMSViewProps {
  userId: string
}

export default function KLMSView({ userId }: KLMSViewProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <KLMSSettings />
    </div>
  )
}
