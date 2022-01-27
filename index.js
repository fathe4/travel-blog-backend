const express = require('express')
const app = express()
const cors = require('cors')
const fileUpload = require('express-fileupload')
const { MongoClient } = require('mongodb');
const objectId = require('mongodb').ObjectId
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const port = process.env.PORT || 5000

var bodyParser = require('body-parser');

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));

// DB_USER=bicycleDB
// DB_PASS=bicycleDB321


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wanl6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect();
        const database = client.db("travel");
        const travelBlogCollection = database.collection("blogs");
        const travelBlogUsersCollection = database.collection("users");
        const travelCategoriesCollection = database.collection("categories");
        const bicycleReviewsCollection = database.collection("reviews");

        // ADD USERS 
        app.post('/addUser', async (req, res) => {
            console.log('hitting user');
            const user = req.body
            const result = await travelBlogUsersCollection.insertOne(user)
            res.json(result)
            console.log(result);
        })

        // UPDATE USER
        app.put('/addUser', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await travelBlogUsersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });


        // ADD BLOG
        app.post('/dashboard/addBlog', async (req, res) => {

            console.log('hitting blog');
            const { admin, email, approval } = req.body
            const title = req.body.title
            const expense = req.body.expense
            const ratings = req.body.ratings
            const date = req.body.date
            const time = req.body.time
            const category = req.body.category
            const location = req.body.location
            const description = req.body.description
            const pic = req.files.url
            const picData = pic.data
            const encodedPic = picData.toString('base64')
            const imageBuffer = Buffer.from(encodedPic, 'base64')
            const blogDetail = {
                title,
                expense,
                ratings,
                date,
                time,
                category,
                location,
                description,
                admin,
                approval,
                email,
                url: imageBuffer
            }
            const result = await travelBlogCollection.insertOne(blogDetail)
            res.json(result)

        })

        // MAKE ADMIN
        app.put('/dashboard/makeAdmin', async (req, res) => {
            const email = req.body
            const adminEmail = email.email


            const filter = { email: adminEmail };

            const updateDoc = {
                $set: {
                    roll: 'admin'
                },
            };
            const result = await travelBlogUsersCollection.updateOne(filter, updateDoc);
            res.json(result)
            console.log('database', result);

        })

        // ADMIN CHECK
        app.get('/users/:email', async (req, res) => {
            console.log('admin', req.params);
            const email = req.params.email
            const adminEmail = { email: email }
            // console.log(adminEmail);
            const user = await travelBlogUsersCollection.findOne(adminEmail);
            // console.log(user);
            let isAdmin = false;
            if (user?.roll === 'admin') {
                isAdmin = true
            }
            res.json({ admin: isAdmin })
        })

        // USER CHECK
        app.get('/users/', async (req, res) => {
            // console.log(adminEmail);
            const user = travelBlogUsersCollection.find({});
            const result = await user.toArray()
            res.json(result)
        })


        // DISPLAY BLOGS
        app.get('/blogs', async (req, res) => {
            const cursor = travelBlogCollection.find({});
            const result = await cursor.toArray()
            res.json(result)

        })



        // CHECK BLOGS BY ID OR USER EMAIL
        app.get('/dashboard/blog', async (req, res) => {
            console.log('hitting query blogs');

            if (req.query.email) {
                console.log('email');
                const email = req.query.email
                const query = { email: email }
                const result = await travelBlogCollection.findOne(query);
                console.log(result);
                res.json(result)

            } else if (req.query.id) {

                const id = req.query.id
                const filter = { _id: objectId(id) }
                const cursor = travelBlogCollection.find(filter);
                const result = await cursor.toArray()
                console.log(result);
                res.json(result)
            }

        })
        // CHECK BLOGS BY USER EMAIL
        app.get('/dashboard/blog/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const cursor = travelBlogCollection.find(query);
            const result = await cursor.toArray()
            console.log(result);
            res.json(result)


        })


        // UPDATE BLOG
        app.put('/dashboard/blog/:id', async (req, res) => {
            const id = req.params.id
            let setData = {}
            const { title, expense, date, time, category, ratings, location, description, url } = req.body
            if (title) {
                setData['title'] = title;
            }
            if (expense) {
                setData['expense'] = expense;
            }
            if (date) {
                setData['date'] = date
            }
            if (time) {
                setData['time'] = time
            }
            if (category) {
                setData['category'] = category
            }
            if (ratings) {
                setData['ratings'] = ratings
            }
            if (location) {
                setData['location'] = location
            }
            if (description) {
                setData['description'] = description
            }
            if (url) {
                setData['url'] = url
            }



            const filter = { _id: objectId(id) };
            const options = { upsert: true };

            const updateDoc = {
                $set: setData
            };
            const result = await travelBlogCollection.updateOne(filter, updateDoc, options);
            res.json(result)
            console.log(result);

        })

        // UPDATE BLOG APPROVAL
        app.put('/dashboard/approval/:id', async (req, res) => {

            const id = req.params.id
            const approval = req.body
            console.log('approval', approval);

            const filter = { _id: objectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    approval: approval.approval
                },
            };
            const result = await travelBlogCollection.updateOne(filter, updateDoc, options);
            res.json(result)

        })

        // DELETE BLOG
        app.delete('/dashboard/blog/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: objectId(id) }
            const result = await travelBlogCollection.deleteOne(query)
            res.json(result)

        })

        // DELETE BLOG
        app.delete('/dashboard/product/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: objectId(id) }
            const result = await travelBlogCollection.deleteOne(query)
            res.json(result)
            console.log(result);
        })

        // ADD ADMIN
        app.put('/dashboard/makeAdmin', async (req, res) => {
            const email = req.body

            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    roll: 'admin'
                },
            };
            const result = await travelCategoriesCollection.updateOne(filter, updateDoc, options);
            res.json(result)
            console.log('admin', result);
        })


    } finally {
        //   await client.close();
    }
}
run().catch(console.dir);



// MIDDLEWARE
app.use(cors())
app.use(express.json())
app.use(fileUpload())

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})