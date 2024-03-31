const express = require('express');
const app = express();
const fileUpload = require('express-fileupload');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const pdf = require('pdf-extraction');
const OpenAI = require('openai');
const converter = require('json-2-csv');
require('dotenv').config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use('/', express.static('public'));
app.use('/uploads', express.static('uploads'));

const openai = new OpenAI({
  apiKey: process.env.openAiKey, // This is the default and can be omitted
});
async function run(prompt) {
  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4-turbo-preview',
  });
  return chatCompletion.choices[0].message.content;
}

function uploadFileMiddleWare(req, res, next) {
  let uploadedFile = req?.files?.pdf;
  if (uploadedFile) {
    const uploadPath = path.join('uploads/', uploadedFile.name);

    uploadedFile.mv(uploadPath, (err) => {
      if (err) console.log(err);
    });
    req.uploadPath = uploadPath;
    next();
  } else {
    return res.status(400).send('No files were uploaded.');
  }
}
app.post('/api/convertpdf2xl', uploadFileMiddleWare, async (req, res) => {
  let uploadedFile = req?.files?.pdf;
  if (uploadedFile) {
    const uploadPath = path.join('uploads/', uploadedFile.name);

    uploadedFile.mv(uploadPath, (err) => {
      if (err) console.log(err);
      req.uploadPath = uploadPath;
      let dataBuffer = fs.readFileSync(uploadPath);
      pdf(dataBuffer)
        .then(async function (data) {
          const gemRes = await run(
            `Here is data extracted from a pdf as a string \nAnalyse it and understand the features of the data and convert it to a json string to use it as excel data.\nRules:\n- Only output the json object, nothing else.\n- Use all the data from the PDF Notice dont nest objects inside objects in the json data and only give me an array of objects in the json not more .` +
              data.text
          );

          const gemResFixed = await run(
            `here is a json array of object as a string it could be missing some curly brackets or the bracket ] or some thing like that and im going to parse it as a json so it may cause errors so your role is to fix the data form and return it back as a stringified json please dont tell nothing except for giving me the json in the response here is the data  ` +
              gemRes.substring(7, gemRes.length - 4)
          );

          const gemResJson = JSON.parse(
            '{ "data"  :' +
              gemResFixed.substring(7, gemResFixed.length - 3) +
              '}'
          );

          const csv = converter.json2csv(gemResJson.data, {
            fields: ['field1', 'field2', 'field3'],
          });

          fs.writeFile(path.join('.', 'uploads', 'data.csv'), csv, (err) => {
            console.log(err);
          });

          return res.json({ status: 'ok', data: 'test' });
        })
        .catch((err) => {
          console.log('err', err);
          return res.status(500).send('Error in converting pdf to text');
        });
    });
  } else {
    return res.status(400).send('No files were uploaded.');
  }
});
app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(5000, () => {
  console.log('server is working on port 5000');
});
