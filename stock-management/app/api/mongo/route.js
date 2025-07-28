import { NextResponse } from "next/server";
const { MongoClient } = require("mongodb");

export async function GET(request) {
    // Replace the uri string with your connection string
    const uri = process.env.MONGODB_URI;
    
    const client = new MongoClient(uri);
    
    
    try {
        const database = client.db('BishnuFurniture');
        const movies = database.collection('Inventory');
        
        // Queries for a movie that has a title value of 'Back to the Future'
        const query = { };
        const movie = await movies.find(query).toArray();
        
        console.log(movie);
        return NextResponse.json({"a":34,movie})
    } finally {
        await client.close();
    }
    
}