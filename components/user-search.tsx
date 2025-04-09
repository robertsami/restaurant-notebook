"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

type UserSearchProps = {
  selectedUsers: string[]
  onSelectUser: (userId: string) => void
  onRemoveUser: (userId: string) => void
}

type User = {
  id: string
  name: string
  email: string
  image: string
}

export function UserSearch({ selectedUsers, onSelectUser, onRemoveUser }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUserDetails, setSelectedUserDetails] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    async function fetchSelectedUsers() {
      try {
        const response = await fetch(`/api/users?ids=${selectedUsers.join(",")}`)
        if (response.ok) {
          const data = await response.json()
          setSelectedUserDetails(data)
        }
      } catch (error) {
        console.error("Failed to fetch selected users:", error)
      }
    }

    if (selectedUsers.length > 0) {
      fetchSelectedUsers()
    }
  }, [selectedUsers])

  async function handleSearch() {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    try {
      setIsSearching(true)
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.filter((user: User) => !selectedUsers.includes(user.id)))
      }
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    const debounce = setTimeout(() => {
      handleSearch()
    }, 300)

    return () => clearTimeout(debounce)
  }, [searchQuery])

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedUserDetails.map((user) => (
          <div key={user.id} className="flex items-center gap-1 bg-muted rounded-full pl-1 pr-2 py-1">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.image} alt={user.name || ""} />
              <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{user.name}</span>
            <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full" onClick={() => onRemoveUser(user.id)}>
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {user.name}</span>
            </Button>
          </div>
        ))}
      </div>

      <div className="relative">
        <Input
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {searchResults.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg">
            <ul className="py-1">
              {searchResults.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-muted cursor-pointer"
                  onClick={() => {
                    onSelectUser(user.id)
                    setSearchQuery("")
                    setSearchResults([])
                  }}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image} alt={user.name || ""} />
                    <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isSearching && (
          <div className="absolute right-3 top-2.5">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  )
}
