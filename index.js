const express = require('express');
const cors = require('cors');
const connexion = require('./conexion');
const ProductRoute = require('./routes/ProductRoute');
const app = express();

// Middleware de mensaje de bienvenida
app.get('/', (req, res) => {
    res.send('¡Bienvenido a nuestra aplicación!');
});

app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use('/ProductRoute', ProductRoute);

module.exports = app;
