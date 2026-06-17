import 'dotenv/config';
import app from './app.js';
import { vehiculoRepository } from './shared/container.js';
import { startGrpcServer } from './grpc/server.js';

const PORT = process.env.PORT ?? 3002;

startGrpcServer(vehiculoRepository);

app.listen(PORT, () => {
  console.log(`🚗 inventario-service corriendo en http://localhost:${PORT}`);
  console.log(`   → http://localhost:${PORT}/api/v1/gustavobenalcazar/vehiculos`);
  console.log(`   → http://localhost:${PORT}/api/v1/gustavobenalcazar/marcas`);
  console.log(`   → http://localhost:${PORT}/api/v1/gustavobenalcazar/modelos`);
  console.log(`   → http://localhost:${PORT}/api/v1/gustavobenalcazar/categorias`);
  console.log(`   → http://localhost:${PORT}/api/v1/gustavobenalcazar/tipos-combustible`);
  console.log(`   → http://localhost:${PORT}/api/v1/gustavobenalcazar/tipos-transmision`);
  console.log(`   → http://localhost:${PORT}/api/v1/gustavobenalcazar/extras`);
});
