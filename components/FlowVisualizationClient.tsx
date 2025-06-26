"use client"

import SwimLaneFlowDiagram from "./SwimLaneFlowDiagram"

interface FlowVisualizationClientProps {
  navigate: (view: string, systemId?: string) => void
}

export default function FlowVisualizationClient({ navigate }: FlowVisualizationClientProps) {
  return <SwimLaneFlowDiagram navigate={navigate} />
}
