"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

const images = [
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/img4-ffwQmgUNhoJ356u7KbptPy3V84CJwB.png",
    alt: "Seamless automations at a single glance",
    title: "Seamless Automations",
    description: "Automate your workflow seamlessly",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/img2-wyw2prVwVSTrEpRHs8UNt6RD88GV0G.png",
    alt: "Get data for your Branches, Instantly",
    title: "Get Data Instantly",
    description: "Access real-time branch data",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/img1-UEpJ7DnCtAEW6buJGp2uqyDOVap6Eo.png",
    alt: "Know how your branches and projects are performing",
    title: "Performance Insights",
    description: "Monitor branch and project performance",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/img3-VU7DB8IN8VyKLiLEoffxSKGkw2ef7i.png",
    alt: "Export data to get a complete overview",
    title: "Complete Overview",
    description: "Export comprehensive data reports",
  },
]

export default function ImageSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden bg-blue-600">
      {images.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <Image
            src={image.src || "/placeholder.svg"}
            alt={image.alt}
            fill
            className="object-contain"
            priority={index === 0}
            sizes="50vw"
          />
        </div>
      ))}

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2 z-20">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
