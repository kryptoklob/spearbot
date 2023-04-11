import { OpenAI } from "langchain/llms";
import { loadSummarizationChain, MapReduceDocumentsChain } from "langchain/chains";
import * as fs from "fs";
import * as path from "path";
import { Document } from "langchain/document";
import { MarkdownTextSplitter, RecursiveCharacterTextSplitter, TextSplitter, TokenTextSplitter } from "langchain/text_splitter";
import { GenericCodeTextSplitter } from "../extensions/codeSplitter";

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
interface Summaries {
    [key: string]: SummarySetByExtension
}

interface SummarySetByExtension {
    [key: string]: SingleFileSummary
}

interface SingleFileSummary {
    filename: string,
    globalSummary: string,
    chunkedSummaries: {
        [key: string]: string
    }
}

/* Usage helpers */

function printUsage(exit: boolean = false) {
    console.log(`\n
    spear-sum
    
    - recursively summarizes the contents of a directory
    - supports txt and md files and solidity
    - outputs results to working directory by default
    - outputs results as json by default
   
    usage:
   
    ./summarize.sh --dir <path> --out <path> --format <format>
   
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

    const model = new OpenAI({ temperature: 0, openAIApiKey: process.env.OPENAI_API_KEY, modelName: "gpt-4" } )

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
}

main()

/* Heavy lifting happens here */

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
    const globalSummary = await summarizationChain.call({
        input_documents: [globalDoc]
    })

    // chunked summaries
    const chunkedSummaries: { [key: string]: string } = {}
    for (let i=0; i<splitDocs.length; i++) {
        console.log(`Summarizing chunk ${i+1} of ${splitDocs.length}...`)

        const chunk = splitDocs[i]

        const chunkSummary = await summarizationChain.call({
            input_documents: [chunk]
        })

        // try to extrac function or class name, etc from the chunk
        // naively just use the three words of the first line
        const chunkName = chunk.pageContent.split("\n")[0].split(" ").slice(0, 3).join(" ")
        chunkedSummaries[chunkName] = chunkSummary.text as string
    }

    summary = {
        filename: filename,
        globalSummary: globalSummary.text as string,
        chunkedSummaries
    }
    
    return summary
}

/* Utility functions */
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