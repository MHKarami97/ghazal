import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import './style.css';

var app = createApp(App);
var pinia = createPinia();

app.use(pinia);
app.use(router);

app.mount('#app');
