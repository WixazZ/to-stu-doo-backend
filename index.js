const express = require('express')
const app = express()
const port = 3000
const jwt = require('jsonwebtoken')
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
const bcrypt = require('bcrypt');
const saltRounds = 10;

const mysql = require('mysql');
const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "alexpara",
    database: "tostudoo"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});

function createToken(username, password) {
    return jwt.sign({ username, password }, 'secretToDooList', { expiresIn: '1h' })
}


app.post('/signin',(req, res) => {


    if (req.body.username, req.body.password){
        // verify regex of username and password and mail

        con.query("SELECT * FROM Identification WHERE username = ?", [req.body.username], function (err, result, fields) {
            if (err) throw err;
            if (result.length > 0){
                bcrypt.compare(req.body.password, result[0].password , function(err, bresult) {
                    if (res){
                        const token = createToken(req.body.username, bresult);
                        con.query("UPDATE Identification SET token = ? WHERE username = ?", [token, req.body.username], function (err, queryUpdateResult, fields) {
                            if (err) throw err;
                        })

                        res.status(200).json({
                            message: 'Successful sign in',
                            token: token
                        })
                    } else {
                        res.send(401).json({
                            message: 'Wrong password'
                        })
                    }
                });

            } else {
                res.status(401).json({
                    message: 'Wrong username'
                })
            }
        });


    } else {
        res.status(200).send({
            message: 'Missing username password or email'
        })
    }

})


function checkRegex(username, password, mail){
    // check regex of username and password and mail
    const regexUsername = /^[a-zA-Z0-9]{3,20}$/;
    const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[.:/(){}@$!%*?&])[A-Za-z\d.:/(){}@$!%*?&]{8,50}$/;
    const regexMail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(regexUsername.test(username)){
        if (regexPassword.test(password)){
            if (regexMail.test(mail)){
                return true;
            } else {
                return "mail isn't correct"
            }
        } else {
            return "password isn't correct"
        }
    } else {
        return "username isn't correct"
    }
}

app.post('/signup', (req, res) => {
    if (req.body.username, req.body.password, req.body.mail) {
        const regex = checkRegex(req.body.username, req.body.password, req.body.mail);
        if (regex === true){
            let id_Person;
            //chech if mail arleady exist in database
            con.query("SELECT * FROM Person WHERE mail = ?", [req.body.mail], function (err, mailResult, fields) {
                if (err) throw err;
                if (mailResult.length > 0){
                    res.status(200).send({
                        message: 'Mail already exist'
                    });
                } else {
                    //check if username arleady exist in database
                    con.query("SELECT * FROM Identification WHERE Username = ?", [req.body.username], function (err, userResult, fields) {
                        if (err) throw err;
                        if (userResult.length > 0){
                            res.status(200).send({
                                message: 'Username already exist'
                            })
                        } else{
                            con.query("INSERT INTO Person(mail) VALUES (?)", [req.body.mail], function (err, iDresult, fields) {
                                if (err) throw err;
                                id_Person = iDresult.insertId;
                            });

                            bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
                                let token = createToken(req.body.username, req.body.password);
                                con.query("INSERT INTO Identification (Username, Password, Token, Id_Person) VALUES (?, ?, ?, ?)", [req.body.username, hash, token, id_Person], function (err, inserIdentificationResult, fields) {
                                    if (err) throw err;
                                    res.status(200).json({
                                        message: 'Successful sign up',
                                        token : token
                                    })
                                });
                            });
                        }
                    });
                }
            });

        } else {
            res.status(200).json({
                message: regex
            })
        }

    } else {
        res.status(200).send({
            message: 'Missing username password or email'
        })
    }
})

app.post('/studoolist', (req, res) => {
    if (req.body.token) {

        //check if token is database
        con.query("SELECT Id_Person FROM Identification WHERE Token = ?", [req.body.token], function (err, tokenResult, fields) {
            if (err) {
                console.log(tokenResult);
                console.error(err);
            }
            if (tokenResult.length > 0){
                con.query("SELECT * FROM Studoolist WHERE Id_Person = ?", [tokenResult[0].Id_Person], function (err, studoolistResult, fields) {
                    if (err) {
                        console.log(tokenResult);
                        console.error(err);
                    }
                    if (studoolistResult.length > 0){

                        let studoolist = [
                        ]

                        for(let i = 0; i < studoolistResult.length; i++){
                            studoolist.push({
                                id: studoolistResult[i].Id_StudooList,
                                name: studoolistResult[i].Name,
                                creationDate : studoolistResult[i].CreationDate
                            })
                        }

                        res.status(200).json({
                            message: 'Successful',
                            studoolist : studoolist
                        })
                    } else {
                        res.status(200).json({
                            message: 'No studool'
                        })
                    }
                });

            } else {
                res.status(200).send({
                    message: 'Token not found'
                })
            }
        });
    }else{
        res.status(200).send({
            message: 'Token not found'
        })
    }

})


app.post('/studoolist/:name', (req, res) => {
    if (req.body.token){
        con.query("SELECT Id_Person FROM Identification WHERE Token = ?", [req.body.token], function (err, tokenResult, fields) {
            if (err) {
                console.log(tokenResult);
                console.error(err);
            }
            if (tokenResult.length > 0){
                con.query("SELECT Id_StudooList FROM StudooList WHERE name = ?", [req.params.name], function (err, studoolistResult, fields) {
                    if (err) {
                        console.log(tokenResult);
                        console.error(err);
                    }
                    if (studoolistResult.length >0){
                        con.query("SELECT * FROM Task WHERE Id_StudooList = ?", [studoolistResult[0].Id_StudooList], function (err, tokenResult, fields) {
                            if (err) throw err;
                            if (tokenResult.length > 0){
                                let task = [
                                ]

                                for(let i = 0; i < tokenResult.length; i++){
                                    task.push({
                                        id: tokenResult[i].Id_Task,
                                        name: tokenResult[i].Name,
                                        content: tokenResult[i].Content,
                                        creationDate : tokenResult[i].CreationDate
                                    })
                                }

                                res.status(200).json({
                                    message: 'Successful',
                                    task : task
                                })
                            } else {
                                res.status(200).json({
                                    message: 'No task'
                                })
                            }
                        });
                    } else {
                        res.status(200).send({
                            message: 'Task not found'
                        })
                    }

                });
            } else {
                res.status(200).send({
                    message: 'Token not found'
                })
            }
        })
    }else{
        res.status(200).send({
            message: 'Token not found'
        })
    }

})

app.listen(port, () => console.log(`App listening on port localhost:${port}/!`))