import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

// --- Iconos (Simulados) ---
const SearchIcon = () => (
  <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);
const HeartIcon = ({ isLiked, ...props }) => (
  <svg {...props} xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);
const UserIcon = () => (
  <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
  </svg>
);
const HomeIcon = () => (
  <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);
// *NUEVO* Icono de Play
const PlayIcon = (props) => (
  <svg {...props} xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);
// *NUEVO* Icono de Historial
const HistoryIcon = (props) => (
  <svg {...props} xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l3.5 2"></path>
  </svg>
);


// --- 1. SERVICIO DE API (Conector al Backend) ---
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// --- Componente: Loader ---
const Loader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900">
    <div className="w-16 h-16 border-4 border-t-blue-500 border-gray-700 rounded-full animate-spin"></div>
  </div>
);

// --- Componente: MessageBox ---
const MessageBox = ({ message, type, onClear }) => {
  if (!message) return null;
  useEffect(() => {
    const timer = setTimeout(onClear, 3000);
    return () => clearTimeout(timer);
  }, [message, onClear]);
  const bgColor = type === 'error' ? 'bg-red-600' : 'bg-blue-600';
  return <div className={`fixed bottom-5 right-5 ${bgColor} text-white p-4 rounded-lg shadow-lg z-50`}>{message}</div>;
};

// --- Componente: Tarjeta de Canción ---
// ***(ACTUALIZADO con onPlay)***
const SongCard = ({ song, isLiked, onLike, onPlay }) => (
  <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden w-48 flex-shrink-0 relative group">
    <img 
      src={`https://placehold.co/300x300/1F2937/FFFFFF?text=${encodeURIComponent(song.title)}`} 
      alt={song.title} 
      className="w-full h-40 object-cover"
    />
    {/* *NUEVO* Botón de Play (aparece al hacer hover) */}
    <button
      onClick={() => onPlay(song)}
      className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center
                 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-green-400"
      title={`Reproducir ${song.title}`}
    >
      <PlayIcon className="w-6 h-6 ml-1" />
    </button>
    
    <div className="p-4">
      <h3 className="text-lg font-semibold text-white truncate">{song.title}</h3>
      <p className="text-sm text-gray-400 truncate">{song.artist.join(', ')}</p>
      <p className="text-xs text-gray-500 uppercase">{song.genres[0] || 'N/A'}</p>
    </div>
    
    <button
      onClick={() => onLike(song._id)}
      disabled={isLiked}
      className={`absolute top-2 right-2 p-1.5 rounded-full ${isLiked ? 'text-red-500 bg-gray-700' : 'text-gray-300 bg-black bg-opacity-30 hover:text-red-400'}`}
      title={`Like ${song.title}`}
    >
      <HeartIcon isLiked={isLiked} className="w-5 h-5" />
    </button>
  </div>
);

// --- Componente: Carrusel de Canciones ---
// ***(ACTUALIZADO con onPlay)***
const SongCarousel = ({ title, songs, myLikes, onLike, onPlay }) => (
  <div className="mb-12">
    <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>
    <div className="flex space-x-6 overflow-x-auto pb-4">
      {songs.length === 0 ? (
        <p className="text-gray-500">No hay canciones que mostrar en esta categoría.</p>
      ) : (
        songs.map(song => (
          <SongCard
            key={song._id}
            song={song}
            isLiked={myLikes.has(song._id)}
            onLike={onLike}
            onPlay={onPlay}
          />
        ))
      )}
    </div>
  </div>
);

