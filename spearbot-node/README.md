# Spearbot



### Script Primitives
- doc - generates documentation of code. optionally uses existing documentation to assist. can output in various forms (html, markdown, plaintext)
- sum - generates hierarchical summaries of code (ie at line, function, class, and file levels). can output in various forms (html, markdown, plaintext)
- emb - generates embeddings of code at various chunking levels (ie at line, function, class, and file levels if possible (class & file levesl likely only possible with gpt4-32k))

# Purpose / Why Is This Useful?
 - the above script primitives, while useful on their own, are primarily useful when composed with each other and other tools to create fully functional, ai powered tools. for example, the first tool is:

### speabit-analyzer
 - what is this: it's a chatbot that has access to the outputs of the above primitives
 - what can it do: answer questions about the codebase it was fed
    - "find me all public functions in solidity"
    - "what does the documentation say about (some function)?
    - "give me all modifiers used in the codebase"
    - "what is the auth style used in this contract?"