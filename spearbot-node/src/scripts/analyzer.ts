import { OpenAI } from "langchain/llms";
import { HNSWLib } from "langchain/vectorstores";
import { OpenAIEmbeddings } from "langchain/embeddings";
import {
  VectorStoreToolkit,
  createVectorStoreAgent,
  VectorStoreInfo,
} from "langchain/agents";

export const run = async () => {
  const vectorStore = await HNSWLib.load("./embeddings", new OpenAIEmbeddings())
  const model = new OpenAI()

  /* Create the agent */
  const vectorStoreInfo: VectorStoreInfo = {
    name: "solidity-chatbot",
    description: "information about solidity programs",
    vectorStore,
  }

  const toolkit = new VectorStoreToolkit(vectorStoreInfo, model)
  const agent = createVectorStoreAgent(model, toolkit)

  const input =
    "What are the public functions in the DAI contract?";
  console.log(`Executing: ${input}`);
  const result = await agent.call({ input });
  console.log(`Got output ${result.output}`);
  console.log(
    `Got intermediate steps ${JSON.stringify(
      result.intermediateSteps,
      null,
      2
    )}`
  );
};

run()