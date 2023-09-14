const express = require("express");
const jwt = require('jsonwebtoken')
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

//midleware
 app.use(cors());
 app.use(express.json())

 const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.p43vn94.mongodb.net/?retryWrites=true&w=majority`;
 
 // Create a MongoClient with a MongoClientOptions object to set the Stable API version
 const client = new MongoClient(uri, {
   serverApi: {
     version: ServerApiVersion.v1,
     strict: true,
     deprecationErrors: true,
   }
 });
 
  const verifyJWT = (req, res, next)=>{
    console.log("hit on backend")
    console.log(req.headers.authorization)
    const authorization = req.headers.authorization
    if(!authorization){
      return res.send({error: true, message: "Un authorised access"})
    }
    const token = authorization.split(' ')[1]
    console.log("verify jwt token", token)
  }


 async function run() {
   try {
     // Connect the client to the server	(optional starting in v4.7)
     await client.connect();

     const serviceCollections = client.db("carDoctor").collection("services");
     const bookingCollections = client.db("carDoctor").collection("bookings");
      //jwt
      app.post('/jwt', (req, res)=>{
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "1h"
        })
        res.send({token})
      })

     //service
      app.get('/services', async(req, res)=>{
      const cursor = serviceCollections.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/services/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};

      const options = {
      // Include only the `title` and `imdb` fields in the returned document
      projection: { title: 1, price: 1, service_id: 1, img: 1 },
    };

      const result =await serviceCollections.findOne(query, options);
      res.send(result)
    })

    //bookings

    app.post('/bookings', async(req, res)=>{
      const booking = req.body;
      const result = await bookingCollections.insertOne(booking);
      res.send(result)
      console.log(booking)
    })

    app.get('/bookings', verifyJWT, async(req, res)=>{
     // console.log(req.headers.authorization)
      let query = {};
      if(req.query?.email) {
        query = {email: req.query.email}
      }
      const result = await bookingCollections.find(query).toArray();
      res.send(result)
    })

    app.patch('/bookings/:id', async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updateBooking = req.body;
      console.log(updateBooking)

      const updateDoc = {
        $set: {
          status: updateBooking.status
        },
      };

      const result = await bookingCollections.updateOne(filter, updateDoc)
      res.send(result)
    })

    app.delete('/bookings/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await bookingCollections.deleteOne(query);
      res.send(result)
    })

     // Send a ping to confirm a successful connection
     await client.db("admin").command({ ping: 1 });
     console.log("Pinged your deployment. You successfully connected to MongoDB!");
   } finally {
     // Ensures that the client will close when you finish/error
    //  await client.close();
   }
 }
 run().catch(console.dir);
 


//
 app.get('/', (req, res)=>{
    res.send('doctor is running')
 })

 app.listen(port, ()=>{
    console.log(`server is running in port ${port}`)
 })