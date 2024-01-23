import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { SupabaseHybridSearch } from "@langchain/community/retrievers/supabase";

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



const retriever = vectorStore.asRetriever();

const llm = new ChatOpenAI({ openAIApiKey });

const statementTemplate =
  "You are a swedish medical assistant bot. Given a statement by a medical professional, convert it to a clean and concise standalone statement including only the procedures or actions undertaken by the medical staff in swedish. statement: {statement} standalone statement:";

const statementPrompt = PromptTemplate.fromTemplate(statementTemplate);

const statementChain = statementPrompt
  .pipe(llm)
  .pipe(new StringOutputParser())
  .pipe(retriever);

const response = await statementChain.invoke({
  statement:
    "Anteckningar från behandling 2024-01-03. Undersökte patientens skallfraktur orsakad av trauma med trubbigt tilhygge. utförd datortomografi. ",
});

console.log(response);
