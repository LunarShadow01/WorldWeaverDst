import jwt from 'jsonwebtoken'
import { compareSync, genSaltSync, hashSync } from 'bcrypt'
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { webcrypto } from 'node:crypto';
import path from 'node:path';

const users_json_file = path.resolve(".", "backend_service", "users.json")

/**
 * @returns {{users: AuthsUser[]}}
 */
const readUsers = () => {
  const json_data = JSON.parse(readFileSync(users_json_file))
  /**@type {{users: AuthsUser[]}} */
  const data = {users: []}
  for (const user_data of json_data.users) {
    const user = new AuthsUser({})
    user.onLoad(user_data)
    data.users.push(user)
  }

  return data
}

/**
 * @param {{users: AuthsUser[]}} data 
 */
const writeUsers = (data) => {
  const json_data = {users: []}
  for (const user of data.users) {
    json_data.users.push(user.onSave())
  }
  writeFileSync(users_json_file, JSON.stringify(json_data, null, " "), {encoding: 'utf-8'})
}

if (!existsSync(users_json_file)) {
  writeUsers({users: []})
}


class AuthsUser {
  /**
   * @param {{
   * username: String,
   * email: String,
   * password_hash: String,
   * password_salt: String,
   * creation_date: Date
   * }} param0 
   */
  constructor({
    username,
    email,
    password_hash,
    password_salt,
    creation_date
  }) {
    /**@type {String} */
    this.username = username
    /**@type {String} */
    this.email = email
    /**@type {String} */
    this.password_hash = password_hash
    /**@type {String} */
    this.password_salt = password_salt
    /**@type {Date} */
    this.creation_date = creation_date
    /**@type {boolean} */
    this.is_verified = false
  }

  onSave() {
    const data = {}

    data.username = this.username
    data.email = this.email
    data.password_hash = this.password_hash
    data.password_salt = this.password_salt
    data.creation_date = this.creation_date.toString()
    data.is_verified = this.is_verified

    return data
  }

  onLoad(data) {
    if (data === null) {
      return
    }

    this.username = data.username
    this.email = data.email
    this.password_hash = data.password_hash
    this.password_salt = data.password_salt
    this.creation_date = Date.parse(data.creation_date)
    this.is_verified = data.is_verified
  }

  validateNewUser() {
    const content = readUsers()
    const is_valid = 
      this.username.length > 5
      && this.email.length > 5
      && (content.users.findIndex((user) => {
        return user.email === this.email
      }) === -1)
      && this.password_hash !== ""
      && this.password_salt !== ""
      && typeof(this.creation_date) === typeof(Date.now())

    return is_valid
  }

  validateExistingUser() {
    const content = readUsers()
    const is_valid = 
      this.username.length > 5
      && this.email.length > 5
      && (content.users.findIndex((user) => {
        return user.email === this.email
      }) !== -1)
      && this.password_hash !== ""
      && this.password_salt !== ""
      && typeof(this.creation_date) === typeof(Date.now())
      && this.is_verified

    return is_valid
  }

  save() {
    if (this.validateNewUser()) {
      const content = readUsers()
      content.users.push(this)
      console.log(content)
    } else {
      console.log("user can't be validated")
    }
  }
}

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
  const password_hash = hashSync(password, password_salt)
  
  const user = new AuthsUser({
    username,
    email,
    password_hash,
    password_salt,
    creation_date: Date.now()
  })

  user.save()
}

/**
 * @param {AuthsUser | null} user_doc 
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
 * @returns {AuthsUser | undefined}
 */
export const getUserNoValidation = (email) => {
  const content = readUsers()
  const user = content.users.find((cur_user) => {
    return cur_user.email === email
  })
  return user
}

/**
 * @param {String} email 
 * @param {String} password 
 * @returns {AuthsUser | null}
 */
export const getVerifiedUser = (email, password) => {
  const user_doc = getUserNoValidation(email)
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
    token_data,
    jwt_secret,
    {
      algorithm: "HS256",
      expiresIn: "4Week",
      subject: "user credentials",
    }
  )
  
  return token
}