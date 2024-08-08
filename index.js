const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors("*"));
const dotenv = require("dotenv");
dotenv.config();

const router = require("./src/routes");

require("./startup/config")(app, express);
require("./startup/db")();
// require("./startup/loginng")();
// require("./startup/lawyer")();
app.use("/api", router);

app.get("/", (req, res) => {
  res.send("Hello, secure world!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`listening on port ${PORT}`));
