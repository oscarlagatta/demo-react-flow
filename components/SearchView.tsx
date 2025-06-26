"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Menu } from "lucide-react"
import { useAppContext } from "../context/AppContext"

const FlowVisualization = dynamic(() => import("./FlowVisualization"), {
  ssr: false,
  loading: () => <div className="flex-1 flex items-center justify-center">Loading...</div>,
})

interface SearchViewProps {
  navigate: (view: string, systemId?: string) => void
}

export default function SearchView({ navigate }: SearchViewProps) {
  const { setSearchResult } = useAppContext()
  const [paymentId, setPaymentId] = useState("262540610024186")
  const [isSearched, setIsSearched] = useState(false)

  const handleSearch = () => {
    const mockResult = {
      paymentId,
      path: ["cpo-gateway", "psh", "mrp", "wtx", "swift-gateway"],
      systems: [],
    }

    setSearchResult(mockResult)
    setIsSearched(true)
  }

  return (
    <motion.div
      className="h-screen flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="bg-blue-900 text-white p-4 flex items-center justify-between">
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
        </div>
        <h1 className="text-xl font-bold flex items-center">
          <div className="w-8 h-8 bg-green-400 rounded mr-3 flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
          Global Banking APS End-to-End Payment Monitor
        </h1>
        <div></div>
      </div>

      <div className="flex-1 flex">
        {/* Left Panel - Search */}
        <motion.div
          className="w-1/3 bg-slate-800 p-6 text-white"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Payment Search</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Payment ID</label>
                <Input
                  value={paymentId}
                  onChange={(e) => setPaymentId(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Enter Payment ID"
                />
              </div>
              <Button onClick={handleSearch} className="w-full bg-blue-600 hover:bg-blue-700">
                <Search className="w-4 h-4 mr-2" />
                SEARCH
              </Button>
            </div>
          </div>

          {isSearched && (
            <motion.div
              className="bg-blue-700 p-4 rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="font-bold mb-2">Search Results are now available.</h3>
              <p className="text-sm mb-4">
                Press the Summary and Detail buttons on associated AITs for more information.
              </p>
              <div className="bg-slate-800 p-3 rounded">
                <p className="text-sm font-mono">
                  Search Dashboard shows the flow. Summary (future) and Details Buttons are available for Drill Down
                  context.
                </p>
                <p className="text-sm font-mono mt-2">CPO → PSH → MRP → WTX → SWIFT</p>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Right Panel - Flow Visualization */}
        <div className="flex-1">
          <FlowVisualization navigate={navigate} />
        </div>
      </div>
    </motion.div>
  )
}
