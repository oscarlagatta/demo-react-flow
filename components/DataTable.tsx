"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Filter, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import DataTableModal from "./DataTableModal"

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

interface DataTableProps {
  navigate: (view: string) => void
}

export default function DataTable({ navigate }: DataTableProps) {
  const [showDetailModal, setShowDetailModal] = useState(false)

  const getStatusBadge = (status: string) => {
    const colors = {
      Completed: "bg-green-500 text-white",
      Processing: "bg-blue-500 text-white",
      Failed: "bg-red-500 text-white",
      Pending: "bg-yellow-500 text-white",
    }
    return <Badge className={colors[status as keyof typeof colors] || "bg-gray-500 text-white"}>{status}</Badge>
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

      {/* Content */}
      <div className="p-6">
        <motion.div
          className="bg-white rounded-lg shadow-lg overflow-hidden"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Table Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Payment Transaction Summary</h2>
              <Button
                onClick={() => setShowDetailModal(true)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                View Details
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

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
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
                  <motion.tr
                    key={transaction.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <td className="py-3 px-4 font-mono text-sm">{transaction.id}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{transaction.timestamp}</td>
                    <td className="py-3 px-4 text-sm font-medium">{transaction.system}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-green-600">{transaction.amount}</td>
                    <td className="py-3 px-4 text-sm">{transaction.type}</td>
                    <td className="py-3 px-4">{getStatusBadge(transaction.status)}</td>
                    <td className="py-3 px-4 font-mono text-sm text-gray-600">{transaction.reference}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Stats */}
          <div className="p-6 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <motion.div
                className="bg-blue-50 rounded-lg p-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <h3 className="text-sm font-medium text-blue-800">Total Transactions</h3>
                <p className="text-2xl font-bold text-blue-900">{mockData.length}</p>
              </motion.div>
              <motion.div
                className="bg-green-50 rounded-lg p-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                <h3 className="text-sm font-medium text-green-800">Completed</h3>
                <p className="text-2xl font-bold text-green-900">
                  {mockData.filter((t) => t.status === "Completed").length}
                </p>
              </motion.div>
              <motion.div
                className="bg-yellow-50 rounded-lg p-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.7 }}
              >
                <h3 className="text-sm font-medium text-yellow-800">Processing</h3>
                <p className="text-2xl font-bold text-yellow-900">
                  {mockData.filter((t) => t.status === "Processing" || t.status === "Pending").length}
                </p>
              </motion.div>
              <motion.div
                className="bg-red-50 rounded-lg p-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.8 }}
              >
                <h3 className="text-sm font-medium text-red-800">Failed</h3>
                <p className="text-2xl font-bold text-red-900">
                  {mockData.filter((t) => t.status === "Failed").length}
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Modal */}
      <DataTableModal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} />
    </motion.div>
  )
}
