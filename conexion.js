const { Pool } = require('pg');

// Configura la conexión a la base de datos
const pool = new Pool({
  user: 'jvqcrqpz',
  host: 'lucky.db.elephantsql.com',
  database: 'jvqcrqpz',
  password: 'bxdcU_xk40rct9_NkShjfslWGJ2kK1vF',
  port: 5432,
  insecureAuth : true

});

pool.connect((error) =>{
    if (!error) {
        console.log("Conectado");
    } else {
        console.log("Error de conexion: " + error)
    }
});

module.exports = pool;
