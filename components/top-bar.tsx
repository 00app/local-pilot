"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ThemeToggle } from "@/components/theme-toggle"

interface TopBarProps {
  onSubmit: (url: string, postcode: string) => void
  isLoading: boolean
}

export function TopBar({ onSubmit, isLoading }: TopBarProps) {
  const [url, setUrl] = useState("")
  const [postcode, setPostcode] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url && postcode) {
      onSubmit(url, postcode)
    }
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-8 py-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[16px] bg-accent flex items-center justify-center">
              <span className="text-accent-foreground font-bold text-2xl font-mono">BL</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">BrightLocal</h1>
              <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">AI Local Pilot</p>
            </div>
          </div>
          
          {/* Form with pill inputs - BIG per Pilot spec */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col sm:flex-row gap-4 w-full lg:w-auto lg:ml-8">
            <div className="flex-1 min-w-0">
              <Input
                type="text"
                placeholder="Enter business URL (e.g. flourpot.co.uk)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-14 rounded-full px-6 text-lg bg-secondary border-2 border-border text-foreground placeholder:text-muted-foreground focus:border-accent"
              />
            </div>
            <div className="w-full sm:w-48">
              <Input
                type="text"
                placeholder="Postcode"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                className="h-14 rounded-full px-6 text-lg bg-secondary border-2 border-border text-foreground placeholder:text-muted-foreground focus:border-accent font-mono uppercase"
              />
            </div>
            <Button 
              type="submit" 
              disabled={!url || !postcode || isLoading}
              className="h-14 px-8 rounded-[16px] bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg uppercase tracking-wide"
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-3 h-5 w-5" />
                  Scanning...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Gather Intel
                </>
              )}
            </Button>
          </form>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
