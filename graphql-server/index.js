const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const { v1: uuid } = require('uuid')
const mongoose = require('mongoose')
const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')
const jwt = require('jsonwebtoken')
const { GraphQLError } = require('graphql')

mongoose.set('strictQuery', false)
require('dotenv').config()

const MONGO_URL = process.env.MONGO_URL

console.log('connecting to', MONGO_URL)

mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

const typeDefs = `
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Author {
    name: String!
    born: Int
    bookCount: Int!
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
    id: ID!
  }
  
  type Query {
    dummy: Int
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]!
    ): Book!
    editAuthor(name: String!, setBornTo: Int!): Author
  }
`

const getAuthorsBooks = (author, books) => {
  const booklistFromAuthor = books.filter(
    (book) => book.author.toString() === author._id.toString()
  )
  return booklistFromAuthor
}

const throwIfNotAuthenticated = (context) => {
  if (!context.currentUser) {
    throw new GraphQLError('Not authenticated', {
      extensions: {
        code: 'UNAUTHENTICATED',
      },
    })
  }
}

const resolvers = {
  Query: {
    me: (root, args, context) => {
      throwIfNotAuthenticated(context)
      return context.currentUser
    },
    bookCount: async () => await Book.collection.countDocuments(),
    authorCount: async () => await Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      const author = args.author
      const genre = args.genre
      const books = await Book.find({}).populate('author', {
        _id: 0, __v: 0
      })

      if (!author && !genre) return books
      if (!author && genre) {
        return books.filter((book) => book.genres.includes(genre))
      }
      else if (author && !genre) {
        return books.filter((book) => book.author.name === author)
      }
      if (author && genre) {
        const booksByAuthor = books.filter(
          (book) => book.author.name === author
        )
        return booksByAuthor.filter((book) => book.genres.includes(genre))
      }
    },
    allAuthors: async () => {
      const authors = await Author.find({})
      const books = await Book.find({})
      const user = await User.find({})
      const authorsWithBookCount = authors.map((author) => {
        const booklistFromAuthor = getAuthorsBooks(author, books)
        const bookCount = booklistFromAuthor.length
        return {
          name: author.name,
          born: author.born ? author.born : null,
          bookCount,
        }
      })
      return authorsWithBookCount
    },
  },
  Mutation: {
    createUser: async (root, args) => {
      await User.deleteMany({})
      const user = new User({ ...args })
      try {
        const savedUser = await user.save()
        return {
          username: savedUser.username,
          favoriteGenre: savedUser.favoriteGenre,
          id: savedUser._id.toString(),
        }
      } catch (error) {
        throw new GraphQLError('Creating user failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.name,
            error
          },
        })
      }
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })
      if (!user || args.password !== 'secret') {
        throw new GraphQLError('Wrong credentials', {
          extensions: {
            code: 'UNAUTHENTICATED',
          },
        })
      }
      const userForToken = {
        username: user.username,
        id: user._id,
      }
      return { value: jwt.sign(userForToken, process.env.JWT_SECRET) }
    },
    addBook: async (root, args, context) => {
      throwIfNotAuthenticated(context) // tämä ehdottomasti tarvitaan
      const matchingAuthor = await Author.findOne({ name: args.author })
      if (matchingAuthor) {
        const { author, ...newBook } = args
        try {
          const bookToSave = new Book({
            ...newBook,
            author: matchingAuthor._id,
          })
          const savedBook = await bookToSave.save()
          return {
            title: savedBook.title,
            published: savedBook.published,
            author: { name: matchingAuthor.name },
            genres: savedBook.genres,
          }
        } catch (error) {
          throw new GraphQLError('Saving a book failed', {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.name,
              error
            }
          })
        }
      } else {
        try {
          const newAuthor = new Author({ name: args.author })
          const savedAuthor = await newAuthor.save()
          const bookToSave = new Book({
            ...args,
            author: savedAuthor._id,
          })
          const savedBook = await bookToSave.save()
          return {
            title: savedBook.title,
            published: savedBook.published,
            author: { name: savedAuthor.name },
            genres: savedBook.genres,
          }
        } catch (error) {
          throw new GraphQLError('Saving user failed', {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.name,
              error
            }
          })
        }
      }
    },
    editAuthor: async (root, args, context) => {
      throwIfNotAuthenticated(context)
      const author = await Author.findOne({ name: args.name })
      if (!author) return null
      const bookCount = await Book.find({ author: author._id }).countDocuments()
      const updatedAuthor = await Author.findOneAndUpdate(
        { name: author.name },
        { name: args.name, born: args.setBornTo, bookCount: author.bookCount },
        { new: true }
      )
      return {
        name: updatedAuthor.name,
        born: updatedAuthor.born,
        bookCount
      }
    },
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req, res }) => {
    const auth = req ? req.headers.authorization : null
    if (!auth) {
    }
    if (auth && auth.startsWith('Bearer ')) {
      const decodedToken = jwt.verify(auth.substring(7), process.env.JWT_SECRET)
      const currentUser = await User.findById(
        decodedToken.id
      )
      return { currentUser }
    }
  },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
