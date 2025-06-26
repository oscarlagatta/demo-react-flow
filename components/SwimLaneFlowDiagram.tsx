"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAppContext } from "../context/AppContext"
import { Trash2, X, Maximize2, Minimize2 } from "lucide-react"

interface Position {
  x: number
  y: number
}

interface ViewportDimensions {
  width: number
  height: number
  availableHeight: number
}

interface SwimLane {
  id: string
  title: string
  color: string
  minHeight: number
  systems: string[]
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
  constrainedPosition: Position
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

// Define swim lanes with their respective systems
const SWIM_LANES: SwimLane[] = [
  {
    id: "origination",
    title: "Origination",
    color: "bg-blue-100 border-blue-300",
    minHeight: 200,
    systems: ["swift-gateway", "loan-iq", "cashpro-mobile", "cpo-gateway", "b2bi"],
  },
  {
    id: "validation",
    title: "Payment Validation and Routing",
    color: "bg-green-100 border-green-300",
    minHeight: 200,
    systems: ["swift-alliance", "gpo", "cashpro-payments", "frp-us", "psh", "ecb"],
  },
  {
    id: "middleware",
    title: "Middleware",
    color: "bg-yellow-100 border-yellow-300",
    minHeight: 200,
    systems: ["rpi", "mrp"],
  },
  {
    id: "processing",
    title: "Payment Processing, Sanctions & Investigation",
    color: "bg-purple-100 border-purple-300",
    minHeight: 200,
    systems: ["gbs-aries", "gtms", "ets", "gfd", "wtx", "rtfp"],
  },
]

// Precise connection mapping
const PRECISE_CONNECTIONS: Connection[] = [
  { id: "swift-gateway-swift-alliance", sourceId: "swift-gateway", targetId: "swift-alliance" },
  { id: "loan-iq-swift-alliance", sourceId: "loan-iq", targetId: "swift-alliance" },
  { id: "loan-iq-cashpro-payments", sourceId: "loan-iq", targetId: "cashpro-payments" },
  { id: "cashpro-mobile-cashpro-payments", sourceId: "cashpro-mobile", targetId: "cashpro-payments" },
  { id: "cpo-gateway-frp-us", sourceId: "cpo-gateway", targetId: "frp-us" },
  { id: "cpo-gateway-b2bi", sourceId: "cpo-gateway", targetId: "b2bi" },
  { id: "b2bi-ecb", sourceId: "b2bi", targetId: "ecb" },
  { id: "swift-alliance-gpo", sourceId: "swift-alliance", targetId: "gpo" },
  { id: "swift-alliance-cashpro-payments", sourceId: "swift-alliance", targetId: "cashpro-payments" },
  { id: "gpo-rpi", sourceId: "gpo", targetId: "rpi" },
  { id: "gpo-cashpro-payments", sourceId: "gpo", targetId: "cashpro-payments" },
  { id: "cashpro-payments-psh", sourceId: "cashpro-payments", targetId: "psh" },
  { id: "cashpro-payments-mrp", sourceId: "cashpro-payments", targetId: "mrp" },
  { id: "frp-us-psh", sourceId: "frp-us", targetId: "psh" },
  { id: "psh-mrp", sourceId: "psh", targetId: "mrp" },
  { id: "rpi-gbs-aries", sourceId: "rpi", targetId: "gbs-aries" },
  { id: "mrp-wtx", sourceId: "mrp", targetId: "wtx" },
  { id: "gbs-aries-gtms", sourceId: "gbs-aries", targetId: "gtms" },
  { id: "gbs-aries-ets", sourceId: "gbs-aries", targetId: "ets" },
  { id: "gtms-ets", sourceId: "gtms", targetId: "ets" },
  { id: "ets-gfd", sourceId: "ets", targetId: "gfd" },
  { id: "gfd-wtx", sourceId: "gfd", targetId: "wtx" },
  { id: "wtx-rtfp", sourceId: "wtx", targetId: "rtfp" },
]

// Custom hook for viewport dimensions
const useViewportDimensions = () => {
  const [dimensions, setDimensions] = useState<ViewportDimensions>({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
    availableHeight: typeof window !== "undefined" ? window.innerHeight : 800,
  })

  useEffect(() => {
    const updateDimensions = () => {
      const headerHeight = 60 // Height of the header
      const columnHeaderHeight = 50 // Height of column headers
      const reservedHeight = headerHeight + columnHeaderHeight

      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
        availableHeight: window.innerHeight - reservedHeight,
      })
    }

    // Initial calculation
    updateDimensions()

    // Debounced resize handler for performance
    let timeoutId: NodeJS.Timeout
    const debouncedResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateDimensions, 150)
    }

    window.addEventListener("resize", debouncedResize)
    window.addEventListener("orientationchange", debouncedResize)

    return () => {
      window.removeEventListener("resize", debouncedResize)
      window.removeEventListener("orientationchange", debouncedResize)
      clearTimeout(timeoutId)
    }
  }, [])

  return dimensions
}

