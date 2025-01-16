import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { User } from './Models/userModel.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import bcrypt from 'bcryptjs';

cloudinary.config({
  cloud_name: 'dnvtxuawy',
  api_key: '966893985626139',
  api_secret: 'cJgxhRHQxmKQ10omnoNnWCxeYQk',
});

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(path.resolve(), 'views'));

app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Render register page
app.get('/register', (req, res) => {
  res.render('register');
});

// Create user
app.post('/register', upload.single('file'), async (req, res) => {
  const { name, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10); // Use a higher salt round for better security


  try {
    if (!req.file) {
      return res.status(400).send('File not uploaded');
    }

    const result = await cloudinary.uploader.upload(req.file.path, { folder: 'auth_project' });
    let newUser = new User({
      name: name,
      email: email,
      password: hashedPassword,
      profilePic: result.secure_url,
    });
    

    await newUser.save();
    console.log('User created:', newUser);

    res.redirect('/');
  } catch (err) {
    console.error('Error in user creation:', err);
    res.status(500).render('register', { error: 'User creation failed' });
  }
});

//all users
app.get('/users', async (req, res) => {
  try {
    let users = await User.find().sort({ created_at: -1 });
    res.render('users.ejs', { users: users });
  } catch (err) {
    console.error('Error in fetching users:', err);
    res.status(500).send('Error in fetching users');
  }
});

// Render login page
app.get('/', (req, res) => {
  res.render('login');
});
//login user

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Debugging: Check incoming request data
    console.log('Login attempt:', { email, password });

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found');
      return res.render('login.ejs', { error: 'User not found' });
    }

    console.log('User found:', user);

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password validation result:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Incorrect password');
      return res.render('login.ejs', { error: 'Incorrect password' });
    }

    // Successful login
    console.log('Login successful for user:', user.email);
    res.render('profile.ejs', { user });
  } catch (err) {
    console.error('Error during user login:', err);
    res.status(500).render('login.ejs', { error: 'An unexpected error occurred. Please try again later.' });
  }
});


// Connect to MongoDB
mongoose.connect('mongodb+srv://rijim843:secjim1234@cluster0.dyxt0.mongodb.net/', {
  dbName: 'auth_project',
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error in MongoDB connection:', err);
});

const PORT = 1000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
