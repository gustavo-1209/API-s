import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT ?? 3003;

app.listen(PORT, () => {
  console.log(`🏢 org-service corriendo en http://localhost:${PORT}`);
  console.log(`   → http://localhost:${PORT}/api/v1/gustavobenalcazar/provincias`);
  console.log(`   → http://localhost:${PORT}/api/v1/gustavobenalcazar/ciudades`);
  console.log(`   → http://localhost:${PORT}/api/v1/gustavobenalcazar/empresas`);
  console.log(`   → http://localhost:${PORT}/api/v1/gustavobenalcazar/agencias`);
});
