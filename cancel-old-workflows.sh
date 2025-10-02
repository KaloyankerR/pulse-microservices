#!/bin/bash

# Script to cancel old workflow runs that are still queued/running
# This helps immediately reduce the pipeline load

echo "🔄 Cancelling old workflow runs..."

# Cancel all running/queued workflows for old workflow files
gh run list --status queued --limit 100 --json databaseId,name,headBranch | \
jq -r '.[] | select(.name == "Microservices CI" or .name == "Code Quality" or .name == "PR Validation") | .databaseId' | \
while read run_id; do
  if [ ! -z "$run_id" ]; then
    echo "Cancelling workflow run: $run_id"
    gh run cancel "$run_id" || echo "Failed to cancel $run_id"
  fi
done

echo "✅ Old workflow cancellation completed!"
echo "📊 Current workflow status:"
gh run list --limit 10
