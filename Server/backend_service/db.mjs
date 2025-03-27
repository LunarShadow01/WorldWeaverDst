import { configDotenv } from "dotenv";
import mongoose, { Schema } from "mongoose";

configDotenv()

// db connection
const DB_ADMIN_USER = process.env.DB_ADMIN_USER
const DB_ADMIN_PWD = process.env.DB_ADMIN_PWD
const DB_NAME = process.env.DB_NAME
const connection_url = process.env.CONNECTION_URL || ""

const connection_uri =`mongodb://${DB_ADMIN_USER}:${DB_ADMIN_PWD}@${connection_url}/?authMechanism=DEFAULT`;
const mongoose_db = await mongoose.connect(connection_uri, {dbName: DB_NAME})

const users_auth = new Schema({
  username: {type: String, required: true},
  email: {type: String, required: true, unique: true},
  password_hash: {type: String, required: true},
  password_salt: {type: String, required: true},
  creation_date: {type: Date, required: true},
})

export const usersAuth = mongoose_db.model("auth", users_auth)

export default mongoose_db

