"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAppContext } from "../context/AppContext"
import { Trash2, X } from "lucide-react"

interface Position {
  x: number
  y: number
}

interface Connection {
  id: string
  sourceId: string
  targetId: string
  sourceHandle?: string
  targetHandle?: string
}

interface DragState {
  isDragging: boolean
  nodeId: string | null
  offset: Position
  startPosition: Position
}

interface ConnectionState {
  isConnecting: boolean
  sourceId: string | null
  sourcePosition: Position | null
  currentPosition: Position | null
}

interface ContextMenu {
  visible: boolean
  position: Position
  connectionId: string | null
}

// Precise connection mapping based on the provided image
const PRECISE_CONNECTIONS: Connection[] = [
  // Swift Gateway connections
  { id: "swift-gateway-swift-alliance", sourceId: "swift-gateway", targetId: "swift-alliance" },

  // LoanIQ connections
  { id: "loan-iq-swift-alliance", sourceId: "loan-iq", targetId: "swift-alliance" },
  { id: "loan-iq-cashpro-payments", sourceId: "loan-iq", targetId: "cashpro-payments" },

  // CashProMobile connections
  { id: "cashpro-mobile-cashpro-payments", sourceId: "cashpro-mobile", targetId: "cashpro-payments" },

  // CPO API Gateway connections
  { id: "cpo-gateway-frp-us", sourceId: "cpo-gateway", targetId: "frp-us" },
  { id: "cpo-gateway-b2bi", sourceId: "cpo-gateway", targetId: "b2bi" },

  // B2BI connections
  { id: "b2bi-ecb", sourceId: "b2bi", targetId: "ecb" },

  // Swift Alliance connections
  { id: "swift-alliance-gpo", sourceId: "swift-alliance", targetId: "gpo" },
  { id: "swift-alliance-cashpro-payments", sourceId: "swift-alliance", targetId: "cashpro-payments" },

  // GPO connections
  { id: "gpo-rpi", sourceId: "gpo", targetId: "rpi" },
  { id: "gpo-cashpro-payments", sourceId: "gpo", targetId: "cashpro-payments" },

  // CashPro Payments connections
  { id: "cashpro-payments-psh", sourceId: "cashpro-payments", targetId: "psh" },
  { id: "cashpro-payments-mrp", sourceId: "cashpro-payments", targetId: "mrp" },

  // FRP US connections
  { id: "frp-us-psh", sourceId: "frp-us", targetId: "psh" },

  // PSH connections
  { id: "psh-mrp", sourceId: "psh", targetId: "mrp" },

  // RPI connections
  { id: "rpi-gbs-aries", sourceId: "rpi", targetId: "gbs-aries" },

  // MRP connections
  { id: "mrp-wtx", sourceId: "mrp", targetId: "wtx" },

  // GBS Aries connections
  { id: "gbs-aries-gtms", sourceId: "gbs-aries", targetId: "gtms" },
  { id: "gbs-aries-ets", sourceId: "gbs-aries", targetId: "ets" },

  // GTMS connections
  { id: "gtms-ets", sourceId: "gtms", targetId: "ets" },

  // ETS connections
  { id: "ets-gfd", sourceId: "ets", targetId: "gfd" },

  // GFD connections
  { id: "gfd-wtx", sourceId: "gfd", targetId: "wtx" },

  // WTX connections
  { id: "wtx-rtfp", sourceId: "wtx", targetId: "rtfp" },
]

const StatusBadge = ({ status, label }: { status: "active" | "warning" | "error"; label: string }) => {
  const colors = {
    active: "bg-green-500 text-white",
    warning: "bg-amber-500 text-white",
    error: "bg-red-500 text-white",
  }

  return <Badge className={`${colors[status]} text-xs px-2 py-1`}>{label}</Badge>
}

