#!/bin/bash
# Netlify build: generate config.js from environment variables
# Set SUPABASE_URL and SUPABASE_ANON_KEY in Netlify → Site settings → Environment variables

set -e

if [ -z "$SUPABASE_URL" ]; then
  echo "ERROR: SUPABASE_URL env var is not set. Go to Netlify → Site settings → Environment variables."
  exit 1
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "ERROR: SUPABASE_ANON_KEY env var is not set. Go to Netlify → Site settings → Environment variables."
  exit 1
fi

printf "window.APP_CONFIG = {\n  SUPABASE_URL:     '%s',\n  SUPABASE_ANON_KEY:'%s',\n  LS_KEY:           'pondy_gps_v5',\n  SESSION_KEY:      'pondy_session_v1',\n};\n" \
  "$SUPABASE_URL" "$SUPABASE_ANON_KEY" > config.js

echo "✓ config.js generated ($(wc -c < config.js) bytes)"
