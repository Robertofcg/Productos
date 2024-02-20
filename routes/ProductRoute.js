const express = require('express');
const connection = require('../conexion');
const routerP = express.Router();
const fs = require('fs');

require('dotenv').config();

// Función para convertir una imagen blob en base64
function blobToBase64(blob) {
    return Buffer.from(blob).toString('base64');
}

routerP.get('/getProducts', (req, res) => {
    var query = "SELECT *, TO_BASE64(Imagenes) AS ImagenBase64 FROM Productos"; // Utilizamos TO_BASE64() en lugar de CONVERT_TO()
    connection.query(query, (error, results) => {
        if (!error) {
            // Convertir las imágenes blob en base64
            results.forEach(producto => {
                producto.ImagenBase64 = producto.Imagenes.toString('base64');
                delete producto.Imagenes; // Opcional: Eliminar la columna Imagenes blob del resultado si no se necesita
            });
            return res.status(200).json(results);
        } else {
            return res.status(500).json(error);
        }
    })
});

routerP.get('/getProducts/:id', (req, res) => {
    const productId = req.params.id;
    var query = "SELECT i.Imagen AS ImagenBase64 FROM Productos p LEFT JOIN Imagenes i ON p.ID = i.ProductoID WHERE p.ID = ?";
    connection.query(query, [productId], (error, results) => {
        if (!error) {
            // Si no se encontraron resultados
            if (results.length === 0) {
                return res.status(404).json({ message: "Producto no encontrado" });
            }
            // Convertir las imágenes blob en base64 si existen
            results.forEach(result => {
                if (result.ImagenBase64) {
                    result.ImagenBase64 = result.ImagenBase64.toString('base64');
                }
            });
            return res.status(200).json(results);
        } else {
            return res.status(500).json(error);
        }
    });
});



module.exports = routerP;