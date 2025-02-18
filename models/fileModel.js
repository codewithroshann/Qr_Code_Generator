const mongoose = require('mongoose');
const dotenv = require('dotenv')
dotenv.config()
mongoose.connect(process.env.MONGODB_URL)
    .then(() => console.log('Connected successfully With Database!')).catch((err)=>{
        console.log(err)
    });

const fileSchema = mongoose.Schema({
    filename: String,
    path: String, // Path to the file (can be local or URL if stored elsewhere)
    contentType: String // Store the content type

});

module.exports = mongoose.model('File', fileSchema); // Create a Mongoose model




