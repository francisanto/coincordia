"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, Save } from "lucide-react"
import type { SavingsGroup } from "./group-dashboard"
import { Input } from "@/components/ui/input"

interface FinalDateManagerProps {
  isOpen: boolean
  onClose: () => void
  group: SavingsGroup | null
  onUpdate: (groupId: string, newFinalDate: string) => void
}

export function FinalDateManager({ isOpen, onClose, group, onUpdate }: FinalDateManagerProps) {
  const [selectedDate, setSelectedDate] = useState<string>("")

  // Calculate minimum date (today)
  const today = new Date().toISOString().split("T")[0]
  
  // Calculate maximum date based on group duration
  const getMaxDate = () => {
    if (!group?.duration) return ""
    
    const durationMonths = 
      group.duration === "1-month" ? 1 : 
      group.duration === "3-months" ? 3 : 
      group.duration === "6-months" ? 6 : 
      group.duration === "12-months" ? 12 : 0
    
    const maxDate = new Date()
    maxDate.setMonth(maxDate.getMonth() + durationMonths)
    return maxDate.toISOString().split("T")[0]
  }

  const handleSave = () => {
    if (group && selectedDate) {
      onUpdate(group.id, selectedDate)
      onClose()
    }
  }

  if (!group) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-concordia-dark-blue border-concordia-light-purple/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-concordia-pink text-xl font-semibold">Set Final Withdrawal Date</DialogTitle>
          <DialogDescription className="text-white/70">
            Choose when funds will be available for withdrawal in "{group.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Settings */}
          <Card className="bg-concordia-purple/20 border-concordia-light-purple/30">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="h-4 w-4 text-concordia-pink" />
                <span className="text-white font-semibold text-sm">Current Settings</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/70">Duration:</span>
                  <div className="text-white font-semibold">{group.duration?.replace("-", " ")}</div>
                </div>
                <div>
                  <span className="text-white/70">End Date:</span>
                  <div className="text-white font-semibold">{group.endDate || "Not set"}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Final Date Selection */}
          <div className="space-y-3">
            <Label htmlFor="finalDate" className="text-white font-semibold">Final Withdrawal Date</Label>
            <Input
              id="finalDate"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={today}
              max={getMaxDate()}
              className="bg-concordia-dark-blue/50 border-concordia-light-purple/50 text-white focus:border-concordia-pink focus:ring-concordia-pink/20"
            />
            <p className="text-sm text-white/60">
              Select a date when funds will be available for withdrawal. This must be within your selected savings duration.
            </p>
          </div>

          {/* Preview */}
          {selectedDate && (
            <Card className="bg-concordia-light-purple/10 border-concordia-light-purple/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-concordia-pink" />
                  <span className="text-white font-semibold text-sm">Preview</span>
                </div>
                <div className="text-sm text-white/80">
                  Funds will be available for withdrawal on{" "}
                  <span className="text-concordia-pink font-semibold">
                    {new Date(selectedDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-concordia-light-purple/50 text-concordia-light-purple hover:bg-concordia-light-purple/10 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedDate}
              className="flex-1 bg-gradient-to-r from-concordia-pink to-concordia-light-purple hover:from-concordia-pink/80 hover:to-concordia-light-purple/80 text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              Set Final Date
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}