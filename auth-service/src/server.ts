import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  console.log(`🔐 auth-service corriendo en http://localhost:${PORT}`);
  console.log(`   → http://localhost:${PORT}/api/v1/gustavobenalcazar/auth/login`);
  console.log(`   → http://localhost:${PORT}/api/v1/gustavobenalcazar/auth/register`);
});
