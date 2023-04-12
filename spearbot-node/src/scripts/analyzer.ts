import { OpenAI } from "langchain/llms"
import { HNSWLib } from "langchain/vectorstores"
import { OpenAIEmbeddings } from "langchain/embeddings"
import { VectorDBQAChain } from "langchain/chains";

export const run = async () => {
  const vectorStore = await HNSWLib.load(`${process.cwd()}/spearbot-node/vecstore/embeddings`, new OpenAIEmbeddings())
  const model = new OpenAI({temperature: 0, modelName: "gpt-4"})

  const vectorChain = VectorDBQAChain.fromLLM(model, vectorStore, {
    k: 5, // search for 15 nearest neighbors
    returnSourceDocuments: true
  })

  const input = process.argv[2]

  const result = await vectorChain.call({query: input})

  console.log(result.text)
}

run()