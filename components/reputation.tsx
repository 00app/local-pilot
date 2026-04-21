"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Review } from "@/lib/types"

interface ReputationProps {
  reviews: Review[]
}

export function Reputation({ reviews }: ReputationProps) {
  return (
    <Card className="bg-card border-border rounded-[12px]">
      <CardHeader className="p-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-chart-4" />
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
            Reputation
          </CardTitle>
        </div>
        <p className="text-lg font-semibold text-foreground">Latest Reviews</p>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-lg bg-background border border-border overflow-hidden">
            {/* Review Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-background font-semibold">
                    {review.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{review.author}</p>
                    <p className="text-xs text-muted-foreground">{review.timestamp}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-0">
                  Google
                </Badge>
              </div>
              
              {/* Star Rating */}
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${i < review.rating ? "text-amber-400" : "text-muted"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              
              <p className="text-sm text-foreground leading-relaxed">{review.text}</p>
            </div>
            
            {/* AI Response */}
            <div className="p-4 bg-secondary/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-muted-foreground">AI-Generated Response</span>
                <Badge variant="outline" className="ml-auto text-xs border-border text-muted-foreground">
                  Ready to send
                </Badge>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed italic">{review.aiResponse}</p>
            </div>
            
            {/* Actions */}
            <div className="p-3 border-t border-border flex items-center gap-2">
              <button className="flex-1 py-2 px-3 text-xs font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors">
                Edit Response
              </button>
              <button className="flex-1 py-2 px-3 text-xs font-medium text-background bg-foreground hover:bg-foreground/90 rounded-lg transition-colors">
                Post Reply
              </button>
            </div>
          </div>
        ))}
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-4 rounded-lg bg-secondary">
            <p className="text-2xl font-bold text-foreground font-mono">4.8</p>
            <p className="text-xs text-muted-foreground">Avg Rating</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-secondary">
            <p className="text-2xl font-bold text-foreground font-mono">127</p>
            <p className="text-xs text-muted-foreground">Total Reviews</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-secondary">
            <p className="text-2xl font-bold text-success font-mono">+12</p>
            <p className="text-xs text-muted-foreground">This Month</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
