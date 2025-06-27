"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAppContext } from "../context/AppContext"
import { Trash2, X, Maximize2, Minimize2, Edit3, Play, Pause, Zap, RotateCcw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { gsap } from "gsap"

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
  isActive?: boolean
  isCritical?: boolean
  flowRate?: number // 1-5 scale for animation speed
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

interface EditableSystemNode {
  id: string
  name: string
  aitNumber: string
  description?: string
  status: {
    flow: "active" | "warning" | "error"
    trend: "active" | "warning" | "error"
    balanced: "active" | "warning" | "error"
  }
}

interface NodeEditState {
  isOpen: boolean
  nodeId: string | null
  editData: EditableSystemNode | null
  errors: Record<string, string>
  hasChanges: boolean
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

// Enhanced connection mapping with animation properties
const PRECISE_CONNECTIONS: Connection[] = [
  {
    id: "swift-gateway-swift-alliance",
    sourceId: "swift-gateway",
    targetId: "swift-alliance",
    isActive: true,
    flowRate: 3,
  },
  { id: "loan-iq-swift-alliance", sourceId: "loan-iq", targetId: "swift-alliance", isActive: true, flowRate: 2 },
  {
    id: "loan-iq-cashpro-payments",
    sourceId: "loan-iq",
    targetId: "cashpro-payments",
    isActive: true,
    isCritical: true,
    flowRate: 5,
  },
  {
    id: "cashpro-mobile-cashpro-payments",
    sourceId: "cashpro-mobile",
    targetId: "cashpro-payments",
    isActive: true,
    flowRate: 4,
  },
  { id: "cpo-gateway-frp-us", sourceId: "cpo-gateway", targetId: "frp-us", isActive: false, flowRate: 1 },
  { id: "cpo-gateway-b2bi", sourceId: "cpo-gateway", targetId: "b2bi", isActive: true, flowRate: 2 },
  { id: "b2bi-ecb", sourceId: "b2bi", targetId: "ecb", isActive: true, flowRate: 3 },
  {
    id: "swift-alliance-gpo",
    sourceId: "swift-alliance",
    targetId: "gpo",
    isActive: true,
    isCritical: true,
    flowRate: 5,
  },
  {
    id: "swift-alliance-cashpro-payments",
    sourceId: "swift-alliance",
    targetId: "cashpro-payments",
    isActive: true,
    flowRate: 4,
  },
  { id: "gpo-rpi", sourceId: "gpo", targetId: "rpi", isActive: true, flowRate: 3 },
  { id: "gpo-cashpro-payments", sourceId: "gpo", targetId: "cashpro-payments", isActive: true, flowRate: 3 },
  {
    id: "cashpro-payments-psh",
    sourceId: "cashpro-payments",
    targetId: "psh",
    isActive: true,
    isCritical: true,
    flowRate: 5,
  },
  { id: "cashpro-payments-mrp", sourceId: "cashpro-payments", targetId: "mrp", isActive: true, flowRate: 4 },
  { id: "frp-us-psh", sourceId: "frp-us", targetId: "psh", isActive: false, flowRate: 1 },
  { id: "psh-mrp", sourceId: "psh", targetId: "mrp", isActive: true, flowRate: 3 },
  { id: "rpi-gbs-aries", sourceId: "rpi", targetId: "gbs-aries", isActive: true, flowRate: 2 },
  { id: "mrp-wtx", sourceId: "mrp", targetId: "wtx", isActive: true, isCritical: true, flowRate: 5 },
  { id: "gbs-aries-gtms", sourceId: "gbs-aries", targetId: "gtms", isActive: true, flowRate: 3 },
  { id: "gbs-aries-ets", sourceId: "gbs-aries", targetId: "ets", isActive: true, flowRate: 2 },
  { id: "gtms-ets", sourceId: "gtms", targetId: "ets", isActive: true, flowRate: 3 },
  { id: "ets-gfd", sourceId: "ets", targetId: "gfd", isActive: true, flowRate: 4 },
  { id: "gfd-wtx", sourceId: "gfd", targetId: "wtx", isActive: true, flowRate: 3 },
  { id: "wtx-rtfp", sourceId: "wtx", targetId: "rtfp", isActive: true, isCritical: true, flowRate: 5 },
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
  onEdit,
  editableSystems,
  isInitialLoad = false,
  entranceDelay = 0,
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
  onEdit: (nodeId: string) => void
  editableSystems: Record<string, EditableSystemNode>
  isInitialLoad?: boolean
  entranceDelay?: number
}) => {
  const nodeRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)

  // Get editable data for this system
  const editableData = editableSystems[system.id] || {
    name: system.name,
    aitNumber: system.aitNumber,
    description: `${system.name} - Payment processing system`,
    status: system.status,
  }

  // GSAP Entrance Animation
  useEffect(() => {
    if (isInitialLoad && nodeRef.current && !hasAnimated) {
      const node = nodeRef.current

      // Set initial state - hidden and positioned off-screen to the left
      gsap.set(node, {
        opacity: 0,
        scale: 0.9,
        x: -100,
        y: 20,
        rotation: -5,
      })

      // Create entrance animation with stagger delay
      const tl = gsap.timeline({
        delay: entranceDelay,
        onComplete: () => setHasAnimated(true),
      })

      tl.to(node, {
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        rotation: 0,
        duration: 0.8,
        ease: "back.out(1.7)",
      })
        .to(
          node,
          {
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
            duration: 0.3,
            ease: "power2.out",
          },
          "-=0.3",
        )
        .to(
          node,
          {
            scale: 1.05,
            duration: 0.2,
            ease: "power2.out",
            yoyo: true,
            repeat: 1,
          },
          "-=0.1",
        )

      return () => {
        tl.kill()
      }
    }
  }, [isInitialLoad, entranceDelay, hasAnimated])

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: isDragging ? 1 : 1.02 }}
      whileDrag={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
      animate={{
        scale: isDragging ? 1.05 : 1,
        boxShadow: isDragging ? "0 20px 25px -5px rgba(0, 0, 0, 0.1)" : "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Edit Button */}
      {isHovered && (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(system.id)
          }}
          className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full opacity-90 hover:opacity-100 transition-all"
          title="Edit node"
        >
          <Edit3 className="w-3 h-3" />
        </Button>
      )}

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
          <h3 className="font-semibold text-gray-800 mb-1 leading-tight">{editableData.name}</h3>
          <p className="text-gray-600 mb-2 leading-tight">{editableData.aitNumber}</p>
        </div>
        <div className="flex flex-wrap gap-1 justify-center mb-2">
          <StatusBadge status={editableData.status.flow} label="Flow" />
          <StatusBadge status={editableData.status.trend} label="Trend" />
          <StatusBadge status={editableData.status.balanced} label="Balanced" />
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

const AnimatedConnectionLine = ({
  connection,
  sourcePos,
  targetPos,
  isHighlighted = false,
  isTemporary = false,
  isSelected = false,
  onSelect,
  onRightClick,
  animationsEnabled = true,
  entranceDelay = 0,
}: {
  connection?: Connection
  sourcePos: Position
  targetPos: Position
  isHighlighted?: boolean
  isTemporary?: boolean
  isSelected?: boolean
  onSelect?: (connectionId: string) => void
  onRightClick?: (e: React.MouseEvent, connectionId: string) => void
  animationsEnabled?: boolean
  entranceDelay?: number
}) => {
  const pathRef = useRef<SVGPathElement>(null)
  const flowRef = useRef<SVGPathElement>(null)
  const pulseRef = useRef<SVGCircleElement>(null)
  const glowRef = useRef<SVGPathElement>(null)

  const midX = (sourcePos.x + targetPos.x) / 2
  const midY = (sourcePos.y + targetPos.y) / 2

  const controlPoint1X = sourcePos.x + (targetPos.x - sourcePos.x) * 0.3
  const controlPoint1Y = sourcePos.y
  const controlPoint2X = sourcePos.x + (targetPos.x - sourcePos.x) * 0.7
  const controlPoint2Y = targetPos.y

  const pathData = `M ${sourcePos.x} ${sourcePos.y} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${targetPos.x} ${targetPos.y}`

  // Calculate path length for animations
  const pathLength = useRef<number>(0)

  useEffect(() => {
    if (pathRef.current) {
      pathLength.current = pathRef.current.getTotalLength()
    }
  }, [pathData])

  // GSAP Entrance Animation for connections
  useEffect(() => {
    if (connection && pathRef.current && entranceDelay > 0) {
      const path = pathRef.current

      // Set initial state - path drawn from 0 to 0 (invisible)
      gsap.set(path, {
        strokeDasharray: pathLength.current,
        strokeDashoffset: pathLength.current,
        opacity: 0,
      })

      // Animate the path drawing in
      gsap
        .timeline({ delay: entranceDelay + 0.5 }) // Start after nodes begin animating
        .to(path, {
          strokeDashoffset: 0,
          opacity: 1,
          duration: 1.2,
          ease: "power2.out",
        })
        .set(path, {
          strokeDasharray: "none",
          strokeDashoffset: 0,
        })
    }
  }, [connection, entranceDelay])

  // GSAP Flow Animations
  useEffect(() => {
    if (!connection || !animationsEnabled) return

    const tl = gsap.timeline({ repeat: -1 })

    if (connection.isActive) {
      // Flow animation - moving dash pattern
      if (flowRef.current) {
        const dashLength = 20
        const gapLength = 10
        const totalDash = dashLength + gapLength

        gsap.set(flowRef.current, {
          strokeDasharray: `${dashLength} ${gapLength}`,
          strokeDashoffset: 0,
        })

        const speed = connection.flowRate || 1
        const duration = 3 / speed // Faster for higher flow rates

        gsap.to(flowRef.current, {
          strokeDashoffset: -totalDash,
          duration: duration,
          ease: "none",
          repeat: -1,
        })
      }

      // Pulse animation for critical paths
      if (connection.isCritical && pulseRef.current) {
        gsap.to(pulseRef.current, {
          r: 8,
          opacity: 0,
          duration: 1,
          ease: "power2.out",
          repeat: -1,
          yoyo: false,
        })
      }

      // Glow effect for critical paths
      if (connection.isCritical && glowRef.current) {
        gsap.to(glowRef.current, {
          strokeWidth: 8,
          opacity: 0.3,
          duration: 1.5,
          ease: "power2.inOut",
          repeat: -1,
          yoyo: true,
        })
      }
    }

    return () => {
      tl.kill()
    }
  }, [connection, animationsEnabled])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
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

  if (!connection && isTemporary) {
    // Temporary connection line (no interaction)
    return (
      <g>
        <path
          d={pathData}
          stroke="#10b981"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arrowhead)"
          className="stroke-dasharray-[5,5] animate-pulse"
        />
      </g>
    )
  }

  const getConnectionColor = () => {
    if (isSelected) return "#ef4444"
    if (isHighlighted) return "#3b82f6"
    if (connection?.isCritical) return "#dc2626"
    if (connection?.isActive) return "#059669"
    return "#374151"
  }

  const getConnectionWidth = () => {
    if (isSelected) return 4
    if (connection?.isCritical) return 3
    if (connection?.isActive) return 2.5
    return 2
  }

  return (
    <g>
      {/* Glow effect for critical paths */}
      {connection?.isCritical && (
        <path
          ref={glowRef}
          d={pathData}
          stroke="#dc2626"
          strokeWidth="6"
          fill="none"
          opacity="0.2"
          filter="blur(2px)"
        />
      )}

      {/* Invisible wider path for easier clicking */}
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth="16"
        fill="none"
        className="cursor-pointer"
        onClick={handleClick}
        onContextMenu={handleRightClick}
        style={{ pointerEvents: "stroke" }}
      />

      {/* Main connection line */}
      <path
        ref={pathRef}
        d={pathData}
        stroke={getConnectionColor()}
        strokeWidth={getConnectionWidth()}
        fill="none"
        markerEnd="url(#arrowhead)"
        className="cursor-pointer hover:stroke-blue-500 transition-colors"
        onClick={handleClick}
        onContextMenu={handleRightClick}
        style={{ pointerEvents: "none" }}
      />

      {/* Animated flow line for active connections */}
      {connection?.isActive && (
        <path
          ref={flowRef}
          d={pathData}
          stroke={connection.isCritical ? "#fbbf24" : "#10b981"}
          strokeWidth="3"
          fill="none"
          opacity="0.8"
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Selection indicator */}
      {isSelected && (
        <circle cx={midX} cy={midY} r="6" fill="#ef4444" stroke="white" strokeWidth="2" className="animate-pulse" />
      )}

      {/* Pulse effect for critical paths */}
      {connection?.isCritical && connection?.isActive && (
        <circle
          ref={pulseRef}
          cx={midX}
          cy={midY}
          r="4"
          fill={connection.isCritical ? "#dc2626" : "#059669"}
          opacity="0.6"
        />
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
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (visible && menuRef.current) {
      gsap.fromTo(
        menuRef.current,
        {
          opacity: 0,
          scale: 0.9,
          y: -10,
          transformOrigin: "top center",
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.2,
          ease: "back.out(1.7)",
        },
      )
    }
  }, [visible])

  if (!visible) return null

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-300 rounded-lg shadow-lg py-2 z-[60]"
      style={{ left: position.x, top: position.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <Trash2 className="w-4 h-4" />
        Delete Connection
      </button>
      <button
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 w-full text-left transition-colors"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      >
        <X className="w-4 h-4" />
        Cancel
      </button>
    </div>
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
  const backdropRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (visible && backdropRef.current && modalRef.current) {
      // Set initial states
      gsap.set(backdropRef.current, { opacity: 0 })
      gsap.set(modalRef.current, {
        scale: 0.7,
        opacity: 0,
        y: 50,
        transformOrigin: "center center",
      })

      // Animate in
      const tl = gsap.timeline()
      tl.to(backdropRef.current, {
        opacity: 1,
        duration: 0.25,
        ease: "power2.out",
      }).to(
        modalRef.current,
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "back.out(1.7)",
        },
        "-=0.1",
      )
    }
  }, [visible])

  const handleClose = (callback: () => void) => {
    if (backdropRef.current && modalRef.current) {
      const tl = gsap.timeline({
        onComplete: callback,
      })

      tl.to(modalRef.current, {
        scale: 0.8,
        opacity: 0,
        y: 30,
        duration: 0.3,
        ease: "power2.in",
      }).to(
        backdropRef.current,
        {
          opacity: 0,
          duration: 0.2,
          ease: "power2.in",
        },
        "-=0.2",
      )
    } else {
      callback()
    }
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[70]">
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => handleClose(onCancel)}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          ref={modalRef}
          className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold mb-2">Delete Connection</h3>
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete this connection? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => handleClose(onCancel)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleClose(onConfirm)}>
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
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
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [entranceAnimationComplete, setEntranceAnimationComplete] = useState(false)

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

  const [nodeEditState, setNodeEditState] = useState<NodeEditState>({
    isOpen: false,
    nodeId: null,
    editData: null,
    errors: {},
    hasChanges: false,
  })
  const [editableSystems, setEditableSystems] = useState<Record<string, EditableSystemNode>>({})

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

  // Trigger entrance animation completion
  useEffect(() => {
    if (isInitialLoad) {
      const maxDelay = SWIM_LANES.length * 0.3 + 2 // Account for stagger + animation duration
      const timer = setTimeout(() => {
        setEntranceAnimationComplete(true)
      }, maxDelay * 1000)

      return () => clearTimeout(timer)
    }
  }, [isInitialLoad])

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
          isActive: true,
          flowRate: 3,
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
      setConnections((prev) => {
        const newConnections = prev.filter((conn) => conn.id !== connectionToDelete)
        return newConnections
      })
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
    // Trigger entrance animation again
    setIsInitialLoad(true)
    setEntranceAnimationComplete(false)
    setTimeout(() => setIsInitialLoad(false), 100)
  }

  // Replay entrance animation
  const handleReplayAnimation = () => {
    setIsInitialLoad(true)
    setEntranceAnimationComplete(false)
    setTimeout(() => setIsInitialLoad(false), 100)
  }

  // Initialize editable systems from context
  useEffect(() => {
    const editableData: Record<string, EditableSystemNode> = {}
    systems.forEach((system) => {
      editableData[system.id] = {
        id: system.id,
        name: system.name,
        aitNumber: system.aitNumber,
        description: `${system.name} - Payment processing system`,
        status: system.status,
      }
    })
    setEditableSystems(editableData)
  }, [systems])

  // Node editing handlers
  const handleNodeEdit = useCallback(
    (nodeId: string) => {
      const system = editableSystems[nodeId]
      if (system) {
        setNodeEditState({
          isOpen: true,
          nodeId,
          editData: { ...system },
          errors: {},
          hasChanges: false,
        })
      }
    },
    [editableSystems],
  )

  const handleEditFieldChange = useCallback(
    (field: string, value: string) => {
      setNodeEditState((prev) => {
        if (!prev.editData) return prev

        const newEditData = { ...prev.editData, [field]: value }
        const hasChanges = JSON.stringify(newEditData) !== JSON.stringify(editableSystems[prev.nodeId!])

        // Clear field-specific errors when user starts typing
        const newErrors = { ...prev.errors }
        if (newErrors[field]) {
          delete newErrors[field]
        }

        return {
          ...prev,
          editData: newEditData,
          errors: newErrors,
          hasChanges,
        }
      })
    },
    [editableSystems],
  )

  const handleStatusChange = useCallback(
    (statusType: string, value: string) => {
      setNodeEditState((prev) => {
        if (!prev.editData) return prev

        const newEditData = {
          ...prev.editData,
          status: {
            ...prev.editData.status,
            [statusType]: value as "active" | "warning" | "error",
          },
        }
        const hasChanges = JSON.stringify(newEditData) !== JSON.stringify(editableSystems[prev.nodeId!])

        return {
          ...prev,
          editData: newEditData,
          hasChanges,
        }
      })
    },
    [editableSystems],
  )

  const validateEditData = useCallback((data: EditableSystemNode): Record<string, string> => {
    const errors: Record<string, string> = {}

    if (!data.name.trim()) {
      errors.name = "System name is required"
    } else if (data.name.length < 2) {
      errors.name = "System name must be at least 2 characters"
    } else if (data.name.length > 50) {
      errors.name = "System name must be less than 50 characters"
    }

    if (!data.aitNumber.trim()) {
      errors.aitNumber = "AIT number is required"
    } else if (!/^AIT\s+\d+$/.test(data.aitNumber)) {
      errors.aitNumber = "AIT number must follow format 'AIT XXXXX'"
    }

    if (data.description && data.description.length > 200) {
      errors.description = "Description must be less than 200 characters"
    }

    return errors
  }, [])

  const handleSaveEdit = useCallback(() => {
    if (!nodeEditState.editData || !nodeEditState.nodeId) return

    const errors = validateEditData(nodeEditState.editData)

    if (Object.keys(errors).length > 0) {
      setNodeEditState((prev) => ({ ...prev, errors }))
      return
    }

    // Update the editable systems
    setEditableSystems((prev) => ({
      ...prev,
      [nodeEditState.nodeId!]: { ...nodeEditState.editData! },
    }))

    // Close the dialog
    setNodeEditState({
      isOpen: false,
      nodeId: null,
      editData: null,
      errors: {},
      hasChanges: false,
    })
  }, [nodeEditState, validateEditData])

  const handleCancelEdit = useCallback(() => {
    setNodeEditState({
      isOpen: false,
      nodeId: null,
      editData: null,
      errors: {},
      hasChanges: false,
    })
  }, [])

  const filteredSystems = searchResult ? systems.filter((system) => searchResult.path.includes(system.id)) : systems

  // Calculate entrance delays for staggered animation
  const getEntranceDelay = (systemId: string): number => {
    const laneIndex = SWIM_LANES.findIndex((lane) => lane.systems.includes(systemId))
    const systemsInLane = systems.filter((system) => SWIM_LANES[laneIndex]?.systems.includes(system.id))
    const systemIndexInLane = systemsInLane.findIndex((system) => system.id === systemId)

    // Stagger by lane first, then by system within lane
    return laneIndex * 0.3 + systemIndexInLane * 0.1
  }

  return (
    <div
      className="w-full bg-gradient-to-br from-orange-100 to-orange-200 relative overflow-hidden"
      style={{ height: `${viewportDimensions.availableHeight}px` }}
    >
      {/* Controls */}
      <div className="absolute top-2 right-2 z-20 flex flex-col gap-1">
        <Button
          size="sm"
          onClick={handleReplayAnimation}
          className="bg-purple-500 hover:bg-purple-600 text-white h-8 w-8 p-0"
          title="Replay entrance animation"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          onClick={() => setAnimationsEnabled(!animationsEnabled)}
          className={`${
            animationsEnabled ? "bg-green-500 hover:bg-green-600" : "bg-gray-500 hover:bg-gray-600"
          } text-white h-8 w-8 p-0`}
          title={animationsEnabled ? "Disable animations" : "Enable animations"}
        >
          {animationsEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
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
        <div className="font-semibold mb-1 flex items-center gap-1">
          <Zap className="w-3 h-3 text-yellow-500" />
          Animated Flow Controls:
        </div>
        <div>• Staggered entrance animations</div>
        <div>• Green flows = Active payments</div>
        <div>• Red flows = Critical paths</div>
        <div>• Yellow pulses = High priority</div>
        <div>• Replay button for entrance animation</div>
        <div>• Right-click connections to delete</div>
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
            <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#059669" />
            </marker>
            <marker id="arrowhead-critical" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#dc2626" />
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

            const entranceDelay = Math.max(getEntranceDelay(connection.sourceId), getEntranceDelay(connection.targetId))

            return (
              <AnimatedConnectionLine
                key={connection.id}
                connection={connection}
                sourcePos={sourcePos}
                targetPos={targetPos}
                isHighlighted={isHighlighted}
                isSelected={selectedConnection === connection.id}
                onSelect={handleConnectionSelect}
                onRightClick={handleConnectionRightClick}
                animationsEnabled={animationsEnabled}
                entranceDelay={isInitialLoad ? entranceDelay : 0}
              />
            )
          })}

          {connectionState.isConnecting && connectionState.sourcePosition && connectionState.currentPosition && (
            <AnimatedConnectionLine
              sourcePos={connectionState.sourcePosition}
              targetPos={connectionState.currentPosition}
              isTemporary={true}
              animationsEnabled={animationsEnabled}
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

            const entranceDelay = getEntranceDelay(system.id)

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
                onEdit={handleNodeEdit}
                editableSystems={editableSystems}
                isInitialLoad={isInitialLoad}
                entranceDelay={entranceDelay}
              />
            )
          })}
        </AnimatePresence>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <ContextMenu
          visible={contextMenu.visible}
          position={contextMenu.position}
          onDelete={() => contextMenu.connectionId && handleDeleteConnection(contextMenu.connectionId)}
          onClose={() => setContextMenu({ visible: false, position: { x: 0, y: 0 }, connectionId: null })}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <DeleteConfirmation
          visible={showDeleteConfirmation}
          onConfirm={confirmDeleteConnection}
          onCancel={cancelDeleteConnection}
        />
      )}

      {/* Node Edit Dialog */}
      <Dialog open={nodeEditState.isOpen} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5" />
              Edit System Node
            </DialogTitle>
          </DialogHeader>

          {nodeEditState.editData && (
            <div className="space-y-4">
              {/* System Name */}
              <div className="space-y-2">
                <Label htmlFor="name">System Name</Label>
                <Input
                  id="name"
                  value={nodeEditState.editData.name}
                  onChange={(e) => handleEditFieldChange("name", e.target.value)}
                  placeholder="Enter system name"
                  className={nodeEditState.errors.name ? "border-red-500" : ""}
                />
                {nodeEditState.errors.name && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{nodeEditState.errors.name}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* AIT Number */}
              <div className="space-y-2">
                <Label htmlFor="aitNumber">AIT Number</Label>
                <Input
                  id="aitNumber"
                  value={nodeEditState.editData.aitNumber}
                  onChange={(e) => handleEditFieldChange("aitNumber", e.target.value)}
                  placeholder="AIT XXXXX"
                  className={nodeEditState.errors.aitNumber ? "border-red-500" : ""}
                />
                {nodeEditState.errors.aitNumber && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{nodeEditState.errors.aitNumber}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={nodeEditState.editData.description || ""}
                  onChange={(e) => handleEditFieldChange("description", e.target.value)}
                  placeholder="Enter system description"
                  rows={3}
                  className={nodeEditState.errors.description ? "border-red-500" : ""}
                />
                {nodeEditState.errors.description && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{nodeEditState.errors.description}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Status Controls */}
              <div className="space-y-3">
                <Label>System Status</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="flow-status" className="text-sm">
                      Flow
                    </Label>
                    <Select
                      value={nodeEditState.editData.status.flow}
                      onValueChange={(value) => handleStatusChange("flow", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trend-status" className="text-sm">
                      Trend
                    </Label>
                    <Select
                      value={nodeEditState.editData.status.trend}
                      onValueChange={(value) => handleStatusChange("trend", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="balanced-status" className="text-sm">
                      Balanced
                    </Label>
                    <Select
                      value={nodeEditState.editData.status.balanced}
                      onValueChange={(value) => handleStatusChange("balanced", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-800 mb-1">{nodeEditState.editData.name}</h4>
                    <p className="text-gray-600 mb-2 text-sm">{nodeEditState.editData.aitNumber}</p>
                    <div className="flex gap-1 justify-center">
                      <StatusBadge status={nodeEditState.editData.status.flow} label="Flow" />
                      <StatusBadge status={nodeEditState.editData.status.trend} label="Trend" />
                      <StatusBadge status={nodeEditState.editData.status.balanced} label="Balanced" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!nodeEditState.hasChanges || Object.keys(nodeEditState.errors).length > 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
