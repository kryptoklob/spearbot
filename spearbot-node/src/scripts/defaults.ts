import { OpenAI } from "langchain/llms"
import { HNSWLib } from "langchain/vectorstores"
import { OpenAIEmbeddings } from "langchain/embeddings"
import { VectorDBQAChain } from "langchain/chains";
import * as fs from 'fs'

async function ask(question:string): Promise<string> {
    const vectorStore = await HNSWLib.load(`${process.cwd()}/spearbot-node/vecstore/embeddings`, new OpenAIEmbeddings())
    const model = new OpenAI({temperature: 0, modelName: "gpt-4"})
  
    const vectorChain = VectorDBQAChain.fromLLM(model, vectorStore, {
      k: 10, // search for 10 nearest neighbors
      returnSourceDocuments: true
    })
  
    const input = question
  
    const result = await vectorChain.call({query: input})
  
    console.log(result.text)

    return result.text
}

const defaultQuestions: string[] = [
    "Give a bullet point overview of the system.",
    "What access control mechanisms are in place?",
    "For each smart contract, give a bullet point overview.",
    "What modifiers are used in each contract?"
]

const defaultAnswers: string[] = [

]

let markdown = ''

for (let i=0; i<defaultQuestions.length; i++) {
    console.log(`Question ${i}: ${defaultQuestions[i]}`)
    const question = defaultQuestions[i]
    const answer = await ask(question)
    defaultAnswers.push(answer)

    markdown += `${i}) ${question}\n`
    markdown += `   \`\`\`${answer}\`\`\`\n`
}

// write markdown string to file
fs.writeFileSync("defaultQuestions.md", markdown)

console.log(`Wrote ${defaultQuestions.length} questions & answers to defaultQuestions.md`)