#!/bin/bash

# This script adds 'use client' directive to all React components that use client-side features

# Color configuration
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Adding 'use client' Directives to Client Components ===${NC}"

# Directory to scan
PROJECT_DIR="/Users/spencerpro/ailogogenerator"
COMPONENTS_DIR="${PROJECT_DIR}/components"

# Array of client-side features to detect
CLIENT_FEATURES=(
  "useState"
  "useEffect"
  "useRef"
  "useContext"
  "useReducer"
  "useMemo"
  "useCallback"
  "useImperativeHandle"
  "useLayoutEffect"
  "useDebugValue"
  "onClick"
  "onChange"
  "onSubmit"
  "onFocus"
  "onBlur"
  "onHover"
  "onTouchStart"
  "onTouchMove"
  "onTouchEnd"
  "onMouseDown"
  "onMouseMove"
  "onMouseUp"
  "onMouseLeave"
  "onDrag"
  "onDragStart"
  "onDragEnd"
  "createRef"
  "forwardRef"
  "window\."
  "document\."
  "navigator\."
  "localStorage"
  "sessionStorage"
  "new Blob"
  "URL\.createObjectURL"
  "createContext"
  "createPortal"
)

# Convert array to grep pattern
PATTERN=$(IFS="|"; echo "${CLIENT_FEATURES[*]}")

# Find all component files
COMPONENT_FILES=$(find "$COMPONENTS_DIR" -type f -name "*.tsx" -not -path "*/node_modules/*")

UPDATED_FILES=0
ALREADY_CLIENT=0
NO_CLIENT_FEATURES=0

# Process each component file
for file in $COMPONENT_FILES; do
  # Skip if the file already has 'use client' directive
  if grep -q "'use client'" "$file" || grep -q "\"use client\"" "$file"; then
    echo -e "${GREEN}✓${NC} $file - Already has 'use client' directive"
    ALREADY_CLIENT=$((ALREADY_CLIENT + 1))
    continue
  fi
  
  # Check if the file uses client-side features
  if grep -E -q "$PATTERN" "$file"; then
    echo -e "${YELLOW}→${NC} $file - Adding 'use client' directive"
    
    # Create a temporary file with 'use client' directive
    TMP_FILE=$(mktemp)
    echo "'use client';" > "$TMP_FILE"
    echo "" >> "$TMP_FILE"
    cat "$file" >> "$TMP_FILE"
    
    # Replace the original file
    mv "$TMP_FILE" "$file"
    
    UPDATED_FILES=$((UPDATED_FILES + 1))
  else
    echo -e "${BLUE}i${NC} $file - No client features detected, skipping"
    NO_CLIENT_FEATURES=$((NO_CLIENT_FEATURES + 1))
  fi
done

echo ""
echo -e "${BLUE}=== Summary ===${NC}"
echo -e "${GREEN}Already client components: $ALREADY_CLIENT${NC}"
echo -e "${YELLOW}Updated files: $UPDATED_FILES${NC}"
echo -e "${BLUE}Server components (no client features): $NO_CLIENT_FEATURES${NC}"
echo ""
echo -e "Run ${BLUE}./scripts/nextjs-compliance-audit.sh${NC} to verify fixes"