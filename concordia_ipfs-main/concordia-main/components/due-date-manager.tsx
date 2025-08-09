"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, Save } from "lucide-react"
import type { SavingsGroup } from "./group-dashboard"

interface DueDateManagerProps {
  isOpen: boolean
  onClose: () => void
  group: SavingsGroup | null
  onUpdate: (groupId: string, newDueDay: number) => void
}

export function DueDateManager({ isOpen, onClose, group, onUpdate }: DueDateManagerProps) {
  const [selectedDay, setSelectedDay] = useState<string>("")

  const handleSave = () => {
    if (group && selectedDay) {
      onUpdate(group.id, Number.parseInt(selectedDay))
      onClose()
    }
  }

  if (!group) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-concordia-dark-blue border-concordia-light-purple/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-concordia-pink text-xl font-semibold">Manage Due Dates</DialogTitle>
          <DialogDescription className="text-white/70">
            Update contribution due dates for "{group.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Settings */}
          <Card className="bg-concordia-purple/20 border-concordia-light-purple/30">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="h-4 w-4 text-concordia-pink" />
                <span className="text-white font-semibold text-sm">Current Schedule</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/70">Next Due:</span>
                  <div className="text-white font-semibold">{group.nextContribution}</div>
                </div>
                <div>
                  <span className="text-white/70">Amount:</span>
                  <div className="text-white font-semibold">{group.contributionAmount} BNB</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Due Day Selection */}
          <div className="space-y-3">
            <Label className="text-white font-semibold">Monthly Due Day</Label>
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger className="bg-concordia-dark-blue/50 border-concordia-light-purple/50 text-white focus:border-concordia-pink focus:ring-concordia-pink/20">
                <SelectValue placeholder="Select day of month" />
              </SelectTrigger>
              <SelectContent className="bg-concordia-purple border-concordia-light-purple/50">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <SelectItem
                    key={day}
                    value={day.toString()}
                    className="text-white hover:bg-concordia-light-purple/20"
                  >
                    {day}
                    {day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"} of each month
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-white/60">
              Choose which day of each month contributions are due (1-31; months with fewer days will use the last valid day)
            </p>
          </div>

          {/* Preview */}
          {selectedDay && (
            <Card className="bg-concordia-light-purple/10 border-concordia-light-purple/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-concordia-pink" />
                  <span className="text-white font-semibold text-sm">Preview</span>
                </div>
                <div className="text-sm text-white/80">
                  Next contribution will be due on the{" "}
                  <span className="text-concordia-pink font-semibold">
                    {selectedDay}
                    {selectedDay === "1" ? "st" : selectedDay === "2" ? "nd" : selectedDay === "3" ? "rd" : "th"}
                  </span>{" "}
                  of next month
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
              disabled={!selectedDay}
              className="flex-1 bg-gradient-to-r from-concordia-pink to-concordia-light-purple hover:from-concordia-pink/80 hover:to-concordia-light-purple/80 text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              Update Due Date
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
