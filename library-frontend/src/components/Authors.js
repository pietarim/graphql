import { useMutation } from '@apollo/client'
import { useState } from 'react'
import { EDIT_AUTHOR, ALL_AUTHORS } from '../services/author'

const Authors = (props) => {
  const [born, setBorn] = useState('')
  const [targetValue, setTargetValue] = useState(props.authors[0].name)
  
  const authors = [...props.authors]

  const [editAuthor] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }],
  })

  const updateAuthor = (event) => {
    event.preventDefault()
    const bornInt = parseInt(born)
    editAuthor({ variables: { name: targetValue, setBornTo: bornInt } })
    setTargetValue(authors[0].name)
    setBorn('')
  }

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Set birthyear</h2>
      <form onSubmit={updateAuthor}>
        <select
          value={targetValue}
          onChange={({ target }) => setTargetValue(target.value)}
        >
          {authors.map((a) => (
            <option key={a.name} value={a.name}>
              {a.name}
            </option>
          ))}
        </select>
        <div>
          born
          <input
            value={born}
            onChange={({ target }) => setBorn(target.value)}
          />
          <br />
          <button type="submit">update author</button>
        </div>
      </form>
    </div>
  )
}

export default Authors
