const Model = require('./Model')

class Song extends Model {
  static get tableName() {
    return "songs"
  }
}

module.exports = Song