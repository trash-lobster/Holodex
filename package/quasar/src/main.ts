import { createApp } from "vue";
import { Quasar } from "quasar";
import router from "./router/index";

// Import icon libraries
import "@quasar/extras/material-icons/material-icons.css";

// Import Quasar css
import "quasar/src/css/index.sass";

// Assumes your root component is App.vue
// and placed in same folder as main.js
import App from "./App.vue";
import { setupPinia } from "./setupPinia";

const myApp = createApp(App);

myApp.use(router);

myApp.use(Quasar, {
  plugins: {}, // import Quasar plugins and add here
});

// config pinia:
const pinia = setupPinia();
myApp.use(pinia);

// Assumes you have a <div id="app"></div> in your index.html
myApp.mount("#app");

