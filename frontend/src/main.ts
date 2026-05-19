import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { setupApiInterceptors } from '@/api/api';
import { setupRouterGuards } from '@/router/guards';
import './assets/main.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

setupApiInterceptors(router);
setupRouterGuards(router);

app.mount('#app');
