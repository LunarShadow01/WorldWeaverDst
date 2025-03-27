import jwt from 'jsonwebtoken'
import { compareSync, genSaltSync, hashSync } from 'bcrypt'
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { webcrypto } from 'node:crypto';
import path from 'node:path';

import { usersAuth } from './db.mjs'

const jwt_file = path.resolve(".", "backend_service", "jwt_secret.txt")

let jwt_secret = ""
if (!existsSync(jwt_file)) {
  const arr = webcrypto.getRandomValues(new Uint32Array(20))
  for (const num of arr) {
    jwt_secret += "" + num
  }
  writeFileSync(jwt_file, jwt_secret, {encoding: "base64"})
  jwt_secret = readFileSync(jwt_file, {encoding: "base64"})
} else {
  jwt_secret = readFileSync(jwt_file, {encoding: "base64"})
}

export const isValidToken = (token) => {
  return jwt.verify(token, jwt_secret, {algorithm: "HS256"}, (err) => {
    return (!err)
  })
}

export const getTokenData = (token) => {
  return jwt.verify(token, jwt_secret, {algorithm: "HS256"}, (err, decoded) => {
    if (!err) {
      return decoded
    } else {
      return null
    }
  })
}

export const createUser = async (username, email, password) => {
  const password_salt = genSaltSync()
  const password_hash = hashSync(password, pass_salt)
  
  const user = new usersAuth({
    username,
    email,
    password_hash,
    password_salt,
    creation_date: Date.now()
  })

  const doc = await user.save({
    validateBeforeSave: true
  })

  console.log("written user doc: ", doc)
}

/**
 * @param {mongoose.Document<usersAuth> | null} user_doc 
 * @param {String} password 
 * @returns {Boolean}
 */
export const verifyUser = (user_doc, password) => {
  if (user_doc === null) {
    return false
  }

  const password_hash = user_doc.password_hash
  return compareSync(password, password_hash)
}

/**
 * @param {String} email 
 * @returns 
 */
export const getUserNoValidation = async (email) => {
  return await usersAuth.findOne()
  .where("email").equals(email)
}

/**
 * @param {String} email 
 * @param {String} password 
 * @returns {mongoose.Document<usersAuth> | null}
 */
export const getVerifiedUser = async (email, password) => {
  const user_doc = await getUserNoValidation(email)
  const is_valid = verifyUser(user_doc, password)

  if (is_valid) {
    return user_doc
  } else {
    return null
  }
}

export const generateUserToken = (email, password) => {
  const user_doc = getVerifiedUser(email, password)

  if (user_doc === null) {
    return null
  }

  const token_data = {
    username: user_doc.username,
    email: user_doc.email,
    creation_date: user_doc.creation_date,
  }

  const token = jwt.sign(
    JSON.stringify(token_data),
    jwt_secret,
    {
      algorithm: "HS256",
      expiresIn: "4Week",
      subject: "user credentials",
    }
  )
  
  return token
}