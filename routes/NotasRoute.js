const express = require('express');
const connection = require('../conexion');
const routerC = express.Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

var auth = require('../services/authentication');
var checkRole = require('../services/checkRole');

routerC.post('/addToCart', auth.authenticateToken, checkRole.checkRole, (req, res) => {
  const { userId, productId, quantity } = req.body;

  // Consulta para obtener la cantidad disponible del producto en el inventario
  const checkInventoryQuery = 'SELECT stock FROM productos WHERE id = ?';
  connection.query(checkInventoryQuery, [productId], (inventoryErr, inventoryResults) => {
    if (inventoryErr) {
      console.error('Error al verificar la disponibilidad del producto en el inventario:', inventoryErr);
      return res.status(500).json({ message: 'Error al verificar la disponibilidad del producto en el inventario' });
    }

    if (inventoryResults.length > 0) {
      const availableInInventory = inventoryResults[0].cantidad_disponible;

      // Consulta para obtener la cantidad del producto en el carrito del usuario
      const checkCartQuery = 'SELECT SUM(cantidad) AS total_cantidad FROM carrito WHERE id_usuario = ? AND id_producto = ?';
      connection.query(checkCartQuery, [userId, productId], (cartErr, cartResults) => {
        if (cartErr) {
          console.error('Error al obtener la cantidad del producto en el carrito:', cartErr);
          return res.status(500).json({ message: 'Error al obtener la cantidad del producto en el carrito' });
        }

        const cantidadEnCarrito = cartResults[0].total_cantidad || 0;
        const totalCantidad = cantidadEnCarrito + quantity;

        if (totalCantidad <= availableInInventory) {
          // Si la cantidad total no excede la disponible en el inventario, proceder con la inserción o actualización en el carrito
          const checkQuery = 'SELECT * FROM carrito WHERE id_usuario = ? AND id_producto = ?';
          connection.query(checkQuery, [userId, productId], (checkErr, checkResults) => {
            if (checkErr) {
              console.error('Error al verificar el producto en el carrito:', checkErr);
              return res.status(500).json({ message: 'Error al verificar el producto en el carrito' });
            }

            if (checkResults.length > 0) {
              // Si el producto ya está en el carrito, actualizar la cantidad
              const updateQuery = 'UPDATE carrito SET cantidad = cantidad + ? WHERE id_usuario = ? AND id_producto = ?';
              connection.query(updateQuery, [quantity, userId, productId], (updateErr, updateResult) => {
                if (updateErr) {
                  console.error('Error al actualizar la cantidad del producto en el carrito:', updateErr);
                  return res.status(500).json({ message: 'Error al actualizar la cantidad del producto en el carrito' });
                }
                return res.status(200).json({ message: 'Cantidad del producto en el carrito actualizada exitosamente' });
              });
            } else {
              // Si el producto no está en el carrito, insertarlo
              const insertQuery = 'INSERT INTO carrito (id_usuario, id_producto, cantidad) VALUES (?, ?, ?)';
              connection.query(insertQuery, [userId, productId, quantity], (insertErr, insertResult) => {
                if (insertErr) {
                  console.error('Error al agregar el producto al carrito:', insertErr);
                  return res.status(500).json({ message: 'Error al agregar el producto al carrito' });
                }
                return res.status(200).json({ message: 'Producto agregado al carrito exitosamente' });
              });
            }
          });
        } else {
          return res.status(400).json({ message: 'La cantidad requerida no está disponible en el inventario' });
        }
      });
    } else {
      return res.status(404).json({ message: 'El producto no existe en el inventario' });
    }
  });
});

// Ruta para obtener productos en el carrito de un usuario específico
routerC.get('/getCartItems/:userId', auth.authenticateToken, checkRole.checkRole, (req, res) => {
  const userId = req.params.userId;

  const selectQuery = 'SELECT productos.id, productos.nombre, productos.precio, carrito.cantidad FROM productos INNER JOIN carrito ON productos.id = carrito.id_producto WHERE carrito.id_usuario = ?';
  connection.query(selectQuery, [userId], (err, results) => {
    if (err) {
      console.error('Error al obtener productos del carrito:', err);
      return res.status(500).json({ message: 'Error al obtener productos del carrito' });
    }
    return res.status(200).json(results);
  });
});

