import Link from "next/link"
import {
  CalendarDaysIcon,
  CheckSquareIcon,
  MessageSquareTextIcon,
  UsersIcon,
} from "lucide-react"

import { AppleCard, AppleCardHeader, AppleCardTitle } from "@/components/feature/card"
import { MemberRow } from "@/components/feature/member-row"
import { MetricCard } from "@/components/feature/metric-card"
import { CheckInBanner } from "@/components/feature/check-in-banner"
import { OccupancyChart } from "@/components/feature/occupancy-chart"
import { TrendChart } from "@/components/feature/trend-chart"
import { PageHeader } from "@/components/layout/page-header"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  getDueCheckIns,
} from "@/lib/services/checkins"
import {
  getWeeklyMetrics,
  getWeeklyOverview,
  getWeeklyOccupancy,
} from "@/lib/services/dashboard"

export const metadata = {
  title: "Overview",
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function DashboardPage() {
  const [overview, metrics, dueCheckIns, occupancy] = await Promise.all([
    getWeeklyOverview(),
    getWeeklyMetrics(),
    getDueCheckIns(),
    getWeeklyOccupancy(),
  ])

  const averageLabel =
    metrics.feedbackAvg === null ? "No feedback yet" : metrics.feedbackAvg.toFixed(1)

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="This week"
        title="Team overview"
        description="Highlights for every member — upcoming time off, tasks due today and overdue follow-ups."
      />

      <CheckInBanner reminders={dueCheckIns} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Members"
          value={metrics.memberCount}
          hint="Active roster"
          icon={UsersIcon}
          tone="blue"
          href="/members"
        />
        <MetricCard
          label="Tasks open"
          value={metrics.openTasks}
          hint={`${metrics.completedTasks} completed`}
          icon={CheckSquareIcon}
          tone="violet"
          href="/tasks"
        />
        <MetricCard
          label="Avg rating"
          value={averageLabel}
          hint={`${metrics.feedbackCount} entries`}
          icon={MessageSquareTextIcon}
          tone="green"
          href="/feedback"
        />
        <MetricCard
          label="Time off this week"
          value={metrics.timeOffCount}
          hint="Approved time off"
          icon={CalendarDaysIcon}
          tone="amber"
          href="/calendar"
        />
      </div>

      <AppleCard>
        <AppleCardHeader>
          <div>
            <AppleCardTitle>Weekly activity</AppleCardTitle>
            <p className="text-sm text-muted-foreground">
              Last 7 days — follow-up records and feedback given.
            </p>
          </div>
        </AppleCardHeader>
        <TrendChart series={metrics.series} />
      </AppleCard>

      <OccupancyChart data={occupancy} />

      <AppleCard>
        <AppleCardHeader>
          <div>
            <AppleCardTitle>Members</AppleCardTitle>
            <p className="text-sm text-muted-foreground">
              Current week highlights per person.
            </p>
          </div>
          <Link
            href="/members"
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            View all
          </Link>
        </AppleCardHeader>
        {overview.members.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersIcon />
              </EmptyMedia>
              <EmptyTitle>No members yet</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <EmptyDescription>
                The roster is empty — add members to start tracking the week.
              </EmptyDescription>
            </EmptyContent>
          </Empty>
        ) : (
          <ul className="divide-y divide-foreground/5">
            {overview.members.map(({ member, highlights }) => (
              <li key={member.id}>
                <MemberRow member={member} highlights={highlights} />
              </li>
            ))}
          </ul>
        )}
      </AppleCard>
    </div>
  )
}
