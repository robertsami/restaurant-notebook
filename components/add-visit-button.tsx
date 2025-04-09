"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, PlusCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { ImageUpload } from "@/components/image-upload"
import { UserSearch } from "@/components/user-search"

type AddVisitButtonProps = {
  restaurantId: string
  userId: string
}

export function AddVisitButton({ restaurantId, userId }: AddVisitButtonProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [notes, setNotes] = useState("")
  const [photos, setPhotos] = useState<string[]>([])
  const [participants, setParticipants] = useState<string[]>([userId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!date) {
      toast({
        title: "Date required",
        description: "Please select a date for your visit.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch("/api/visits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurantId,
          date: date.toISOString(),
          notes,
          photos,
          participants,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add visit")
      }

      toast({
        title: "Visit added",
        description: "Your visit has been recorded successfully.",
      })

      setIsDialogOpen(false)
      setDate(new Date())
      setNotes("")
      setPhotos([])
      setParticipants([userId])
      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: "Something went wrong",
        description: "Failed to add your visit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function handlePhotoUpload(url: string) {
    setPhotos((prev) => [...prev, url])
  }

  function handleRemovePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Visit
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Visit</DialogTitle>
            <DialogDescription>Record your visit to this restaurant.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Participants</label>
              <UserSearch
                selectedUsers={participants}
                onSelectUser={(userId) => {
                  if (!participants.includes(userId)) {
                    setParticipants([...participants, userId])
                  }
                }}
                onRemoveUser={(userId) => {
                  setParticipants(participants.filter((id) => id !== userId))
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                placeholder="What did you think of your experience?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Photos</label>
              <div className="grid grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                    <Image
                      src={photo || "/placeholder.svg"}
                      alt={`Visit photo ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => handleRemovePhoto(index)}
                    >
                      <span className="sr-only">Remove photo</span>
                      <span aria-hidden>×</span>
                    </Button>
                  </div>
                ))}
                <ImageUpload value="" onChange={handlePhotoUpload} disabled={isSubmitting} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Visit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