const ConnectionHandle = ({
  position,
  type,
  onConnectionStart,
  onConnectionEnd,
  nodeId,
}: {
  position: "top" | "bottom" | "left" | "right"
  type: "source" | "target"
  onConnectionStart: (nodeId: string, position: Position) => void
  onConnectionEnd: (nodeId: string) => void
  nodeId: string
}) => {
  const handlePositions = {
    top: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
    bottom: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
    left: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2",
    right: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2",
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (type === "source") {
      const rect = e.currentTarget.getBoundingClientRect()
      onConnectionStart(nodeId, {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      })
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (type === "target") {
      onConnectionEnd(nodeId)
    }
  }

  return (
    <div
      className={`absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-crosshair hover:bg-blue-600 transition-colors ${handlePositions[position]} opacity-0 group-hover:opacity-100 z-30`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    />
  )
}

const SystemNode = ({
  system,
  navigate,
  showButtons,
  position,
  onDragStart,
  onDrag,
  onDragEnd,
  onConnectionStart,
  onConnectionEnd,
  isHighlighted = false,
}: {
  system: any
  navigate: (view: string, systemId?: string) => void
  showButtons: boolean
  position: Position
  onDragStart: (nodeId: string, offset: Position, startPos: Position) => void
  onDrag: (position: Position) => void
  onDragEnd: () => void
  onConnectionStart: (nodeId: string, position: Position) => void
  onConnectionEnd: (nodeId: string) => void
  isHighlighted?: boolean
}) => {
  const nodeRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).closest(".drag-handle")) {
      return
    }

    e.preventDefault()
    const rect = nodeRef.current?.getBoundingClientRect()
    if (!rect) return

    const offset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }

    setIsDragging(true)
    onDragStart(system.id, offset, position)
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        onDrag({ x: e.clientX, y: e.clientY })
      }
    },
    [isDragging, onDrag],
  )

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      onDragEnd()
    }
  }, [isDragging, onDragEnd])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <motion.div
      ref={nodeRef}
      className={`absolute bg-white border-2 rounded-lg p-4 min-w-[180px] shadow-lg cursor-move group select-none ${
        isHighlighted ? "border-blue-500 shadow-blue-200" : "border-gray-300"
      } ${isDragging ? "z-50" : "z-10"}`}
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
      }}
      onMouseDown={handleMouseDown}
      whileHover={{ scale: isDragging ? 1 : 1.02 }}
      whileDrag={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
      animate={{
        scale: isDragging ? 1.05 : 1,
        boxShadow: isDragging ? "0 20px 25px -5px rgba(0, 0, 0, 0.1)" : "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Connection Handles */}
      <ConnectionHandle
        position="top"
        type="target"
        onConnectionStart={onConnectionStart}
        onConnectionEnd={onConnectionEnd}
        nodeId={system.id}
      />
      <ConnectionHandle
        position="bottom"
        type="source"
        onConnectionStart={onConnectionStart}
        onConnectionEnd={onConnectionEnd}
        nodeId={system.id}
      />
      <ConnectionHandle
        position="left"
        type="target"
        onConnectionStart={onConnectionStart}
        onConnectionEnd={onConnectionEnd}
        nodeId={system.id}
      />
      <ConnectionHandle
        position="right"
        type="source"
        onConnectionStart={onConnectionStart}
        onConnectionEnd={onConnectionEnd}
        nodeId={system.id}
      />

      <div className="text-center">
        <div className="drag-handle cursor-move">
          <h3 className="font-semibold text-gray-800 mb-1">{system.name}</h3>
          <p className="text-sm text-gray-600 mb-3">{system.aitNumber}</p>
        </div>
        <div className="flex flex-wrap gap-1 justify-center mb-3">
          <StatusBadge status={system.status.flow} label="Flow" />
          <StatusBadge status={system.status.trend} label="Trend" />
          <StatusBadge status={system.status.balanced} label="Balanced" />
        </div>
        {showButtons && (
          <div className="flex gap-2 justify-center">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                navigate("data-table")
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs"
            >
              Summary
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                navigate("log-detail", system.id)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs"
            >
              Details
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

const ConnectionLine = ({
  connection,
  sourcePos,
  targetPos,
  isHighlighted = false,
  isTemporary = false,
  isSelected = false,
  onSelect,
  onRightClick,
}: {
  connection?: Connection
  sourcePos: Position
  targetPos: Position
  isHighlighted?: boolean
  isTemporary?: boolean
  isSelected?: boolean
  onSelect?: (connectionId: string) => void
  onRightClick?: (e: React.MouseEvent, connectionId: string) => void
}) => {
  const midX = (sourcePos.x + targetPos.x) / 2
  const midY = (sourcePos.y + targetPos.y) / 2

  // Create a more precise path for better visual alignment
  const controlPoint1X = sourcePos.x + (targetPos.x - sourcePos.x) * 0.3
  const controlPoint1Y = sourcePos.y
  const controlPoint2X = sourcePos.x + (targetPos.x - sourcePos.x) * 0.7
  const controlPoint2Y = targetPos.y

  const pathData = `M ${sourcePos.x} ${sourcePos.y} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${targetPos.x} ${targetPos.y}`

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (connection && onSelect) {
      onSelect(connection.id)
    }
  }

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (connection && onRightClick) {
      onRightClick(e, connection.id)
    }
  }

  return (
    <g>
      {/* Invisible wider path for easier clicking */}
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth="12"
        fill="none"
        className="cursor-pointer"
        onClick={handleClick}
        onContextMenu={handleRightClick}
      />

      {/* Visible connection line */}
      <path
        d={pathData}
        stroke={isSelected ? "#ef4444" : isHighlighted ? "#3b82f6" : isTemporary ? "#10b981" : "#374151"}
        strokeWidth={isSelected ? 4 : isHighlighted ? 3 : 2}
        fill="none"
        markerEnd="url(#arrowhead)"
        className={`${isTemporary ? "stroke-dasharray-[5,5] animate-pulse" : ""} ${
          connection && !isTemporary ? "cursor-pointer hover:stroke-blue-500" : ""
        }`}
        onClick={handleClick}
        onContextMenu={handleRightClick}
      />

      {/* Selection indicator */}
      {isSelected && connection && (
        <circle cx={midX} cy={midY} r="6" fill="#ef4444" stroke="white" strokeWidth="2" className="animate-pulse" />
      )}
    </g>
  )
}

const ContextMenu = ({
  visible,
  position,
  onDelete,
  onClose,
}: {
  visible: boolean
  position: Position
  onDelete: () => void
  onClose: () => void
}) => {
  if (!visible) return null

  return (
    <motion.div
      className="fixed bg-white border border-gray-300 rounded-lg shadow-lg py-2 z-50"
      style={{ left: position.x, top: position.y }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
    >
      <button
        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
        onClick={onDelete}
      >
        <Trash2 className="w-4 h-4" />
        Delete Connection
      </button>
      <button
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 w-full text-left"
        onClick={onClose}
      >
        <X className="w-4 h-4" />
        Cancel
      </button>
    </motion.div>
  )
}

const DeleteConfirmation = ({
  visible,
  onConfirm,
  onCancel,
}: {
  visible: boolean
  onConfirm: () => void
  onCancel: () => void
}) => {
  if (!visible) return null

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-lg p-6 max-w-sm mx-4"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        <h3 className="text-lg font-semibold mb-2">Delete Connection</h3>
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete this connection? This action cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

interface InteractiveFlowDiagramProps {
  navigate: (view: string, systemId?: string) => void
}

export default function InteractiveFlowDiagram({ navigate }: InteractiveFlowDiagramProps) {
const { systems, searchResult } = useAppContext()
const containerRef = useRef<HTMLDivElement>(null)

// State management
const [nodePositions, setNodePositions] = useState<Record<string, Position>>({})
const [connections, setConnections] = useState<Connection[]>(PRECISE_CONNECTIONS)
const [selectedConnection, setSelectedConnection] = useState<string | null>(null)
const [contextMenu, setContextMenu] = useState<ContextMenu>({
  visible: false,
  position: { x: 0, y: 0 },
  connectionId: null,
})
const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
const [connectionToDelete, setConnectionToDelete] = useState<string | null>(null)

const [dragState, setDragState] = useState<DragState>({
  isDragging: false,
  nodeId: null,
  offset: { x: 0, y: 0 },
  startPosition: { x: 0, y: 0 },
})
const [connectionState, setConnectionState] = useState<ConnectionState>({
  isConnecting: false,
  sourceId: null,
  sourcePosition: null,
  currentPosition: null,
})
const [zoom, setZoom] = useState(1)
const [pan, setPan] = useState({ x: 0, y: 0 })

// Initialize node positions with precise layout matching the image
useEffect(() => {
  const columnPositions = {
    origination: 150,
    validation: 400,
    middleware: 650,
    processing: 900,
  }

  const initialPositions: Record<string, Position> = {}
  systems.forEach((system) => {
    initialPositions[system.id] = {
      x: columnPositions[system.column],
      y: system.position.y + 100,
    }
  })

  setNodePositions(initialPositions)
}, [systems])

// Keyboard event handler for delete key
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Delete" && selectedConnection) {
      setConnectionToDelete(selectedConnection)
      setShowDeleteConfirmation(true)
    }
    if (e.key === "Escape") {
      setSelectedConnection(null)
      setContextMenu({ visible: false, position: { x: 0, y: 0 }, connectionId: null })
    }
  }

  document.addEventListener("keydown", handleKeyDown)
  return () => document.removeEventListener("keydown", handleKeyDown)
}, [selectedConnection])

// Click outside to deselect
useEffect(() => {
  const handleClickOutside = () => {
    setSelectedConnection(null)
    setContextMenu({ visible: false, position: { x: 0, y: 0 }, connectionId: null })
  }

  document.addEventListener("click", handleClickOutside)
  return () => document.removeEventListener("click", handleClickOutside)
}, [])

// Drag handlers
const handleDragStart = useCallback((nodeId: string, offset: Position, startPos: Position) => {
  setDragState({
    isDragging: true,
    nodeId,
    offset,
    startPosition: startPos,
  })
}, [])

const handleDrag = useCallback(
  (mousePosition: Position) => {
    if (!dragState.isDragging || !dragState.nodeId) return

    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return

    const newPosition = {
      x: (mousePosition.x - containerRect.left - dragState.offset.x) / zoom + pan.x,
      y: (mousePosition.y - containerRect.top - dragState.offset.y) / zoom + pan.y,
    }

    setNodePositions((prev) => ({
      ...prev,
      [dragState.nodeId!]: newPosition,
    }))
  },
  [dragState, zoom, pan],
)

const handleDragEnd = useCallback(() => {
  setDragState({
    isDragging: false,
    nodeId: null,
    offset: { x: 0, y: 0 },
    startPosition: { x: 0, y: 0 },
  })
}, [])

// Connection handlers
const handleConnectionStart = useCallback((nodeId: string, position: Position) => {
  setConnectionState({
    isConnecting: true,
    sourceId: nodeId,
    sourcePosition: position,
    currentPosition: position,
  })
}, [])

const handleConnectionEnd = useCallback(
  (targetId: string) => {
    if (connectionState.isConnecting && connectionState.sourceId && connectionState.sourceId !== targetId) {
      const newConnection: Connection = {
        id: `${connectionState.sourceId}-${targetId}-${Date.now()}`,
        sourceId: connectionState.sourceId,
        targetId,
      }

      setConnections((prev) => [...prev, newConnection])
    }

    setConnectionState({
      isConnecting: false,
      sourceId: null,
      sourcePosition: null,
      currentPosition: null,
    })
  },
  [connectionState],
)

const handleMouseMove = useCallback(
  (e: React.MouseEvent) => {
    if (connectionState.isConnecting) {
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (containerRect) {
        setConnectionState((prev) => ({
          ...prev,
          currentPosition: {
            x: e.clientX - containerRect.left,
            y: e.clientY - containerRect.top,
          },
        }))
      }
    }
  },
  [connectionState.isConnecting],
)

// Connection selection and deletion handlers
const handleConnectionSelect = useCallback((connectionId: string) => {
  setSelectedConnection(connectionId)
