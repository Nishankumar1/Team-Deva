const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/userModel'); // Adjust the path as necessary
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
 // Ensure bcrypt is available for hashing

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use('/pdfs', express.static(path.join(__dirname, 'public/pdfs')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // For parsing application/json


// Middleware for session management
app.use(session({
    secret: process.env.SESSION_SECRET || 'yourSecretKey', // Use environment variable for secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true } // Set secure to true if using HTTPS
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Learners', { // Update with your DB name
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// User registration route
app.post('/signup', async (req, res) => {
    const { name, email, password, learningStyle = 'Unknown' } = req.body;
    const newUser = new User({
        name,
        email,
        password, // Save hashed password
        learningStyle,
        courseProgress: {
            html: {
                completedLevels: [],
                currentLevel: 1,
                completionPercentage: 0
            }
        }
    });

    newUser.save()
        .then(() => res.sendFile(path.join(__dirname, 'public', 'login.html')))
        .catch(err => res.status(400).send('Error creating user: ' + err.message));
});

// User login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email' });
        }

        // Assuming you want to hash passwords, you should verify the password correctly.
        // Example if using bcrypt: const isMatch = await bcrypt.compare(password, user.password);
        if (password !== user.password) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        req.session.userId = user._id; // Store user ID in session
        if (user.learningStyle === 'Know') {
            // If learningStyle is unknown, redirect to the quiz page
            res.sendFile(path.join(__dirname, 'public', 'knowyourstyle.html'));
        } 
        // Send user data and dashboard HTML
        else if (user.learningStyle === 'Kinesthetic') {
            res.sendFile(path.join(__dirname, 'public', 'kinesthetic.html'));
        } else if (user.learningStyle === 'document') {
            res.sendFile(path.join(__dirname, 'public', 'newUserdashboard.html'));
        }
        else if (user.learningStyle === 'Know') {
            res.sendFile(path.join(__dirname, 'public', 'knowyourstyle.html'));
        }
        else if (user.learningStyle === 'Auditory') {
            res.sendFile(path.join(__dirname, 'public', 'audio.html'));
    } 
    } catch (error) {
        console.error('Error during login:', error); // Log error for debugging
        res.status(500).json({ message: 'Error during login: ' + error.message });
    }

    console.log('Logged in User ID:', req.session.userId);
});
// Since 'public' is already defined as the static directory, you can access files directly.
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});
app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/knowyourstyle', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'knowyourstyle.html'));
});

app.get('/kinesthetic', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'kinesthetic.html'));
});

app.get('/audio', ensureAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/public/audio.html');
});


app.post('/updateLearningStyle', async (req, res) => {
    const { learningStyle } = req.body;
    const userId = req.session.userId; // Automatically gets the logged-in user ID

    try {
        await User.findByIdAndUpdate(userId, { learningStyle });
        res.status(200).json({ message: 'Learning style updated successfully.' });
    } catch (error) {
        console.error('Error updating learning style:', error);
        res.status(500).json({ message: 'Error updating learning style.' });
    }
});


// Update course progress route
app.post('/update-progress', (req, res) => {
    const { level } = req.body;
    const userId = req.session.userId; // Get user ID from session

    if (!userId) return res.status(401).send('Unauthorized');

    User.findById(userId)
        .then(user => {
            if (!user) return res.status(404).send('User not found');

            if (!user.courseProgress.html.completedLevels.includes(level)) {
                user.courseProgress.html.completedLevels.push(level);
                user.courseProgress.html.currentLevel = level;

                const totalLevels = 10; // Assuming there are 10 levels
                user.courseProgress.html.completionPercentage = 
                    (user.courseProgress.html.completedLevels.length / totalLevels) * 100;
                
                return user.save();
            } else {
                return res.status(400).send('Level already completed');
            }
        })
        .then(updatedUser => res.json(updatedUser))
        .catch(err => res.status(500).send('Error updating progress: ' + err.message));
});

// Get peer learning suggestions route
app.get('/peer-suggestions', async (req, res) => {
    const userId = req.session.userId;

    if (!userId) return res.status(401).send('Unauthorized');

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).send('User not found');

        const suggestions = await User.find({
            _id: { $ne: userId }, // Exclude the current user
            'courseProgress.html.currentLevel': { $gte: user.courseProgress.html.currentLevel }, // Users at the same or higher level
            preferredTopics: { $in: user.preferredTopics } // Users with similar preferred topics
        });

        res.json(suggestions);
    } catch (error) {
        res.status(500).send('Error fetching peer suggestions: ' + error.message);
    }
});

// User Dashboard Route
app.get('/dashboard', async (req, res) => {
    const userId = req.session.userId;

    if (!userId) return res.status(401).send('Unauthorized');

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).send('User not found');

        // Fetch peer suggestions
        const peerSuggestions = await User.find({
            _id: { $ne: userId },
            'courseProgress.html.currentLevel': { $gte: user.courseProgress.html.currentLevel },
            preferredTopics: { $in: user.preferredTopics }
        });

        res.render('newUserdashboard', { 
            learningStyle: user.learningStyle,
            completedLevels: user.courseProgress.html.completedLevels,
            completionPercentage: user.courseProgress.html.completionPercentage.toFixed(2),
            peerSuggestions // Pass peer suggestions to the dashboard
        });
    } catch (err) {
        res.status(500).send('Error retrieving user: ' + err.message);
    }
});

app.post('/update-pdf-read', async (req, res) => {
    const userId = req.session.userId; // Get the current user's ID from the session
    const { level } = req.body; // Get the level read from the request body

    try {
        // Update the user's PDF read count and add the completed level
        await User.findByIdAndUpdate(userId, {
            $inc: { pdfReadCount: 1 }, // Increment the PDF read count
            $addToSet: { 'courseProgress.html.completedLevels': level } // Add the completed level
        });
        res.status(200).send('PDF read count updated');
    } catch (error) {
        res.status(500).send('Error updating PDF read count: ' + error.message);
    }
});

app.post('/save-progress', async (req, res) => {
    console.log("Request body:", req.body); 
    const { pdfReadCount } = req.body; // Get the new count from the request
    const userId = req.session.userId; // Assuming you're using session to track the user
    if (!userId) {
        return res.status(401).send('Unauthorized');
    }
    try {
        const updatedUser = await User.findByIdAndUpdate(userId, { pdfReadCount }, { new: true }); // Use { new: true } to return the updated document
        console.log("Updated User:", updatedUser);
        if (!updatedUser) {
            return res.status(404).send('User not found');
        } // Update the user's pdfReadCount
        res.status(200).send('Progress saved successfully');
    } catch (error) {
        res.status(500).send('Error saving progress: ' + error.message);
    }
    console.log("User ID:", req.session.userId); // Add this line in your save-progress route
});

app.get('/user-data', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).send('Unauthorized');
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        res.status(200).json({ pdfReadCount: user.pdfReadCount });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('Error fetching user data');
    }
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.redirect('/login');  // Redirect to login if not authenticated
    }
}

app.get('/handson', ensureAuthenticated, (req, res) => {
    res.sendFile(__dirname + 'public/handson.html');
});


app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running in http://localhost:${PORT}`);
});
