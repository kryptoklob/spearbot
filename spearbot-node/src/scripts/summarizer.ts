import { OpenAI } from "langchain/llms";
import { loadSummarizationChain, MapReduceDocumentsChain } from "langchain/chains";
import * as fs from "fs";
import * as path from "path";
import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter, TextSplitter, TokenTextSplitter } from "langchain/text_splitter";
import { GenericCodeTextSplitter } from "../extensions/codeSplitter";

/* gpt-4 powered summarizer

 - recursively summarizes the contents of a directory
 - supports txt and md files and solidity
 - outputs results to working directory by default
 - outputs results as json by default

usage:

npm run summarize [-- <args>]

args:

--dir <path> - directory to summarize
--out <path> - filename/path to output results to
--format <format> - output format (json, md, stdout)
--summarylevel <level> - at which hierarchy level to summarize (function, file, directory, project, all)

Note that for summarylevel, function is only applicable to solidity files.

*/

enum SummaryLevel {
    Function = "function",
    File = "file",
    Directory = "directory",
    Project = "project",
    All = "all",
}

enum SplitMethod {
    RecursiveCharacter = "recursive-character",
    Solidity = "function",
    Tokens = "tokens"
}

enum InputFormat {
    Text = "text",
    Markdown = "markdown",
    Solidity = "solidity"
}

async function main() {
    // instantate openai
    const model = new OpenAI({ temperature: 0, openAIApiKey: process.env.OPENAI_API_KEY } )

    // find all sol files in pwd
    const currentDirectory = process.cwd();
    const targetExtension = '.sol';
    const foundFiles = findFilesWithExtension(currentDirectory, targetExtension);

    console.log(`Found ${foundFiles.length} .sol files in ${currentDirectory}:`);
    for (const file of foundFiles) {
      console.log(`- ${file}`);
    }

    // summarize each one
    const summaries: any = {}

    for (const file of foundFiles) {
        console.log(`Summarizing ${file}...`)
        const fileName = path.basename(file)
        const summary = await summarizeSolFile(file, /*SummaryLevel.Function,*/ model, SplitMethod.Solidity)
        summaries[fileName] = summary
    }

    // output results as json file
    const outputFilename = "summarization-results.json";
    const outputPath = path.join(currentDirectory, outputFilename);

    // write to file
    fs.writeFileSync(outputPath, JSON.stringify(summaries, null, 2));

    console.log(`Wrote results to ${outputPath}`);
    console.log(`Have a nice day! :D`)
}

main()

function findFilesWithExtension(directory: string, extension: string): string[] {
    const foundFiles: string[] = [];
    const files = fs.readdirSync(directory);
  
    for (const file of files) {
      const filePath = path.join(directory, file);
      const fileStat = fs.statSync(filePath);
  
      if (fileStat.isDirectory()) {
        foundFiles.push(...findFilesWithExtension(filePath, extension));
      } else if (fileStat.isFile() && path.extname(filePath) === extension) {
        foundFiles.push(filePath);
      }
    }
  
    return foundFiles;
  }

async function summarizeSolFile(file: string, /*summaryLevel: SummaryLevel,*/ model: OpenAI, split: SplitMethod): Promise<string[]> {
    const content = fs.readFileSync(file, "utf-8");
    const summarizationChain = loadSummarizationChain(model, {type: "map_reduce"}) as MapReduceDocumentsChain;
    
    const splitDocs = await splitContent(content, SplitMethod.Solidity)

    console.log(`Split ${file} into ${splitDocs.length} documents`)
    console.log(`Summarizing @ top level first...`)
    const topLevelSummaryResult = await summarizationChain.call({
        input_documents: splitDocs
    })

    const topLevelSummary = topLevelSummaryResult.text as string

    let individualSummaries: string[] = []

    console.log(`Summarizing each individual document...`)

    for (const doc of splitDocs) {
        const summary = await summarizationChain.call({
            input_documents: [doc],
            
        })

        individualSummaries.push(summary.text as string)
    }

    return [topLevelSummary, ...individualSummaries]
}


async function splitContent(content: string, split: SplitMethod): Promise<Document[]> {
    let splitter: TextSplitter

    switch (split) {
        case SplitMethod.RecursiveCharacter:
            splitter = new RecursiveCharacterTextSplitter()
            break
        case SplitMethod.Solidity:
            splitter = new GenericCodeTextSplitter(["contract", "interface", "function", "constructor"], {chunkSize: 1, chunkOverlap: 0})
            break
        case SplitMethod.Tokens:
            splitter = new TokenTextSplitter()
            break
    }

    return splitter.createDocuments([content])
}
