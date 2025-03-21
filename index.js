const { MongoClient } = require('mongodb');

async function main() {
    // Replace <connection-string> with your MongoDB URI
    const uri = "mongodb://localhost:27017";
    const client = new MongoClient(uri);

    console.time("Connection Time");

    try {
        await client.connect();
        console.log("Connected to MongoDB!");

        console.timeEnd("Connection Time");

        const db = client.db("testDB");
        const collection = db.collection("users");

        // Insert a document
        await collection.insertOne({ name: "Iqbal", age: 23 });
        console.log("Document inserted!");

        // Query the document
        const result = await collection.findOne({ name: "Iqbal" });
        console.log("Query result:", result);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.close();
    }
}

main();
