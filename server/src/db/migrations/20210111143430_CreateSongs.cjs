/**
 * @typedef {import("knex")} Knex
 */

/**
 * @param {Knex} knex
 */
exports.up = async (knex) => {
  return knex.schema.createTable("songs", (table) => {
    table.bigIncrements("id").primary()
    table.string("name").notNullable()
    table.string("artist")
    table.string("album")
    table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now())
    table.timestamp("updatedAt").notNullable().defaultTo(knex.fn.now())
  })
}

/**
 * @param {Knex} knex
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists("songs")
}
