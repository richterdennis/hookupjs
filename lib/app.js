import boot from './boot.js';

const app = boot.app;
if (!app) throw new Error('App imported before boot() got called!');

export default app;
