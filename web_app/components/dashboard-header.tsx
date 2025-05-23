"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MegaphoneIcon, RefreshCwIcon, DownloadIcon, AlertCircleIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function DashboardHeader() {
  const [isScraping, setIsScraping] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const handleScrape = async () => {
    setIsScraping(true)
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || "your-secret"}`,
        },
        body: JSON.stringify({}),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Scraping completed",
          description: "New opportunities have been fetched and saved to the database.",
        })
        // Refresh the page to show new data
        window.location.reload()
      } else {
        toast({
          title: "Scraping failed",
          description: result.error || "There was a problem scraping opportunities.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start scraping process.",
        variant: "destructive",
      })
    } finally {
      setIsScraping(false)
    }
  }

  const handlePostAllApproved = async () => {
    setIsPosting(true)
    setIsDialogOpen(false)

    try {
      const response = await fetch("/api/cron/telegram", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || "your-secret"}`,
        },
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: "Posting completed",
          description: `Successfully posted "${result.posted}" to Telegram.`,
        })
        // Refresh the page to update status
        setTimeout(() => window.location.reload(), 1500)
      } else if (response.ok && result.message) {
        toast({
          title: "No posts to send",
          description: result.message,
        })
      } else {
        toast({
          title: "Posting failed",
          description: result.error || "There was a problem posting to Telegram.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post approved opportunities.",
        variant: "destructive",
      })
    } finally {
      setIsPosting(false)
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
      <div>
        <h1 className="text-3xl font-bold">Opportunity Desk</h1>
        <p className="text-muted-foreground">Manage and approve opportunities for Telegram posting</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex items-center gap-2" onClick={handleRefresh}>
          <RefreshCwIcon size={16} />
          Refresh Data
        </Button>
        <Button variant="outline" className="flex items-center gap-2" onClick={handleScrape} disabled={isScraping}>
          <DownloadIcon size={16} className={isScraping ? "animate-spin" : ""} />
          {isScraping ? "Scraping..." : "Scrape New Data"}
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <MegaphoneIcon size={16} />
              Post Approved
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Post to Telegram</DialogTitle>
              <DialogDescription>
                This will post the next approved opportunity to your Telegram channel.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-start gap-4 py-4">
              <AlertCircleIcon className="text-amber-500 mt-0.5" size={20} />
              <div>
                <h4 className="font-medium">Please confirm</h4>
                <p className="text-sm text-muted-foreground">
                  Opportunities will be posted one at a time in the order they were approved.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePostAllApproved} disabled={isPosting}>
                {isPosting ? "Posting..." : "Post Now"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
