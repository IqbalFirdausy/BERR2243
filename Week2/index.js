const { MongoClient } = require('mongodb');

const drivers = [
    {
        name: "John Doe",
        vehicleType: "Sedan",
        isAvailable: true,
        rating: 4.8
    },
    {
        name: "Alice Smith",
        vehicleType: "SUV",
        isAvailable: false,
        rating: 4.5
    }
];

//show the data in the console
//console.log(drivers);

//Read and display the driver’s name into the console
//drivers.forEach((drivers) => console.log(drivers.name));

//Add a new driver directly in the array
drivers.push({ name: "Iqbal", vehicleType: "Sedan", isAvailable: true, rating: 4.4 });

//console.log(drivers);

async function main() {
    // Replace <connection-string> with your MongoDB URI
    const uri = "mongodb://localhost:27017";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db("testDB");

        const driversCollection = db.collection("drivers");

        //add driver
        for (const driver of drivers) {
            const result = await driversCollection.insertOne(driver);
            console.log(`New driver created with result: ${result.insertedId}`);
        }

        //drivers.forEach(async (driver) => {
        //    const result = await driversCollection.insertOne(driver);
        //    console.log (`New driver created with result: ${result}`);  
        //});

        //find driver
        const availableDrivers = await db.collection('drivers').find({
            isAvailable: true,
            rating: {$gte: 4.5}
        }).toArray();
        console.log("Available drivers:", availableDrivers)

        //update driver
        const update = await db.collection('drivers').updateMany(
            { name: "John Doe" },
            { $inc: { rating: 0.1 } }
        );
        console.log (`Driver update with result: ${update}`); 

        //delete driver
        const deleteResult = await db.collection('drivers').deleteMany(
            { isAvailable: false }
        );
        console.log (`Driver delete with result: ${deleteResult}`);
        
    } finally {
        await client.close();
    }
}

main();
