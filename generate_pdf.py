# See the requirements needed it ./pdf-scripts/requirements.txt

import subprocess

print("Converting Markdown files to LaTeX ...")
subprocess.call("./pdf-scripts/convert.sh")
print(f"Done.\n")
print("Generating PDF...")
subprocess.call("./pdf-scripts/generate.sh")
print(f"Done.\n")
