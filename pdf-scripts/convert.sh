#!/bin/bash
pandoc --filter ./pdf-scripts/pandoc-minted.py --from gfm+tex_math_dollars ./summarization-results.md -o ./pdf-scripts/summarization-results.tex

