#!/bin/bash

# Test Runner Script for AI Logo Generator
# This script provides a convenient way to run different test suites

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display help
show_help() {
  echo -e "${BLUE}AI Logo Generator Test Runner${NC}"
  echo ""
  echo "Usage: ./test-runner.sh [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  -a, --all          Run all tests"
  echo "  -u, --unit         Run unit tests only"
  echo "  -i, --integration  Run integration tests only"
  echo "  -c, --coverage     Run tests with coverage"
  echo "  -w, --watch        Run tests in watch mode"
  echo "  -p, --pattern      Run tests matching a pattern (e.g. 'cache')"
  echo "  -h, --help         Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./test-runner.sh --all             # Run all tests"
  echo "  ./test-runner.sh --unit --coverage # Run unit tests with coverage"
  echo "  ./test-runner.sh --pattern cache   # Run tests with 'cache' in the name"
}

# Default options
RUN_ALL=false
RUN_UNIT=false
RUN_INTEGRATION=false
WITH_COVERAGE=false
WATCH_MODE=false
PATTERN=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -a|--all)
      RUN_ALL=true
      shift
      ;;
    -u|--unit)
      RUN_UNIT=true
      shift
      ;;
    -i|--integration)
      RUN_INTEGRATION=true
      shift
      ;;
    -c|--coverage)
      WITH_COVERAGE=true
      shift
      ;;
    -w|--watch)
      WATCH_MODE=true
      shift
      ;;
    -p|--pattern)
      PATTERN="$2"
      shift
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      show_help
      exit 1
      ;;
  esac
done

# If no test type is specified, default to all
if [ "$RUN_ALL" = false ] && [ "$RUN_UNIT" = false ] && [ "$RUN_INTEGRATION" = false ] && [ -z "$PATTERN" ]; then
  RUN_ALL=true
fi

# Build the command
CMD="npx vitest run"

# Add options
if [ "$WATCH_MODE" = true ]; then
  CMD="npx vitest"
fi

if [ "$WITH_COVERAGE" = true ]; then
  CMD="$CMD --coverage"
fi

# Add test filters
if [ "$RUN_ALL" = true ]; then
  echo -e "${BLUE}Running all tests...${NC}"
elif [ "$RUN_UNIT" = true ]; then
  CMD="$CMD \"__tests__/.*\\.test\\.ts\""
  echo -e "${BLUE}Running unit tests...${NC}"
elif [ "$RUN_INTEGRATION" = true ]; then
  CMD="$CMD \"integration/.*\\.test\\.ts\""
  echo -e "${BLUE}Running integration tests...${NC}"
fi

if [ -n "$PATTERN" ]; then
  CMD="$CMD -t \"$PATTERN\""
  echo -e "${BLUE}Running tests matching pattern '$PATTERN'...${NC}"
fi

# Run the command
echo -e "${YELLOW}Running command: $CMD${NC}"
eval $CMD

# Check the exit code
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Tests completed successfully!${NC}"
else
  echo -e "${RED}Tests failed!${NC}"
  exit 1
fi