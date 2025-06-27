"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { gsap } from "gsap"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GSAPModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  size?: "sm" | "md" | "lg" | "xl" | "full"
  showCloseButton?: boolean
  closeOnBackdropClick?: boolean
  className?: string
}

export default function GSAPModal({
  isOpen,
  onClose,
  children,
  title,
  size = "md",
  showCloseButton = true,
  closeOnBackdropClick = true,
  className = "",
}: GSAPModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const isAnimatingRef = useRef(false)

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-7xl",
  }

  useEffect(() => {
    if (isOpen && !isAnimatingRef.current) {
      openModal()
    } else if (!isOpen && isAnimatingRef.current) {
      closeModal()
    }
  }, [isOpen])

  const openModal = () => {
    if (!backdropRef.current || !modalRef.current || !contentRef.current) return

    isAnimatingRef.current = true
    const tl = gsap.timeline({
      onComplete: () => {
        // Animation complete, but keep isAnimatingRef true while modal is open
      },
    })

    // Set initial states
    gsap.set(backdropRef.current, { opacity: 0 })
    gsap.set(modalRef.current, {
      scale: 0.7,
      opacity: 0,
      y: 60,
      transformOrigin: "center center",
    })
    gsap.set(contentRef.current, {
      opacity: 0,
      y: 30,
    })

    // Animate in sequence
    tl.to(backdropRef.current, {
      opacity: 1,
      duration: 0.25,
      ease: "power2.out",
    })
      .to(
        modalRef.current,
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "back.out(1.7)",
        },
        "-=0.1",
      )
      .to(
        contentRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "power2.out",
        },
        "-=0.3",
      )
  }

  const closeModal = () => {
    if (!backdropRef.current || !modalRef.current || !contentRef.current) return

    const tl = gsap.timeline({
      onComplete: () => {
        isAnimatingRef.current = false
        onClose()
      },
    })

    // Animate out in reverse sequence
    tl.to(contentRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.2,
      ease: "power2.in",
    })
      .to(
        modalRef.current,
        {
          scale: 0.8,
          opacity: 0,
          y: 40,
          duration: 0.3,
          ease: "power2.in",
        },
        "-=0.1",
      )
      .to(
        backdropRef.current,
        {
          opacity: 0,
          duration: 0.2,
          ease: "power2.in",
        },
        "-=0.2",
      )
  }

  const handleBackdropClick = () => {
    if (closeOnBackdropClick && !isAnimatingRef.current) {
      closeModal()
    }
  }

  const handleCloseClick = () => {
    if (!isAnimatingRef.current) {
      closeModal()
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isAnimatingRef.current) {
        closeModal()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen && !isAnimatingRef.current) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Animated Backdrop */}
      <div ref={backdropRef} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleBackdropClick} />

      {/* Modal Container */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={modalRef}
          className={`relative w-full ${sizeClasses[size]} max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseClick}
                  className="h-8 w-8 p-0 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span className="sr-only">Close</span>
                </Button>
              )}
            </div>
          )}

          {/* Content */}
          <div ref={contentRef} className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
