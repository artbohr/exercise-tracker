const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI, {useMongoClient: true});

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  exercises: [{
    description : String,
    duration : String
     }]
});

const User = mongoose.model("User", userSchema);

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

// create new user
app.post('/api/exercise/new-user', (req, res) =>{

  const userForm = new User({username: req.body.username});
  userForm.save();

  res.send({"username": userForm.username, "_id" : userForm._id})
});

// route for appending exercises
app.post('/api/exercise/add', (req, res) =>{
  const description = req.body.description
  const duration = req.body.duration

  User.findByIdAndUpdate(
        req.body.userId,
        {$push: {"exercises": {description: description, duration: duration}}},
        {safe: true, upsert: true, new : true},
        function(err, model) {
          console.log(err);
          res.send(model);
        }
    );
});

// route for finding a user by id
app.get("/api/user/:id", (req, res) => {
  User.findOne({_id: req.params.id}).then(doc=>res.send(doc))
});

// get all users
app.get('/api/exercise/users', (req, res) => {
  User.find({})
    .then(doc=>res.json(doc)
    ).catch(err=> res.send({message: err}))
});

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
