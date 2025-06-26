"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

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
  const highlightText = (text: string) => {
    return text
      .replace(/SWIFT/g, '<span class="bg-yellow-200 text-yellow-800 px-1 rounded">SWIFT</span>')
      .replace(/search_name/g, '<span class="bg-blue-200 text-blue-800 px-1 rounded">search_name</span>')
      .replace(/message_type/g, '<span class="bg-green-200 text-green-800 px-1 rounded">message_type</span>')
      .replace(/ACME\d+/g, '<span class="bg-purple-200 text-purple-800 px-1 rounded">$&</span>')
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="bg-blue-900 text-white p-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("flow")} className="text-white hover:bg-blue-800">
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

      {/* Log Content */}
      <div className="p-6">
        <motion.div
          className="bg-white rounded-lg shadow-lg p-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-4 text-gray-800">System Log Details - {systemId?.toUpperCase()}</h2>

          <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
            <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
              {mockLogData.split("\n").map((line, index) => (
                <motion.div
                  key={index}
                  className="mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  dangerouslySetInnerHTML={{ __html: highlightText(line) }}
                />
              ))}
            </pre>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Log Analysis Summary</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Total transactions processed: 5</li>
              <li>• Message types: 103 (Send), 202 (Receive)</li>
              <li>• Time range: 05/01/2025 11:06:34 - 11:06:38</li>
              <li>• System: SWIFT US WTX Trend Data Pull</li>
              <li>• Status: All transactions completed successfully</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
