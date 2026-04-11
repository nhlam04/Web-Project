const app = require("./app");
const { port } = require("./config");

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`ordering-service listening on port ${port}`);
});
