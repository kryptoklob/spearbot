#!/bin/sh
exec ts-node --esm --experimental-specifier-resolution=node "spearbot-node/src/scripts/defaults.ts" "$@"