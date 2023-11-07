import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { BOOKS_BY_GENRE, ALL_BOOKS } from '../services/books'

const Books = () => {
  const [genre, setGenre] = useState('all genres')

  const { data: booksByGenre, refetch: refetchBooksByGenre } = useQuery(BOOKS_BY_GENRE)
  const { data: allBooks, refetch: refetchAllBooks } = useQuery(ALL_BOOKS)

  const handleGenreChange = (eventsMember) => {
    if (eventsMember === genre) {
      setGenre('all genres')
      refetchAllBooks()
    } else {
      setGenre(eventsMember)
      refetchBooksByGenre({ genre: eventsMember })
    }
  }

  const getGenres = (allBooks) => {
    let genres = []
    allBooks.forEach((book) => {
      book.genres.forEach((genre) => {
        if (!genres.includes(genre)) {
          genres.push(genre)
        }
      })
    })
    return genres
  }

  const genres = getGenres(allBooks.allBooks)

  const renderBooks = (allBooks) => {
    return (
      <div>
        <table>
          <tbody>
            <tr>
              <th></th>
              <th>author</th>
              <th>published</th>
            </tr>
            {allBooks.map((a) => (
              <tr key={a.title}>
                <td>{a.title}</td>
                <td>{a.author.name}</td>
                <td>{a.published}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div>
      <h2>books</h2>
      {genre === 'all genres' ? renderBooks(allBooks.allBooks) : renderBooks(booksByGenre.allBooks)}
      {genres.map((genresMember) => (
        <li
          onClick={() => handleGenreChange(genresMember)}
          value={genresMember}
          style={{
            display: 'inline',
            border: 'solid',
            borderWidth: '1px',
            padding: '2px',
            cursor: 'pointer',
            margin: '1px',
            backgroundColor: genresMember === genre ? 'lightblue' : 'white',
          }}
          key={genresMember}
        >
          {genresMember}
        </li>
      ))}
    </div>
  )
}

export default Books
