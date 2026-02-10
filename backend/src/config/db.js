import mongoose from "mongoose";
import ora from "ora";
import chalk from "chalk";
import symbols from "log-symbols";

const connectDatabase = async () => {
  const spinner = ora("Connecting to database...").start();

  const dbName = process.env.MONGO_DB_NAME || "LostFound";
  const uri =
    process.env.ATLAS_URI || process.env.MONGO_URI || process.env.LOCAL_URI;

  if (!uri) {
    spinner.fail(
      `${symbols.error} ${chalk.red("MongoDB connection string is missing")}`,
    );
    throw new Error(
      "Please set LOCAL_URI for development or ATLAS_URI for production.",
    );
  }

  try {
    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 10000,
    });

    spinner.succeed(`${chalk.green("MongoDB Successfully Connected")}`);
    return mongoose.connection;
  } catch (error) {
    spinner.fail(`${symbols.error} ${chalk.red("MongoDB Connection Failed")}`);
    console.error(chalk.red(error.message));
    throw error;
  }
};

export default connectDatabase;
