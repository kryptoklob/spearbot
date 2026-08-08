#!/bin/bash

# This is called from parent directory by generate_report.py
# All paths are relative to ..

cd ./pdf-scripts

pdflatex -shell-escape -interaction nonstopmode main.tex

rm -rf _minted-main
rm main.aux
rm main.log
rm main.out
