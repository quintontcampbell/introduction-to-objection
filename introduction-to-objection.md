**Objection** acts as an object-layer on top of our SQL database, abstracting us away from the complexity of SQL queries. Through inheritance, we can utilize the features of Objection to perform database queries actions without writing any SQL.

## Learning Goals

* Introduce the configuration necessary for Objection
* Understand the interface Objection provides for communicating with our database
* See the most commonly used Objection queries for each of the CRUD actions

## Getting Started

```no-highlight
et get introduction-to-objection
cd introduction-to-objection
yarn install
cd server

dropdb songs_development
createdb songs_development
```
## Introducing Objection.js

Objection is a lightweight ORM for Node.js, that is built over Knex.js. Many ORMs, or Object-Relational-Mapping libraries have been created for various technologies to allow developers to spend less time writing SQL queries, and instead use our knowledge of Object Oriented Programming to abstract said queries into commonly used methods.

For instance, in SQL, in order to retrieve all song records we may have in our database we would need to establish a connection to the database, then our setup our query correctly, and convert the results of our query into JavaScript notation.

With Objection configured in our Node/Express apps with Knex, fetching all of our song records is as simple as:

```js
Song.query()
```

By defining a Song class and having it inherit from Objection, we can quickly provide our classes with methods that skip the SQL in favor of simpler query methods that each of our classes can use out of the box. In this way, our objects become the managers of the data in our database. This is "Object Relational Mapping", or ORM. A `Song` class which we have access to in our JavaScript code becomes tied to the `songs` table in our database. In fact, said Song class becomes the key interface we have with the data stored in our database altogether.

Once we are done exploring the configuration and syntax of Objection, we will be able to define models that easily handle our SQL queries for us. We will then be able to use those models in our API endpoints, in order to interact with the data in our database.

### Configuring Objection

Aside from very minimal loading that we have managed for you (you can click around the provided files if you want to explore), the primary file that connects Objection with your Knex config is the `server/src/boot/model.js` file.

```js
import knex from "knex"
import objection from "objection"

import knexConfig from "../../knexfile.cjs"

const knexConnection = knex(knexConfig)

objection.Model.knex(knexConnection)
```

Here, we load in the same config and connection that Knex has established and link it with the installed version of Objection. Now let's use Objection by examining the `Model.js` that we have provided.

```js
// eslint-disable-next-line import/no-extraneous-dependencies
const ObjectionModel = require("objection").Model

/**
 * @class Model
 */

class Model extends ObjectionModel {
  $beforeInsert() {
    this.createdAt = new Date().toISOString()
    this.updatedAt = new Date().toISOString()
  }

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }
}

module.exports = Model
```
While this is not a file provided by Objection, we will be having our own custom models (e.g. a Song model) inherit directly from this class. In this way, we can share logic between our classes without having to repeat ourselves. For instance, it's good practice to ensure that each of our tables in our database have a `createdAt` and `updatedAt` column that is automatically updated. By adding the `$beforeInsert()` and `$beforeUpdate()` Objection hook methods defined here, this is exactly what will happen whenever we create or update a record in our database with Objection. If we didn't have a `Model` class, each model we create (e.g `Song`, `Producer`, `Album`, `Artist`) would also need these methods.

Note: all of our model files will require us to use CommonJS when we are defining their syntax.

## Models

Now that we have our base "parent" Model, we can create new classes that inherit from our `Model` class, which in turn extends all of the methods and functionality from Objection. The classes that we define which inherit from Objection represent the "M" in MVC frameworks. The responsibility of our Models will solely be to connect with a table in our database, querying and managing our data.

Navigating to the `models` folder in our server, let's create a `Song.js` file and add the following code:

```js
const Model = require("./Model")

class Song extends Model {
  static get tableName() {
    return "songs"
  }
}

module.exports = Song
```

