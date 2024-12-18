import express, {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";
import cors from "cors";
import jwt, { verify } from "jsonwebtoken";
import { MongoClient, ServerApiVersion } from "mongodb";
import { TQuery } from "./types";
const app = express();
const port = 3000;

// middleware
require("dotenv").config();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fudiykq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const gadgetShopDB = client.db("gadget-shop");

    await gadgetShopDB.command({ ping: 1 });

    const usersCollection = gadgetShopDB.collection("users");
    const allProductCollection = gadgetShopDB.collection("all-product");

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    app.post("/jwt", (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.JWT_ACCESS_SECRET as string, {
        expiresIn: "10d",
      });

      res.send({ token });
    });

    app.get("/user/:email", async (req, res) => {
      const { email } = req?.params;
      console.log(email);
      const existUser = await usersCollection.findOne({ email });
      if (!existUser) {
        res.send({ message: "User Does not exist!" });
        return;
      }

      res.send(existUser);
    });

    app.post(`/user/:email`, async (req: Request, res: Response) => {
      const { email } = req?.params;
      const { userData } = req?.body;
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        res.send({ message: "This user Already exist!" });
        return;
      }
      const result = await usersCollection.insertOne(userData);
      res.send(result);
    });

    // Products
    app.post("/add-product", async (req, res) => {
      const products = req.body;

      console.log(products);
      const result = await allProductCollection.insertOne(products);

      res.send(result);
    });

    app.get("/all-product", async (req, res) => {
      const { brand, title, category, sort } = req.query;

      const query: TQuery = {};

      if (title) {
        query.title = { $regex: title as string, $options: "i" };
      }
      if (category) {
        query.category = { $regex: category as string, $options: "i" };
      }

      if (brand) {
        query.brand = brand as string;
      }

      const sortOption = sort === "asc" ? 1 : -1;

      const result = await allProductCollection
        .find(query)
        .sort({ price: sortOption })
        .toArray();
      res.send(result);
    });

    app.get("/my-product/:email", async (req: Request, res: Response) => {
      const { email } = req?.params;
      const existingUser = await usersCollection.findOne({ email });
      if (!existingUser) {
        res.send({ message: "This user Does not exist!" });
        return;
      }
      const result = await allProductCollection.findOne({ sellerEmail: email });
      res.send(result);
    });
  } catch (err) {
    console.log(err);
  }
}
run();

app.get("/", (req, res) => {
  res.send("server is  running...!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
