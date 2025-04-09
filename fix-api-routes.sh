#!/bin/bash

# Find all API route files
API_ROUTES=$(find app/api -name "route.ts" -not -path "*/auth/*")

# Loop through each file and update it
for file in $API_ROUTES; do
  echo "Fixing $file"
  
  # Add import for ensureAuthApi if it doesn't exist
  if ! grep -q "import { ensureAuthApi } from" "$file"; then
    sed -i '/import { auth } from/a import { ensureAuthApi } from "@/lib/utils/session"' "$file"
  fi
  
  # Fix the session check pattern
  sed -i 's/const session = await auth()/const session = ensureAuthApi(await auth())/g' "$file"
  
  # Remove the if (!session) block
  sed -i '/if (!session) {/,/}/d' "$file"
  
  # Fix any broken try blocks (remove extra closing braces)
  sed -i 's/const session = ensureAuthApi(await auth())\n\n    }/const session = ensureAuthApi(await auth())/g' "$file"
done

echo "All API routes fixed!"