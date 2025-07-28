import { NextResponse } from "next/server";
const { MongoClient, ObjectId } = require("mongodb");

export async function PUT(request, { params }) {
    const { id } = await params;
    const body = await request.json();
    
    const uri = process.env.MONGODB_URI;
    
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
        
        // Update the product with the given ID
        const result = await inventory.updateOne(
            { _id: new ObjectId(id) },
            { $set: body }
        );
        
        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }
        
        return NextResponse.json({ success: true, message: 'Product updated successfully' });
    } catch (error) {
        console.error("Error in PUT /api/product/[id]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        await client.close();
    }
}

export async function DELETE(request, { params }) {
    const { id } = await params;
    
    const uri = process.env.MONGODB_URI;
    
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
        
        // Delete the product with the given ID
        const result = await inventory.deleteOne({ _id: new ObjectId(id) });
        
        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }
        
        return NextResponse.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error("Error in DELETE /api/product/[id]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        await client.close();
    }
} 