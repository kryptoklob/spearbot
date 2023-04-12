#!/bin/sh
exec ts-node --esm --experimental-specifier-resolution=node "src/scripts/embedder.ts" "$@"