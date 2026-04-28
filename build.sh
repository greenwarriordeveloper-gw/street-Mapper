#!/bin/bash
# Netlify build script — generates config.js from environment variables
# Set SUPABASE_URL and SUPABASE_ANON_KEY in Netlify → Site settings → Environment variables

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "ERROR: SUPABASE_URL and SUPABASE_ANON_KEY must be set in Netlify environment variables."
  exit 1
fi

cat > config.js <<EOF
window.APP_CONFIG = {
  SUPABASE_URL:     '${SUPABASE_URL}',
  SUPABASE_ANON_KEY:'${SUPABASE_ANON_KEY}',
  LS_KEY:           'pondy_gps_v5',
  SESSION_KEY:      'pondy_session_v1',
};
EOF

echo "config.js generated successfully."
