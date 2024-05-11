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

    // get borrowed books by email
    app.get("/allBorrowers/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const cursor = borrowerCollection.find(query);
      const result = await cursor.toArray();
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
    //
    //
    // borrow data sent to database from client and server
    // borrow data sent to database from client and server
    // app.post("/allBorrowers", async (req, res) => {
    //   const newBorrower = req.body;
    //   console.log(newBorrower);

    //   try {
    //     // First, insert the new borrower into borrowerCollection
    //     const borrowerResult = await borrowerCollection.insertOne(newBorrower);

    //     // Then, decrement the quantity of the borrowed book in booksCollection
    //     const bookId = newBorrower.book_id;
    //     const query = { _id: new ObjectId(bookId) };
    //     const book = await booksCollection.findOne(query);

    //     if (!book) {
    //       console.log(`Book with id ${bookId} not found`);
    //       return res.status(404).json({ message: "Book not found" });
    //     }

    //     // Convert quantity from string to number
    //     const quantity = parseInt(book.quantity);

    //     // Check if quantity is valid
    //     if (isNaN(quantity)) {
    //       console.log(`Quantity of book ${bookId} is not a number`);
    //       return res.status(500).json({ message: "Invalid quantity" });
    //     }

    //     // Check if quantity is greater than 0
    //     if (quantity <= 0) {
    //       console.log(`Quantity of book ${bookId} is already 0`);
    //       return res.status(400).json({ message: "Book quantity already 0" });
    //     }

    //     // Decrement quantity by 1
    //     const updatedQuantity = quantity - 1;

    //     // Update quantity in the database
    //     const updateResult = await booksCollection.updateOne(query, {
    //       $set: { quantity: updatedQuantity.toString() },
    //     });

    //     if (updateResult.modifiedCount === 1) {
    //       console.log(`Quantity of book ${bookId} decremented successfully`);
    //     } else {
    //       console.log(`Failed to decrement quantity of book ${bookId}`);
    //       return res.status(500).json({ message: "Failed to update quantity" });
    //     }

    //     res.status(200).json({
    //       message: "Borrower added successfully",
    //       borrower: borrowerResult.ops[0],
    //       updateResult: updateResult || null,
    //     });
    //   } catch (error) {
    //     console.error("Error borrowing book:", error);
    //     res.status(500).json({ message: "Internal server error" });
    //   }
    // });

    // borrow data sent to database from client and server
    app.post("/allBorrowers", async (req, res) => {
      const newBorrower = req.body;
      console.log(newBorrower);

      try {
        const bookId = newBorrower.book_id;
        const query = { _id: new ObjectId(bookId) };
        const book = await booksCollection.findOne(query);

        const quantity = parseInt(book.quantity);

        // Check if quantity is valid and greater than 0
        if (quantity <= 0) {
          console.log(`Quantity of book ${bookId} is already 0`);
          return res
            .status(400)
            .json({ message: "Sorry no book left, so cannot be borrowed" });
        }

        // Decrement quantity by 1
        const updatedQuantity = quantity - 1;

        // Update quantity in the database
        const updateResult = await booksCollection.updateOne(query, {
          $set: { quantity: updatedQuantity.toString() },
        });

        if (updateResult.modifiedCount === 1) {
          console.log(`Quantity of book ${bookId} decremented successfully`);
          return res
            .status(200)
            .json({ message: "Quantity decremented successfully" });
        } else {
          console.log(`Failed to decrement quantity of book ${bookId}`);
          return res.status(500).json({ message: "Failed to update quantity" });
        }
      } catch (error) {
        console.error("Error decrementing book quantity:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    });

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
