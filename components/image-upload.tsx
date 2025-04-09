"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

type ImageUploadProps = {
  value: string
  onChange: (url: string) => void
  disabled?: boolean
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]

    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload image")
      }

      const data = await response.json()
      onChange(data.url)
    } catch (error) {
      console.error(error)
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div>
      {value ? (
        <div className="relative aspect-square rounded-md overflow-hidden">
          <Image src={value || "/placeholder.svg"} alt="Uploaded image" fill className="object-cover" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={() => onChange("")}
            disabled={disabled}
          >
            <span className="sr-only">Remove image</span>
            <span aria-hidden>×</span>
          </Button>
        </div>
      ) : (
        <div className="relative">
          <label
            htmlFor="image-upload"
            className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-md border border-dashed p-4 text-muted-foreground hover:bg-muted"
          >
            <Upload className="h-6 w-6 mb-2" />
            <span className="text-xs">Upload image</span>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleUpload}
              disabled={disabled || isUploading}
            />
          </label>
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
