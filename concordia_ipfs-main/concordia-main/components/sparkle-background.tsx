"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface SparkleProps {
  id: number
  style: React.CSSProperties
}

const Sparkle: React.FC<SparkleProps> = ({ id, style }) => {
  const colors = ["bg-concordia-pink", "bg-concordia-light-purple"]
  const randomColor = colors[Math.floor(Math.random() * colors.length)]

  return (
    <div
      key={id}
      className={cn(
        "absolute rounded-full",
        "animate-twinkle", // This applies the keyframe and infinite iteration
        randomColor,
      )}
      style={style} // This overrides animation-delay and animation-duration
    />
  )
}

export function SparkleBackground() {
  const [isClient, setIsClient] = useState(false)
  const numSparkles = 80 // Number of sparkles

  useEffect(() => {
    setIsClient(true)
  }, [])

  const generateSparkleStyle = () => {
    const top = Math.random() * 100 + "%"
    const left = Math.random() * 100 + "%"
    const size = Math.random() * 3 + 1 // Size between 1px and 4px
    const animationDelay = Math.random() * 5 + "s" // Delay up to 5 seconds
    const animationDuration = Math.random() * 3 + 2 + "s" // Duration between 2 and 5 seconds

    return {
      top,
      left,
      width: size + "px",
      height: size + "px",
      animationDelay,
      animationDuration,
    }
  }

  // Don't render sparkles on server side to prevent hydration mismatch
  if (!isClient) {
    return <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" />
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: numSparkles }).map((_, i) => (
        <Sparkle key={i} id={i} style={generateSparkleStyle()} />
      ))}
    </div>
  )
}
