"use client"

import type { OvenStatus } from "@/lib/types"

interface StatusHeaderProps {
  ovenStatus: OvenStatus
  postcode: string
}

export function StatusHeader({ ovenStatus, postcode }: StatusHeaderProps) {
  const getNeighbourhoodStatus = () => {
    // Mock logic based on postcode
    if (postcode.startsWith("BN1")) {
      return { status: "HOT", searchVolume: "High" }
    }
    return { status: "WARM", searchVolume: "Medium" }
  }

  const neighbourhood = getNeighbourhoodStatus()

  const getOvenTemp = () => {
    switch (ovenStatus) {
      case "HOT": return "180"
      case "LOW": return "120"
      case "OUT": return "OFF"
    }
  }

  return (
    <div className="bg-card border-2 border-border rounded-[30px] p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pilot Status */}
        <div className="flex items-center gap-4">
          <div className="w-4 h-4 rounded-full bg-success animate-pulse glow-success" />
          <div>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Status</p>
            <p className="text-2xl font-bold text-success">PILOT: ACTIVE</p>
          </div>
        </div>

        {/* Neighbourhood Status */}
        <div className="flex items-center gap-4 justify-center">
          <div className={`w-4 h-4 rounded-full ${neighbourhood.status === "HOT" ? "bg-destructive animate-pulse" : "bg-chart-4"}`} />
          <div className="text-center">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Neighbourhood</p>
            <p className={`text-2xl font-bold ${neighbourhood.status === "HOT" ? "text-destructive" : "text-chart-4"}`}>
              {postcode}: {neighbourhood.status}
            </p>
          </div>
        </div>

        {/* Oven Status */}
        <div className="flex items-center gap-4 justify-end">
          <div>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider text-right">Oven</p>
            <p className={`text-2xl font-bold text-right font-mono ${
              ovenStatus === "HOT" ? "text-success" : 
              ovenStatus === "LOW" ? "text-chart-4" : "text-muted-foreground"
            }`}>
              {getOvenTemp()}{ovenStatus !== "OUT" && "°C"}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            ovenStatus === "HOT" ? "bg-success/20 text-success" :
            ovenStatus === "LOW" ? "bg-chart-4/20 text-chart-4" : "bg-muted text-muted-foreground"
          }`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