We define a class `Song`, and have it inherit from our abstract `Model` class that is loaded up with Objection. We also create a helper method that Objection uses to know exactly what table we want to persist new song records too, so make sure you define this method with the table name that matches your corresponding migration whenever making new models. That's it! Our Song class is ready to be used, we just have to make the table. From the `server` folder run the following to create a new migration:

```
yarn run migrate:make createSongs
```

And add the following to the generated migration file.

```js
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
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("songs")
}
```

Now that we are using Objection it's good practice to add `createdAt` and `updatedAt` columns. Because of the `beforeInsert` and `beforeUpdate` method hooks we defined in `model.js`, any time we attempt to persist information to a row in our database, our record will also update the these columns (when an object is created or updated respectively). We also have these two columns default to the time and date that this table is created with Knex's `fn` module; this provides us access to the `now()` function for getting the current timestamp.

This concludes the setup that is needed for us to use Objection models and queries. Now we can have our models create, read, update and destroy records in our database with fewer lines of code.

## Using Objection

The reason we have set up Objection is so that we can define queries in JavaScript instead of submitting raw SQL queries directly to the database.

Below we will be introducing you to some of more essential Objection queries that you can use in your applications. These queries allow you to do many of the same things that we could do with SQL, but more simply. We've selected these queries with a combination of simplicity, function and efficiency in mind, but we highly suggest you review the [Objection.js Guide][objection-js-guide] and documentation for more context and more queries that you can potentially run!

#### Working with REPL

In order to see our Objection classes in action, we'll want an interface to experiment with them in a console. This is where a "repl" comes in. The `repl` library in this case provides us that console with access to our Objection models. This in turn will allow us to to call the methods on our `Song` model from a command line, to interact with our database in real time.

If you are curious about the configuration, you can review this in `server/src/console.js`.

```js
import repl from "repl"
import { connection } from "./boot.js"

import models from "./models/index.js"

const replServer = repl.start({
  prompt: "> ",
})

replServer.context.models = models
replServer.on("close", () => {
  connection.destroy()
})
```

Thankfully, you will not need to edit this file as long as you consistently update the `server/src/models/index.js` with imports for any classes you have defined.

Let's update this `index.js` file to import and export our `Song` class as a module, in addition to our more abstract `Model` class.

```js
const Model = require("./Model")
const Song = require("./Song")
module.exports = { Model, Song }
```

When we now add our models to our `repl` console, our `Song` and `Model` classes will be available to us.

From the `server` folder, running `yarn run console` will open up our REPL. From here, enter in the word `models`.

```no-highlight
> models

{
  Model: [class Model extends Model],
  Song: [class Song extends Model]
}
```

We can see that we have access to our `Model` and `Song` classes within this REPL!

### Objection Queries

Let's run the following to test our Objection model:

```js
const Song = models.Song
await Song.query()

[]
```

Our `query` method from objection works! Alas, we don't have any song records yet, so an empty array is returned...but it's still pretty cool. Don't forget to define a `Song` constant when you first open the REPL (as we did on the first line there) so that we don't need to type out `models.Song` each time we wish to interact with our class.

Objection queries are inherently asynchronous because they must communicate with an external interface - PostgreSQL. As such, each of our Objection queries should have an `await` keyword to ensure that our code execution is paused until the result is returned.

The `query()` method by default, returns all of the associated Song records, and then instantiates them as Song objects contained in an array. Currently, we have no Songs in our database though, so let's change that:

```js
const yesterdaySong = await Song.query().insert({ name: "Yesterday", artist: "The Beatles", album: "Help!" })

const letItBeSong = await Song.query().insert({ name: "Let It Be", artist: "The Beatles", album: "Let It Be" })
```

That should add two song records. Let's check out the first:
```js
yesterdaySong

Song {
  name: "Yesterday",
  artist: "The Beatles",
  album: "Let It Be",
  createdAt: "2020-11-12T14:14:39.346Z",
  updatedAt: "2020-11-12T14:14:39.347Z",
  id: "1"
}
```

