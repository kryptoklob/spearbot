import * as tiktoken from "@dqbd/tiktoken";
import * as fs from "fs";
import { loadSummarizationChain, MapReduceDocumentsChain } from "langchain/chains";
import { Document } from "langchain/document";
import { OpenAI } from "langchain/llms";
import { MarkdownTextSplitter, RecursiveCharacterTextSplitter, TextSplitter, TokenTextSplitter } from "langchain/text_splitter";
import * as path from "path";
import { GenericCodeTextSplitter } from "../extensions/codeSplitter";
import { ChunkedSummary, SingleFileSummary, Summaries, SummarySetByExtension } from "../types/types";

/* Enums & interfaces */

enum InputFormat {
    Text = "text",
    Markdown = "markdown",
    Solidity = "solidity"
}

enum OutputFormat {
    Json = "json",
    Markdown = "markdown",
    Stdout = "stdout"
}

interface ProgOpts {
    dir: string
    exts: InputFormat[]
    out: string
    format: OutputFormat
}

/* Usage helpers */

function printUsage(exit: boolean = false): void {
    console.log(`\n
    spear-sum
    
    - recursively summarizes the contents of a directory
    - supports txt and md files and solidity
    - outputs results to working directory by default
    - outputs results as json by default
   
    usage:
   
    ./summarize.sh --dir <path> --out <path> --exts [text,md,solidity] --format <format>
   
    args:
   
    --dir <path> - directory to summarize (default: current directory)
    --exts [exts] - file extensions to summarize (default: [text,md,solidity])
    --out <path> - filename/path to output results to (default: summarization-results.json)
    --format <format> - output format (json, md, stdout; default: json)`)

    if (exit) {
        process.exit(1)
    }
}

function parseArgs(args: string[]): ProgOpts {
    // instantiate opts with defaults, then override them later if provided by user
    const options: ProgOpts = {
        dir: `${process.cwd()}`,
        exts: [InputFormat.Text, InputFormat.Markdown, InputFormat.Solidity],
        out: "summarization-results.json",
        format: OutputFormat.Json
    }

    if (args.includes("--help")) {
        // prints usage and exits
        printUsage(true)
    }

    // straight parsing
    for (let i = 0; i < args.length; i++) {
        const arg = args[i]

        switch (arg) {
            case "--dir":
                options.dir = args[++i]
                break
            case "--out":
                options.out = args[++i]
                break
            case "--exts":
                options.exts = args[++i].split(",") as InputFormat[]
                break
            case "--format":
                options.format = args[++i] as OutputFormat 
                break
            default:
                console.error(`Invalid argument "${arg}"`)
                printUsage(true)
        }
    }

    // validation failure --> print usage and exit

    if (options.dir && !fs.existsSync(options.dir)) {
        console.error(`Directory ${options.dir} does not exist`)
        printUsage(true)
    }

    if (options.format && !Object.values(OutputFormat).includes(options.format)) {
        console.error(`Invalid format ${options.format}`)
        printUsage(true)
    }

    if (options.out === undefined || options.out === "") {
        console.error(`Invalid output filename ${options.out}`)
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
        process.exit(1)
    }

    const model = new OpenAI({ temperature: 0, openAIApiKey: process.env.OPENAI_API_KEY, modelName: "gpt-4", maxTokens: 750 } )

    // get relevant files
    const filesByExtension: { [key: string]: string[] } = {}
    for (const ext of options.exts) {
        let extension: string

        if (ext === InputFormat.Text) {
            extension = ".txt"
        } else if (ext === InputFormat.Markdown) {
            extension = ".md"
        } else if (ext === InputFormat.Solidity) {
            extension = ".sol"
        } else {
            console.error(`Invalid extension ${ext}`)
            printUsage(true)
            throw new Error("Can't reach.")
        }

        const files = findFilesWithExtension(options.dir, extension)
        filesByExtension[ext] = files

        console.log(`Found ${files.length} ${ext} files`)
    }

    // summarize each set of files
    const summaries: Summaries = {}

    for (const ext in filesByExtension) {
        summaries[ext] = await summarizeFiles(filesByExtension[ext], ext as InputFormat, model)
    }

    // output and we're done
    outputSummaries(summaries, options.out, options.format)

    // write markdown to file
    fs.writeFileSync("summarization-results.md", generateMarkdown(summaries))
}

main()

/* Heavy lifting happens here */

function generateMarkdown(summaries: Summaries): string {
    const solidity = summaries[InputFormat.Solidity]

    let outputString = "# Solidity\n\n"
    for (const filename in solidity) {
        outputString += `## ${filename}\n\n`

        const fileSummaryObj = solidity[filename]
        const fileSummary = fileSummaryObj.globalSummary

        outputString += `Summary: ${fileSummary}\n\n`

        for (const chunkTitle in fileSummaryObj.chunkedSummaries) {
            const chunk = fileSummaryObj.chunkedSummaries[chunkTitle]
            const title = chunk.title
            const summary = chunk.summary

            outputString += `### ${title}\n\n${summary}\n\n`
        }
    }

    return outputString
}

