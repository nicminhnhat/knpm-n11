require("dotenv").config();

const { app, prisma } = require("./app");

const PORT = process.env.PORT || 3001;
const isVercel = Boolean(process.env.VERCEL);

let server = null;

if (!isVercel) {
  server = app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });

  async function shutdown(signal) {
    console.log(`${signal} received. Closing server...`);
    await prisma.$disconnect();
    server.close(() => process.exit(0));
  }

  process.on("SIGINT", () => shutdown("SIGINT").catch((error) => { console.error(error); process.exit(1); }));
  process.on("SIGTERM", () => shutdown("SIGTERM").catch((error) => { console.error(error); process.exit(1); }));
}

module.exports = app;
