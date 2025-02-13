// server.js (Backend - Express.js)
const express = require('express');
const QRCode = require('qrcode')
const crypto = require("crypto");
const fileSchema = require('./models/fileModel')
const path = require('path');
const ejs = require('ejs'); // For EJS templating
const app = express();
const multer = require('multer')
const dotenv = require('dotenv')
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
            console.log(newFile)
            await newFile.save();

            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            qrCodeFile = fileUrl;
        }
        else if (req.body.text) { // File upload
            // qrCodeFile = req.file ? req.file.path.slice(8, req.file.path.length) : null; // Base64 file content
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
});


app.get('/uploads/:filename', async (req, res) => {
    const file = await fileSchema.findOne({ filename: req.params.filename })
   res.render('uploads', { file: file });

})

// Add this route to handle file downloads
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename); // Construct the full file path

    res.download(filePath, filename, (err) => { // Use res.download to send the file
        if (err) {
            console.error("Error downloading file:", err);
            if (err.code === 'ENOENT') {
                return res.status(404).send("File not found.");
            }
            return res.status(500).send("Error downloading file.");
        }
    });
});



app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});


