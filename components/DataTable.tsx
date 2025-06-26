"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight } from "lucide-react"

const mockData = [
  {
    aitNumber: "1901",
    aitName: "Wire Transfer System",
    flowDirection: "INBOUND FROM",
    flowAitNumber: "AllSources",
    flowAitName: "Complete",
    isTrafficFlowing: "Yes",
    isTrafficOnTrend: "Yes",
    currentStdDev: "24.64",
    historicMean: "2145",
    historicStdDev: "1398",
    currentTxCount: "36295",
    avgTxCount: "36253",
    avgDelta: "On-Trend (2.50%)",
    balanced: "Yes",
    analyticsContext: "",
  },
  {
    aitNumber: "1901",
    aitName: "Wire Transfer System",
    flowDirection: "OUTBOUND TO",
    flowAitNumber: "AllSources",
    flowAitName: "Complete",
    isTrafficFlowing: "Yes",
    isTrafficOnTrend: "Yes",
    currentStdDev: "-1.12",
    historicMean: "2145",
    historicStdDev: "1398",
    currentTxCount: "575",
    avgTxCount: "4242",
    avgDelta: "Off-Trend (-86.45%)",
    balanced: "No",
    analyticsContext: "",
  },
  {
    aitNumber: "1901",
    aitName: "Wire Transfer System",
    flowDirection: "INBOUND FROM",
    flowAitNumber: "AllSources",
    flowAitName: "Incomplete",
    isTrafficFlowing: "Yes",
    isTrafficOnTrend: "Yes",
    currentStdDev: "-1.25",
    historicMean: "2145",
    historicStdDev: "1398",
    currentTxCount: "399",
    avgTxCount: "677",
    avgDelta: "Off-Trend (-41.18%)",
    balanced: "No",
    analyticsContext: "",
  },
  {
    aitNumber: "1901",
    aitName: "Wire Transfer System",
    flowDirection: "OUTBOUND TO",
    flowAitNumber: "AllSources",
    flowAitName: "Incomplete",
    isTrafficFlowing: "Yes",
    isTrafficOnTrend: "Yes",
    currentStdDev: "-1.53",
    historicMean: "2145",
    historicStdDev: "1398",
    currentTxCount: "2",
    avgTxCount: "109",
    avgDelta: "Off-Trend (-98.16%)",
    balanced: "No",
    analyticsContext: "",
  },
  {
    aitNumber: "1901",
    aitName: "Wire Transfer System",
    flowDirection: "INBOUND FROM",
    flowAitNumber: "46951",
    flowAitName: "ETS",
    isTrafficFlowing: "Yes",
    isTrafficOnTrend: "Yes",
    currentStdDev: "2.42",
    historicMean: "157178",
    historicStdDev: "101185",
    currentTxCount: "402268",
    avgTxCount: "406580",
    avgDelta: "On-Trend (-1.06%)",
    balanced: "Yes",
    analyticsContext: "",
  },
  {
    aitNumber: "1901",
    aitName: "Wire Transfer System",
    flowDirection: "INBOUND FROM",
    flowAitNumber: "73929",
    flowAitName: "GFD",
    isTrafficFlowing: "Yes",
    isTrafficOnTrend: "Yes",
    currentStdDev: "3.07",
    historicMean: "23074",
    historicStdDev: "16446",
    currentTxCount: "83478",
    avgTxCount: "72837",
    avgDelta: "On-Trend (14.61%)",
    balanced: "Yes",
    analyticsContext: "",
  },
  {
    aitNumber: "1901",
    aitName: "Wire Transfer System",
    flowDirection: "INBOUND FROM",
    flowAitNumber: "62686",
    flowAitName: "GTMS",
    isTrafficFlowing: "Yes",
    isTrafficOnTrend: "Yes",
    currentStdDev: "1.83",
    historicMean: "22928",
    historicStdDev: "10688",
    currentTxCount: "42531",
    avgTxCount: "45967",
    avgDelta: "On-Trend (-7.48%)",
    balanced: "Yes",
    analyticsContext: "",
  },
  {
    aitNumber: "1901",
    aitName: "Wire Transfer System",
    flowDirection: "OUTBOUND TO",
    flowAitNumber: "46951",
    flowAitName: "ETS",
    isTrafficFlowing: "Yes",
    isTrafficOnTrend: "Yes",
    currentStdDev: "2.36",
    historicMean: "152599",
    historicStdDev: "97837",
    currentTxCount: "383966",
    avgTxCount: "392862",
    avgDelta: "On-Trend (-2.27%)",
    balanced: "Yes",
    analyticsContext: "",
  },
]

const StatusBadge = ({ value }: { value: string }) => {
  if (value === "Yes") {
    return <Badge className="bg-green-500 text-white">Yes</Badge>
  }
  return <Badge className="bg-red-500 text-white">{value}</Badge>
}

interface DataTableProps {
  navigate: (view: string) => void
}

export default function DataTable({ navigate }: DataTableProps) {
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
        <Button variant="ghost" size="sm" className="text-white hover:bg-blue-800">
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">AIT Number</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">AIT Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Flow Direction</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Flow AIT Number</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Flow AIT Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Is Traffic Flowing</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Is Traffic On Trend</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Current Standard Deviation</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Historic Mean</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Historic Standard Deviation</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Current Transaction Count</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Average Transaction Count</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Average Delta</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Balanced</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Analytics Context</th>
                </tr>
              </thead>
              <tbody>
                {mockData.map((row, index) => (
                  <motion.tr
                    key={index}
                    className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-blue-50 transition-colors`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <td className="px-4 py-3 text-sm">{row.aitNumber}</td>
                    <td className="px-4 py-3 text-sm">{row.aitName}</td>
                    <td className="px-4 py-3 text-sm">{row.flowDirection}</td>
                    <td className="px-4 py-3 text-sm">{row.flowAitNumber}</td>
                    <td className="px-4 py-3 text-sm">{row.flowAitName}</td>
                    <td className="px-4 py-3 text-sm">
                      <StatusBadge value={row.isTrafficFlowing} />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <StatusBadge value={row.isTrafficOnTrend} />
                    </td>
                    <td className="px-4 py-3 text-sm">{row.currentStdDev}</td>
                    <td className="px-4 py-3 text-sm">{row.historicMean}</td>
                    <td className="px-4 py-3 text-sm">{row.historicStdDev}</td>
                    <td className="px-4 py-3 text-sm">{row.currentTxCount}</td>
                    <td className="px-4 py-3 text-sm">{row.avgTxCount}</td>
                    <td className="px-4 py-3 text-sm">{row.avgDelta}</td>
                    <td className="px-4 py-3 text-sm">
                      <StatusBadge value={row.balanced} />
                    </td>
                    <td className="px-4 py-3 text-sm">{row.analyticsContext}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
