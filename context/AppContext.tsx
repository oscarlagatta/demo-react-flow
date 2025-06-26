"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface SystemNode {
  id: string
  name: string
  aitNumber: string
  column: "origination" | "validation" | "middleware" | "processing"
  position: { x: number; y: number }
  status: {
    flow: "active" | "warning" | "error"
    trend: "active" | "warning" | "error"
    balanced: "active" | "warning" | "error"
  }
  connections: string[]
}

interface SearchResult {
  paymentId: string
  path: string[]
  systems: SystemNode[]
}

interface AppContextType {
  systems: SystemNode[]
  searchResult: SearchResult | null
  setSearchResult: (result: SearchResult | null) => void
  selectedSystem: string | null
  setSelectedSystem: (systemId: string | null) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const mockSystems: SystemNode[] = [
  // Origination
  {
    id: "swift-gateway",
    name: "Swift Gateway",
    aitNumber: "AIT 11554",
    column: "origination",
    position: { x: 50, y: 100 },
    status: { flow: "warning", trend: "warning", balanced: "warning" },
    connections: ["swift-alliance", "loan-iq"],
  },
  {
    id: "loan-iq",
    name: "LoanIQ",
    aitNumber: "AIT 48581",
    column: "origination",
    position: { x: 50, y: 200 },
    status: { flow: "active", trend: "active", balanced: "warning" },
    connections: ["cashpro-payments"],
  },
  {
    id: "cashpro-mobile",
    name: "CashPro Mobile",
    aitNumber: "AIT 41107",
    column: "origination",
    position: { x: 50, y: 300 },
    status: { flow: "active", trend: "active", balanced: "warning" },
    connections: ["cashpro-payments"],
  },
  {
    id: "cpo-gateway",
    name: "CPO API Gateway",
    aitNumber: "AIT 11697",
    column: "origination",
    position: { x: 50, y: 400 },
    status: { flow: "active", trend: "active", balanced: "warning" },
    connections: ["frp-us", "b2bi"],
  },
  {
    id: "b2bi",
    name: "B2BI",
    aitNumber: "AIT 54071",
    column: "origination",
    position: { x: 50, y: 500 },
    status: { flow: "active", trend: "active", balanced: "warning" },
    connections: ["ecb"],
  },

  // Payment Validation and Routing
  {
    id: "swift-alliance",
    name: "Swift Alliance",
    aitNumber: "AIT 512",
    column: "validation",
    position: { x: 300, y: 100 },
    status: { flow: "active", trend: "active", balanced: "active" },
    connections: ["gpo", "cashpro-payments"],
  },
  {
    id: "gpo",
    name: "GPO",
    aitNumber: "AIT 70199",
    column: "validation",
    position: { x: 300, y: 200 },
    status: { flow: "active", trend: "active", balanced: "active" },
    connections: ["rpi"],
  },
  {
    id: "cashpro-payments",
    name: "CashPro Payments",
    aitNumber: "AIT 28960",
    column: "validation",
    position: { x: 300, y: 300 },
    status: { flow: "active", trend: "active", balanced: "active" },
    connections: ["mrp", "psh"],
  },
  {
    id: "frp-us",
    name: "FRP US",
    aitNumber: "AIT 15227",
    column: "validation",
    position: { x: 300, y: 400 },
    status: { flow: "active", trend: "active", balanced: "warning" },
    connections: ["psh"],
  },
  {
    id: "psh",
    name: "PSH",
    aitNumber: "AIT 31427",
    column: "validation",
    position: { x: 300, y: 500 },
    status: { flow: "active", trend: "active", balanced: "active" },
    connections: ["mrp"],
  },
  {
    id: "ecb",
    name: "ECB",
    aitNumber: "AIT 834",
    column: "validation",
    position: { x: 300, y: 600 },
    status: { flow: "warning", trend: "warning", balanced: "warning" },
    connections: [],
  },

  // Middleware
  {
    id: "rpi",
    name: "RPI",
    aitNumber: "AIT 80745",
    column: "middleware",
    position: { x: 550, y: 150 },
    status: { flow: "warning", trend: "warning", balanced: "warning" },
    connections: ["gbs-aries"],
  },
  {
    id: "mrp",
    name: "MRP",
    aitNumber: "AIT 4679",
    column: "middleware",
    position: { x: 550, y: 350 },
    status: { flow: "warning", trend: "warning", balanced: "warning" },
    connections: ["wtx"],
  },

  // Payment Processing, Sanctions & Investigation
  {
    id: "gbs-aries",
    name: "GBS Aries",
    aitNumber: "AIT 515",
    column: "processing",
    position: { x: 800, y: 100 },
    status: { flow: "active", trend: "active", balanced: "active" },
    connections: ["gtms", "ets"],
  },
  {
    id: "gtms",
    name: "GTMS (Limits)",
    aitNumber: "AIT 62686",
    column: "processing",
    position: { x: 800, y: 200 },
    status: { flow: "active", trend: "active", balanced: "active" },
    connections: ["ets"],
  },
  {
    id: "ets",
    name: "ETS (Sanctions)",
    aitNumber: "AIT 46951",
    column: "processing",
    position: { x: 800, y: 300 },
    status: { flow: "active", trend: "active", balanced: "active" },
    connections: ["gfd"],
  },
  {
    id: "gfd",
    name: "GFD (Fraud)",
    aitNumber: "AIT 73929",
    column: "processing",
    position: { x: 800, y: 400 },
    status: { flow: "active", trend: "active", balanced: "active" },
    connections: ["wtx"],
  },
  {
    id: "wtx",
    name: "WTX",
    aitNumber: "AIT 1901",
    column: "processing",
    position: { x: 800, y: 500 },
    status: { flow: "active", trend: "active", balanced: "active" },
    connections: ["rtfp"],
  },
  {
    id: "rtfp",
    name: "RTFP",
    aitNumber: "AIT 74014",
    column: "processing",
    position: { x: 800, y: 600 },
    status: { flow: "active", trend: "active", balanced: "warning" },
    connections: [],
  },
]

export function AppProvider({ children }: { children: ReactNode }) {
  const [systems] = useState<SystemNode[]>(mockSystems)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <div>Loading...</div>
  }

  return (
    <AppContext.Provider
      value={{
        systems,
        searchResult,
        setSearchResult,
        selectedSystem,
        setSelectedSystem,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider")
  }
  return context
}
