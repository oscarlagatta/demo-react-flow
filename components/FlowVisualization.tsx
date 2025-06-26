"use client"

import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { RefreshCw, Menu } from "lucide-react"

const FlowVisualizationClient = dynamic(() => import("./FlowVisualizationClient"), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading flow diagram...</p>
      </div>
    </div>
  ),
})

interface FlowVisualizationProps {
  navigate: (view: string, systemId?: string) => void
}

export default function FlowVisualization({ navigate }: FlowVisualizationProps) {
  return (
    <motion.div
      className="h-screen flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="bg-blue-900 text-white p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("welcome")}
            className="text-white hover:bg-blue-800"
          >
            <Menu className="w-4 h-4 mr-2" />
            Menu
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-white hover:bg-blue-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        <h1 className="text-xl font-bold flex items-center">
          <div className="w-8 h-8 bg-green-400 rounded mr-3 flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
          Global Banking APS End-to-End Payment Monitor
        </h1>
        <div></div>
      </div>

      {/* Column Headers */}
      <div className="bg-blue-800 text-white p-2 flex-shrink-0">
        <div className="grid grid-cols-4 gap-4 max-w-7xl mx-auto">
          <div className="text-center font-semibold bg-blue-700 py-2 rounded text-sm">Origination</div>
          <div className="text-center font-semibold bg-blue-700 py-2 rounded text-sm">
            Payment Validation and Routing
          </div>
          <div className="text-center font-semibold bg-blue-700 py-2 rounded text-sm">Middleware</div>
          <div className="text-center font-semibold bg-blue-700 py-2 rounded text-sm">
            Payment Processing, Sanctions & Investigation
          </div>
        </div>
      </div>

      {/* Flow Diagram - This will now take full remaining height */}
      <div className="flex-1 overflow-hidden">
        <FlowVisualizationClient navigate={navigate} />
      </div>
    </motion.div>
  )
}
