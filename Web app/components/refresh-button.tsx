"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCwIcon } from "lucide-react"
import { refreshData } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"

export default function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshData()
      toast({
        title: "Data refreshed",
        description: "The latest opportunities have been loaded.",
      })
    } catch (error) {
      toast({
        title: "Error refreshing data",
        description: "There was a problem refreshing the data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Button variant="outline" className="flex items-center gap-2" onClick={handleRefresh} disabled={isRefreshing}>
      <RefreshCwIcon size={16} className={isRefreshing ? "animate-spin" : ""} />
      {isRefreshing ? "Refreshing..." : "Refresh Data"}
    </Button>
  )
}
