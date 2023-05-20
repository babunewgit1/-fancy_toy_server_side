const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();

// middleware
app.use(cors());
app.use(express.json());

//mongobd setup

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster-1.vbj8kjp.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const database = client.db("fancytoy").collection("fancytoyproduct");

    // routes defines
    app.post("/addtoy", async (req, res) => {
      const toy = req.body;
      const result = await database.insertOne(toy);
      res.send(result);
    });

    // app.get("/kidstoy", async (req, res) => {
    //   const result = await database.find({}).limit(20).toArray();
    //   res.send(result);
    // });

    app.get("/search/:text", async (req, res) => {
      const element = req.params.text;
      const result = await database
        .find({ toy_name: { $regex: element, $options: "i" } })
        .toArray();
      res.send(result);
    });

    app.get("/alltoy/:cata", async (req, res) => {
      const cata = req.params.cata;
      const result = await database.find({ sub_cata: cata }).toArray();
      res.send(result);
    });

    app.get("/toy/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await database.findOne(query);
      res.send(result);
    });

    app.get("/mytoy/:email", async (req, res) => {
      const mail = req.params.email;
      const sort = req.query.sort;
      const result = await database
        .find({ seller_email: mail })
        .sort({ price: sort })
        .toArray();
      res.send(result);
    });

    app.put("/update/:id", async (req, res) => {
      const updateId = req.params.id;
      const docs = req.body;
      const filter = { _id: new ObjectId(updateId) };
      const updateDoc = {
        $set: {
          price: docs.price,
          quentity: docs.quentity,
          discription: docs.discription,
        },
      };
      const result = await database.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/delete/:id", async (req, res) => {
      const deletedId = req.params.id;
      const query = { _id: new ObjectId(deletedId) };
      const result = await database.deleteOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

//routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
