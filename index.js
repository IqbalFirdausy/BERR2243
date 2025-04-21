const express = require('express');
const { MongoClient,ObjectId } = require('mongodb');
const cors = require('cors');  // Import CORS package
const port = 3000

const app = express();
app.use(cors());  // Enable CORS for all origins
app.use(express.json());

let db;

async function connectToMongoDB() {
    // Replace <connection-string> with your MongoDB URI
    const uri = "mongodb://localhost:27017";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("Connected to MongoDB!");

        db = client.db("testDB");
    } catch (err) {
        console.error("Error:", err);
    } 
}
connectToMongoDB();

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


//POST- create new user
app.post('/users', async (req, res) => {
    try {
      const { fullName, email, phone, password, role, approved } = req.body;
  
      const result = await db.collection('users').insertOne({
        fullName,
        email,
        phone,
        password,
        role,
        approved
      });
  
      res.status(201).json({ id: result.insertedId });
      alert("Sucessfull Registration");
    } catch (err) {
      res.status(400).json({ error: "Failed to register user" });
    }
  });
  
  //POST- create new driver
app.post('/drivers', async (req, res) => {
    try {
      const { fullName, email, phone, password, role, brand, model, colour, plate, approved } = req.body;
  
      const result = await db.collection('drivers').insertOne({
        fullName,
        email,
        phone,
        password,
        role,
        brand,
        model,
        colour,
        plate,
        approved
      });
  
      res.status(201).json({ id: result.insertedId });
      alert("Sucessfull Registration");
    } catch (err) {
      res.status(400).json({ error: "Failed to register user" });
    }
  });

// POST - Login for admin, user, driver
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await db.collection('users').findOne({ email, password });

    if (user && user.approved === true) {
      return res.status(200).json({ message: "Login successful", user });
    }

    let driver = await db.collection('drivers').findOne({ email, password });

    if (driver && driver.approved === true) {
      return res.status(200).json({ message: "Login successful", user: driver });
    }

    let admin = await db.collection('admin').findOne({ email, password });

    if (admin) {
      return res.status(200).json({ message: "Login successful", user: admin });
    }

    res.status(401).json({ message: "Invalid credentials or not approved" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//PATCH - approved registration for user and driver
app.patch('/admin/all/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { approved } = req.body;

  try {
    // Try updating in users collection
    let result = await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: { approved } }
    );

    let message = ""; // Default message

    // If not found in users, try drivers
    if (result.matchedCount === 0) {
      result = await db.collection('drivers').updateOne(
        { _id: new ObjectId(id) },
        { $set: { approved } }
      );
      
      // If found in drivers, set the message accordingly
      if (result.matchedCount > 0) {
        message = approved ? "Driver approved" : "Driver rejected";
      }
    } else {
      // If found in users, set the message accordingly
      message = approved ? "User approved" : "User rejected";
    }

    // If no matching user or driver is found
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User or driver not found" });
    }

    res.status(200).json({ message });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//delete - reject registration for user and driver
app.delete('/admin/all/:id/reject', async (req, res) => {
  const userId = req.params.id;

  try {
    const objectId = new ObjectId(userId);

    // Try to find user first
    let account = await db.collection('users').findOne({ _id: objectId });

    let accountType = 'user';

    // If not found in users, check drivers
    if (!account) {
      account = await db.collection('drivers').findOne({ _id: objectId });
      accountType = 'driver';
    }

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (account.approved === true) {
      return res.status(403).json({ message: `Cannot reject approved ${accountType} account` });
    }

    const collectionName = accountType === 'user' ? 'users' : 'drivers';
    await db.collection(collectionName).deleteOne({ _id: objectId });

    res.status(200).json({ message: `${accountType.charAt(0).toUpperCase() + accountType.slice(1)} account rejected and deleted successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

//PATCH - admin block user or driver
app.patch('/admin/all/:id/block', async (req, res) => {
  const userId = req.params.id;

  try {
    const objectId = new ObjectId(userId);

    // Try to find the user first
    let account = await db.collection('users').findOne({ _id: objectId });
    let accountType = 'user';

    // If not found in users, check drivers
    if (!account) {
      account = await db.collection('drivers').findOne({ _id: objectId });
      accountType = 'driver';
    }

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const collectionName = accountType === 'user' ? 'users' : 'drivers';

    // Update isBlock to "1"
    await db.collection(collectionName).updateOne(
      { _id: objectId },
      { $set: { isBlock: "1" } }
    );

    res.status(200).json({ message: `${accountType.charAt(0).toUpperCase() + accountType.slice(1)} account has been blocked` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

//GET - analytic which count total user and driver
app.get('/admin/analytic/count', async (req, res) => {
  try {
    // Get the count of approved users
    const approvedUsersCount = await db.collection('users').countDocuments({ approved: true });

    // Get the count of approved drivers
    const approvedDriversCount = await db.collection('drivers').countDocuments({ approved: true });

    // Send the response with both counts
    res.status(200).json({
      message: "Counts fetched successfully",
      approvedUsersCount,
      approvedDriversCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
  
//PATCH - driver update availability
app.patch('/drivers/:id/status', async (req, res) => {
  const driverId = req.params.id;

  try {
    const objectId = new ObjectId(driverId);

    const driver = await db.collection('drivers').findOne({ _id: objectId });

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Update isAvailable to "1"
    await db.collection('drivers').updateOne(
      { _id: objectId },
      { $set: { isAvailable: "1" } }
    );

    res.status(200).json({ message: 'Driver status updated to available' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

//GET - driver check earning
app.get('/drivers/:id/earnings', async (req, res) => {
  const driverId = req.params.id;

  try {
    const objectId = new ObjectId(driverId);

    // Fetch the driver data (assumes 'earning' is part of the driver document)
    const driver = await db.collection('drivers').findOne({ _id: objectId });

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    const earnings = driver.earning || 0;  

    res.status(200).json({
      driverId,
      earnings,
      message: 'Driver earnings retrieved successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

//GET - Customer select driver
app.get('/users/select-driver', async (req, res) => {
  try {
    // Fetch all drivers who are approved, not blocked, and available
    const freeDrivers = await db.collection('drivers').find({
      approved: true,
      isBlock: "0",
      isAvailable: "1"
    }).toArray();

    if (freeDrivers.length === 0) {
      return res.status(404).json({ message: 'No free drivers available' });
    }

    res.status(200).json({
      freeDrivers,
      message: 'List of free drivers retrieved successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

