import { createClient } from "@supabase/supabase-js";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
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

  const query =
    "Undersökte skallfraktur, La in epidural tryckmätare. lindring av akut cerebralt ödem"

    const vectorStore = new SupabaseVectorStore(embeddings,
      {
        client: supabase,
        tableName: 'classifications',
        queryName: 'match_classifications',
      }
    )
    const retriever = new SupabaseHybridSearch(embeddings, {
      client: supabase,
      //  Below are the defaults, expecting that you set up your supabase table and functions according to the guide above. Please change if necessary.
      similarityK: 4,
      keywordK: 4,
      tableName: "classifications",
      similarityQueryName: "match_classifications",
      keywordQueryName: "kw_match_classifications",
    });
  
    try {
      
      const results = await retriever.getRelevantDocuments(query);
      const resultOne = await vectorStore.similaritySearch(query)
    
    if (error) console.error(error);
    else console.log(data);

  } catch (error) {
    console.error("Error querying the vector store:", error);
  }
}

run();
