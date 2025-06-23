'use client'

import React from 'react'

export default function MinimalThemeProvider({
  children
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}