const Recommended = ({ books, user }) => {

  const filteredBooks = () => {
    if (user.favoriteGenre) {
      return books.filter((book) => book.genres.includes(user.favoriteGenre))
    }
    return books
  }

  const booksToShow = filteredBooks()

  return (
    <div>
      <h2>recommendations</h2>
      <p>
        books in your favorite genre <b>{user.favoriteGenre}</b>
      </p>
      <table>
        <tbody>
          <tr>
            <th>book</th>
            <th>author</th>
            <th>published</th>
          </tr>
          {booksToShow.map((a) => (
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

export default Recommended