// --- Componente: Navbar ---
// ***(ACTUALIZADO con botón de Historial)***
const Navbar = ({ user, onSearch, onLogout, onSetPage, currentPage }) => (
  <nav className="bg-gray-800 shadow-md sticky top-0 z-40 px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16 max-w-7xl mx-auto">
      <span className="text-2xl font-bold text-white">MusicRecs (MVC)</span>
      
      {/* Solo mostrar buscador en la página Home */}
      {currentPage === 'home' && (
        <div className="flex-1 px-4 flex justify-center lg:justify-center">
          <div className="w-full max-w-lg">
            <label htmlFor="search" className="sr-only">Buscar</label>
            <div className="relative text-gray-400 focus-within:text-gray-200">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
              <input
                id="search-input"
                name="search"
                onChange={(e) => onSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:bg-gray-600 focus:border-gray-500 focus:ring-0 sm:text-sm"
                placeholder="Buscar por artista, género, tag..."
                type="search"
              />
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center space-x-4">
        <span className="text-gray-300 text-sm hidden md:block truncate max-w-xs">
          Hola, {user.name}
        </span>
        
        {/* Botones de Navegación */}
        <button 
          onClick={() => onSetPage('home')} 
          className={`p-2 rounded-full ${currentPage === 'home' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
          title="Home"
        >
          <HomeIcon />
        </button>
        {/* *NUEVO* Botón de Historial */}
        <button 
          onClick={() => onSetPage('history')} 
          className={`p-2 rounded-full ${currentPage === 'history' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
          title="Mi Historial"
        >
          <HistoryIcon />
        </button>
        <button 
          onClick={() => onSetPage('profile')} 
          className={`p-2 rounded-full ${currentPage === 'profile' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
          title="Mi Perfil"
        >
          <UserIcon />
        </button>
        
        <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium">Salir</button>
      </div>
    </div>
  </nav>
);

// --- Componente: Página de Autenticación (Login/Register) ---
const AuthPage = ({ onLoginSuccess, setAppMessage }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Campo 'name' para registrarse
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAppMessage(null);
    try {
      let url, payload;
      if (isLogin) {
        url = '/auth/login';
        payload = { username, password };
      } else {
        url = '/auth/register';
        payload = { username, password, name };
      }
      
      const { data } = await api.post(url, payload);
      onLoginSuccess(data.token, data.user); // Pasa el token y el usuario al componente App
      setAppMessage({ text: isLogin ? '¡Bienvenido!' : '¡Cuenta creada!', type: 'success' });
    } catch (err) {
      setAppMessage({ text: err.response?.data?.message || 'Error de conexión', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-full flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-xl">
        <div className="flex border-b border-gray-700">
          <button onClick={() => setIsLogin(true)} className={`w-1/2 py-4 text-center font-medium ${isLogin ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500'}`}>Iniciar Sesión</button>
          <button onClick={() => setIsLogin(false)} className={`w-1/2 py-4 text-center font-medium ${!isLogin ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500'}`}>Registrarse</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-2xl font-bold text-center text-white">{isLogin ? 'Bienvenido' : 'Crear Cuenta'}</h2>
          
          {!isLogin && ( // Solo mostrar campo 'name' si es registro
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-400">Nombre (Name)</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required={!isLogin} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
          )}
          
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-400">Username</label>
            <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-400">Contraseña</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <button type="submit" disabled={loading} className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isLogin ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50`}>
            {loading ? 'Cargando...' : (isLogin ? 'Entrar' : 'Registrarse')}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Componente: Página Principal (Home) ---
// ***(ACTUALIZADO: recibe myLikes, onLike, onPlay como props)***
const HomePage = ({ user, setAppMessage, onLogout, initialSearchTerm = '', myLikes, onLike, onPlay }) => {
  const [allSongs, setAllSongs] = useState([]);
  const [recs, setRecs] = useState({
    content: [],
    user: [],
    popular: [],
    profile: [],
    friends: []
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [loading, setLoading] = useState(true);

  // Carga inicial de datos
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Ya no pedimos 'myLikes', se recibe como prop
      const [allSongsRes, contentRes, userRes, popularRes, profileRes, friendsRes] = await Promise.all([
        api.get('/songs'),
        api.get('/recs/content-based'),
        api.get('/recs/user-based'),
        api.get('/recs/popular'),
        api.get('/recs/profile-based'),
        api.get('/recs/friend-based')
      ]);
      setAllSongs(allSongsRes.data);
      setRecs({
        content: contentRes.data,
        user: userRes.data,
        popular: popularRes.data,
        profile: profileRes.data,
        friends: friendsRes.data
      });
    } catch (err) {
      setAppMessage({ text: 'Error al cargar recomendaciones', type: 'error' });
      if (err.response && err.response.status === 401) {
        onLogout();
      }
    }
    setLoading(false);
  }, [setAppMessage, onLogout]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Manejador de Búsqueda
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const { data } = await api.get(`/songs/search?q=${searchTerm}`);
        setSearchResults(data);
      } catch (err) {
        setAppMessage({ text: 'Error en la búsqueda', type: 'error' });
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, setAppMessage]);
  
  if (loading) {
     return <div className="text-center text-gray-400 pt-20">Cargando recomendaciones...</div>
  }

  // Refrescamos los carruseles si se da 'like' desde esta página
  const handleLikeAndRefresh = async (songId) => {
    await onLike(songId);
    fetchData(); // Refresca los carruseles de recs
  };

  return (
    <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {searchResults.length > 0 ? (
        <SongCarousel title={`Resultados para "${searchTerm}"`} songs={searchResults} myLikes={myLikes} onLike={handleLikeAndRefresh} onPlay={onPlay} />
      ) : (
        <>
          <SongCarousel title="Actividad de Amigos" songs={recs.friends} myLikes={myLikes} onLike={handleLikeAndRefresh} onPlay={onPlay} />
          <SongCarousel title="Basado en tu Perfil" songs={recs.profile} myLikes={myLikes} onLike={handleLikeAndRefresh} onPlay={onPlay} />
          <SongCarousel title="Porque te gusta..." songs={recs.content} myLikes={myLikes} onLike={handleLikeAndRefresh} onPlay={onPlay} />
          <SongCarousel title="Usuarios como tú también escucharon..." songs={recs.user} myLikes={myLikes} onLike={handleLikeAndRefresh} onPlay={onPlay} />
          <SongCarousel title="Más Populares" songs={recs.popular} myLikes={myLikes} onLike={handleLikeAndRefresh} onPlay={onPlay} />
          <SongCarousel title="Todas las Canciones" songs={allSongs} myLikes={myLikes} onLike={handleLikeAndRefresh} onPlay={onPlay} />
        </>
      )}
    </main>
  );
};

// --- Componente: Página de Perfil ---
const ProfilePage = ({ user, setAppMessage }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para las listas de datos
  const [allData, setAllData] = useState({ artists: [], genres: [], users: [] });
  
  // Estados para los formularios
  const [name, setName] = useState('');
  const [friendUsername, setFriendUsername] = useState('');
  
  // Estados para las selecciones (Usamos Sets para eficiencia)
  const [selectedArtists, setSelectedArtists] = useState(new Set());
  const [selectedGenres, setSelectedGenres] = useState(new Set());

  // Cargar datos del perfil y listas de selección
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Pedimos todos los datos en paralelo
      const [profileRes, artistsRes, genresRes, usersRes] = await Promise.all([
        api.get('/me/profile'),
        api.get('/data/all-artists'),
        api.get('/data/all-genres'),
        api.get('/data/all-users')
      ]);

      // 1. Poblar datos del perfil
      setProfile(profileRes.data);
      setName(profileRes.data.name);
      
      // 2. Poblar los Sets de selección con los datos del usuario
      setSelectedArtists(new Set(profileRes.data.favoriteArtists));
      setSelectedGenres(new Set(profileRes.data.favoriteGenres));
      
      // 3. Poblar las listas de datos para los selectores
      setAllData({
        artists: artistsRes.data,
        genres: genresRes.data,
        users: usersRes.data // El backend ya filtra al usuario actual
      });
      
    } catch (err) {
      setAppMessage({ text: 'Error al cargar el perfil', type: 'error' });
    }
    setLoading(false);
  }, [setAppMessage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Manejador para guardar perfil (nombre, artistas, generos)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    // Convertir los Sets de vuelta a arrays para enviar
    const favoriteArtists = [...selectedArtists];
    const favoriteGenres = [...selectedGenres];
    
    try {
      await api.put('/me/profile', { name, favoriteArtists, favoriteGenres });
      setAppMessage({ text: '¡Perfil actualizado!', type: 'success' });
      fetchData(); // Refrescar
    } catch (err) {
      setAppMessage({ text: err.response?.data?.message || 'Error al actualizar', type: 'error' });
    }
  };
  
  // Manejador para añadir amigo
  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!friendUsername) {
      setAppMessage({ text: 'Por favor, selecciona un usuario', type: 'error' });
      return;
    }
    try {
      await api.post('/me/friends', { friendUsername });
      setAppMessage({ text: `¡Amigo ${friendUsername} añadido!`, type: 'success' });
      setFriendUsername('');
      fetchData(); // Refrescar para ver amigo en la lista
    } catch (err) {
      setAppMessage({ text: err.response?.data?.message || 'Error al añadir amigo', type: 'error' });
    }
  };
  
  // Manejadores para los checkboxes
  const handleArtistToggle = (artist) => {
    setSelectedArtists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(artist)) newSet.delete(artist);
      else newSet.add(artist);
      return newSet;
    });
  };
  
  const handleGenreToggle = (genre) => {
    setSelectedGenres(prev => {
      const newSet = new Set(prev);
      if (newSet.has(genre)) newSet.delete(genre);
      else newSet.add(genre);
      return newSet;
    });
  };
  
  if (loading) {
    return <div className="text-center text-gray-400 pt-20">Cargando perfil...</div>
  }
  
  if (!profile) return null;

  return (
    <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-white mb-8">Mi Perfil</h1>
      
      {/* Formulario de Actualizar Perfil */}
      <form onSubmit={handleUpdateProfile} className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Actualizar Información</h2>
        <div className="space-y-4">
          
          {/* Campo de Nombre */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">Nombre</label>
            <input 
              type="text" id="name" value={name} onChange={e => setName(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md text-white shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
            />
          </div>
          
          {/* Campo de Artistas (Checkboxes) */}
          <div>
            <label htmlFor="artists" className="block text-sm font-medium text-gray-300">Artistas Favoritos</label>
            <div className="mt-1 max-h-48 overflow-y-auto rounded-md bg-gray-700 p-3 border border-gray-600 space-y-2">
              {allData.artists.length > 0 ? allData.artists.map(artist => (
                <div key={artist} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`artist-${artist}`}
                    checked={selectedArtists.has(artist)}
                    onChange={() => handleArtistToggle(artist)}
                    className="h-4 w-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor={`artist-${artist}`} className="ml-2 block text-sm text-gray-300">{artist}</label>
                </div>
              )) : <p className="text-sm text-gray-400">No hay artistas en la base de datos.</p>}
            </div>
          </div>
          
          {/* Campo de Géneros (Checkboxes) */}
          <div>
            <label htmlFor="genres" className="block text-sm font-medium text-gray-300">Géneros Favoritos</label>
             <div className="mt-1 max-h-48 overflow-y-auto rounded-md bg-gray-700 p-3 border border-gray-600 space-y-2">
              {allData.genres.length > 0 ? allData.genres.map(genre => (
                <div key={genre} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`genre-${genre}`}
                    checked={selectedGenres.has(genre)}
                    onChange={() => handleGenreToggle(genre)}
                    className="h-4 w-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor={`genre-${genre}`} className="ml-2 block text-sm text-gray-300 capitalize">{genre}</label>
                </div>
              )) : <p className="text-sm text-gray-400">No hay géneros en la base de datos.</p>}
            </div>
          </div>

        </div>
        <div className="mt-6">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            Guardar Cambios
          </button>
        </div>
      </form>
      
      {/* Formulario de Añadir Amigos (Dropdown) */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Amigos</h2>
        <form onSubmit={handleAddFriend} className="flex space-x-4 mb-4">
          <div className="flex-1">
            <label htmlFor="friendUsername" className="sr-only">Seleccionar usuario</label>
            <select 
              id="friendUsername" 
              value={friendUsername} 
              onChange={e => setFriendUsername(e.target.value)}
              className="block w-full bg-gray-700 border border-gray-600 rounded-md text-white shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Selecciona un usuario para añadir...</option>
              {allData.users.map(u => (
                <option key={u._id} value={u.username}>{u.username}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            Añadir
          </button>
        </form>
        
        {/* Lista de Amigos */}
        <div>
          <h3 className="text-lg font-medium text-gray-300">Tu lista de amigos:</h3>
          {profile.friends.length === 0 ? (
            <p className="text-gray-500 mt-2">Aún no tienes amigos.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {profile.friends.map(friend => (
                <li key={friend} className="bg-gray-700 p-3 rounded-md text-white">{friend}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
};

// --- *NUEVO* Componente: Página de Historial ---
const HistoryPage = ({ myLikes, onLike, onPlay, setAppMessage, onLogout }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar historial de reproducción
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/me/history');
      setHistory(data);
    } catch (err) {
      setAppMessage({ text: 'Error al cargar el historial', type: 'error' });
      if (err.response && err.response.status === 401) {
        onLogout(); // Token expirado
      }
    }
    setLoading(false);
  }, [setAppMessage, onLogout]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (loading) {
    return <div className="text-center text-gray-400 pt-20">Cargando historial...</div>;
  }

  return (
    <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-white mb-8">Mi Historial de Reproducción</h1>
      <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
        {history.length === 0 ? (
          <p className="text-gray-500">Aún no has reproducido ninguna canción.</p>
        ) : (
          // Usamos un grid layout para el historial
          history.map(song => (
            <SongCard
              key={song._id}
              song={song}
              isLiked={myLikes.has(song._id)}
              onLike={onLike}
              onPlay={onPlay}
            />
          ))
        )}
      </div>
    </main>
  );
};


// --- Componente Principal: App ---
// ***(ACTUALIZADO: Estado de 'likes' y manejadores elevados)***
export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [loading, setLoading] = useState(true); // Empezar en true para validar token
  const [message, setMessage] = useState(null);
  const [page, setPage] = useState('home'); // 'home', 'profile', 'history'
  
  // Estado de 'Likes' elevado para compartir entre páginas
  const [myLikes, setMyLikes] = useState(new Set());

  const currentUser = useMemo(() => user, [user]);

  // Función para obtener los 'likes' del usuario
  const fetchMyLikes = useCallback(async () => {
    if (!token) return; // No hacer nada si no hay token
    try {
      const { data } = await api.get('/me/likes');
      setMyLikes(new Set(data.map(song => song._id)));
    } catch (err) {
      console.error("Error al cargar 'likes'", err);
      if (err.response && err.response.status === 401) {
        handleLogout(); // Token inválido
      }
    }
  }, [token]);

  // Validar token y cargar 'likes' al iniciar
  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        try {
          // Validar el token pidiendo el perfil
          await api.get('/me/profile');
          // Si tiene éxito, cargar los 'likes'
          await fetchMyLikes();
        } catch (err) {
          // Token inválido o expirado
          handleLogout();
        }
      }
      setLoading(false);
    };
    validateToken();
  }, [token, fetchMyLikes]); // Depende de fetchMyLikes

  // Manejador de Login
  const handleLogin = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setPage('home');
    fetchMyLikes(); // Cargar 'likes' después de iniciar sesión
  };

  // Manejador de Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setPage('home'); // Volver a la página de login (que se mostrará por no haber token)
    setMyLikes(new Set()); // Limpiar 'likes'
    setAppMessage({ text: 'Has cerrado sesión.', type: 'success' });
  };
  
  const setAppMessage = (msg) => setMessage(msg);
  const clearMessage = () => setMessage(null);
  
  // --- Manejadores de Interacción (Elevados) ---
  
  // Manejador de "Like"
  const handleLike = useCallback(async (songId) => {
    if (myLikes.has(songId)) return;
    
    // Optimistic UI: Actualizar Set de 'likes' inmediatamente
    const newLikes = new Set(myLikes).add(songId);
    setMyLikes(newLikes);
    
    try {
      await api.post(`/songs/${songId}/interact`, { action: 'like' });
      // No necesitamos refrescar todos los carruseles, solo el estado de 'likes'
      // La UI se actualizará reactivamente
    } catch (err) {
      setAppMessage({ text: 'Error al dar like', type: 'error' });
      // Revertir si falla
      setMyLikes(prev => {
        const newSet = new Set(prev);
        newSet.delete(songId);
        return newSet;
      });
    }
  }, [myLikes, setAppMessage]);
  
  // *NUEVO* Manejador de "Play"
  const handlePlay = useCallback(async (song) => {
    try {
      // Registrar la interacción 'play'
      await api.post(`/songs/${song._id}/interact`, { action: 'play' });
      // Mostrar mensaje (simulando reproducción)
      setAppMessage({ text: `Reproduciendo: ${song.title}`, type: 'success' });
    } catch (err) {
      setAppMessage({ text: 'Error al reproducir', type: 'error' });
    }
  }, [setAppMessage]);
  

  // --- Renderizado ---
  
  if (loading) return <Loader />;

  // Manejador de Búsqueda
  const handleSearch = (term) => {
    setPage({ name: 'home', searchTerm: term });
  };
  
  // Renderizado condicional de la página
  let currentPageComponent;
  const pageName = typeof page === 'object' ? page.name : page;
  
  switch(pageName) {
    case 'home':
      currentPageComponent = (
        <HomePage 
          user={currentUser} 
          onLogout={handleLogout} 
          setAppMessage={setAppMessage} 
          key={page.searchTerm || 'home'} // Forzar re-render si searchTerm cambia
          initialSearchTerm={page.searchTerm}
          // Pasamos estado y manejadores
          myLikes={myLikes}
          onLike={handleLike}
          onPlay={handlePlay}
        />
      );
      break;
    case 'profile':
      currentPageComponent = (
        <ProfilePage 
          user={currentUser} 
          setAppMessage={setAppMessage} 
        />
      );
      break;
    // *NUEVO* Caso para Historial
    case 'history':
      currentPageComponent = (
        <HistoryPage 
          user={currentUser} 
          onLogout={handleLogout} 
          setAppMessage={setAppMessage}
          // Pasamos estado y manejadores
          myLikes={myLikes}
          onLike={handleLike}
          onPlay={handlePlay}
        />
      );
      break;
    default:
      setPage('home'); // Resetea a 'home' si el estado es inválido
      currentPageComponent = <HomePage user={currentUser} onLogout={handleLogout} setAppMessage={setAppMessage} initialSearchTerm="" myLikes={myLikes} onLike={handleLike} onPlay={handlePlay} />;
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }} className="h-full">
      <MessageBox message={message?.text} type={message?.type} onClear={clearMessage} />
      
      {!token || !currentUser ? (
        <AuthPage onLoginSuccess={handleLogin} setAppMessage={setAppMessage} />
      ) : (
        <div className="min-h-full flex flex-col">
          <Navbar 
            user={currentUser} 
            onLogout={handleLogout} 
            onSetPage={setPage}
            currentPage={pageName}
            onSearch={handleSearch} 
          />
          {currentPageComponent}
        </div>
      )}
    </div>
  );
}
