require('dotenv').config();
const express = require('express');
const { MongoClient,ObjectId } = require('mongodb');
const cors = require('cors');  // Import CORS package
const port = 3000
const app = express();
app.use(cors());  // Enable CORS for all origins
app.use(express.json());
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');


const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const authorize = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: "Forbidden" });
  next();
};

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


// POST - create new admin
app.post('/admin', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.collection('admin').insertOne({
      email,
      password: hashedPassword,
      role
    });

    res.status(201).json({ id: result.insertedId, message: "Admin registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to register admin" });
  }
});

// POST - create new user
app.post('/users', async (req, res) => {
  try {
    const { fullName, email, phone, password, role, isApproved } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.collection('users').insertOne({
      fullName,
      email,
      phone,
      password: hashedPassword,
      role,
      isApproved
    });

    res.status(201).json({ id: result.insertedId, message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to register user" });
  }
});


// POST - create new driver
app.post('/drivers', async (req, res) => {
  try {
    const { fullName, email, phone, password, role, brand, model, colour, plate, isApproved } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.collection('drivers').insertOne({
      fullName,
      email,
      phone,
      password: hashedPassword,
      role,
      brand,
      model,
      colour,
      plate,
      isApproved
    });

    res.status(201).json({ id: result.insertedId, message: "Driver registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to register driver" });
  }
});

// POST - Login for admin, user, driver
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check Users
    let user = await db.collection('users').findOne({ email });
    if (user && user.isApproved === true) {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        const token = jwt.sign(
          { userId: user._id, role: 'user' },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        return res.status(200).json({ message: "Login successful", user, token });
      }
    }

    // Check Drivers
    let driver = await db.collection('drivers').findOne({ email });
    if (driver && driver.isApproved === true) {
      const match = await bcrypt.compare(password, driver.password);
      if (match) {
        const token = jwt.sign(
          { userId: driver._id, role: 'driver' },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        return res.status(200).json({ message: "Login successful", user: driver, token });
      }
    }

    // Check Admins
    let admin = await db.collection('admin').findOne({ email });
    if (admin) {
      const match = await bcrypt.compare(password, admin.password);
      if (match) {
        const token = jwt.sign(
          { userId: admin._id, role: 'admin' },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        return res.status(200).json({ message: "Login successful", user: admin, token });
      }
    }

    // If none matched
    res.status(401).json({ message: "Invalid credentials or not approved" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//PATCH - approved registration for user and driver
app.patch('/admin/all/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { isApproved } = req.body;

  try {
    // Try updating in users collection
    let result = await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: { isApproved } }
    );

    let message = ""; // Default message

    // If not found in users, try drivers
    if (result.matchedCount === 0) {
      result = await db.collection('drivers').updateOne(
        { _id: new ObjectId(id) },
        { $set: { isApproved } }
      );
      
      // If found in drivers, set the message accordingly
      if (result.matchedCount > 0) {
        message = isApproved ? "Driver approved" : "Driver rejected";
      }
    } else {
      // If found in users, set the message accordingly
      message = isApproved ? "User approved" : "User rejected";
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
app.delete('/admin/all/:id/reject', authenticate, authorize(['admin']), async (req, res) => {
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

    if (account.isApproved === true) {
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
    const approvedUsersCount = await db.collection('users').countDocuments({ isApproved: true });

    // Get the count of approved drivers
    const approvedDriversCount = await db.collection('drivers').countDocuments({ isApproved: true });

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
      isApproved: true,
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

