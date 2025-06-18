'use client'

import * as React from 'react'
import { Button } from './button'
import { CheckIcon, CopyIcon } from 'lucide-react'

interface ClipboardProps extends React.HTMLAttributes<HTMLDivElement> {
  content: string
  onCopy?: () => void
}

export function Clipboard({ content, onCopy, className, children, ...props }: ClipboardProps) {
  const [hasCopied, setHasCopied] = React.useState(false)

  const copyToClipboard = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setHasCopied(true)
      onCopy?.()
      
      setTimeout(() => {
        setHasCopied(false)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }, [content, onCopy])

  return (
    <div className={className} {...props}>
      {children}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={copyToClipboard}
        className="h-6 w-6 p-0"
      >
        {hasCopied ? (
          <CheckIcon className="h-3 w-3" />
        ) : (
          <CopyIcon className="h-3 w-3" />
        )}
        <span className="sr-only">Copy to clipboard</span>
      </Button>
    </div>
  )
}