async function summarizeFiles(filenames: string[], ext: InputFormat, model: OpenAI): Promise<SummarySetByExtension> {
    const summaries: SummarySetByExtension = {}

    for (const filename of filenames) {
        console.log(`Summarizing ${filename}...`)

        const contents = fs.readFileSync(filename, "utf8")
        const fileSummary = await summarizeFile(filename, contents, ext, model)
        summaries[filename] = fileSummary
    }

    return summaries
}

async function summarizeFile(filename: string, content: string, ext: InputFormat, model: OpenAI): Promise<SingleFileSummary> {
    let summary: SingleFileSummary

    const globalDoc = new Document({pageContent: content})
    const splitDocs = await splitContent(content, ext)

    // load summarization chain
    const summarizationChain = loadSummarizationChain(model, {type: "map_reduce"}) as MapReduceDocumentsChain;

    // top level summary
    console.log(`Summarizing entire file...`)

    let globalDocs = [globalDoc]
    const tokenCount = await model.getNumTokens(globalDoc.pageContent)
    
    if (tokenCount > 3000) {
        console.log(`File ${filename} is too large to summarize in one go (${tokenCount} tokens). Breaking it up...`)

        const tokenSplitter = new TokenTextSplitter({chunkSize: 1500})
        globalDocs = await tokenSplitter.splitDocuments(globalDocs)
    }

    const globalSummary = await summarizationChain.call({
        input_documents: globalDocs
        
    })

    const chunkedSummaries: { [key: string]: ChunkedSummary } = {}

    // chunked summaries
    
    const resolvedChunks: ChunkedSummary[] = []

    console.log(`Summarizing ${splitDocs.length} chunks...`)

    const concurrency = 10

    for (let i=0; i<splitDocs.length; i+=concurrency) {
        const promises: Promise<ChunkedSummary>[] = []
        
        console.log(`Summarizing chunks ${i} to min(${i+concurrency}, ${splitDocs.length})...`)

        for (let j=0; j<concurrency; j++) {
            if (i+j >= splitDocs.length) {
                break
            }

            const chunk = splitDocs[i+j]
            const chunkedSummary = getChunkSummary(chunk, model)

            promises.push(chunkedSummary)
        }

        const resolved = await Promise.all(promises)
        resolvedChunks.push(...resolved)
    }

    for (let chunkSummary of resolvedChunks) {
        const awaitedSummary = chunkSummary
        chunkedSummaries[awaitedSummary.title] = awaitedSummary
    }

    summary = {
        filename: filename,
        globalSummary: globalSummary.text as string,
        chunkedSummaries
    }
    
    return summary
}

async function getChunkSummary(chunk: Document, model: OpenAI): Promise<ChunkedSummary> {
    const title = await getThreeWordSummary(chunk.pageContent as string, model)

    const chunkSummaryResult = await model.generate([`Give a detailed and technical summary of the following content:\n${chunk.pageContent}\n`])
    const chunkSummary = chunkSummaryResult.generations[0][0].text

    const summaryTokens = await getTokenCount(chunkSummary)
    const contentTokens = await getTokenCount(chunk.pageContent)

    const chunkedSummary: ChunkedSummary = {
        title: title,
        summary: chunkSummary,
        content: chunk.pageContent,
        tokens: {
            summary: summaryTokens,
            content: contentTokens
        }
    }

    return chunkedSummary
}

async function getThreeWordSummary(text: string, model: OpenAI): Promise<string> {
    const result = await model.generate([`Given the following text, generate a three word identifier/title. Remember ONLY output the three words, and literally nothing else.\n${text}\n\n`])
    const completion = result.generations[0][0].text

    return completion
}

/* Utility functions */
async function getTokenCount(text: string): Promise<number> {
    const enc = tiktoken.get_encoding('cl100k_base')
    return enc.encode_ordinary(text).length
}

function outputSummaries(summaries: Summaries, out: string, format: OutputFormat) {
    switch (format) {
        case OutputFormat.Json:
            fs.writeFileSync(out, JSON.stringify(summaries, null, 2))
            break
        case OutputFormat.Markdown:
            throw new Error("Markdown output not implemented yet.")
            break
        case OutputFormat.Stdout:
            console.log(JSON.stringify(summaries, null, 2))
            break
    }
}

function findFilesWithExtension(directory: string, extension: string): string[] {
    const foundFileNames: string[] = [];
    const files = fs.readdirSync(directory);
  
    for (const file of files) {
      const filePath = path.join(directory, file);
      const fileStat = fs.statSync(filePath);
  
      if (fileStat.isDirectory()) {
        foundFileNames.push(...findFilesWithExtension(filePath, extension));
      } else if (fileStat.isFile() && path.extname(filePath) === extension) {
        foundFileNames.push(filePath);
      }
    }
  
    return foundFileNames;
}

async function splitContent(content: string, contentType: InputFormat): Promise<Document[]> {
    let splitter: TextSplitter

    switch (contentType) {
        case InputFormat.Text:
            splitter = new RecursiveCharacterTextSplitter()
            break;

        case InputFormat.Markdown:
            splitter = new MarkdownTextSplitter()
            break;

        case InputFormat.Solidity:
            splitter = new GenericCodeTextSplitter(["contract", "interface", "function", "constructor"], {chunkSize: 1, chunkOverlap: 0})
            break;
    }

    return splitter.createDocuments([content])
}