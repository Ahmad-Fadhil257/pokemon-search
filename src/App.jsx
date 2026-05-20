import { useState, useEffect } from 'react'
import './styles/global.css'
import './styles/poke.css'

const getTypeColor = (type) => {
  return `type-${type}`
}

const PokemonCard = ({ pokemon, onClick }) => {
  const [details, setDetails] = useState(pokemon.fullDetails || null)

  useEffect(() => {
    let isMounted = true
    if (!details && pokemon.url) {
      fetch(pokemon.url)
        .then(r => r.json())
        .then(data => {
          if (isMounted) {
            setDetails(data)
            pokemon.fullDetails = data // Cache
          }
        })
        .catch(() => {})
    }
    return () => { isMounted = false }
  }, [pokemon, details])

  const id = pokemon.id || (pokemon.url ? pokemon.url.split('/').filter(Boolean).pop() : null)
  const image = details?.sprites?.other['official-artwork']?.front_default 
             || details?.sprites?.front_default 
             || (id ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png` : null)

  const types = details?.types || []

  return (
    <div className="pokemon-card" onClick={() => onClick(details)}>
      <div className="pokemon-image">
        {image ? (
          <img 
            src={image} 
            alt={pokemon.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            loading="lazy"
          />
        ) : <div className="loading-spinner" style={{width: 30, height: 30, margin: 'auto', borderWidth: 3}}></div>}
      </div>
      <h2 className="pokemon-name">{pokemon.name}</h2>
      <div className="type-container" style={{ minHeight: '24px' }}>
        {types.map(t => (
          <span key={t.type.name} className={`type-badge ${getTypeColor(t.type.name)}`}>
            {t.type.name}
          </span>
        ))}
      </div>
    </div>
  )
}

function App() {
  const [pokemonList, setPokemonList] = useState([])
  const [allPokemon, setAllPokemon] = useState([]) 
  const [searchResults, setSearchResults] = useState(null)
  
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPokemon, setSelectedPokemon] = useState(null)
  const [error, setError] = useState(null)

  const [isDarkMode, setIsDarkMode] = useState(false)
  const [mode, setMode] = useState('pokedex') 

  const [gamePokemon, setGamePokemon] = useState(null)
  const [guess, setGuess] = useState('')
  const [gameResult, setGameResult] = useState(null) // 'win' | 'lose' | 'surrender' | null

  const limit = 24

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=10000')
        const data = await res.json()
        setAllPokemon(data.results)
      } catch (e) {
        console.error('Gagal mengambil semua pokemon', e)
      }
    }
    fetchAll()
  }, [])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [isDarkMode])

  const loadPokemon = async (reset = false) => {
    try {
      setLoading(true)
      const currentOffset = reset ? 0 : offset
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${currentOffset}`)
      const data = await res.json()
      
      const basicData = data.results.map(p => {
        const id = p.url.split('/').filter(Boolean).pop()
        return { ...p, id }
      })
      
      setPokemonList(prev => reset ? basicData : [...prev, ...basicData])
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

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (!searchTerm.trim()) {
        setSearchResults(null)
        setError(null)
        return
      }

      setError(null)
      const filtered = allPokemon.filter(p => p.name.includes(searchTerm.toLowerCase().trim()))
      
      if (filtered.length === 0) {
        setError('Pokemon tidak ditemukan')
        setSearchResults([])
      } else {
        const toShow = filtered.slice(0, limit).map(p => {
          const id = p.url.split('/').filter(Boolean).pop()
          return { ...p, id }
        })
        setSearchResults(toShow)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, allPokemon])

  const startGame = async () => {
    setMode('game')
    setGameResult(null)
    setGuess('')
    setGamePokemon(null)
    if (allPokemon.length > 0) {
      const random = allPokemon[Math.floor(Math.random() * allPokemon.length)]
      const res = await fetch(random.url)
      const details = await res.json()
      setGamePokemon(details)
    }
  }

  const handleGuess = (e) => {
    e.preventDefault()
    if (!guess.trim() || !gamePokemon) return
    if (guess.toLowerCase().trim() === gamePokemon.name.toLowerCase()) {
      setGameResult('win')
    } else {
      setGameResult('lose')
    }
  }

  const handleSurrender = () => {
    setGameResult('surrender')
  }

  const displayList = searchResults !== null ? searchResults : pokemonList

  return (
    <div className="app-container">
      <header className="header">
        <div className="controls" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1rem' }}>
          <button className="toggle-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? '☀️ Mode Terang' : '🌙 Mode Malam'}
          </button>
          <button className="toggle-btn" onClick={() => {
            if (mode === 'pokedex') startGame()
            else setMode('pokedex')
          }}>
            {mode === 'pokedex' ? '🎮 Main Tebak Pokemon' : '📖 Kembali ke Pokedex'}
          </button>
        </div>
        <h1>PokeVibe</h1>
        <p>Jelajahi dunia Pokemon dengan antarmuka modern</p>
      </header>

      {mode === 'pokedex' ? (
        <>
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Cari Pokemon (contoh: bul)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {error && <div style={{ textAlign: 'center', color: '#ef4444', marginBottom: '2rem' }}>{error}</div>}

          <div className="pokemon-grid">
            {displayList.map((pokemon, index) => (
              <PokemonCard 
                key={`${pokemon.id}-${index}`} 
                pokemon={pokemon} 
                onClick={(details) => details && setSelectedPokemon(details)}
              />
            ))}
          </div>

          {loading && searchResults === null && pokemonList.length === 0 && <div className="loading-spinner"></div>}

          {!loading && searchResults === null && (
            <button className="load-more" onClick={() => loadPokemon()}>
              Muat Lebih Banyak
            </button>
          )}
        </>
      ) : (
        <div className="game-container">
          <h2>Siapakah Pokemon ini?</h2>
          {!gamePokemon ? (
            <div className="loading-spinner"></div>
          ) : (
            <div className="game-box">
              <div className="pokemon-image-large">
                <img 
                  src={gamePokemon.sprites.other['official-artwork'].front_default || gamePokemon.sprites.front_default} 
                  alt="Tebak Pokemon"
                  style={{ 
                    width: '300px', 
                    height: '300px', 
                    objectFit: 'contain',
                    filter: (gameResult === 'win' || gameResult === 'surrender') ? 'brightness(1) drop-shadow(0 10px 8px rgba(0,0,0,0.2))' : 'brightness(0) drop-shadow(0 10px 8px rgba(0,0,0,0.5))',
                    transition: 'filter 0.5s ease',
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }}
                  draggable="false"
                />
              </div>
              
              {gameResult === 'win' || gameResult === 'surrender' ? (
                <div className="win-message">
                  <h3 style={{ color: gameResult === 'win' ? '#10b981' : '#f59e0b' }}>
                    {gameResult === 'win' ? 'Benar!' : 'Sayang sekali!'} Itu adalah {gamePokemon.name.toUpperCase()}!
                  </h3>
                  <button className="load-more" onClick={startGame} style={{ margin: '1rem auto' }}>Main Lagi</button>
                </div>
              ) : (
                <form onSubmit={handleGuess} className="game-form" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Masukkan nama pokemon..."
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="submit" className="load-more" style={{ margin: '0', padding: '0.75rem 2rem' }}>Tebak</button>
                    <button type="button" onClick={handleSurrender} className="load-more" style={{ margin: '0', padding: '0.75rem 2rem', background: '#ef4444' }}>Menyerah</button>
                  </div>
                  {gameResult === 'lose' && <p style={{ color: '#ef4444', marginTop: '1rem', fontWeight: 'bold' }}>Salah, coba lagi!</p>}
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {selectedPokemon && (
        <div className="modal-overlay" onClick={() => setSelectedPokemon(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setSelectedPokemon(null)}>✕</button>
            <div className={`modal-header ${getTypeColor(selectedPokemon.types[0].type.name)}`}>
              <img 
                src={selectedPokemon.sprites.other['official-artwork'].front_default || selectedPokemon.sprites.front_default} 
                alt={selectedPokemon.name}
                style={{ width: '200px', height: '200px', objectFit: 'contain', zIndex: 2 }}
              />
            </div>
            <div className="modal-body">
              <h2 className="pokemon-name" style={{ fontSize: '2rem', textAlign: 'center', textTransform: 'capitalize' }}>{selectedPokemon.name}</h2>
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

