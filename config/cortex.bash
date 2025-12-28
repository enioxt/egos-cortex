#!/bin/bash
# Cortex Shell Integration for Bash
# Add to ~/.bashrc: source ~/.local/share/cortex/cortex.bash

# Record command history to Cortex
__cortex_preexec() {
  local cmd="$1"
  # Skip if command is empty or starts with space
  [[ -z "$cmd" || "$cmd" =~ ^[[:space:]] ]] && return
  
  # Record command asynchronously
  (cx history add "$cmd" "$PWD" &>/dev/null &)
}

# Hook into bash PROMPT_COMMAND
if [[ -z "$__cortex_installed" ]]; then
  export __cortex_installed=1
  
  # Use DEBUG trap for preexec
  trap '__cortex_preexec "$BASH_COMMAND"' DEBUG
fi

# Cortex shortcuts
alias cxa='cx ask'
alias cxs='cx search'
alias cxst='cx status'

# Smart suggest based on current directory
cx-suggest() {
  local context="I'm in directory: $PWD"
  [[ -n "$1" ]] && context="$context. Task: $1"
  cx ask "$context. What commands should I run?"
}

# Quick search in current project
cx-here() {
  cx search "$1" --filter "path:$PWD"
}

echo "🧠 Cortex shell integration loaded"
