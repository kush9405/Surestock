import { NextResponse } from "next/server";
const { MongoClient } = require("mongodb");

export async function GET(request) {
    // Replace the uri string with your connection string
    const uri = "mongodb+srv://kush:kush@inventorymanagement.cyn3nhp.mongodb.net/?retryWrites=true&w=majority&ssl=true&tls=true";
    
    const client = new MongoClient(uri, {
        ssl: true,
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
        retryWrites: true,
        w: 'majority'
    });
    
    
    try {
        const database = client.db('BishnuFurniture');
        const inventory = database.collection('Inventory');
        
        // Queries for a movie that has a title value of 'Back to the Future'
        const query = { };
        const products = await inventory.find(query).toArray();
        
        return NextResponse.json({success:true,products})
    } finally {
        await client.close();
    }
    
}





export async function POST(request) {

    let body=await request.json()
    // Replace the uri string with your connection string
    const uri = "mongodb+srv://kush:kush@inventorymanagement.cyn3nhp.mongodb.net/?retryWrites=true&w=majority&ssl=true&tls=true";
    console.log(body)
    const client = new MongoClient(uri, {
        ssl: true,
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
        retryWrites: true,
        w: 'majority'
    });
    
    
    try {
        const database = client.db('BishnuFurniture');
        const inventory = database.collection('Inventory');
        
        // Queries for a movie that has a title value of 'Back to the Future'
        const query = { };
        const products = await inventory.insertOne(body); 
        
        return NextResponse.json({products,ok:true})
    } catch (error) {
        console.error("Error in POST /api/product:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        await client.close();
    }
    
}