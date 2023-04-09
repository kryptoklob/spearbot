# Spearbot Monorepo

## [spearbot-node](spearbot-node/README.md): node/ts scripts

## vuln databases
 - [not so smart contracts](https://github.com/crytic/not-so-smart-contracts)
 - [audit hero](https://audit-hero.com/finding)

### existing tools
 - c4udit
    - a static analyzer for solidity contracts based on regular expressions specifically crafted for Code4Rena contests."
 - slither
    - a Solidity static analysis framework written in Python3. It runs a suite of vulnerability detectors, prints visual information about contract details, and provides an API to easily write custom analyses. Slither enables developers to find vulnerabilities, enhance their code comprehension, and quickly prototype custom analyses
 - mythril
    - Consensys' security analysis tool for EVM bytecode. Uses symbolic execution, SMT solving, and taint analysis. Part of the Mythx Tool Sutie

 - securify
    - security scanner for Ethereum smart contracts supported by the Ethereum Foundation and ChainSecurity. Supports 37 vulnerabilities; implements novel context-sensitive static analysis written in Datalog
 - pyrometer
    - wip alpha from Nascent; mix of symbolic execution, abstract interpretation, and static analysis; shines for anayzing math and access control
 - echidna
    - smart contract fuzzer; program for fuzzing & property-based testing. 
 - smtchecker (compiler)
    - "If you use pragma experimental SMTChecker;, then you get additional safety warnings which are obtained by querying an SMT solver. The component does not yet support all features of the Solidity language and likely outputs many warnings. In case it reports unsupported features, the analysis may not be fully sound."
 - kevm (runtime verification)
    - "K is a rewrite-based executable semantic framework in which programming languages, type systems and formal analysis tools can be defined using configurations and rules. Configurations organize the state in units called cells, which are labeled and can be nested. K rewrite rules make it explicit which parts of the term are read-only, write-only, read-write, or unused. This makes K suitable for defining truly concurrent languages even in the presence of sharing. Computations are represented as syntactic extensions of the original language abstract syntax, using a nested list structure which sequentializes computational tasks, such as program fragments."
 - hevm
    - The hevm project is an implementation of the Ethereum Virtual Machine (EVM) focused on symbolic analysis of evm bytecode. It can:

        - symbolically execute a smart contract and find reachable assertion violations
        - prove equivalence of two different bytecode objects
        - execute (symbolic and concrete) solidity tests written using ds-test (a.k.a "foundry tests")
        - visually debug arbitrary evm executions (both concrete & symbolic)
        - fetch remote state via rpc
        - automatically create test cases

### existing services / competitors
 - audit-hero / auditai
    - cosine similirity search over embeddings of exploits
 - auditware
    - all-in-one automatic auditing solution. 
    - "We’ve combined all essential auditing tools into a single, easy-to-use platform. With features like built-in code scanning (Slither, Mythril), AI-powered vulnerability detection, and automatic report generation, you can audit like a firm for a fraction of the time and cost."
 - MythX
    - smart contract security analysis service by consensys. comprehensive tool

### potential new tools to create
 - spear-autodoc, spear-autosum, spear-embed, etc [see spearbot-node/README.md](spearbot-node/README.md)
    - these are primitives that can be composed with other tools to be (hopefullyA supremely useful)
 - semantic search (over solidity AST)
    - basically regex for solidity, but with more advanced rules
 - semantic search (with AI embeddigns & cosine similarity)
    - natural language version of the above semantic search
 - spear-audit
    - using some or all of the above and existing tools, and also just raw gpt4-8k and gpt4-32k, runs audits of the smart contracts
 - spearbot: automatically runs any combination fo the above tools that we will create & the tools that already exist. may also help with collatting results/reports into one final report
