#!/bin/bash

# Find all API route files
API_ROUTES=$(find app/api -name "route.ts")

# Loop through each file and update it
for file in $API_ROUTES; do
  echo "Updating $file"
  
  # Add import for ensureAuthApi if it doesn't exist
  if ! grep -q "import { ensureAuthApi } from" "$file"; then
    sed -i '/import { auth } from/a import { ensureAuthApi } from "@/lib/utils/session"' "$file"
  fi
  
  # Replace session = await auth() with ensureAuthApi
  sed -i 's/const session = await auth()/const session = ensureAuthApi(await auth())/g' "$file"
  
  # Remove the session check that's now redundant
  sed -i '/if (!session) {/,/}/d' "$file"
done

echo "All API routes updated!"