With this implementation, we chain the `insert()` method on our `query()` method. When we do such chaining, `query()` is also an instance of Objection's `QueryBuilder`, and so allows this functionality to specify an `insert` query (and more). We will almost always be chaining CRUD related methods such as `insert()` onto our `query()` method.

Insert accepts a single argument: an object whose properties coincide with our songs table's column names and row values respectively. The key designates the column, the value represents the information that will be stored in that column in the `songs` table.

It's worth noting that `insert()` only returns an object with the rows that you designated with your insert (meaning, the return value of this method will skip any rows we didn't ourselves specify). This will generally do the trick for us, but if we want to ensure that we also have access to the complete record with all of its properties regardless of whether they were designated then we will want to replace `insert()` with `insertAndFetch()`. _If we don't need access to the complete record after inserting our song, then `insert()` is preferred since it reduces the number of queries necessary._

```js
const yesterdaySong = await Song.query().insertAndFetch({ name: "Yesterday", artist: "The Beatles", album: "Help!"})
```

While we didn't setup a constructor in our `Song` class definition, Objection ensures each of the `name`, `artist`, and `album` properties are available to be called upon.

```js
console.log(yesterdaySong.name) // --> "Yesterday"
console.log(yesterdaySong.artist) // --> "The Beatles"
```

Running `await Song.query()` should now return an array with two Song records:

```js
await Song.query()

[
  Song {
    id: "1",
    name: "Yesterday",
    artist: "The Beatles",
    album: "Let It Be",
    createdAt: 2020-11-12T14:14:39.346Z,
    updatedAt: 2020-11-12T14:14:39.347Z
  },
  Song {
    id: "2",
    name: "Let It Be",
    artist: "The Beatles",
    album: "Let It Be",
    createdAt: 2020-11-12T14:17:02.604Z,
    updatedAt: 2020-11-12T14:17:02.604Z
  }
]
```

#### Find Queries

Let's cover the `findById()`, `findOne()` and `where()` queries.

The fastest way to retrieve an individual record is with the `findById()` query. If we know the id of the record we want (say, if we receive the `id` from the params at a dynamic route in Express), we can retrieve our Song.

```js
await Song.query().findById(1)

Song {
  id: "1",
  name: "Yesterday",
  artist: "The Beatles",
  album: "Let It Be",
  createdAt: 2020-11-12T14:14:39.346Z,
  updatedAt: 2020-11-12T14:14:39.347Z
}
```

If we don't have an id, but we know which attributes we want to use to search for our Song, then `findOne()` is the query to use:

```js
await Song.query().findOne({ name: "Yesterday" })
```

Finally, the `where()` query will return all records whose properties match any supplied properties.

```js
await Song.query().where({ artist: "The Beatles" })

[
  Song {
    id: "1",
    name: "Yesterday",
    artist: "The Beatles",
    album: "Let It Be",
    createdAt: 2020-11-12T14:14:39.346Z,
    updatedAt: 2020-11-12T14:14:39.347Z
  },
  Song {
    id: "2",
    name: "Yesterday",
    artist: "The Beatles",
    album: "Let It Be",
    createdAt: 2020-11-12T14:17:02.604Z,
    updatedAt: 2020-11-12T14:17:02.604Z
  }
]
```

#### Updating Queries

We can update records with Objection using a `patch()` or `update()` query. While the use of these two queries is situational, we recommend using `update()` to ensure that your record is in compliance with the schema, allowing errors to be thrown otherwise. In order to run an `update()` query, we must first retrieve the object/record we wish to update:

```js
const numberOfUpdatedRows = await Song.query().findById(1).update({ artist: "The Beatlemen" })
```

Unfortunately, the return of `update()` is the number of updated rows affected by our query, which is fine for simple updates, but less effective if we want info about the final product of our query. If we want the full song object with all of its properties after we have run our update query, then we will need another compound query similar to `insertAndFetch()`. 

```js
await Song.query().findById(2).updateAndFetch({ artist: "The Beatlemen"})
```

