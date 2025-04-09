"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { ImageUpload } from "@/components/image-upload"

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  coverImage: z.string().url().optional(),
  collaborators: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function CreateListForm({ userId }: { userId: string | undefined }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      coverImage: "",
      collaborators: "",
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      setIsLoading(true)

      const collaborators = values.collaborators ? values.collaborators.split(",").map((email) => email.trim()) : []

      const response = await fetch("/api/lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          collaborators,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create list")
      }

      const list = await response.json()

      toast({
        title: "List created",
        description: "Your restaurant list has been created successfully.",
      })

      router.push(`/lists/${list.id}`)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: "Something went wrong",
        description: "Failed to create your list. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="coverImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Image</FormLabel>
              <FormControl>
                <ImageUpload value={field.value || ""} onChange={field.onChange} disabled={isLoading} />
              </FormControl>
              <FormDescription>Choose an image to represent your list</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="My Favorite Restaurants" {...field} disabled={isLoading} />
              </FormControl>
              <FormDescription>Give your list a descriptive name</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="A collection of restaurants I want to try..." {...field} disabled={isLoading} />
              </FormControl>
              <FormDescription>Optional description for your list</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="collaborators"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Collaborators</FormLabel>
              <FormControl>
                <Input placeholder="email1@example.com, email2@example.com" {...field} disabled={isLoading} />
              </FormControl>
              <FormDescription>Add collaborators by email (comma separated)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create List"}
        </Button>
      </form>
    </Form>
  )
}
