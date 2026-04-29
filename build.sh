#!/bin/bash

echo "Generating config.js..."

printf "window.SUPABASE_URL='%s';\n" "$SUPABASE_URL" > config.js
printf "window.SUPABASE_ANON_KEY='%s';\n" "$SUPABASE_ANON_KEY" >> config.js

echo "config.js created"
