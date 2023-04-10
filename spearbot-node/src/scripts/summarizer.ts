import { OpenAI } from "langchain/llms";
import { loadSummarizationChain } from "langchain/chains";
import * as fs from "fs";
import * as path from "path";
import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter, TextSplitter } from "langchain/text_splitter";

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
    Function = "function",
    Tokens = "tokens"
}

enum InputFormat {
    Text = "text",
    Markdown = "markdown",
    Solidity = "solidity"
}

async function summarizeFile(file: string, summaryLevel: SummaryLevel, model: OpenAI, split: SplitMethod): Promise<string> {
    const content = fs.readFileSync(file, "utf-8");
    const summarizationChain = loadSummarizationChain(model);
    const summarizedContent = await summarizationChain.summarize(content, summaryLevel);
    return summarizedContent;
}


async function splitDocument(content: string, format: InputFormat, split: SplitMethod): Promise<Document> {
    let splitter: TextSplitter

    switch (split) {
        case SplitMethod.RecursiveCharacter:
            splitter = new RecursiveCharacterTextSplitter()
            break
        case SplitMethod.Function:
            splitter = new 
            break
        case SplitMethod.Tokens:

            break
        


}