Uh oh, this should throw and error: `Uncaught Error: updateAndFetch can only be called for instance operations`. `updateAndFetch` can only be called on an *instance* of a song! Let's use the `yesterdaySong` variable that we created earlier to update our record

```js
await yesterdaySong.$query().updateAndFetch({ artist: "The Beatlemen"})
```

We made one other change here as well: when calling an Objection method on an instance of our Song, we have to add the `$` syntax as well. 

Now our `yesterdaySong` object has all of the properties that its corresponding database row's record has. But there is another method of optimization we can follow, IF we do want to update a record without having to get an instance of it first: 

```js
const yesterdaySongUpdated = await Song.query().updateAndFetchById(1, { artist: "The Beatlemen" })
```

If we already know the id of the song we wish to update (and we often will) then we can simplify our query and improve its performance with `updateAndFetchById`, while also returning the full song object that we may wish to use.

Each of these queries has its merits, but for simplicity you may want to prefer `updateAndFetchById()` where possible.

### Delete Queries  

The simplest option for deleting is `deleteById()`, which accepts an argument of an id and returns the number of rows deleted (which will generally be 1):

```js
const rowsDeleted = await Song.query().deleteById(1)
```

There isn't much more to deletion, unless we want to delete more than one record. If so, we can just chain `delete` on to our `query` builder to delete all records.

```js
await Song.query().delete()
```

### Using our Models in the Context of our App

Like we have done with our models in the past which interacted with file storage, we can utilize these models inside of our Express routes in order to interact with our data in storage. 

Previously, we have built an API endpoint looking something like this:

```js
// server/src/routes/api/v1/songsRouter.js
...
songsRouter.get("/", (req, res) => {
  return res.status(200).json({ songs: Song.findAll })
})
...
```

Now, however, we will update the syntax around using this model to use the Objection methods:

```js
// server/src/routes/api/v1/songsRouter.js
...
songsRouter.get("/", async (req, res) => {
  try {
    const songs = await Song.query()
    return res.status(200).json({ songs: songs })
  } catch(err) {
    return res.status(500).json({ errors: err })
  }
})
...
```

Notice that while interacting with our JSON file storage in the past was synchronous, reaching out to a database for data is an asynchronous process. As such, we will need to give our route an `async` function, so that we can add our `await` prior to `Song.query()` like we did in our console. Additionally, because we don't know if Objection will encounter errors when trying to interact with the database, we wrap it all up in a `try/catch` to handle errors elegantly. If we fail to get our songs for whatever reason, we consider that a server error and respond with a 500 status code.

### Conclusion

With Objection, our models are empowered with a query interface that reduces the amount of code and complexity necessary for retrieving, creating, updating and deleting data in our database. For each model (e.g. `Song` class) we create, we should have a corresponding table in our database (e.g. `songs`). While Knex manages the structure of our database, Objection manages our ability to access and alter the data housed within that structure.

For retrieving a given record, Objection gives us the `query()`, `findById()`, `findOne()` and `where()` queries, which are differentiated by either the arguments they receive or the objects they return.

For inserting a new record, `insert()` and `insertAndFetch()` should be used. Mutating existing records requires the use of `update()`, `updateAndFetch()`, or `updateAndFetchById()`, though `updateAndFetchById()` should be preferred where possible while we are still getting accustomed to Objection. `deleteById()` is a simpler method for removing a record in our database.

**The methods we introduce you to here are only a few of the numerous query methods Objection provides.** In fact, there are other query methods that will be either more efficient or more useful for certain features that you are building in your applications. However, the methods above will get the job done while you are starting out, and will generally require less complexity than other methods. As long as you have methods for each of the CRUD actions - create, read, update, and destroy - then you will be able manage data in your applications with success.

### Resources
[Objection.js Guide][objection-js-guide]
[Objection API Documentation][objection-api-docs]

[objection-api-docs]:https://vincit.github.io/objection.js/api/query-builder/
[objection-js-guide]: https://vincit.github.io/objection.js/guide/query-examples.html
