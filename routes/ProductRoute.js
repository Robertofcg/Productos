const express = require('express');
const connection = require('../conexion');
const routerP = express.Router();

require('dotenv').config();

routerP.get('/getProducts', (req, res) => {
    var query = "SELECT * FROM productos";
    connection.query(query, (error, results) => {
        if (!error) {
            return res.status(200).json(results);
        } else {
            return res.status(500).json(error);
        }
    })
});

module.exports = routerP;