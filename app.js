
const express = require('express')
const app = express()
const mustacheExpress = require('mustache-express')
const bodyParser = require('body-parser')
const bcrypt= require('bcrypt')
const pgp = require('pg-promise')()
const session = require('express-session')
const path=require('path')

const PORT = 3000
const CONNECTION_STRING = "postgres://postgres:9525@localhost:5432/newsdb"
const SALT_ROUND=10 //  for bycrpt

const VIEWS_PATHS=path.join(__dirname,'/views')


// configuring your view engine
app.engine('mustache',mustacheExpress(VIEWS_PATHS + '/partials','.mustache'))
app.set('views',VIEWS_PATHS)
app.set('view engine','mustache')




app.use(session({
  secret: 'aniket29',//can be anything
  resave : false,
  saveUninitialized: false
}))//cookie for session 

app.use(bodyParser.urlencoded({extended: false}))

const db = pgp(CONNECTION_STRING)



console.log(db)//if database is connected display syantaxs in terminal


app.get('/users/articles',(req,res)=>{
  res.render('articles',{username:req.session.user.username})
})

app.get('/users/add-article',(req,res)=>{
  res.render('add-article')
})
app.get('/login',(req,res)=>{
  res.render('login')
})

app.post('/users/add-article',(req,res) => {

  let title = req.body.title
  let description = req.body.description
  let userId = req.session.user.userId

  db.none('INSERT INTO articles(title,body,userid) VALUES($1,$2,$3)',[title,description,userId])
  .then(() => {
    res.send("SUCCESS")
  }).catch(error => {
    console.log(error);
  })

})


app.post('/login',(req,res)=>{
  
  let username = req.body.username
  let password = req.body.password

  db.oneOrNone('SELECT userid,username,password FROM users WHERE username = $1',[username])
  .then((user) => {
    if(user){//check for users password

      bcrypt.compare(password,user.password,function(error,result){
        if(result){
          //username and userid in the session
            if(req.session){
              req.session.user ={userId:user.userid,username:user.username}
            }
          res.redirect('/users/articles')
        }else{
          res.render('login',{message:'invalid username or password'})
        }
      })

    }else{
      res.render('login',{message:'invalid username or password'})
    }
  }).catch(error => {
    console.log(error);
  })










})


app.post('/register',(req,res) => {

  let username = req.body.username
  let password = req.body.password

  db.oneOrNone('SELECT userid FROM users WHERE username = $1',[username])
  .then((user) => {
    console.log(user)
    if(user) {
      res.render('register',{message: "User name already exists!"})
    } else {
      // insert user into the users table
     bcrypt.hash(password,SALT_ROUND,function(error,hash){
       if(error == null){
        db.none('INSERT INTO users(username,password) VALUES($1,$2)',[username,hash])
        .then(() => {
          res.send('SUCCESS');
        })
       }
     })
    }
  })
  .catch(error => {
    console.log(error);
  })

})

app.get('/register',(req,res) => {
  res.render('register')
})

app.listen(PORT,() => {
  console.log(`Server has started on ${PORT}`)
})
