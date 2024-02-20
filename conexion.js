const mysql = require('mysql2');

// Certificado CA
const certificadoCA = `-----BEGIN CERTIFICATE-----
MIIEQTCCAqmgAwIBAgIUObPC+RHvtklrMyeDLYrzb6D9dGYwDQYJKoZIhvcNAQEM
BQAwOjE4MDYGA1UEAwwvNTk3OWFiYzQtMWE0Ny00OWNhLWI4ODctMThjZDg3NTc0
MTU2IFByb2plY3QgQ0EwHhcNMjQwMjEyMDUxNTAyWhcNMzQwMjA5MDUxNTAyWjA6
MTgwNgYDVQQDDC81OTc5YWJjNC0xYTQ3LTQ5Y2EtYjg4Ny0xOGNkODc1NzQxNTYg
UHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCCAYoCggGBAKXOfmDs
iyfhpmLUqGmTEm9YwUZlSo2lZN2I47ukO72VnsI1/bbDkJkjYVc1rnDoU/X6Y/vn
0Y/rsBKDOneaJabM6fFqRUe0O92GjO617toTB8FJpTbc3K14jAv5+k6Yv/e9mS+T
7UmnQVhKNaRQY7T//Gp++j9OCOk9nRTWQVqFiQCAR5u9OdeUMmRRdRGF90TDMxw3
a8lPEInioyrXLQjFADRFt6UMWUwNqV1D7mv26LuR43/4q9nKQQ8H4ADLc/T4a4l7
JxWbVmbU8S43ZIZHIskDP69TeuWXhKZRnrHvzR9cEZw5e7w8DEkW4gK/9bKiONHs
YLPkebKdO2wulVTcw2MpGVpCGkgAWwV8Iz0jSUcG999cXAMJe8FdWdJdLnwiifG5
0B1G06PWbJIkweWYR88jJr5tA+H893skueggV67fTIzXFYbODOXLeltKQPSHLoYL
yLcswmbfx2fort55W0we1BNEIAQxN5WW9mg/alZVH1a7Lo4/KyClrzWY9wIDAQAB
oz8wPTAdBgNVHQ4EFgQU9byn00fP2AJDMgXUMM2rwKmhiDcwDwYDVR0TBAgwBgEB
/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQADggGBAEQZ0eh9uPu1W+yT
NLvkfSB8HKrM5thNrRUgixvAaa2CbtNBb+CgRy2ot2g+avmkCanlVZMhpBoiJY4i
rY5fFzR0/ff4nHMWRq2ZlyUbgwp2aoJU9gaH9H8UeXrX378qzduNWHTBhXGcwYUc
ic4aCImK2QqEislnYbuIALvLxKKs2k1w4RWYM2TWRNeonOc41ipHBiRSKgdUMT+n
v5ZlYF4oUIUbsgzw/G7vDErI2YL7Yaum/s9YoEGuMfvRj80+oiavVGBNUFiZa4f4
U/Hj2acaeq6mWvtkX/JWudglIIHcYs4qJGP4lrGWiUwZ+Tlxq41AqOynRZt67G/7
cIATGyKBBf1GLtnwyyhPfQHQG017h+eRhwTf4JHmwazJC5bznyV+PyXKNa9sNCHj
yJkMtVw3D/M5w9jm/D3fukheZ1is9kvXEYi8R+tBWabcN3bidxLFm6DccUMj71xl
FD+4KVvpPpJeHUYw0VDwCTPqBNtF6PLVhJYMPmZCkZXqVQJ+QQ==
-----END CERTIFICATE-----`;

const pool = mysql.createPool({
    host: 'mysql-17bc6690-carlospelaezxx-ca96.a.aivencloud.com',
    port: 10812,
    user: 'avnadmin',
    password: 'AVNS_OMxpsEhnClatnCBR5r0', // Reemplaza 'tu_contraseña' con tu contraseña real
    database: 'defaultdb',
    ssl: {
        ca: certificadoCA,  // Reemplaza 'certificado_CA_aqui' con el contenido de tu certificado CA
        rejectUnauthorized: true // Rechazar la conexión si el servidor presenta un certificado no confiable

    }
});

// Realizar operaciones de base de datos
pool.query('SELECT * FROM Productos', (error, results, fields) => {
    if (error) {
        console.error('Error al realizar la consulta:', error);
        return;
    }
    console.log('Resultados de la consulta:', results);
});

// Aquí dentro del callback, puedes realizar la segunda consulta y enviar la respuesta al cliente
pool.query('SELECT p.*, i.Imagen AS ImagenBase64 FROM Productos p LEFT JOIN Imagenes i ON p.ID = i.ProductoID', (error, results) => {
    if (error) {
        console.error('Error al realizar la consulta:', error);
        return;
    }

    const productosConImagenes = results.map(producto => {
        return {
            ID: producto.ID,
            Nombre: producto.Nombre,
            Cantidad: producto.Cantidad,
            Marca: producto.Marca,
            Modelo: producto.Modelo,
            Voltaje: producto.Voltaje,
            Potencia: producto.Potencia,
            Precio: producto.Precio,
            Lumenes: producto.Lumenes,
            Atenuable: producto.Atenuable,
            VidaUtil: producto.VidaUtil,
            Dimensiones: producto.Dimensiones,
            Angulo: producto.Angulo,
            Descripcion: producto.Descripcion,
            Imagenes64: producto.ImagenBase64 ? producto.ImagenBase64.toString('base64') : null
        };
    });

    // Envía la respuesta JSON al cliente
    console.log('Resultados de la segunda consulta:', productosConImagenes);
});


// Manejar el evento 'connection' para imprimir un mensaje cuando se conecte con éxito
pool.on('connection', function (connection) {
    console.log('¡Conexión establecida con éxito!');
});

// Manejar errores de conexión
pool.on('error', function (err) {
    console.error('Error en el pool de conexiones:', err);
});


module.exports = pool;
