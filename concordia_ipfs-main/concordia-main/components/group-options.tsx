
"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Target, ArrowRight, Sparkles } from "lucide-react"

interface GroupOptionsProps {
  onCreateGroup: () => void
  onJoinGroup: () => void
}

export function GroupOptions({ onCreateGroup, onJoinGroup }: GroupOptionsProps) {
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-4">
          Choose Your <span className="text-concordia-pink">Savings Journey</span>
        </h2>
        <p className="text-white/80 text-lg max-w-2xl mx-auto">
          Start a new savings group with friends or join an existing one to achieve your goals together
        </p>
      </div>

      {/* Options Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Create Group Card */}
        <Card className="bg-gradient-to-br from-concordia-pink/20 to-concordia-light-purple/20 border-concordia-pink/30 hover:border-concordia-pink/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-4 bg-gradient-to-r from-concordia-pink/30 to-concordia-light-purple/30 rounded-full w-fit">
              <Plus className="h-12 w-12 text-concordia-pink" />
            </div>
            <CardTitle className="text-white text-2xl font-bold">Create New Group</CardTitle>
            <CardDescription className="text-white/70 text-base">
              Start your own savings group and invite friends to join
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-concordia-pink rounded-full"></div>
                <span className="text-white/80 text-sm">Set your own savings goal</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-concordia-pink rounded-full"></div>
                <span className="text-white/80 text-sm">Invite 2-10 friends</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-concordia-pink rounded-full"></div>
                <span className="text-white/80 text-sm">Control group settings</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-concordia-pink rounded-full"></div>
                <span className="text-white/80 text-sm">Manage withdrawals</span>
              </div>
            </div>

            {/* Badge */}
            <div className="flex justify-center">
              <Badge className="bg-concordia-pink/20 text-concordia-pink border-concordia-pink/30">
                <Target className="h-3 w-3 mr-1" />
                Group Creator
              </Badge>
            </div>

            {/* Button */}
            <Button
              onClick={onCreateGroup}
              className="w-full bg-gradient-to-r from-concordia-pink to-concordia-light-purple hover:from-concordia-pink/80 hover:to-concordia-light-purple/80 text-white py-6 text-lg font-semibold"
            >
              Create New Group
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>

        {/* Join Group Card */}
        <Card className="bg-gradient-to-br from-concordia-light-purple/20 to-concordia-purple/20 border-concordia-light-purple/30 hover:border-concordia-light-purple/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-4 bg-gradient-to-r from-concordia-light-purple/30 to-concordia-purple/30 rounded-full w-fit">
              <Users className="h-12 w-12 text-concordia-light-purple" />
            </div>
            <CardTitle className="text-white text-2xl font-bold">Join Existing Group</CardTitle>
            <CardDescription className="text-white/70 text-base">
              Join a friend's savings group with an invite code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-concordia-light-purple rounded-full"></div>
                <span className="text-white/80 text-sm">Get invite code from friend</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-concordia-light-purple rounded-full"></div>
                <span className="text-white/80 text-sm">Join instantly</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-concordia-light-purple rounded-full"></div>
                <span className="text-white/80 text-sm">Start contributing</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-concordia-light-purple rounded-full"></div>
                <span className="text-white/80 text-sm">Earn Aura points</span>
              </div>
            </div>

            {/* Badge */}
            <div className="flex justify-center">
              <Badge className="bg-concordia-light-purple/20 text-concordia-light-purple border-concordia-light-purple/30">
                <Sparkles className="h-3 w-3 mr-1" />
                Group Member
              </Badge>
            </div>

            {/* Button */}
            <Button
              onClick={onJoinGroup}
              variant="outline"
              className="w-full border-concordia-light-purple text-concordia-light-purple hover:bg-concordia-light-purple/10 py-6 text-lg font-semibold bg-transparent"
            >
              Join Existing Group
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <div className="max-w-2xl mx-auto">
        <Card className="bg-concordia-purple/20 border-concordia-light-purple/30 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Target className="h-5 w-5 text-concordia-pink" />
              <span className="text-white font-semibold">How It Works</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Whether you create or join a group, all funds are secured in smart contracts on the blockchain. 
              Members contribute regularly and can only withdraw when the group reaches consensus. 
              Earn Aura Points for consistent contributions and early payments!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
