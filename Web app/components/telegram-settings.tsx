"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface TelegramSettingsProps {
  schedule?: string
}

export default function TelegramSettings({ schedule = "0 12 * * *" }: TelegramSettingsProps) {
  const [botToken, setBotToken] = useState("")
  const [channelId, setChannelId] = useState("")
  const [postSchedule, setPostSchedule] = useState(schedule)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // In a real app, you would save these settings to your database
      // and update environment variables if needed

      toast({
        title: "Settings saved",
        description: "Your Telegram settings have been updated.",
      })
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    if (!botToken || !channelId) {
      toast({
        title: "Missing information",
        description: "Please enter both bot token and channel ID to test.",
        variant: "destructive",
      })
      return
    }

    setIsTesting(true)
    try {
      const response = await fetch("/api/telegram/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          botToken,
          channelId,
          message: "<b>Test Message</b>\n\nThis is a test message from your Opportunity Desk application.",
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Test successful",
          description: "The test message was sent to your Telegram channel.",
        })
      } else {
        toast({
          title: "Test failed",
          description: result.error || "There was a problem sending the test message.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test message. Please check your network connection.",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bot-token">Bot Token</Label>
        <Input
          id="bot-token"
          type="password"
          placeholder="Enter your Telegram bot token"
          value={botToken}
          onChange={(e) => setBotToken(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          You can get a bot token from{" "}
          <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="underline">
            @BotFather
          </a>{" "}
          on Telegram.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="channel-id">Channel ID</Label>
        <Input
          id="channel-id"
          placeholder="Enter your Telegram channel ID (e.g., @yourchannel)"
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          This is the ID of the channel where opportunities will be posted.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="post-schedule">Posting Schedule (cron format)</Label>
        <Input
          id="post-schedule"
          placeholder="0 12 * * *"
          value={postSchedule}
          onChange={(e) => setPostSchedule(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">Default: 12:00 PM daily. Use cron format (e.g., "0 12 * * *").</p>
      </div>

      <div className="flex gap-4">
        <Button onClick={handleTest} variant="outline" disabled={isTesting}>
          {isTesting ? "Testing..." : "Test Connection"}
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}
