const Application = require('./src/application');

const app = new Application();
const port = 3000;

app.listen(port, () => {
  console.log(`step2 server is running at http://127.0.0.1:${port}`);
});
