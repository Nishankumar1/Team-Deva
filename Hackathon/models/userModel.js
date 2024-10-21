const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    learningStyle: {
        type: String,
        default: 'Unknown' // Default if not specified
    },
    courseProgress: {
        html: {
            currentLevel: { type: Number, default: 1 }, // Current level starts at 1
            completedLevels: { type: [Number], default: [] }, // Completed levels
            completionPercentage: { type: Number, default: 0 } // Completion percentage
        }
    },
    pdfReadCount: { type: Number, default: 0 },

    // Field to store preferred topics or subjects for peer matching
    preferredTopics: {
        type: [String], // Array of preferred topics
        default: [] // Default to an empty array
    },
    // New field to store peer information with course and level details
    peers: [{
        name: { type: String, required: true },
        email: { type: String, required: true },
        level: { type: Number, required: true }, // Level of the peer
        courseName: { type: String, required: true }, // Course associated with the peer
        learningStyle: { type: String, default: 'Unknown' } // Learning style of the peer
    }]
});

// Pre-save hook to hash the password before saving the user
userSchema.methods.updateLearningStyle = async function (newStyle) {
    this.learningStyle = newStyle;
    await this.save();
};

// Method to compare entered password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
