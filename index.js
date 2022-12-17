const mongoose = require("mongoose")
const express = require("express")
const Person = require("./models/Person")
const Contact = require("./models/Contact")
var multer = require('multer')
var csv = require('csvtojson')
const app = express()
const cors = require("cors")
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

app.use(express.json({ extended: false }))

const uri = "mongodb+srv://leninmern:leninmern@cluster0.kroxssy.mongodb.net/?"

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __dirname);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  },
})
var uploads = multer({ storage: storage })

const connectDB = async () => {
  try {
    await mongoose.connect(uri)
    console.log("MongoDB connected !!!")
  }
  catch (err) {
    console.log(err.message);
    process.exit(1)
  }
}
connectDB()

app.use(
  cors({
    origin: "*"
  })
)





//Auth
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body

  try {

    let user = await Person.findOne({ email: email })
    if (user) {
      return res.status(400).json({ errors: [{ message: "User already exists." }] })
    }

    user = new Person({
      name,
      email,
      password
    })

    //Encrypting password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save()

    const payload = {
      user: {
        id: user.id
      }
    }

    jwt.sign(payload, "itismysecret",
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw (err);
        res.json({ token })
      }
    )


  } catch (err) {
    console.log(err.message)
    res.status(500).send('Server Error.')
  }

})


app.post('/login', async (req, res) => {

  const { email, password } = req.body

  try {
    let user = await Person.findOne({ email: email })
    if (!user) {
      return res.status(400).json({ errors: [{ message: "Please Register." }] })
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ errors: [{ message: "Invalid Credential." }] })
    }


    const payload = {
      user: {
        id: user.id
      }
    }

    jwt.sign(payload,
      "itismysecret",
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw (err);
        res.json({ token })
      }
    )


  } catch (err) {
    console.log(err.message)
    res.status(500).send('Server Error.')
  }

})






//Upload

app.post('/contact', async (req, res) => {

  try {
    const newContact = new Contact({
      Name: req.body.name,
      Email: req.body.email,
      Phone: req.body.phone,
      Linkedin: req.body.linkedin
    })

    const contact = await newContact.save()
    res.json(contact)

  } catch (err) {
    console.log(err.message)
    res.status(500).send("Server Error!")
  }
})


var empResponse;

app.post('/csv', uploads.single('csvFile'), (req, res) => {
  csv()
    .fromFile(req.file.path)
    .then((response) => {
      for (var x = 0; x < response; x++) {
        empResponse = response[x].name
        response[x].name = empResponse
        empResponse = response[x].phone
        response[x].phone = empResponse
        empResponse = response[x].email
        response[x].email = empResponse
        empResponse = response[x].linkedin
        response[x].linkedin = empResponse
      }
      
      Contact.insertMany(response, (err, data) => {
        if (err) {
          console.log(err)
        } else {
          res.json(response)
        }
      })
    })
})






app.listen("8000", () => {
  console.log("Server Running!")
})