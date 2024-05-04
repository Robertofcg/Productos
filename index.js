const express = require('express');
const cors = require('cors');
const connexion = require('./conexion');
const ProductRoute = require('./routes/ProductRoute');
const app = express();

const bodyParser = require('body-parser');
// Configurar body-parser con un límite de tamaño más grande (por ejemplo, 10MB)
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Middleware de mensaje de bienvenida
app.get('/Productos', (req, res) => {
    res.send('¡Bienvenido a nuestra aplicación!');
});

app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use('/ProductRoute', ProductRoute);

module.exports = app;
