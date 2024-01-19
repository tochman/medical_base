import { createClient } from "@supabase/supabase-js";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseHybridSearch } from "@langchain/community/retrievers/supabase";

import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL; // Use environment variable
const supabaseKey = process.env.SUPABASE_KEY; // Use environment variable
const openAIApiKey = process.env.OPEN_AI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  statement_timeout: 60000, // Set the timeout to 60 seconds (or adjust as needed)
});
async function run() {
  const embeddings = new OpenAIEmbeddings({ openAIApiKey: openAIApiKey });

  // const retriever = new SupabaseHybridSearch(embeddings, {
  //   client: supabase,
  //   similarityK: 20,
  //   keywordK: 20,
  //   tableName: "classifications",
  //   similarityQueryName: "match_classifications",
  //   keywordQueryName: "kw_match_classifications",
  //   statementTimeout: 60000
  // });

  const query =
    "Avlägsnade kateter i intrakraniell injektionsutrustning. Dränage, avlägsnande av främmande kropp";

  try {
    // const matchedDocs = await retriever.getRelevantDocuments(query);
    let { data, error } = await supabase.rpc("kw_match_classifications", {
      match_count: 10,
      query_text: query,
    });
    if (error) console.error(error);
    else console.log(data);
    // console.log("Search results:", matchedDocs);
    // const matchedDocs = await vectorStore.similaritySearch(queryDocument);
    // console.log("Matched documents:", matchedDocs);
  } catch (error) {
    console.error("Error querying the vector store:", error);
  }
}

run();
