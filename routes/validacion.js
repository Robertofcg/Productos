// Importar el módulo 'jsonwebtoken'
const jwt = require('jsonwebtoken');
// Importar el paquete dotenv
require('dotenv').config();

// Definir el secreto para firmar y verificar tokens JWT
const SECRET_KEY = process.env.SECRET_KEY;
// Middleware de autenticación
function verifyToken(req, res, next) {
    // Obtener el token de la cabecera de autorización
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Verificar si el token está presente
    if (!token) {
        return res.status(401).json({ message: 'Token de acceso no proporcionado' });
    }

    // Verificar el token
    jwt.verify(token, 'secret_key', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido' });
        }
        req.user = user;
        next(); // Pasar al siguiente middleware o ruta
    });
}


// Exportar el middleware verifyToken para su uso en otros archivos
module.exports = verifyToken;

// Exportar el middleware verifyToken para su uso en otros archivos
