"use client"

import { useRef, useState, useTransition } from "react"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StarRatingInput } from "@/components/feature/star-rating"
import { createFeedbackAction } from "@/lib/actions/feedback"
import type { FeedbackCategory, Member } from "@/lib/domain"

type FeedbackFormProps = {
  members: Member[]
}

const CATEGORIES: Array<{ value: FeedbackCategory; label: string }> = [
  { value: "praise", label: "Praise" },
  { value: "coaching", label: "Coaching" },
  { value: "concern", label: "Concern" },
]

/**
 * Feedback submission form (REQ-FR-002): member, star rating, category and
 * content go through a Server Action and persist in SQLite.
 */
export function FeedbackForm({ members }: FeedbackFormProps) {
  const [memberId, setMemberId] = useState(members[0]?.id ?? "")
  const [rating, setRating] = useState(0)
  const [category, setCategory] = useState<FeedbackCategory>("praise")
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createFeedbackAction({
        memberId,
        rating,
        content: String(formData.get("content") ?? ""),
        category,
      })
      if (result.ok) {
        toast.success("Feedback saved")
        formRef.current?.reset()
        setRating(0)
        setCategory("praise")
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form ref={formRef} action={submit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="feedback-member">Member</Label>
          <Select value={memberId} onValueChange={(value) => setMemberId(value ?? "")}>
            <SelectTrigger id="feedback-member" aria-label="Member" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="feedback-category">Category</Label>
          <Select
            value={category}
            onValueChange={(value) => setCategory((value ?? "praise") as FeedbackCategory)}
          >
            <SelectTrigger id="feedback-category" aria-label="Category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label id="feedback-rating-label">Rating</Label>
        <StarRatingInput
          value={rating}
          onChange={setRating}
          ariaLabelledBy="feedback-rating-label"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="feedback-content">Notes</Label>
        <Textarea
          id="feedback-content"
          name="content"
          rows={3}
          required
          placeholder="What did this member do well, or where can they grow?"
        />
      </div>

      <div>
        <Button type="submit" disabled={isPending || rating === 0 || !memberId}>
          {isPending ? <Loader2Icon className="size-4 motion-safe:animate-spin motion-reduce:animate-none" aria-hidden /> : null}
          Save feedback
        </Button>
      </div>
    </form>
  )
}
