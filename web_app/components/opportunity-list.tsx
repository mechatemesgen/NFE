"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ExternalLinkIcon, SendIcon, CheckIcon, CalendarIcon, SortAscIcon, SortDescIcon } from "lucide-react"
import { approveOpportunity, postToTelegram } from "@/lib/actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, parseISO, isValid } from "date-fns"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Opportunity {
  id: number
  title: string
  description: string | null
  link: string | null
  deadline: string | null
  thumbnail: string | null
  approved: boolean
  posted_to_telegram: boolean
  created_at: string
}

export default function OpportunityList({ opportunities }: { opportunities: Opportunity[] }) {
  const [isPosting, setIsPosting] = useState<Record<number, boolean>>({})
  const [isApproving, setIsApproving] = useState<Record<number, boolean>>({}) // New state for approving
  const [activeTab, setActiveTab] = useState("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [sortField, setSortField] = useState<"created_at" | "deadline">("created_at")
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState<{
    startDate: string
    endDate: string
  }>({
    startDate: "",
    endDate: "",
  })

  // Apply filters and sorting
  useEffect(() => {
    let result = [...opportunities]

    // Filter by tab
    if (activeTab === "pending") {
      result = result.filter((opp) => !opp.approved)
    } else if (activeTab === "approved") {
      result = result.filter((opp) => opp.approved && !opp.posted_to_telegram)
    } else if (activeTab === "posted") {
      result = result.filter((opp) => opp.posted_to_telegram)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (opp) =>
          opp.title.toLowerCase().includes(term) || (opp.description && opp.description.toLowerCase().includes(term)),
      )
    }

    // Filter by date range
    if (dateFilter.startDate) {
      result = result.filter((opp) => {
        const createdDate = new Date(opp.created_at)
        const startDate = new Date(dateFilter.startDate)
        return createdDate >= startDate
      })
    }

    if (dateFilter.endDate) {
      result = result.filter((opp) => {
        const createdDate = new Date(opp.created_at)
        const endDate = new Date(dateFilter.endDate)
        // Set end date to end of day
        endDate.setHours(23, 59, 59, 999)
        return createdDate <= endDate
      })
    }

    // Sort results
    result.sort((a, b) => {
      let valueA, valueB

      if (sortField === "deadline") {
        // Handle null deadlines by treating them as "far future"
        valueA = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER
        valueB = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER
      } else {
        valueA = new Date(a.created_at).getTime()
        valueB = new Date(b.created_at).getTime()
      }

      return sortOrder === "asc" ? valueA - valueB : valueB - valueA
    })

    setFilteredOpportunities(result)
  }, [opportunities, activeTab, sortOrder, sortField, searchTerm, dateFilter])

  const handleApprove = async (id: number) => {
    setIsApproving((prev) => ({ ...prev, [id]: true })) // Set loading true
    try {
      await approveOpportunity(id)
    } catch (error) {
      console.error("Error approving opportunity:", error)
      // Optionally, show a toast notification for the error
    } finally {
      setIsApproving((prev) => ({ ...prev, [id]: false })) // Set loading false
    }
  }

  const handlePostToTelegram = async (opportunity: Opportunity) => {
    setIsPosting((prev) => ({ ...prev, [opportunity.id]: true }))
    try {
      await postToTelegram(opportunity.id)
    } catch (error) {
      console.error("Error posting to Telegram:", error)
    } finally {
      setIsPosting((prev) => ({ ...prev, [opportunity.id]: false }))
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      if (isValid(date)) {
        return format(date, "MMM d, yyyy")
      }
      return dateString
    } catch (error) {
      return dateString
    }
  }

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }

  const clearFilters = () => {
    setSearchTerm("")
    setDateFilter({ startDate: "", endDate: "" })
    setSortField("created_at")
    setSortOrder("desc")
  }

  return (
    <div>
      <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="posted">Posted</TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Input
                placeholder="Search opportunities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setSearchTerm("")}
                >
                  ×
                </Button>
              )}
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <CalendarIcon size={16} />
                  <span className="hidden md:inline">Date Filter</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Filter by Date</h4>
                  <div className="grid gap-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={dateFilter.startDate}
                      onChange={(e) => setDateFilter((prev) => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={dateFilter.endDate}
                      onChange={(e) => setDateFilter((prev) => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" size="sm" onClick={() => setDateFilter({ startDate: "", endDate: "" })}>
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => document.body.click()} // Close popover
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Select value={sortField} onValueChange={(value) => setSortField(value as "created_at" | "deadline")}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Added</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" size="icon" onClick={toggleSortOrder}>
              {sortOrder === "asc" ? <SortAscIcon size={16} /> : <SortDescIcon size={16} />}
            </Button>

            {(searchTerm ||
              dateFilter.startDate ||
              dateFilter.endDate ||
              sortField !== "created_at" ||
              sortOrder !== "desc") && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="all" className="mt-0">
          <OpportunityGrid
            opportunities={filteredOpportunities}
            isPosting={isPosting}
            isApproving={isApproving} // Pass new state
            handleApprove={handleApprove}
            handlePostToTelegram={handlePostToTelegram}
            formatDate={formatDate}
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          <OpportunityGrid
            opportunities={filteredOpportunities}
            isPosting={isPosting}
            isApproving={isApproving} // Pass new state
            handleApprove={handleApprove}
            handlePostToTelegram={handlePostToTelegram}
            formatDate={formatDate}
          />
        </TabsContent>

        <TabsContent value="approved" className="mt-0">
          <OpportunityGrid
            opportunities={filteredOpportunities}
            isPosting={isPosting}
            isApproving={isApproving} // Pass new state
            handleApprove={handleApprove}
            handlePostToTelegram={handlePostToTelegram}
            formatDate={formatDate}
          />
        </TabsContent>

        <TabsContent value="posted" className="mt-0">
          <OpportunityGrid
            opportunities={filteredOpportunities}
            isPosting={isPosting}
            isApproving={isApproving} // Pass new state
            handleApprove={handleApprove}
            handlePostToTelegram={handlePostToTelegram}
            formatDate={formatDate}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function OpportunityGrid({
  opportunities,
  isPosting,
  isApproving, // New prop
  handleApprove,
  handlePostToTelegram,
  formatDate,
}: {
  opportunities: Opportunity[]
  isPosting: Record<number, boolean>
  isApproving: Record<number, boolean> // New prop
  handleApprove: (id: number) => Promise<void>
  handlePostToTelegram: (opportunity: Opportunity) => Promise<void>
  formatDate: (dateString: string) => string
}) {
  if (opportunities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No opportunities found in this category.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {opportunities.map((opportunity, index) => ( // Added index
        <Card key={opportunity.id} className="flex flex-col h-full">
          <div className="relative h-48 w-full">
            {opportunity.thumbnail ? (
              <Image
                src={opportunity.thumbnail || "/placeholder.svg"}
                alt={opportunity.title}
                fill
                className="object-cover rounded-t-lg"
                priority={index === 0} // Add priority to the first image
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=200&width=400"
                }}
              />
            ) : (
              <div className="h-full w-full bg-muted flex items-center justify-center">
                <p className="text-muted-foreground">No image available</p>
              </div>
            )}
          </div>

          <CardContent className="flex-grow pt-6">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-bold line-clamp-2">{opportunity.title}</h2>
              <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                {formatDate(opportunity.created_at)}
              </div>
            </div>

            {opportunity.description && (
              <p className="text-muted-foreground mb-4 line-clamp-3">{opportunity.description}</p>
            )}

            {opportunity.deadline && (
              <div className="mb-2">
                <span className="font-semibold">Deadline:</span> {opportunity.deadline}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-2">
              {opportunity.approved && !opportunity.posted_to_telegram && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Approved
                </Badge>
              )}
              {opportunity.posted_to_telegram && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Posted to Telegram
                </Badge>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between pt-2 pb-4">
            <Button variant="outline" size="sm" asChild>
              <a
                href={opportunity.link || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <ExternalLinkIcon size={14} />
                View
              </a>
            </Button>

            <div className="flex gap-2">
              {!opportunity.approved ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-green-600"
                  onClick={() => handleApprove(opportunity.id)}
                  disabled={isApproving[opportunity.id]} // Disable button when approving
                >
                  {isApproving[opportunity.id] ? ( // Show loading text
                    <>Approving...</>
                  ) : (
                    <>
                      <CheckIcon size={14} />
                      Approve
                    </>
                  )}
                </Button>
              ) : !opportunity.posted_to_telegram ? (
                <Button
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handlePostToTelegram(opportunity)}
                  disabled={isPosting[opportunity.id]}
                >
                  {isPosting[opportunity.id] ? (
                    <>Posting...</>
                  ) : (
                    <>
                      <SendIcon size={14} />
                      Post to Telegram
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
