import { NextResponse } from "next/server";
const { MongoClient } = require("mongodb");

export async function GET(request) {
    // Replace the uri string with your connection string
    const uri = process.env.MONGODB_URI;
    const query=request.nextUrl.searchParams.get('query')
    console.log(query, typeof query)
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

        const products = await inventory.aggregate([{
            $match:{
            $or: [
                { productName:{ $regex: query, $options: "i" } }, // Partial matching for name field
                {sku: { $regex: query, $options: "i" } }, // Partial matching for price
                {location: { $regex: query, $options: "i" } } // Partial matching for price
            ]
        }
        }]).toArray()
        
        return NextResponse.json({products})
    } catch (error) {
        console.error("Error in GET /api/search:", error);
        return NextResponse.json({ products: [], error: error.message }, { status: 500 });
    } finally {
        await client.close();
    }
    
}





