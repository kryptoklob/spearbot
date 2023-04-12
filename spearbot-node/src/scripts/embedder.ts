import { OpenAIEmbeddings } from "langchain/embeddings"
import { HNSWLib } from "langchain/vectorstores";
import { PineconeStore } from "langchain/vectorstores";
import { PineconeClient } from "@pinecone-database/pinecone";
import * as fs from "fs";
import { SingleFileSummary, Summaries } from "../types/types";
import { OpenAIChat } from "langchain/llms";
import { Document } from "langchain/document";

/* Enums & interfaces */

enum InputFormat {
    Json = "json",
    Text = "text"
}

enum OutputFormat {
    Pinecone = "pinecone",
    HNSWIndex = "hnsw",
    Both = "both"
}

interface ProgOpts {
    in: string
    fmt: InputFormat
    out: OutputFormat
    outfile: string
}

/* Usage helpers */

function printUsage(exit: boolean = false): void {
    console.log(`\n
    spear-emb
    
    - creates embeddings over a given set of texts
    - optionally uploads to a given vector db
   
    usage:
   
    ./embedder.sh --in <path> --fmt <json|text> --out <pinecone|hnsw|both> --outfile <path>
   
    args:

    --in <path> - path to input file (default: none)
    --fmt <json|text> - input format (default: json)
    --out <pinecone|hnsw|both> - output format (default: hnsw)
    --outfdir <path> - path to output directory, only for hnsw (default: './embeddings')`)
   
    if (exit) {
        process.exit(1)
    }
}

function parseArgs(args: string[]): ProgOpts {
    // instantiate opts with defaults, then override them later if provided by user
    const options: ProgOpts = {
        in: "",
        fmt: InputFormat.Json,
        out: OutputFormat.HNSWIndex,
        outfile: `${process.cwd()}/embeddings`
    }

    if (args.includes("--help")) {
        // prints usage and exits
        printUsage(true)
    }

    // straight parsing
    for (let i = 0; i < args.length; i++) {
        const arg = args[i]

        switch (arg) {
            case "--in":
                options.in = args[++i]
                break
            case "--fmt":
                options.fmt = args[++i] as InputFormat
                break
            case "--out":
                options.out = args[++i] as OutputFormat
                break
            case "--outdir":
                options.outfile = args[++i] as string
                break
            default:
                console.error(`Invalid argument "${arg}"`)
                printUsage(true)
        }
    }

    // validation failure --> print usage and exit

    if (!options.in) {
        console.error(`Input file not specified`)
        printUsage(true)
    }

    if (options.in && !fs.existsSync(options.in)) {
        console.error(`Input file ${options.in} does not exist`)
        printUsage(true)
    }

    if (options.fmt && !Object.values(InputFormat).includes(options.fmt)) {
        console.error(`Invalid format ${options.fmt}`)
        printUsage(true)
    }

    if (options.fmt == InputFormat.Text) {
        console.error(`Text format not supported yet`)
        printUsage(true)
    }

    return options
}

/* Run program */

async function main() {
    // parse args
    const options = parseArgs(process.argv.slice(2))

    // instantate openai
    if (!process.env.OPENAI_API_KEY) {
        console.error("OPENAI_API_KEY env not set. Exiting...")
        printUsage(true)
    }

    const embeddings = new OpenAIEmbeddings()
    const model = new OpenAIChat({modelName: "gpt-4"})
    
    // read input file
    const rawInput = fs.readFileSync(options.in, "utf-8")
    const input = JSON.parse(rawInput) as Summaries

    // input should be in *summaries* form
    // todo: when we add in text format, we'll need this logic differently

    const soliditySummaries = input["solidity"]
    const fileNames = Object.keys(soliditySummaries)
    const fileSummaries: SingleFileSummary[] = fileNames.map((fileName) => soliditySummaries[fileName])

    const embeds: number[][] = []
    const docs: Document[] = []

    // create embeddings for each file summary
    for (let i=0; i<fileSummaries.length; i++) {
        console.log(`Creating embeddings for file ${i+1} of ${fileSummaries.length}...`)

        const fileSummary = fileSummaries[i]
        const globalSummary  = fileSummary.globalSummary
        const chunkedSummaries = fileSummary.chunkedSummaries
        const chunkNames = Object.keys(chunkedSummaries)
        const chunkSummaries = chunkNames.map((chunkName) => chunkedSummaries[chunkName])

        // creat a short global summary so that the global context is embedded here as well
        const globalSummaryResult = await model.generate([`Give a one sentence summary fo the following. Only give the sentence and do not say anything else: ${globalSummary}`])
        const globalShortSummary  = globalSummaryResult.generations[0][0].text

        const toEmbeds: string[] = []

        for (const chunkSummary of chunkSummaries) {
            const { summary, content } = chunkSummary
            const toEmbed = "File Context: " + globalShortSummary + "\n\nSection Summary: " + summary + "\n\nSection Content: " + content
            const doc = new Document({pageContent: toEmbed})
            toEmbeds.push(toEmbed)
            docs.push(doc)
        }

        // create embeddings
        const embeddingsResult = await embeddings.embedDocuments(toEmbeds)
        embeds.push(...embeddingsResult)
    }

    console.log(`Embeddings created.`)

    // embeds created
    // now save to vector store(s)

    if (options.out == OutputFormat.HNSWIndex || options.out == OutputFormat.Both) {
        const hnsw = new HNSWLib(embeddings, {space: "cosine"})
        await hnsw.addVectors(embeds, docs)
        await hnsw.save(options.outfile)
        console.log(`Saved HNSW index to ${options.outfile}`)
    }

    if (options.out == OutputFormat.Pinecone || options.out == OutputFormat.Both) {
        throw new Error("Pinecone not supported yet")
    }
}

main()