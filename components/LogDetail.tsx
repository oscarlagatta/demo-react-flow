"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useEffect, useRef } from "react"
import { gsap } from "gsap"

const mockLogData = `05/01/2025 11:06:34 +0000, search_name=SWIFT_US_WTX_TREND_DATA_PULL_15MIN, search_now=1746096100.000, info_min_time=1746072700.000, info_max_time=1746096100.000, info_search_time=1746096197.387, message_type=103, transaction_reference=ACME20241201, message_action=Send

05/01/2025 11:06:35 +0000, search_name=SWIFT_US_WTX_TREND_DATA_PULL_15MIN, search_now=1746096100.000, info_min_time=1746072700.000, info_max_time=1746096100.000, info_search_time=1746096197.387, message_type=202, transaction_reference=ACME20241202, message_action=Receive

05/01/2025 11:06:36 +0000, search_name=SWIFT_US_WTX_TREND_DATA_PULL_15MIN, search_now=1746096100.000, info_min_time=1746072700.000, info_max_time=1746096100.000, info_search_time=1746096197.387, message_type=103, transaction_reference=ACME20241203, message_action=Send

05/01/2025 11:06:37 +0000, search_name=SWIFT_US_WTX_TREND_DATA_PULL_15MIN, search_now=1746096100.000, info_min_time=1746072700.000, info_max_time=1746096100.000, info_search_time=1746096197.387, message_type=202, transaction_reference=ACME20241204, message_action=Receive

05/01/2025 11:06:38 +0000, search_name=SWIFT_US_WTX_TREND_DATA_PULL_15MIN, search_now=1746096100.000, info_min_time=1746072700.000, info_max_time=1746096100.000, info_search_time=1746096197.387, message_type=103, transaction_reference=ACME20241205, message_action=Send`

interface LogDetailProps {
  navigate: (view: string) => void
  systemId: string
}

export default function LogDetail({ navigate, systemId }: LogDetailProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // GSAP entrance animation
    const tl = gsap.timeline()

    if (backdropRef.current && modalRef.current && contentRef.current) {
      // Set initial states
      gsap.set(backdropRef.current, { opacity: 0 })
      gsap.set(modalRef.current, {
        scale: 0.8,
        opacity: 0,
        y: 50,
        transformOrigin: "center center",
      })
      gsap.set(contentRef.current, {
        opacity: 0,
        y: 20,
      })

      // Animate in sequence
      tl.to(backdropRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
      })
        .to(
          modalRef.current,
          {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: "back.out(1.7)",
          },
          "-=0.1",
        )
        .to(
          contentRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease: "power2.out",
          },
          "-=0.2",
        )
    }

    return () => {
      tl.kill()
    }
  }, [])

  const handleClose = () => {
    // GSAP exit animation
    const tl = gsap.timeline({
      onComplete: () => navigate("flow"),
    })

    if (backdropRef.current && modalRef.current && contentRef.current) {
      tl.to(contentRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.2,
        ease: "power2.in",
      })
        .to(
          modalRef.current,
          {
            scale: 0.9,
            opacity: 0,
            y: 30,
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
  }

  const highlightText = (text: string) => {
    return text
      .replace(/SWIFT/g, '<span class="bg-yellow-200 text-yellow-800 px-1 rounded">SWIFT</span>')
      .replace(/search_name/g, '<span class="bg-blue-200 text-blue-800 px-1 rounded">search_name</span>')
      .replace(/message_type/g, '<span class="bg-green-200 text-green-800 px-1 rounded">message_type</span>')
      .replace(/ACME\d+/g, '<span class="bg-purple-200 text-purple-800 px-1 rounded">$&</span>')
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Animated Backdrop */}
      <div ref={backdropRef} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal Container */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={modalRef}
          className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-blue-900 text-white p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white hover:bg-blue-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              RETURN
            </Button>
            <h1 className="text-xl font-bold flex items-center">
              <div className="w-8 h-8 bg-green-400 rounded mr-3 flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
              Global Banking APS End-to-End Payment Monitor
            </h1>
            <div></div>
          </div>

          {/* Content */}
          <div ref={contentRef} className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            <div className="bg-white rounded-lg">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">System Log Details - {systemId?.toUpperCase()}</h2>

              <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96 mb-6">
                <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                  {mockLogData.split("\n").map((line, index) => (
                    <motion.div
                      key={index}
                      className="mb-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 + 0.5 }}
                      dangerouslySetInnerHTML={{ __html: highlightText(line) }}
                    />
                  ))}
                </pre>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Log Analysis Summary</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Total transactions processed: 5</li>
                  <li>• Message types: 103 (Send), 202 (Receive)</li>
                  <li>• Time range: 05/01/2025 11:06:34 - 11:06:38</li>
                  <li>• System: SWIFT US WTX Trend Data Pull</li>
                  <li>• Status: All transactions completed successfully</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
