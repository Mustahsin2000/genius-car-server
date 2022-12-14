const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();

/*
geniusDBUser
94H9A4Nxya502IYN
*/


//middle wires
app.use(cors());
app.use(express.json());

console.log(process.env.DB_USER);
console.log(process.env.DB_PASSWORD);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wfblndv.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// function verifyJWT(req,res,next){
//        const authHeader = req.headers.authorization;
//        if(!authHeader){
//         res.status(401).send({message:'unauthorized access'})
//        }
//        const token = authHeader.split(' ')[1];
//        jwt.verify(token,process.env.ACCESS_TOKEN_SECRET, function(err,decoded){
//         if(err){
//           res.status(401).send({message:'unauthorized access'})
//         }
//         req.decoded = decoded;
//         next();
//        });
// }

function verifyJWT(req,res,next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message : 'unauthorized access'})
  }
  const token = authHeader.split(' ')[1];

  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,function(err,decoded){
    if(err){
     return res.status(401).send({message : 'Forbidden access'})
    }
    req.decoded = decoded;
    next();
  })
}

async function run(){
try{
  const serviceCollection = client.db('geniusCar').collection('services');
  const orderCollection = client.db('geniusCar').collection('orders');

  app.post('/jwt',(req,res)=>{
    const user = req.body;
    const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'});
    res.send({token});
  })

  app.get('/services',async(req,res)=>{
    // const query = {price:{$gt:20 , $lt:200}};
    // const query = {price:{$eq:500}};
    // const query = {price:{$gte:200}};
    // const query = {price:{$in: [500,400,100]}};
    // const query = {price:{$nin: [500,400,100]}};
    // const query = {$and: [{price:{$gt:100}},{price:{$gt:300}}]};
    const search = req.query.search;
    console.log(search);
    let query = {};   
    if(search.length){
      query = {
        $text:{
          $search: search
        }
      }
    }
    const order = req.query.order === 'asc' ? 1 : -1;
    const cursor = serviceCollection.find(query).sort({price: order});
    const services = await cursor.toArray();
    res.send(services);
  });

  app.get('/services/:id',async(req,res)=>{
    const id = req.params.id;
    const query = {_id: ObjectId(id)};
    const service = await serviceCollection.findOne(query);
    res.send(service);
  })
  //orders api (order gula pauar jonno)
  app.get('/orders', verifyJWT , async(req,res)=>{
    const decoded = req.decoded;
    
    if(decoded.email !== req.query.email){
      res.status(403).send({message:'unauthorized access'})
    }
    // console.log(req.headers.authorization);
    let query = {};

    if(req.query.email){
        query={
            email:req.query.email
        }
    }

    const cursor = orderCollection.find(query);
    const orders = await cursor.toArray();
    res.send(orders);
  })

  //order api (order gula create korar jonno)
  app.post('/orders',verifyJWT,async(req,res)=>{
    const order = req.body;
    const result = await orderCollection.insertOne(order);
    res.send(result);
  });

//order ar update option er jonno(CRUD er D)
  app.patch('/orders/:id',verifyJWT,async(req,res)=>{
    const id = req.params.id;
    const status = req.body.status;
    const query = { _id: ObjectId(id)};
    const updatedDoc = {
        $set:{
            status: status
        }
    }
      const result = await orderCollection.updateOne(query,updatedDoc);
      res.send(result);
  })
  

  app.delete('/orders/:id',verifyJWT,async(req,res)=>{
    const id = req.params.id;
    const query = {_id:ObjectId(id)};
    const result = await orderCollection.deleteOne(query);
    res.send(result);
  })
}finally{

}
}
run().catch(err=>console.log(err));


app.get('/',(req,res)=>{
    res.send('genius car server is running')
})

app.listen(port,()=>{
    console.log(`Genius car server runnung on ${port}`);
})

