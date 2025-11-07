"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

const images = [
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_7688.JPG-vf6ZE3fmtzOoSBreVKQlYQCJzxZwj6.jpeg",
    alt: "Community members farming",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/large-handinhand_tanzania_2023%20042-KWZAik0Z05JIO8DRF9nZIxkHozJVAH.jpg",
    alt: "Maasai woman in traditional attire",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/large-handinhand_tanzania_2023%20069-eklSgUjvf0hf3lJyH5MLblgnOi3lDG.jpg",
    alt: "Woman farmer with tool",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/large-handinhand_tanzania_2023%20131-JaJ3KtnNhNhZL7wwUvaYG32k7CmsvY.jpg",
    alt: "Woman in farm field",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/large-handinhand_tanzania_2023%20168-bzDE5Y9Zvb8iJvEs0tWIKod3zhJ18H.jpg",
    alt: "Woman with cow",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_6736-3WjTbeDVHBp76wlgJ8qoxY55SrUAdw.jpg",
    alt: "Young community member",
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
    <div className="relative h-full w-full overflow-hidden bg-teal-600">
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
            className="object-cover"
            priority={index === 0}
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-teal-900/60 via-teal-900/20 to-transparent" />
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

      {/* Overlay text */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="text-center px-8">
          <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">Empowering Communities</h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md">
            Building stronger communities through accessible financial services and sustainable development
          </p>
        </div>
      </div>
    </div>
  )
}
