"use client"
import { useState } from "react"
import { AnimatePresence } from "framer-motion"
import WelcomeScreen from "./components/WelcomeScreen"
import FlowVisualization from "./components/FlowVisualization"
import DataTable from "./components/DataTable"
import SearchView from "./components/SearchView"
import LogDetail from "./components/LogDetail"
import { AppProvider } from "./context/AppContext"

export default function App() {
  const [currentView, setCurrentView] = useState<string>("welcome")
  const [selectedSystemId, setSelectedSystemId] = useState<string>("")

  const navigate = (view: string, systemId?: string) => {
    setCurrentView(view)
    if (systemId) setSelectedSystemId(systemId)
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case "welcome":
        return <WelcomeScreen navigate={navigate} />
      case "flow":
        return <FlowVisualization navigate={navigate} />
      case "data-table":
        return <DataTable navigate={navigate} />
      case "search":
        return <SearchView navigate={navigate} />
      case "log-detail":
        return <LogDetail navigate={navigate} systemId={selectedSystemId} />
      default:
        return <WelcomeScreen navigate={navigate} />
    }
  }

  return (
    <AppProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <AnimatePresence mode="wait">{renderCurrentView()}</AnimatePresence>
      </div>
    </AppProvider>
  )
}
