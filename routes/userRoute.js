const express = require('express');
const connection = require('../conexion');
const router = express.Router();

const jwt = require('jsonwebtoken');
require('dotenv').config();

var auth = require('../services/authentication');
var checkRole = require('../services/checkRole');

router.post('/signup', auth.authenticateToken, checkRole.checkRole, (req, res) => {
    let user = req.body;

    // Verificar si faltan datos requeridos
    if (!user.name || !user.telefono || !user.email || !user.password) {
        return res.status(400).json({ message: "Por favor, completa todos los campos." });
    }

    // Verificar si el correo ya existe
    let query = "SELECT email, password, role, status FROM user WHERE email=?";
    connection.query(query, [user.email], (error, results) => {
        if (!error) {
            if (results.length <= 0) {
                // Si el correo no existe, insertar el nuevo usuario
                query = "INSERT INTO user (name, telefono, email, password, status, role) VALUES (?,?,?,?,true,'User')";
                connection.query(query, [user.name, user.telefono, user.email, user.password], (error, results) => {
                    if (!error) {
                        return res.status(200).json({ message: "Registro exitoso." });
                    } else {
                        return res.status(500).json({ error });
                    }
                });
            } else {
                return res.status(400).json({ message: "El correo ya existe." });
            }
        } else {
            return res.status(500).json({ error });
        }
    });
});

router.post('/login', (req, res) => {
    const user = req.body;
    query = "select id, email, password, role, status from user where email=?";
    connection.query(query, [user.email], (error, results) => {
        if (!error) {
            if (results.length <= 0 || results[0].password !== user.password) {
                return res.status(401).json({ message: "Usuario o Contraseña incorrectos" });
            } else if (results[0].status === "false") {
                return res.status(401).json({ message: "El usuario está inactivo" });
            } else {
                const response = {
                    id: results[0].id,
                    email: results[0].email,
                    role: results[0].role
                };
                const issuedAt = Date.now(); // Obtener la fecha actual en milisegundos
                const accessToken = jwt.sign({
                    ...response,
                    issuedAt // Guardar la fecha de creación del token en el payload
                }, process.env.ACCESS_TOKEN, {
                    expiresIn: "8h",
                });

                // Devolver solo el token en la respuesta
                return res.status(200).json({ token: accessToken });
            }
        } else {
            return res.status(500).json({ message: "Ocurrió un error, inténtalo más tarde." });
        }
    });
});


router.get('/Perfil', auth.authenticateToken, checkRole.checkRole, (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(400).json({ message: 'Token no proporcionado en el encabezado de autorización' });
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN);
        const userId = decodedToken.id;
        return res.status(200).json({ message: `${userId}` });
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
});


router.post('/logout', (req, res) => {
    // No es necesario realizar ninguna acción en el servidor para desloguear con tokens JWT
    res.status(200).json({ message: "Deslogueo exitoso" });
});

router.get('/getUsers', auth.authenticateToken, checkRole.checkRole, (req, res) => {
    var query = "select id, name, email, telefono, status, role from user";
    connection.query(query, (error, results) => {
        if (!error) {
            return res.status(200).json(results);
        } else {
            return res.status(500).json(error);
        }
    })
});

router.patch('/updateUser', auth.authenticateToken, (req, res) => {
    let user = req.body;

    // Verificación de campos vacíos
    if (!user.name || !user.telefono || !user.email || !user.status || !user.role || !user.id) {
        return res.status(400).json({ message: "Por favor, completa todos los campos." });
    }

    var query = "UPDATE user SET name=?, telefono=?, email=?, status=?, role=? WHERE id=?";
    connection.query(query, [user.name, user.telefono, user.email, user.status, user.role, user.id], (error, results) => {
        if (!error) {
            if (results.affectedRows === 0) {
                return res.status(404).json({ message: "El usuario no existe." });
            }
            return res.status(200).json({ message: "El usuario se actualizó con éxito." });
        } else {
            return res.status(500).json({ error });
        }
    });
});

// Ruta para eliminar un usuario por su ID
router.delete('/deleteUser/:userId', auth.authenticateToken, (req, res) => {
    const userId = req.params.userId;

    const query = "DELETE FROM user WHERE id = ?";
    connection.query(query, [userId], (error, results) => {
        if (!error) {
            if (results.affectedRows === 0) {
                return res.status(404).json({ message: "El usuario no existe" });
            }
            return res.status(200).json({ message: "El usuario se eliminó con éxito" });
        } else {
            return res.status(500).json(error);
        }
    });
});

router.get('/checkToken', auth.authenticateToken, (req, res) => {
    return res.status(200).json({ message: "true" });
})

module.exports = router;