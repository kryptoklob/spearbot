#!/bin/sh
exec ts-node --esm --experimental-specifier-resolution=node "src/scripts/summarizer.ts" "$@"