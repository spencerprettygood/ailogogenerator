'use client'

import React from 'react';
import { TypographyShowcase } from '@/components/ui/typography-showcase';
import { Header } from '@/components/logo-generator/header';

export default function TypographyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <TypographyShowcase />
    </div>
  );
}