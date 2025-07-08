import React, { useState } from 'react';
import axios from 'axios';
import './DatabaseSearch.css';

const DatabaseSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    try {
      if (!query) return;
      const response = await axios.get(`/api/search?query=${query}`);
      setResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    }
  };

  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-input"
      />
      <button onClick={handleSearch} className="search-button">
        Search
      </button>

      <div className="search-results">
        {results.length > 0 ? (
          results.map((result) => (
            <div key={result.id} className="search-result">
              <h4>{result.title}</h4>
              <p>{result.description}</p>
            </div>
          ))
        ) : (
          <p>No results found</p>
        )}
      </div>
    </div>
  );
};

export default DatabaseSearch;

