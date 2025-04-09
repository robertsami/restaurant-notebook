#!/bin/bash

# Find all files with the old import
FILES=$(find app -type f -name "*.ts" -o -name "*.tsx" | xargs grep -l "import { getServerSession } from \"next-auth\"")

# Loop through each file and update the imports
for file in $FILES; do
  echo "Updating $file"
  # Replace the import statement
  sed -i 's/import { getServerSession } from "next-auth"/import { auth } from "@\/lib\/auth"/g' "$file"
  
  # Replace authOptions with auth()
  sed -i 's/const session = await getServerSession(authOptions)/const session = await auth()/g' "$file"
  
  # Remove import for authOptions if it exists
  sed -i '/import { authOptions } from "@\/lib\/auth"/d' "$file"
done

echo "All files updated!"