const express = require('express');
const connection = require('../conexion');
const routerP = express.Router();
const fs = require('fs');
const jwt = require('jsonwebtoken');

require('dotenv').config();
const verifyToken = require('./validacion');
const SECRET_KEY = process.env.SECRET_KEY;

// Middleware para analizar solicitudes JSON

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
    var query = "SELECT p.*, i.Imagen AS ImagenBase64 FROM Productos p LEFT JOIN Imagenes i ON p.ID = i.ProductoID WHERE p.ID = ?";
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

// Ruta para registrar un producto con su imagen y varias imágenes adicionales
routerP.post('/registrarProductoConImagenes', verifyToken, (req, res) => {
    // Obtener los datos del cuerpo de la solicitud
    const { Nombre, Cantidad, Marca, Modelo, Voltaje, Potencia, Precio, Lumenes, Atenuable, VidaUtil, Dimensiones, Angulo, Descripcion, ImagenBase64, ImagenesAdicionales } = req.body;

    // Decodificar la imagen base64 del producto
    const ImagenProducto = Buffer.from(ImagenBase64, 'base64');

    // Consulta SQL para insertar un nuevo producto con su imagen en la tabla "Productos"
    const queryProducto = `
        INSERT INTO Productos (Nombre, Cantidad, Marca, Modelo, Voltaje, Potencia, Precio, Lumenes, Atenuable, VidaUtil, Dimensiones, Angulo, Descripcion, Imagenes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Ejecutar la consulta SQL para insertar el producto con su imagen
    connection.query(queryProducto, [Nombre, Cantidad, Marca, Modelo, Voltaje, Potencia, Precio, Lumenes, Atenuable, VidaUtil, Dimensiones, Angulo, Descripcion, ImagenProducto], (error, resultProducto) => {
        if (error) {
            console.error('Error al insertar el producto en la base de datos:', error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }

        // Obtener el ID del producto recién insertado
        const ProductoID = resultProducto.insertId;

        // Decodificar y procesar las imágenes base64 adicionales
        const processedImages = ImagenesAdicionales.map(imageData => {
            return [ProductoID, Buffer.from(imageData.ImagenBase64, 'base64')];
        });

        // Consulta SQL para insertar varias imágenes adicionales en la tabla "Imagenes"
        const queryImagenes = `
            INSERT INTO Imagenes (ProductoID, Imagen) 
            VALUES ?
        `;

        // Ejecutar la consulta SQL para insertar las imágenes adicionales
        connection.query(queryImagenes, [processedImages], (error, resultImagenes) => {
            if (error) {
                console.error('Error al insertar las imágenes adicionales en la base de datos:', error);
                return res.status(500).json({ message: 'Error interno del servidor' });
            }

            // Enviar una respuesta indicando que el producto y las imágenes han sido registrados con éxito
            return res.status(201).json({ message: 'Producto y todas las imágenes registrados con éxito' });
        });
    });
});





// Ruta para la autenticación de inicio de sesión
routerP.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Consulta SQL para buscar un usuario en la base de datos
    const query = `SELECT * FROM users WHERE username = ? AND password = ?`;

    // Ejecutar la consulta SQL
    connection.query(query, [username, password], (error, results) => {
        if (error) {
            console.error('Error al buscar el usuario en la base de datos:', error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }

        // Verificar si se encontró un usuario
        if (results.length > 0) {
            const user = results[0];
            // Verificar el rol del usuario
            if (user.role === 'admin') {
                // Crear un token JWT con la información del usuario utilizando la variable SECRET_KEY
                const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, 'secret_key');
                return res.status(200).json({ token });
            } else {
                return res.status(403).json({ message: 'Acceso no autorizado' });
            }
        } else {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
    });
});



module.exports = routerP;