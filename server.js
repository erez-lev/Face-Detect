/*
'/' -> GET, response: this is working

'/signin' -> POST, response: success/failed

'/register' -> POST, response: new user object

'/profile/:userId' -> GET, response: user with userId

'/image' -> PUT, response: updated user object with the rank
*/

const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const db = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'Erezlev@94',
        database: 'face_detect'
    }
});

const app = express();

app.use(express.json());
app.use(cors());

/* GET /index */
app.get('/', (req, res) => {
    res.send(db.users);
});

/* POST /signin */
app.post('/signin', (req, res) => {
    console.log('signin ', req.body);
    db.select('email', 'hash').from('login')
    .where('email', '=', req.body.email)
    .then(data => {
        const isValidPassword = bcrypt.compareSync(req.body.password, data[0].hash);
        if (isValidPassword) {
            return db.select('*').from('users')
                    .where('email', '=', req.body.email)
                    .then(user => {
                        res.status(200).json(user[0]);
                    })
                    .catch(err => res.status(404).json("User was not found!"));
        } else {
            res.status(400).json('wrong cradentials');
        }
    })
    .catch(err => res.status(400).json('wrong cradentials'));
});

/* POST /register */
app.post('/register', (req, res) => {
    console.log('register', req.body);
    const { email, name, password } = req.body;
    const hash = bcrypt.hashSync(password);

    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users')
            .returning('*')
            .insert({
                name: name,
                email: loginEmail[0],
                joined: new Date()
            })
            .then(user => {
                res.status(200).json(user[0]);
            });
        })
        .then(trx.commit)
        .catch(trx.rollback);
    })
    .catch(err => {
        res.status(404).json('register was unsucceed');
    })
});

/* GET /profile/:id */
app.get('/profile/:id', (req, res) => {
    const id = req.params.id;

    db.select('*').from('users').where({
        id: id
    })
    .then(user => {
        if (user.length) {
            res.status(200).json(user[0]);
        } else {
            res.status(404).json("No such user");
        }
    })
    .catch(err => res.status(404).json("Error getting user!"));
});

/* PUT /image */
app.put('/image', (req, res) => {
    const { id } = req.body;

    db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entrie => {
        if (entrie.length) {
            res.status(200).json(entrie[0]);
        } else {
            res.status(404).json("Unable to get entries!");
        }
    })
    .catch(err => res.status(404).json("Error getting user!"));
});

/* LISTEN */
app.listen(3001, () => {
    console.log("App is running on port 3001");
});