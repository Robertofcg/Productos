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
    var query = "SELECT * FROM Productos WHERE ID = ?";
    connection.query(query, [productId], (error, results) => {
        if (!error) {
            if (results.length > 0) {
                const producto = results[0];
                obtenerImagenesDelProducto(productId, producto, res);
            } else {
                return res.status(404).json({ message: 'Producto no encontrado' });
            }
        } else {
            return res.status(500).json(error);
        }
    });
});

function obtenerImagenesDelProducto(productId, producto, res) {
    var query = "SELECT TO_BASE64(Imagen) AS ImagenBase64 FROM Imagenes WHERE ProductoID = ?";
    connection.query(query, [productId], (error, results) => {
        if (!error) {
            if (results.length > 0) {
                const imagenesBase64 = results.map(result => result.ImagenBase64);
                producto.imagen_principal = producto.ImagenBase64; // Agrega la imagen principal al objeto producto
                producto.imagenes_adicionales = imagenesBase64; // Agrega las imágenes adicionales al objeto producto
                delete producto.ImagenBase64; // Elimina el atributo ImagenBase64 si no se necesita en el resultado final
                return res.status(200).json(producto);
            } else {
                return res.status(200).json(producto); // Si no hay imágenes adicionales, devuelve solo el producto
            }
        } else {
            return res.status(500).json(error);
        }
    });
}




module.exports = routerP;