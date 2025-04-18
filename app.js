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
const cloudinary = require('cloudinary').v2
dotenv.config()
const port = process.env.PORT || 5000;


// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

//multer SETUP 
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
app.set('views', './views');
app.use(express.static(path.join(__dirname, 'public'))) // Serve static files (CSS, etc.)
app.use(express.urlencoded({ extended: true })); // Handle form data with increased limit

app.get('/', async (req, res) => {
    res.render('index', { qrCodeUrl: null }); // Render the index.ejs file

});

// QR GENERETE ROUTE

app.post('/generate', upload.single("file"), async (req, res) => {

    try {
        let qrCodeFile;
        let qrCodeText;

        if (req.file) {
            console.log( "thatsme" , req.file)
            const uploadResult = await cloudinary.uploader.upload(req.file.path,{
                resource_type: "auto" // 🔥 key for supporting all file types
              })
                .catch((error) => {
                    console.log(error,"Somthing Went Wrong");
                });

            console.log("THIS IS ME",uploadResult);

            const newFile = new fileSchema({
                filename: req.file.filename,
                link: uploadResult.secure_url,
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

    fs.unlink(`${req.file.path}`, (err) => {
        if (err) throw err;
        console.log('successfully deleted !');
      });
});


//File View Route

app.get('/uploads/:filename', async (req, res) => {
    try {
        const file = await fileSchema.findOne({ filename: req.params.filename })
        const link = await file.link.indexOf("/upload/") +8;
        let insertString = "fl_attachment/";
        let newUrl = file.link.slice(0, link) + insertString + file.link.slice(link);
      console.log("newurl",newUrl,file)

        if (!file) {
            return res.status(404).send('File not found');
        }

        res.render('uploads', { file: file, qrCodeUrl: newUrl });

    } catch (error) {
        console.error("Error generating QR code:", error);
        res.status(500).send('Failed to generate QR code');
    }

})


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

