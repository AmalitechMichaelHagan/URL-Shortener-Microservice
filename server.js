require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//Database connection
let uri = 'mongodb+srv://Michael:224748@cluster0.blnca.mongodb.net/db1?retryWrites=true&w=majority';
mongoose.connect(uri,{useNewUrlParser: true , useUnifiedTopology: true});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

//Schema Definition
let urlSchema = new mongoose.Schema({
actual: {type:String, required:true},
shortened: Number
})


let Url= mongoose.model('url',urlSchema); 
let responseObject = {};

//Redirects to the corresponding url of shortened url number

app.get('/api/shorturl/:short',(req,res)=>{

const num = req.params.short;
//Stores the document containing the shortened number to the redirect variable
let redirect = {};
Url.findOne({ shortened: num}, function (err, doc){
  console.log(doc);
  redirect = doc;
});

//Checks highest shortened number and compares to 'num' to determine if its in the collection
Url.findOne({}).sort({shortened:'desc'}).exec((err,result)=>{


if(!err && result != undefined && result.shortened>=num){
  
  res.redirect("https://"+redirect.actual);
  return;
}else{
  res.status(404).send();
  return;
}



})
})

app.post('/api/shorturl',bodyParser.urlencoded({ extended: false }),(req,res,next)=>{
const string = req.body['url'];
const regex = /^www.[a-zA-Z0-9]+.[a-zA-Z0-9]{2,3}$/; //regular expression  to confirm url is of the right syntax
const passes = regex.test(string);

//moves to the next middleware if it passes
if(passes){
next();
}else{
res.json({ error: 'invalid url' })
return;
}

})

app.post('/api/shorturl',bodyParser.urlencoded({ extended: false }),(req,res)=>{

let inputUrl = req.body['url'];

let shortenedInput = 1;
responseObject['original_url'] = inputUrl;


Url.findOne({}).sort({shortened:'desc'}).exec((err,result)=>{
if(!err && result != undefined){
  shortenedInput = result.shortened+1;
}
if(!err){
Url.findOneAndUpdate(

{actual:inputUrl},
{actual:inputUrl,shortened:shortenedInput},
{new:true,upsert:true},
(err,savedUrl)=>{
if(!err){
  responseObject['short_url'] = savedUrl.shortened;
  res.json(responseObject);
}
}

)
}
})

})

