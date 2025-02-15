// server.js (Backend - Express.js)
const express = require('express');
const QRCode = require('qrcode');
const crypto = require("crypto");
const fileSchema = require('./models/fileModel');
const path = require('path');
const ejs = require('ejs'); // For EJS templating
const app = express();
const multer = require('multer');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config()
const port = process.env.PORT ||5000;

//multer 
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/files/uploads')
    },
    filename: function (req, file, cb) {
        crypto.randomBytes(16, function (err, buf) {
            cb(null, buf.toString('hex') + path.extname(file.originalname))
        })
    }
})

const upload = multer({ storage: storage })

app.set('view engine', 'ejs'); // Set EJS as the view engine
app.use(express.static(path.join(__dirname, 'public'))) // Serve static files (CSS, etc.)
app.use(express.urlencoded({ extended: true })); // Handle form data with increased limit

app.get('/', async (req, res) => {
    res.render('index', { qrCodeUrl: null }); // Render the index.ejs file

});

app.post('/generate', upload.single("file"), async (req, res) => {
     try {
        let qrCodeFile;
        let qrCodeText;
        if (req.file) {
            const newFile = new fileSchema({
                filename: req.file.filename,
                path: `../files/uploads/${req.file.filename}`,
                contentType: req.file.mimetype,
            });          
            await newFile.save();
            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            qrCodeFile = fileUrl;
        }
        else if (req.body.text) { // text upload
           qrCodeText = await req.body.text;
        } // Text input
        else {
            return res.status(400).send('No data provided');
        }
        const inputData = qrCodeFile ? qrCodeFile : qrCodeText;
        const qrCodeUrl = await QRCode.toDataURL(inputData);
       res.render('index', { qrCodeUrl }); // Re-render index.ejs with QR code URL

    } catch (error) {
        console.error("Error generating QR code:", error);
        res.status(500).send('Failed to generate QR code');
    }
    setTimeout( async () => {
        try{
            fs.unlink(`${req.file.path}`,(err)=>{
                console.log(err)
            })
            const file =  await fileSchema.findOneAndDelete({ filename: req.file.filename })
            console.log(file,"file deleted")
        }catch(err){
            console.log("somthing went wrong")
        }
     }, 86400000);

});


app.get('/uploads/:filename', async (req, res) => {
    const file = await fileSchema.findOne({ filename: req.params.filename })
    if (!file) {
        return res.status(404).send('File not found');
    }
   res.render('uploads', { file: file });

})



app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});