const StatusBadge = ({ status, label }: { status: "active" | "warning" | "error"; label: string }) => {
  const colors = {
    active: "bg-green-500 text-white",
    warning: "bg-amber-500 text-white",
    error: "bg-red-500 text-white",
  }

  return <Badge className={`${colors[status]} text-xs px-2 py-1`}>{label}</Badge>
}

const SwimLaneHeader = ({
  lane,
  isCollapsed,
  onToggleCollapse,
}: {
  lane: SwimLane
  isCollapsed: boolean
  onToggleCollapse: (laneId: string) => void
}) => {
  return (
    <div className={`${lane.color} border-2 border-dashed p-2 mb-1 rounded-lg`}>
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-xs sm:text-sm lg:text-base truncate">{lane.title}</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onToggleCollapse(lane.id)}
          className="h-5 w-5 p-0 hover:bg-white/50 flex-shrink-0"
        >
          {isCollapsed ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
        </Button>
      </div>
    </div>
  )
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
      className={`absolute w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 border-2 border-white rounded-full cursor-crosshair hover:bg-blue-600 transition-colors ${handlePositions[position]} opacity-0 group-hover:opacity-100 z-30`}
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
  swimLaneBounds,
  onDragStart,
  onDrag,
  onDragEnd,
  onConnectionStart,
  onConnectionEnd,
  isHighlighted = false,
  scale = 1,
}: {
  system: any
  navigate: (view: string, systemId?: string) => void
  showButtons: boolean
  position: Position
  swimLaneBounds: { left: number; right: number; top: number; bottom: number }
  onDragStart: (nodeId: string, offset: Position, startPos: Position) => void
  onDrag: (position: Position, constrainedPosition: Position) => void
  onDragEnd: () => void
  onConnectionStart: (nodeId: string, position: Position) => void
  onConnectionEnd: (nodeId: string) => void
  isHighlighted?: boolean
  scale?: number
}) => {
  const nodeRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const constrainPosition = useCallback(
    (pos: Position): Position => {
      const nodeWidth = 140 * scale
      const nodeHeight = 100 * scale
      const halfWidth = nodeWidth / 2
      const halfHeight = nodeHeight / 2

      return {
        x: Math.max(swimLaneBounds.left + halfWidth, Math.min(pos.x, swimLaneBounds.right - halfWidth)),
        y: Math.max(swimLaneBounds.top + halfHeight, Math.min(pos.y, swimLaneBounds.bottom - halfHeight)),
      }
    },
    [swimLaneBounds, scale],
  )

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
        const unconstrained = { x: e.clientX, y: e.clientY }
        const constrained = constrainPosition(unconstrained)
        onDrag(unconstrained, constrained)
      }
    },
    [isDragging, onDrag, constrainPosition],
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

  const nodeWidth = Math.max(120, 140 * scale)
  const fontSize = Math.max(10, 12 * scale)

  return (
    <motion.div
      ref={nodeRef}
      className={`absolute bg-white border-2 rounded-lg p-2 shadow-lg cursor-move group select-none ${
        isHighlighted ? "border-blue-500 shadow-blue-200" : "border-gray-300"
      } ${isDragging ? "z-50" : "z-10"}`}
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
        minWidth: `${nodeWidth}px`,
        fontSize: `${fontSize}px`,
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
          <h3 className="font-semibold text-gray-800 mb-1 leading-tight">{system.name}</h3>
          <p className="text-gray-600 mb-2 leading-tight">{system.aitNumber}</p>
        </div>
        <div className="flex flex-wrap gap-1 justify-center mb-2">
          <StatusBadge status={system.status.flow} label="Flow" />
          <StatusBadge status={system.status.trend} label="Trend" />
          <StatusBadge status={system.status.balanced} label="Balanced" />
        </div>
        {showButtons && (
          <div className="flex gap-1 justify-center">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                navigate("data-table")
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs"
            >
              Summary
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                navigate("log-detail", system.id)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs"
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
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth="12"
        fill="none"
        className="cursor-pointer"
        onClick={handleClick}
        onContextMenu={handleRightClick}
      />

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

interface SwimLaneFlowDiagramProps {
  navigate: (view: string, systemId?: string) => void
}

export default function SwimLaneFlowDiagram({ navigate }: SwimLaneFlowDiagramProps) {
  const { systems, searchResult } = useAppContext()
  const containerRef = useRef<HTMLDivElement>(null)
  const viewportDimensions = useViewportDimensions()

  // State management
  const [nodePositions, setNodePositions] = useState<Record<string, Position>>({})
  const [swimLaneBounds, setSwimLaneBounds] = useState<
    Record<string, { left: number; right: number; top: number; bottom: number }>
  >({})
  const [collapsedLanes, setCollapsedLanes] = useState<Set<string>>(new Set())
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
    constrainedPosition: { x: 0, y: 0 },
  })
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnecting: false,
    sourceId: null,
    sourcePosition: null,
    currentPosition: null,
  })
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  // Calculate responsive scale based on viewport
  const responsiveScale = Math.min(1, Math.max(0.6, viewportDimensions.width / 1400))

  // Calculate swim lane bounds and positions with viewport awareness
  const calculateLayout = useCallback(() => {
    const containerWidth = viewportDimensions.width
    const containerHeight = viewportDimensions.availableHeight
    const laneWidth = containerWidth / SWIM_LANES.length
    const headerHeight = 50
    const padding = Math.max(10, containerWidth * 0.01)

    const bounds: Record<string, { left: number; right: number; top: number; bottom: number }> = {}
    const positions: Record<string, Position> = {}

    SWIM_LANES.forEach((lane, laneIndex) => {
      const laneLeft = laneIndex * laneWidth + padding
      const laneRight = (laneIndex + 1) * laneWidth - padding
      const laneTop = headerHeight + padding
      const laneBottom = containerHeight - padding

      bounds[lane.id] = {
        left: laneLeft,
        right: laneRight,
        top: laneTop,
        bottom: laneBottom,
      }

      // Position systems within the lane with responsive scaling
      const systemsInLane = systems.filter((system) => lane.systems.includes(system.id))
      const systemsPerRow = Math.max(1, Math.floor(Math.sqrt(systemsInLane.length)))
      const systemWidth = (laneRight - laneLeft) / systemsPerRow
      const systemHeight = (laneBottom - laneTop) / Math.ceil(systemsInLane.length / systemsPerRow)

      systemsInLane.forEach((system, systemIndex) => {
        const row = Math.floor(systemIndex / systemsPerRow)
        const col = systemIndex % systemsPerRow

        positions[system.id] = {
          x: laneLeft + (col + 0.5) * systemWidth,
          y: laneTop + (row + 0.5) * systemHeight,
        }
      })
    })

    setSwimLaneBounds(bounds)
    setNodePositions(positions)
  }, [systems, viewportDimensions])

  // Initialize layout and handle viewport changes
  useEffect(() => {
    calculateLayout()
  }, [calculateLayout])

  // Keyboard event handler
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

  // Drag handlers with swim lane constraints
  const handleDragStart = useCallback((nodeId: string, offset: Position, startPos: Position) => {
    setDragState({
      isDragging: true,
      nodeId,
      offset,
      startPosition: startPos,
      constrainedPosition: startPos,
    })
  }, [])

  const handleDrag = useCallback(
    (mousePosition: Position, constrainedPosition: Position) => {
      if (!dragState.isDragging || !dragState.nodeId) return

      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return

      const newPosition = {
        x: (constrainedPosition.x - containerRect.left - dragState.offset.x) / zoom + pan.x,
        y: (constrainedPosition.y - containerRect.top - dragState.offset.y) / zoom + pan.y,
      }

      setNodePositions((prev) => ({
        ...prev,
        [dragState.nodeId!]: newPosition,
      }))

      setDragState((prev) => ({
        ...prev,
        constrainedPosition: newPosition,
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
      constrainedPosition: { x: 0, y: 0 },
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

  // Connection management
  const handleConnectionSelect = useCallback((connectionId: string) => {
    setSelectedConnection(connectionId)
    setContextMenu({ visible: false, position: { x: 0, y: 0 }, connectionId: null })
  }, [])

  const handleConnectionRightClick = useCallback((e: React.MouseEvent, connectionId: string) => {
    setContextMenu({
      visible: true,
      position: { x: e.clientX, y: e.clientY },
      connectionId,
    })
    setSelectedConnection(connectionId)
  }, [])

  const handleDeleteConnection = useCallback((connectionId: string) => {
    setConnectionToDelete(connectionId)
    setShowDeleteConfirmation(true)
    setContextMenu({ visible: false, position: { x: 0, y: 0 }, connectionId: null })
  }, [])

  const confirmDeleteConnection = useCallback(() => {
    if (connectionToDelete) {
      setConnections((prev) => prev.filter((conn) => conn.id !== connectionToDelete))
      setSelectedConnection(null)
      setConnectionToDelete(null)
    }
    setShowDeleteConfirmation(false)
  }, [connectionToDelete])

  const cancelDeleteConnection = useCallback(() => {
    setConnectionToDelete(null)
    setShowDeleteConfirmation(false)
  }, [])

  // Swim lane management
  const handleToggleCollapse = useCallback((laneId: string) => {
    setCollapsedLanes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(laneId)) {
        newSet.delete(laneId)
      } else {
        newSet.add(laneId)
      }
      return newSet
    })
  }, [])

  // Zoom and pan handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.2, 3))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.2, 0.3))
  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    calculateLayout()
  }

  const filteredSystems = searchResult ? systems.filter((system) => searchResult.path.includes(system.id)) : systems

  return (
    <div
      className="w-full bg-gradient-to-br from-orange-100 to-orange-200 relative overflow-hidden"
      style={{ height: `${viewportDimensions.availableHeight}px` }}
    >
      {/* Controls */}
      <div className="absolute top-2 right-2 z-20 flex flex-col gap-1">
        <Button size="sm" onClick={handleZoomIn} className="bg-white text-gray-800 hover:bg-gray-100 h-8 w-8 p-0">
          +
        </Button>
        <Button size="sm" onClick={handleZoomOut} className="bg-white text-gray-800 hover:bg-gray-100 h-8 w-8 p-0">
          -
        </Button>
        <Button size="sm" onClick={handleReset} className="bg-white text-gray-800 hover:bg-gray-100 h-8 w-8 p-0">
          ⌂
        </Button>
      </div>

      {/* Instructions */}
      <div className="absolute top-2 left-2 z-20 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs max-w-xs">
        <div className="font-semibold mb-1">Swim Lane Controls:</div>
        <div>• Nodes constrained to lanes</div>
        <div>• Click headers to collapse/expand</div>
        <div>• Right-click connections to delete</div>
        <div>• Delete key for selected connections</div>
      </div>

      {/* Main Container */}
      <div
        ref={containerRef}
        className="w-full h-full relative cursor-default"
        onMouseMove={handleMouseMove}
        onMouseUp={() => {
          if (connectionState.isConnecting) {
            setConnectionState({
              isConnecting: false,
              sourceId: null,
              sourcePosition: null,
              currentPosition: null,
            })
          }
        }}
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: "center center",
        }}
      >
        {/* Swim Lane Headers and Boundaries */}
        <div className="absolute inset-0 pointer-events-none">
          {SWIM_LANES.map((lane, index) => {
            const bounds = swimLaneBounds[lane.id]
            if (!bounds) return null

            const isCollapsed = collapsedLanes.has(lane.id)

            return (
              <div
                key={lane.id}
                className="absolute pointer-events-auto"
                style={{
                  left: bounds.left - 5,
                  top: 5,
                  width: bounds.right - bounds.left + 10,
                  height: isCollapsed ? 45 : bounds.bottom - bounds.top + 40,
                }}
              >
                <SwimLaneHeader lane={lane} isCollapsed={isCollapsed} onToggleCollapse={handleToggleCollapse} />
                {!isCollapsed && (
                  <div
                    className={`${lane.color} border-2 border-dashed rounded-lg h-full opacity-30 pointer-events-none`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* SVG for connections */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#374151" />
            </marker>
          </defs>

          {connections.map((connection) => {
            const sourcePos = nodePositions[connection.sourceId]
            const targetPos = nodePositions[connection.targetId]

            if (!sourcePos || !targetPos) return null

            const isHighlighted =
              searchResult &&
              searchResult.path.includes(connection.sourceId) &&
              searchResult.path.includes(connection.targetId)

            return (
              <ConnectionLine
                key={connection.id}
                connection={connection}
                sourcePos={sourcePos}
                targetPos={targetPos}
                isHighlighted={isHighlighted}
                isSelected={selectedConnection === connection.id}
                onSelect={handleConnectionSelect}
                onRightClick={handleConnectionRightClick}
              />
            )
          })}

          {connectionState.isConnecting && connectionState.sourcePosition && connectionState.currentPosition && (
            <ConnectionLine
              sourcePos={connectionState.sourcePosition}
              targetPos={connectionState.currentPosition}
              isTemporary={true}
            />
          )}
        </svg>

        {/* System Nodes */}
        <AnimatePresence>
          {filteredSystems.map((system) => {
            const position = nodePositions[system.id]
            const systemLane = SWIM_LANES.find((lane) => lane.systems.includes(system.id))
            const bounds = systemLane ? swimLaneBounds[systemLane.id] : null
            const isLaneCollapsed = systemLane ? collapsedLanes.has(systemLane.id) : false

            if (!position || !bounds || isLaneCollapsed) return null

            return (
              <SystemNode
                key={system.id}
                system={system}
                navigate={navigate}
                showButtons={searchResult ? searchResult.path.includes(system.id) : false}
                position={position}
                swimLaneBounds={bounds}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                onConnectionStart={handleConnectionStart}
                onConnectionEnd={handleConnectionEnd}
                isHighlighted={searchResult ? searchResult.path.includes(system.id) : false}
                scale={responsiveScale}
              />
            )
          })}
        </AnimatePresence>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        <ContextMenu
          visible={contextMenu.visible}
          position={contextMenu.position}
          onDelete={() => contextMenu.connectionId && handleDeleteConnection(contextMenu.connectionId)}
          onClose={() => setContextMenu({ visible: false, position: { x: 0, y: 0 }, connectionId: null })}
        />
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        <DeleteConfirmation
          visible={showDeleteConfirmation}
          onConfirm={confirmDeleteConnection}
          onCancel={cancelDeleteConnection}
        />
      </AnimatePresence>
    </div>
  )
}
