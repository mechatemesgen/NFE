import { createServerClient } from "@/lib/supabase-server"
import OpportunityList from "@/components/opportunity-list"
import DashboardHeader from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function Home() {
  const supabase = createServerClient()

  // Check if the opportunities table exists
  const { error: tableCheckError } = await supabase.from("opportunities").select("id").limit(1).maybeSingle()

  // If we get a "relation does not exist" error, the table doesn't exist yet
  const tableDoesNotExist =
    tableCheckError?.message?.includes("relation") && tableCheckError?.message?.includes("does not exist")

  if (tableDoesNotExist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome to Opportunity Desk</h1>
          <p className="text-lg mb-8">
            It looks like your database tables haven't been set up yet. Let's get started by initializing your database.
          </p>
          <Button asChild size="lg">
            <Link href="/setup">Initialize Database</Link>
          </Button>
        </div>
      </div>
    )
  }

  // If the table exists, try to fetch opportunities
  try {
    const { data: opportunities, error } = await supabase
      .from("opportunities")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching opportunities:", JSON.stringify(error, null, 2))
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Error Loading Opportunities</h1>
            <p className="text-lg mb-8">
              There was a problem loading opportunities. Please try again or check your database connection.
            </p>
            <pre className="bg-gray-100 p-4 rounded text-left overflow-auto text-sm">
              {error.message || JSON.stringify(error, null, 2)}
            </pre>
          </div>
        </div>
      )
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <DashboardHeader />
        <OpportunityList opportunities={opportunities || []} />
      </div>
    )
  } catch (error) {
    console.error("Unexpected error:", error)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Unexpected Error</h1>
          <p className="text-lg mb-8">An unexpected error occurred. Please try again or check your configuration.</p>
          <Button asChild>
            <Link href="/setup">Go to Setup</Link>
          </Button>
        </div>
      </div>
    )
  }
}
