"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

const images = [
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image4-mRsnjpVqqqO4KPW7YkndDFdvD4ERWX.png",
    alt: "Seamless automations at a single glance",
    title: "Seamless Automations",
    description: "Automate your workflow seamlessly",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image2-6EJtICfAA04xD8OyQ4OHECFCpqyCga.png",
    alt: "Get data for your Branches, Instantly",
    title: "Get Data Instantly",
    description: "Access real-time branch data",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image1-mIxE36HW1ADfcGqS0lqz9p7QRoY4TE.png",
    alt: "Know how your branches and projects are performing",
    title: "Performance Insights",
    description: "Monitor branch and project performance",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image3-h3v4v9vhbf5IXp7jxUJcazYvZG8GwI.png",
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
    <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: '#0050ED' }}>
      {images.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <div className="relative w-full h-full flex items-center justify-center px-4 py-8">
            <Image
              src={image.src || "/placeholder.svg"}
              alt={image.alt}
              fill
              className="object-contain p-4"
              priority={index === 0}
              sizes="50vw"
            />
          </div>
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
