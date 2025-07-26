import { NextResponse } from "next/server";
const { MongoClient } = require("mongodb");

export async function GET(request) {
    // Replace the uri string with your connection string
    const uri = "mongodb+srv://kush:kush@inventorymanagement.cyn3nhp.mongodb.net/";
    
    const client = new MongoClient(uri);
    
    
    try {
        const database = client.db('BishnuFurniture');
        const inventory = database.collection('Inventory');
        
        // Queries for a movie that has a title value of 'Back to the Future'
        const query = { };
        const allProducts = await inventory.find(query).toArray();
        
        return NextResponse.json({allProducts})
    } finally {
        await client.close();
    }
    
}
export async function POST(request) {

    let body=await request.json()
    // Replace the uri string with your connection string
    const uri = "mongodb+srv://kush:kush@inventorymanagement.cyn3nhp.mongodb.net/";
    console.log(body)
    const client = new MongoClient(uri);
    
    
    try {
        const database = client.db('BishnuFurniture');
        const inventory = database.collection('Inventory');
        
        // Queries for a movie that has a title value of 'Back to the Future'
        const query = { };
        const products = await inventory.insertOne(body); 
        
        return NextResponse.json({products,ok:true})
    } finally {
        await client.close();
    }
    
}