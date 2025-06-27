"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { X, Download, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface DataTableModalProps {
  isOpen: boolean
  onClose: () => void
}

const mockData = [
  {
    id: "TXN001",
    timestamp: "2025-01-05 14:23:15",
    system: "Swift Gateway",
    amount: "$125,000.00",
    status: "Completed",
    type: "Wire Transfer",
    reference: "ACME20241201",
  },
  {
    id: "TXN002",
    timestamp: "2025-01-05 14:22:45",
    system: "CashPro Payments",
    amount: "$75,500.00",
    status: "Processing",
    type: "ACH Transfer",
    reference: "ACME20241202",
  },
  {
    id: "TXN003",
    timestamp: "2025-01-05 14:21:30",
    system: "GPO",
    amount: "$250,000.00",
    status: "Failed",
    type: "Wire Transfer",
    reference: "ACME20241203",
  },
  {
    id: "TXN004",
    timestamp: "2025-01-05 14:20:15",
    system: "Swift Alliance",
    amount: "$45,750.00",
    status: "Completed",
    type: "SWIFT MT103",
    reference: "ACME20241204",
  },
  {
    id: "TXN005",
    timestamp: "2025-01-05 14:19:00",
    system: "RPI",
    amount: "$180,000.00",
    status: "Pending",
    type: "Real-time Payment",
    reference: "ACME20241205",
  },
]

export default function DataTableModal({ isOpen, onClose }: DataTableModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const isAnimatingRef = useRef(false)

  useEffect(() => {
    if (isOpen && !isAnimatingRef.current) {
      openModal()
    } else if (!isOpen && isAnimatingRef.current) {
      closeModal()
    }
  }, [isOpen])

  const openModal = () => {
    if (!backdropRef.current || !modalRef.current || !headerRef.current || !contentRef.current) return

    isAnimatingRef.current = true
    const tl = gsap.timeline()

    // Set initial states
    gsap.set(backdropRef.current, { opacity: 0 })
    gsap.set(modalRef.current, {
      scale: 0.8,
      opacity: 0,
      y: 60,
      transformOrigin: "center center",
    })
    gsap.set(headerRef.current, {
      opacity: 0,
      y: -20,
    })
    gsap.set(contentRef.current, {
      opacity: 0,
      y: 30,
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
          duration: 0.5,
          ease: "back.out(1.7)",
        },
        "-=0.1",
      )
      .to(
        headerRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: "power2.out",
        },
        "-=0.3",
      )
      .to(
        contentRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "power2.out",
        },
        "-=0.2",
      )
  }

  const closeModal = () => {
    if (!backdropRef.current || !modalRef.current || !headerRef.current || !contentRef.current) return

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
        headerRef.current,
        {
          opacity: 0,
          y: -10,
          duration: 0.2,
          ease: "power2.in",
        },
        "-=0.1",
      )
      .to(
        modalRef.current,
        {
          scale: 0.9,
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
    if (!isAnimatingRef.current) {
      closeModal()
    }
  }

  const handleCloseClick = () => {
    if (!isAnimatingRef.current) {
      closeModal()
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      Completed: "bg-green-500 text-white",
      Processing: "bg-blue-500 text-white",
      Failed: "bg-red-500 text-white",
      Pending: "bg-yellow-500 text-white",
    }
    return <Badge className={colors[status as keyof typeof colors] || "bg-gray-500 text-white"}>{status}</Badge>
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
      <div ref={backdropRef} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleBackdropClick} />

      {/* Modal Container */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={modalRef}
          className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div ref={headerRef} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Payment Transaction Summary</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseClick}
                className="text-white hover:bg-blue-600 transition-colors h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/70"
                />
              </div>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Content */}
          <div ref={contentRef} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Transaction ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Timestamp</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">System</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {mockData.map((transaction, index) => (
                    <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-sm">{transaction.id}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{transaction.timestamp}</td>
                      <td className="py-3 px-4 text-sm font-medium">{transaction.system}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-green-600">{transaction.amount}</td>
                      <td className="py-3 px-4 text-sm">{transaction.type}</td>
                      <td className="py-3 px-4">{getStatusBadge(transaction.status)}</td>
                      <td className="py-3 px-4 font-mono text-sm text-gray-600">{transaction.reference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800">Total Transactions</h3>
                <p className="text-2xl font-bold text-blue-900">{mockData.length}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-800">Completed</h3>
                <p className="text-2xl font-bold text-green-900">
                  {mockData.filter((t) => t.status === "Completed").length}
                </p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-yellow-800">Processing</h3>
                <p className="text-2xl font-bold text-yellow-900">
                  {mockData.filter((t) => t.status === "Processing" || t.status === "Pending").length}
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-red-800">Failed</h3>
                <p className="text-2xl font-bold text-red-900">
                  {mockData.filter((t) => t.status === "Failed").length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
