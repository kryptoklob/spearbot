export type SummarizerOutputFormat = Summaries

export interface Summaries {
    [key: string]: SummarySetByExtension
}

export interface SummarySetByExtension {
    [key: string]: SingleFileSummary
}

export interface SingleFileSummary {
    filename: string,
    globalSummary: string,
    chunkedSummaries: {
        [key: string]: ChunkedSummary
    }
}

export interface ChunkedSummary {
    title: string,
    summary: string,
    content: string,
    tokens: {
        summary: number,
        content: number
    }
}

/* output format (see above interfaces)
{
    "solidity": {
        "full/file/name/filename.sol": {
            filename: "filename.sol",
            globalSummary: "global summary",
            chunkedSummaries: {
                "someFunctionName": { // line number where this chunk begins in the file
                    title: "someFunctionName",
                    summary: "someFunctionName summary, blah blah blah",
                    content: "function someFunctionName(arg1, arg2) returns { implementaiton blah blah..."
                    tokens: {
                        summary: 10,
                        content: 250
                    }
                },
                "anotherFunctionName": {
                    ...
                },
                ...
            }
        },
        "full/file/name/otherfile.sol": {
            ...
        }
    },
    "markdown": {
        ...
    },
    ...
}
*/