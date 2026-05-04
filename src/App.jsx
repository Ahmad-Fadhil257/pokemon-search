import { useState, useEffect } from 'react'
import './styles/global.css'
import './styles/poke.css'

function App() {
  const [pokemonList, setPokemonList] = useState([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPokemon, setSelectedPokemon] = useState(null)
  const [error, setError] = useState(null)

  const limit = 24

  const fetchPokemonDetails = async (url) => {
    const res = await fetch(url)
    return await res.json()
  }

  const loadPokemon = async (reset = false) => {
    try {
      setLoading(true)
      const currentOffset = reset ? 0 : offset
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${currentOffset}`)
      const data = await res.json()
      
      const detailsPromises = data.results.map(p => fetchPokemonDetails(p.url))
      const detailedData = await Promise.all(detailsPromises)
      
      setPokemonList(prev => reset ? detailedData : [...prev, ...detailedData])
      setOffset(prev => currentOffset + limit)
    } catch (err) {
      setError('Gagal mengambil data Pokemon.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPokemon(true)
  }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchTerm.trim()) {
      loadPokemon(true)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${searchTerm.toLowerCase().trim()}`)
      if (!res.ok) throw new Error('Pokemon tidak ditemukan')
      const data = await res.json()
      setPokemonList([data])
    } catch (err) {
      setError(err.message)
      setPokemonList([])
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type) => {
    return `type-${type}`
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1>PokeVibe</h1>
        <p>Jelajahi dunia Pokemon dengan antarmuka modern</p>
      </header>

      <form onSubmit={handleSearch} className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Cari Pokemon (contoh: pikachu)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </form>

      {error && <div style={{ textAlign: 'center', color: '#ef4444', marginBottom: '2rem' }}>{error}</div>}

      <div className="pokemon-grid">
        {pokemonList.map((pokemon, index) => (
          <div 
            key={`${pokemon.id}-${index}`} 
            className="pokemon-card"
            onClick={() => setSelectedPokemon(pokemon)}
          >
            <div className="pokemon-image">
              <img 
                src={pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default} 
                alt={pokemon.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <h2 className="pokemon-name">{pokemon.name}</h2>
            <div className="type-container">
              {pokemon.types.map(t => (
                <span key={t.type.name} className={`type-badge ${getTypeColor(t.type.name)}`}>
                  {t.type.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {loading && <div className="loading-spinner"></div>}

      {!loading && !searchTerm && (
        <button className="load-more" onClick={() => loadPokemon()}>
          Muat Lebih Banyak
        </button>
      )}

      {selectedPokemon && (
        <div className="modal-overlay" onClick={() => setSelectedPokemon(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setSelectedPokemon(null)}>✕</button>
            <div className={`modal-header ${getTypeColor(selectedPokemon.types[0].type.name)}`}>
              <img 
                src={selectedPokemon.sprites.other['official-artwork'].front_default} 
                alt={selectedPokemon.name}
                style={{ width: '200px', height: '200px', objectFit: 'contain', zIndex: 2 }}
              />
            </div>
            <div className="modal-body">
              <h2 className="pokemon-name" style={{ fontSize: '2rem', textAlign: 'center' }}>{selectedPokemon.name}</h2>
              <div className="type-container" style={{ marginBottom: '2rem' }}>
                {selectedPokemon.types.map(t => (
                  <span key={t.type.name} className={`type-badge ${getTypeColor(t.type.name)}`}>
                    {t.type.name}
                  </span>
                ))}
              </div>
              
              <div className="stat-grid">
                <div className="stat-item">
                  <div className="stat-label">Tinggi</div>
                  <div className="stat-value">{selectedPokemon.height / 10} m</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Berat</div>
                  <div className="stat-value">{selectedPokemon.weight / 10} kg</div>
                </div>
                {selectedPokemon.stats.slice(0, 4).map(s => (
                  <div key={s.stat.name} className="stat-item">
                    <div className="stat-label">{s.stat.name.replace('-', ' ')}</div>
                    <div className="stat-value">{s.base_stat}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
