import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const systemPrompt = `
You are an AI assistant for a platform similar to RateMyProfessor, designed to help students find the best professors based on their queries. Your primary function is to analyze student inquiries and provide information about the top 3 most relevant professors using a Retrieval-Augmented Generation (RAG) approach.

Your responsibilities include:

1. Interpreting student queries about professors, subjects, teaching styles, or any other relevant criteria.

2. Using RAG to search through a comprehensive database of professor reviews and information.

3. Selecting the top 3 most relevant professors based on the query and available data.

4. Providing a concise summary for each of the top 3 professors, including:
   - Professor's name
   - Subject(s) taught
   - Overall rating (out of 5 stars)
   - A brief highlight of their strengths or notable characteristics
   - A short excerpt from a positive student review

5. Offering additional context or advice if appropriate, such as tips for success in the professor's class or how to choose between the recommended professors.

6. Answering follow-up questions about the recommended professors or helping to refine the search if the student needs more specific information.

7. Maintaining a neutral and informative tone, focusing on factual information from the reviews rather than personal opinions.

8. Respecting privacy by not sharing any personal information about professors beyond what is publicly available in the reviews.

9. Encouraging students to make their own informed decisions based on the information provided.

Remember, your goal is to assist students in finding professors who best match their academic needs and preferences. Always strive to provide accurate, helpful, and concise information to support students in their academic journey.
`


export async function POST(req){
    const data = await req.json()

    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY, 
    })

    const index = pc.index('rag').namespace('ns1')
    const openai = new OpenAI()

    const text = data[data.length - 1].content
    const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small', 
        input: text, 
        encoding_format: 'float',
    })

    const results = await index.query({
        topK: 3, 
        includeMetadata: true, 
        vector: embedding.data[0].embedding
    })

    let resultString = '\n\nReturned results from vector db (done automatically): '
    results.matches.forEach((match) => {
        resultString+= `\n
        Professor: ${match.id}
        Review: ${match.metadata.stars}
        Subject: ${match.metadata.subject}
        Stars ${match.metadata.stars}
        \n\n
        `
    })

    const lastMessage = data[data.length - 1]
    const lastMessageContent = lastMessage.content + resultString
    const lastDataWithoutLastMessage = data.slice(0, data.length - 1)
    const completion = await openai.chat.completions.create({
        messages:[
            {role: 'system', content: systemPrompt},
            ...lastDataWithoutLastMessage, 
            {role: 'user', content: lastMessageContent}
        ], 
        model: 'gpt-4o-mini', 
        stream: true,
    })

    const stream = new ReadableStream({
        async start(controller){
            const encoder = new TextEncoder()
            try{
                for await (const chunk of completion){
                    const content = chunk.choices[0]?.delta?.content
                    if(content){
                        const text = encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            } catch (err){
                controller.error(err)
            } finally {
                controller.close()
            }
        }
    })
    return new NextResponse(stream)
 }