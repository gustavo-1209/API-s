import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT ?? 3004;

app.listen(PORT, () => {
  console.log(`📋 operaciones-service corriendo en http://localhost:${PORT}`);
  console.log(`   → http://localhost:${PORT}/api/v1/gustavobenalcazar/reservas`);
  console.log(`   → http://localhost:${PORT}/api/v1/gustavobenalcazar/alquileres`);
  console.log(`   → http://localhost:${PORT}/api/v1/gustavobenalcazar/devoluciones`);
  console.log(`   → http://localhost:${PORT}/api/v1/gustavobenalcazar/seguros`);
  console.log(`   → http://localhost:${PORT}/api/v1/gustavobenalcazar/tarifas`);
  console.log(`   → http://localhost:${PORT}/api/v1/gustavobenalcazar/canales-venta`);
});
