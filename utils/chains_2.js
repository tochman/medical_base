import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";

import dotenv from "dotenv";
dotenv.config();

const openAIApiKey = process.env.OPEN_AI_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const embeddings = new OpenAIEmbeddings({ openAIApiKey });

const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabase,
  tableName: "classifications",
  queryName: "match_classifications",
});

const combineRetrievedDocuments = (docs) => {
  return docs.map((doc) => doc.pageContent).join("\n\n");
};

const documentRetriever = vectorStore.asRetriever();
const llm = new ChatOpenAI({ openAIApiKey, modelName: "gpt-4-1106-preview" });

const sanitizeTemplate = PromptTemplate.fromTemplate(
  `You are a swedish medical assistant bot. Given a {statement} by a medical professional, convert it to a clean and concise standalone statement including only the procedures or actions undertaken by the medical staff in swedish. 
  statement: '{statement}' 
  sanitized_statement:`
);

const generateOutputTemplate = PromptTemplate.fromTemplate(
  `Given the medical statement '{statement}', and only using the the codes and treatments provided in {documents}, generate a journal entry and propose classification codes. Respond with a JSON object that includes a 'date' key with any date reference you find in the statement or {date} in the format YYYY-MM-DD, a 'journal_entry' key with a comprehensive description of any treatments based on doctor's input that is relevant for the procedures and treatments, a 'treatments' key that contains the {sanitized_statement} as value, and a 'classification' key that is an array of objects with 'code', 'classification' and 'description' keys. Always respond in swedish`
);

const sanitizeChain = RunnableSequence.from([
  sanitizeTemplate,
  llm,
  new StringOutputParser(),
]);

const retreiveDocumentsChain = RunnableSequence.from([
  (prevResults) => prevResults.sanitized_statement,
  documentRetriever,
  combineRetrievedDocuments,
]);

const generateOutputChain = RunnableSequence.from([
  generateOutputTemplate,
  llm.bind({
    response_format: {
      type: "json_object",
    },
  }),
  new StringOutputParser(),
]);

const chain = RunnableSequence.from([
  {
    sanitized_statement: sanitizeChain,
    passthrough: new RunnablePassthrough(),
  },
  {
    documents: retreiveDocumentsChain,
    statement: (prevResults) => prevResults.passthrough.statement,
    date: (prevResults) => prevResults.passthrough.date,
    sanitized_statement: (prevResults) =>
      prevResults.sanitized_statement,
  },
  generateOutputChain,
]);

(async () => {
  try {
    const inputStatement = `Anteckningar från behandling. Patient orolig och i chock. Stor blodförlust. Skallskada orsakad av trubbigt tillhygge. Undersökte skallfraktur. Stoppade blodflöde`;
    const response = await chain.invoke({ statement: inputStatement, date: new Date()});

    console.log(response);
  } catch (error) {
    console.error("Error:", error);
  }
})();
