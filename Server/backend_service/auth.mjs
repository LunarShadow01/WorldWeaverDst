import jwt from 'jsonwebtoken'
import { compareSync, genSaltSync, hashSync } from 'bcrypt'
import { webcrypto } from 'node:crypto';
import { getDataKey, setDataKey } from '../data_writer.mjs';

/**
 * @returns {AuthsUser[]}
 */
const readUsers = () => {
  /**@type {AuthsUser[]} */
  const users = []
  for (const user_data of getDataKey("users")) {
    const user = new AuthsUser({})
    user.onLoad(user_data)
    users.push(user)
  }

  return users
}

/**
 * @param {AuthsUser[]} users 
 */
const writeUsers = (users) => {
  const saved_users = []
  for (const user of users) {
    saved_users.push(user.onSave())
  }
  setDataKey("users", saved_users)
}

class AuthsUser {
  /**
   * @param {{
   * username: String,
   * pass_key_hash: String,
   * }} param0 
   */
  constructor({
    username,
    pass_key_hash,
  }) {
    /**@type {String} */
    this.username = username
    /**@type {String} */
    this.pass_key_hash = pass_key_hash;
  }

  onSave() {
    const data = {}

    data.username = this.username
    data.pass_key_hash = this.pass_key_hash

    return data
  }

  onLoad(data) {
    if (data === null) {
      return
    }

    this.username = data.username
    this.pass_key_hash = data.pass_key_hash
  }

  save() {
    const users = readUsers()
    users.push(this)
    writeUsers(users)
  }

  static findVerified(pass_key) {
    const users = readUsers();
    for (data of users) {
      const user = new AuthsUser().onLoad(data)
      if (compareSync(pass_key, user.pass_key_hash)) {
        return user
      }
    }
    return null
  }
}

const issued_key = "jwt_secret_issued_date"
const jwt_secret_key = "jwt_secret"
let jwt_secret = getDataKey(jwt_secret_key)
if (jwt_secret === "") {
  const arr = webcrypto.getRandomValues(new Uint32Array(20))
  for (const num of arr) {
    jwt_secret += "" + num
  }

  setDataKey(jwt_secret_key, Buffer.from(jwt_secret).toString("base64"))
  setDataKey(issued_key, Date.now())
}

export const getUserValidate = (pass_key) => {
  return AuthsUser.findVerified(pass_key)
}