"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Network } from "lucide-react"

interface WelcomeScreenProps {
  navigate: (view: string) => void
}

export default function WelcomeScreen({ navigate }: WelcomeScreenProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  }

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="mb-16 text-center" variants={itemVariants}>
        <div className="flex items-center justify-center mb-4">
          <Network className="w-8 h-8 text-green-400 mr-3" />
          <h1 className="text-4xl font-bold text-white">Global Banking APS End-to-End Payment Monitor</h1>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl w-full">
        {/* US Wire Section */}
        <motion.div
          className="bg-blue-600 rounded-lg p-8 text-center"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h2 className="text-2xl font-bold text-white mb-8">US Wire</h2>
          <div className="space-y-4">
            <Button
              onClick={() => navigate("flow")}
              className="w-full bg-blue-500 hover:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              size="lg"
            >
              E2E Payment Flow
            </Button>
            <Button
              onClick={() => navigate("search")}
              className="w-full bg-blue-500 hover:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              size="lg"
            >
              E2E Payment Search
            </Button>
          </div>
        </motion.div>

        {/* APAC Payments Section (Disabled) */}
        <motion.div className="bg-gray-600 rounded-lg p-8 text-center opacity-50" variants={itemVariants}>
          <h2 className="text-2xl font-bold text-gray-300 mb-8">APAC Payments</h2>
          <div className="space-y-4">
            <Button
              disabled
              className="w-full bg-gray-500 text-gray-300 font-semibold py-3 px-6 rounded-lg cursor-not-allowed"
              size="lg"
            >
              E2E Payment Flow
            </Button>
            <Button
              disabled
              className="w-full bg-gray-500 text-gray-300 font-semibold py-3 px-6 rounded-lg cursor-not-allowed"
              size="lg"
            >
              E2E Payment Search
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