// Ruta para crear una nota asociada a una papelería seleccionada
routerC.post('/crearNota', auth.authenticateToken, checkRole.checkRole, (req, res) => {
  const { userId, papeleriaId, fecha } = req.body;

  const getCartItemsQuery = `
    SELECT c.id_producto, c.cantidad, p.precio
    FROM carrito c
    INNER JOIN productos p ON c.id_producto = p.id
    WHERE c.id_usuario = ?
  `;

  connection.query(getCartItemsQuery, [userId], (cartErr, cartResults) => {
    if (cartErr) {
      console.error('Error al obtener los productos del carrito:', cartErr);
      return res.status(500).json({ message: 'Error al obtener los productos del carrito' });
    }

    if (cartResults.length === 0) {
      return res.status(400).json({ message: 'El carrito está vacío, no se puede crear la nota' });
    }

    const insertNotaQuery = 'INSERT INTO nota (id_usuario, id_papeleria, total, fecha) VALUES (?, ?, ?, ?)';
    const totalNota = 0; // Puedes usar 0 o cualquier otro valor predeterminado
    connection.query(insertNotaQuery, [userId, papeleriaId, totalNota, fecha], (insertNotaErr, insertNotaResult) => {
      if (insertNotaErr) {
        console.error('Error al crear la nota:', insertNotaErr);
        return res.status(500).json({ message: 'Error al crear la nota' });
      }

      const notaId = insertNotaResult.insertId;

      const detalleValues = cartResults.map(producto => {
        const totalProducto = producto.cantidad * producto.precio;
        return [notaId, producto.id_producto, producto.cantidad, totalProducto];
      });

      const insertDetalleQuery = 'INSERT INTO detalle_nota (id_nota, id_producto, cantidad, total_producto) VALUES ?';
      connection.query(insertDetalleQuery, [detalleValues], (insertDetalleErr, insertDetalleResult) => {
        if (insertDetalleErr) {
          console.error('Error al insertar los detalles de los productos en la nota:', insertDetalleErr);
          return res.status(500).json({ message: 'Error al insertar los detalles de los productos en la nota' });
        }

        const totalNotaQuery = 'SELECT SUM(total_producto) AS total FROM detalle_nota WHERE id_nota = ?';
        connection.query(totalNotaQuery, [notaId], (totalNotaErr, totalNotaResult) => {
          if (totalNotaErr) {
            console.error('Error al calcular el total de la nota:', totalNotaErr);
            return res.status(500).json({ message: 'Error al calcular el total de la nota' });
          }

          const total = totalNotaResult[0].total || 0;

          const updateNotaQuery = 'UPDATE nota SET total = ? WHERE id = ?';
          connection.query(updateNotaQuery, [total, notaId], (updateNotaErr, updateNotaResult) => {
            if (updateNotaErr) {
              console.error('Error al actualizar el total de la nota:', updateNotaErr);
              return res.status(500).json({ message: 'Error al actualizar el total de la nota' });
            }

            const vaciarCarrito = 'DELETE FROM carrito WHERE id_usuario = ?';
            connection.query(vaciarCarrito, [userId], (deleteCartErr, deleteCartResult) => {
              if (deleteCartErr) {
                console.error('Error al vaciar el carrito:', deleteCartErr);
                return res.status(500).json({ message: 'Error al vaciar el carrito' });
              }
              return res.status(200).json({ message: 'Nota creada exitosamente' });
            });
          });
        });
      });
    });
  });
});

// Ruta para obtener productos en el carrito de un usuario específico
routerC.get('/getPapelerias/', auth.authenticateToken, checkRole.checkRole, (req, res) => {

  const selectQuery = 'SELECT * from papelerias';
  connection.query(selectQuery, (err, results) => {
    if (err) {
      console.error('Error al obtener productos del carrito:', err);
      return res.status(500).json({ message: 'Error al obtener productos del carrito' });
    }
    return res.status(200).json(results);
  });
});

// Ruta para obtener productos en el carrito de un usuario específico
routerC.get('/getNotas/:userId', auth.authenticateToken, checkRole.checkRole, (req, res) => {
  const userId = req.params.userId;
  const selectQuery = `
    SELECT 
      nota.id, 
      user.name AS nombre_usuario, 
      papelerias.nombre AS nombre_papeleria, 
      nota.total, 
      nota.fecha 
    FROM 
      nota 
    INNER JOIN 
      user ON nota.id_usuario = user.id 
    INNER JOIN 
      papelerias ON nota.id_papeleria = papelerias.id 
    WHERE 
      nota.id_usuario = ?
  `;

  connection.query(selectQuery, [userId], (err, results) => {
    if (err) {
      console.error('Error al obtener productos del carrito:', err);
      return res.status(500).json({ message: 'Error al obtener productos del carrito' });
    }
    return res.status(200).json(results);
  });
});

routerC.get('/getDetalleNota/:notaId', auth.authenticateToken, checkRole.checkRole, (req, res) => {
  const notaId = req.params.notaId;

  const selectQuery = `
    SELECT 
      detalle_nota.id AS detalle_id,
      detalle_nota.id_producto,
      detalle_nota.cantidad,
      detalle_nota.total_producto,
      productos.nombre AS nombre_producto,
      productos.precio AS precio_producto
    FROM 
      detalle_nota 
    INNER JOIN 
      productos ON detalle_nota.id_producto = productos.id 
    WHERE 
      detalle_nota.id_nota = ?
  `;

  connection.query(selectQuery, [notaId], (err, results) => {
    if (err) {
      console.error('Error al obtener detalles de la nota:', err);
      return res.status(500).json({ message: 'Error al obtener detalles de la nota' });
    }
    return res.status(200).json(results);
  });
});

routerC.get('/:productId/inventory', (req, res) => {
  const productId = req.params.productId;
  const inventoryQuery = 'SELECT stock FROM productos WHERE id = ?';

  connection.query(inventoryQuery, [productId], (error, results) => {
    if (error) {
      console.error('Error al obtener la cantidad disponible en el inventario:', error);
      return res.status(500).json({ message: 'Error al obtener la cantidad disponible en el inventario' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'El producto no existe en el inventario' });
    }

    const availableQuantity = results[0].stock || 0;
    return res.status(200).json({ cantidad_disponible: availableQuantity});
  });
});

// Obtener la cantidad actual en el carrito de un usuario por producto específico
routerC.get('/:userId/:productId/quantity', (req, res) => {
  const userId = req.params.userId;
  const productId = req.params.productId;
  const cartQuery = 'SELECT SUM(cantidad) AS total_cantidad FROM carrito WHERE id_usuario = ? AND id_producto = ?';

  connection.query(cartQuery, [userId, productId], (error, results) => {
    if (error) {
      console.error('Error al obtener la cantidad del producto en el carrito:', error);
      return res.status(500).json({ message: 'Error al obtener la cantidad del producto en el carrito' });
    }

    const cantidadEnCarrito = results[0].total_cantidad || 0;
    return res.status(200).json({ total_cantidad: cantidadEnCarrito });
  });
});

module.exports = routerC;
