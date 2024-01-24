import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";

import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL; // Use environment variable
const supabaseKey = process.env.SUPABASE_KEY; // Use environment variable
const openAIApiKey = process.env.OPEN_AI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
// Read the Excel file
const workbook = XLSX.readFile("./data/kva_classification_codes.xlsx");

// Get the sheet by name
const sheetName = "KVÅ (KKÅ+KMÅ)";
const sheet = workbook.Sheets[sheetName];

// Convert the sheet to JSON and skip the headers
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Remove the first row (headers) from the data
data.shift();

async function run() {
  // const embeddings = new OpenAIEmbeddings({ openAIApiKey: openAIApiKey });
  const documents = data.map((row, index) => {
    const doc = new Document({
      pageContent: JSON.stringify({
        classification: row[0],
        code: row[1],
        text: row.slice(2, 10).join(" "),
      }),
      metadata: {
        classification: row[0],
        code: row[1],
        text: row.slice(2, 10).join(" "),
      },
    });
    return doc;
  });
  try {
    const resp = await SupabaseVectorStore.fromDocuments(
      documents,
      new OpenAIEmbeddings({ openAIApiKey }),
      { client: supabase, tableName: "classifications" }
    );
    console.log("Documents added to the vector store successfully", resp);
  } catch (error) {
    console.error("Error adding documents to the vector store:", error);
  }


}

run().catch((error) => {
  console.error("Error:", error);
});
