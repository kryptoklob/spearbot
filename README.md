# Spearbot



### Scripts
- doc - generates documentation of code. optionally uses existing documentation to assist. can output in various forms (html, markdown, plaintext)
- sum - generates hierarchical summaries of code (ie at line, function, class, and file levels). can output in various forms (html, markdown, plaintext)
- emb - generates embeddings of code at various chunking levels (ie at line, function, class, and file levels if possible (class & file levesl likely only possible with gpt4-32k))
- com - generates gpt4-readable-only compressed code for use in analysis (just strips comments & whitespace)



### Agents
- doc-compare - compares generated documentation (from doc run with no existing documentation assist) with existing documentation. generates a report of any minor to major semantic & logical differences
- sum-compare - compares generated summaries (from sum run) with an externally provided summary of what is *supposed* to be happening. generates a report of any minor to major semantic & logical differences
- emb-compare - compares generated embeddings (from emb run) with external database of embeddings for known vulnerable contracts of each vuln type; generates report with table of any threshold similarity scores


### To Explore
- Operations on the AST?
- Plugins? (ie auto-call slither, synk, etc)