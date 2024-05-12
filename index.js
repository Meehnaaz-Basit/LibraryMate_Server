const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleware
app.use(cors());
app.use(express.json());

// mongo

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jzmmeq8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const categoryCollection = client
      .db("libraryMateDB")
      .collection("categories");
    const booksCollection = client.db("libraryMateDB").collection("books");
    const borrowerCollection = client
      .db("libraryMateDB")
      .collection("borrowers");

    // get cat from db to server
    app.get("/categories", async (req, res) => {
      const result = await categoryCollection.find().toArray();
      res.send(result);
    });
    app.get("/allBooks", async (req, res) => {
      const result = await booksCollection.find().toArray();
      res.send(result);
    });
    // borrower
    app.get("/allBorrowers", async (req, res) => {
      const result = await borrowerCollection.find().toArray();
      res.send(result);
    });

    // Add a route to fetch crafts based on category
    app.get("/singleCategory/:category", async (req, res) => {
      const category = req.params.category;
      const query = { category: category };
      const cursor = booksCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    // fetch single data by id
    app.get("/bookDetail/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await booksCollection.findOne(query);
      res.send(result);
    });

    // data sent to database from client from and server
    app.post("/allBooks", async (req, res) => {
      const newBook = req.body;
      console.log(newBook);
      const result = await booksCollection.insertOne(newBook);
      res.send(result);
    });
    // borrow data sent to database from client from and server
    // app.post("/allBorrowers", async (req, res) => {
    //   const newBorrowers = req.body;
    //   console.log(newBorrowers);
    //   const result = await borrowerCollection.insertOne(newBorrowers);
    //   res.send(result);
    // });
    //**** */
    // borrow data sent to database from client from and server
    // borrow data sent to database from client from and server
    app.post("/allBorrowers", async (req, res) => {
      const newBorrowers = req.body;
      console.log(newBorrowers);
      const { book_id } = newBorrowers; // Assuming you're sending book_id in the request body

      // Fetch the current quantity of the borrowed book
      const book = await booksCollection.findOne({
        _id: new ObjectId(book_id),
      });

      // Ensure the quantity is a number
      const currentQuantity = parseInt(book.quantity);

      // Check if currentQuantity is a valid number and greater than 0
      if (!isNaN(currentQuantity) && currentQuantity > 0) {
        // Reduce the quantity of the borrowed book in the books collection by 1
        await booksCollection.updateOne(
          { _id: new ObjectId(book_id) }, // Filter by the book_id
          { $set: { quantity: currentQuantity - 1 } } // Set the quantity to currentQuantity - 1
        );

        // Insert the borrower information into the borrowers collection
        const result = await borrowerCollection.insertOne(newBorrowers);

        res.send(result);
      } else {
        // Handle the case where the quantity is not greater than 0
        console.error("Cannot borrow book. Quantity is zero or less.");
        res.status(400).send("Cannot borrow book. Quantity is zero or less.");
      }
    });

    //**** */

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

//
app.get("/", (req, res) => {
  res.send("library server is running");
});

app.listen(port, () => {
  console.log(`server is running in port ${port}`);
});
