import { useState } from 'react'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import { Routes, Route, Link } from 'react-router-dom'
import { useApolloClient, useQuery } from '@apollo/client'
/* import { LOGIN } from './services/login' */
import LoginForm from './components/LoginForm'
import Recommended from './components/Recommended'
import { ALL_BOOKS } from './services/books'
import { ALL_AUTHORS } from './services/author'

const App = () => {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const client = useApolloClient()

  const authorResult = useQuery(ALL_AUTHORS)
  const bookResult = useQuery(ALL_BOOKS)

  const padding = {
    padding: 5,
  }

  if (authorResult.loading || bookResult.loading) {
    return <div>loading...</div>
  }

  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
  }

  return (
    <div>
      <div>
        <Link style={padding} to="/">
          authors
        </Link>
        <Link style={padding} to="/books">
          books
        </Link>
        {token ? (
          <div style={{ display: 'inline-block' }}>
            <Link style={padding} to="/add">
              add book
            </Link>
            <Link style={padding} to="/recommended">
              recommended
            </Link>
            <button onClick={logout}>logout</button>
          </div>
        ) : (
          <Link style={padding} to="/login">
            login
          </Link>
        )}
      </div>
      <Routes>
        <Route
          path="/recommended"
          element={<Recommended user={user} books={bookResult.data.allBooks} />}
        />
        <Route
          path="/"
          element={<Authors authors={authorResult.data.allAuthors} />}
        />
        <Route
          path="/books"
          element={<Books />}
        />
        <Route path="/add" element={<NewBook />} />
        <Route
          path="/login"
          element={<LoginForm setUser={setUser} setToken={setToken} />}
        />
      </Routes>
    </div>
  )
}

export default App
