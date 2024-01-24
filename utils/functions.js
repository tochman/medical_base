import dotenv from "dotenv";
dotenv.config();

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { BufferMemory } from "langchain/memory";
import { HumanMessage } from "@langchain/core/messages";
import {
  StringOutputParser,
} from "@langchain/core/output_parsers";
import { JsonOutputFunctionsParser } from "langchain/output_parsers";


import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";

const openAIApiKey = process.env.OPEN_AI_API_KEY;

function get_weather(){
  debugger
  return "BAZZZZZ"
}

const fooSchema = {
  name: "get_weather",
  description: "Returns weather conditions",
  parameters: {
    type: "object",
    properties: {
      weather: {
        type: "string",
        description: "generates weather conditions",
      },
      response: {
        type: "string",
        description: "A response to the input",
      },
    },
    required: ["foo", "response"],
  },
};
const extractionFunctionSchema = {
  name: "extractor",
  description: "Extracts fields from the input.",
  parameters: {
    type: "object",
    properties: {
      tone: {
        type: "string",
        enum: ["positive", "negative"],
        description: "The overall tone of the input",
      },
      chat_response: {
        type: "string",
        description: "A response to the human's input",
      },
    },
    required: ["tone", "chat_response"],
  },
};

const llm = new ChatOpenAI({
  openAIApiKey,
  modelName: "gpt-4-1106-preview",
}).bind({
  response_format: {
    type: "json_object",
  },
  functions: [fooSchema],
  function_call: { name: "get_weather" },
});

const conversationTemplate = PromptTemplate.fromTemplate(
  `Respond to the message: {message}. Use json with the following keys: 'message' key with value of the original message and 'response' key with value of the chat response`
);

const conversationChain = RunnableSequence.from([
  conversationTemplate,
  llm,
  new JsonOutputFunctionsParser(),
  // new StringOutputParser(),
]);

// const response = await model.invoke([new HumanMessage("What a beautiful day!")]);
const response = await conversationChain.invoke({
  message: "Give me weather in Stockholm. What do you say?",
});
console.log(response);
