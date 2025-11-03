import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// --- CONFIGURACIÓN INICIAL ---
dotenv.config({ path: '../.env' }); // Asegúrate de que lea el .env de la raíz
const app = express();
app.use(cors()); // Permite que React se conecte
app.use(express.json()); // Permite leer JSON

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

// --- CONEXIÓN A MONGODB ATLAS ---
mongoose.connect(MONGO_URI)
    .then(() => console.log("Conectado a MongoDB Atlas"))
    .catch((err) => console.error("Error al conectar a MongoDB:", err));

// --- 1. MODELOS (El "Model" de MVC - Basado en tus imágenes) ---

// Modelo de Usuario (Basado en COLECCION USUARIOS)
const usuarioSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true }, // Almacenará el hash
    name: { type: String, required: true },
    favoriteArtists: { type: [String], default: [] },
    favoriteGenres: { type: [String], default: [] },
    friends: { type: [String], default: [] } // Lista de usernames
});
// Forzamos a Mongoose a usar tu nombre de colección exacto: 'usuarios'
const Usuario = mongoose.model('Usuario', usuarioSchema, 'usuarios');

// Modelo de Canción (Basado en COLECCION CANCIONES)
const cancionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    artist: { type: [String], required: true },
    album: { type: String, default: null },
    genres: { type: [String], default: [] },
    year: { type: Number },
    tags: { type: [String], default: [] }
});
// Índice de texto para el buscador (basado en tus campos)
cancionSchema.index({ 
    title: 'text', 
    artist: 'text', 
    genres: 'text',
    tags: 'text' 
});
// Forzamos a Mongoose a usar tu nombre de colección exacto: 'canciones'
const Cancion = mongoose.model('Cancion', cancionSchema, 'canciones');

// Modelo de Interacción (Basado en COLECCION INTERACCIONES)
const interaccionSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true }, // Username del usuario
    songId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cancion', required: true },
    action: { type: String, enum: ['play', 'like', 'skip'], required: true },
    ts: { type: Date, default: Date.now }
});
// Índice para optimizar búsquedas por usuario
interaccionSchema.index({ userId: 1, songId: 1, action: 1 });
// Forzamos a Mongoose a usar tu nombre de colección exacto: 'interacciones'
const Interaccion = mongoose.model('Interaccion', interaccionSchema, 'interacciones');


// --- MIDDLEWARE DE AUTENTICACIÓN ---
// Verifica el token JWT en rutas protegidas
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token, autorización denegada' });
    }
    
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id; // Este es el _id de MongoDB
        req.username = decoded.username; // Este es el username
        next();
    } catch (e) {
        res.status(401).json({ message: 'Token no es válido' });
    }
};

// --- 2. CONTROLADORES (El "Controller" de MVC) ---

// --- Controlador de Autenticación ---
const authController = {
    register: async (req, res) => {
        try {
            const { username, password, name } = req.body;
            if (!username || !password || !name) {
                return res.status(400).json({ message: 'Username, password y name son requeridos' });
            }
            let user = await Usuario.findOne({ username });
            if (user) {
                return res.status(400).json({ message: 'El username ya existe' });
            }

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            
            user = new Usuario({ 
                username, 
                password: passwordHash, // Guardamos el hash en el campo 'password'
                name 
            });
            await user.save();

            // Creamos el token con el _id y el username
            const token = jwt.sign(
                { id: user._id, username: user.username }, 
                JWT_SECRET, 
                { expiresIn: '3h' }
            );
            res.status(201).json({ token, user: { id: user._id, username: user.username, name: user.name } });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },
    login: async (req, res) => {
        try {
            const { username, password } = req.body;
            const user = await Usuario.findOne({ username });
            if (!user) {
                return res.status(400).json({ message: 'Credenciales inválidas (usuario)' });
            }

            // Comparamos el hash guardado en 'password'
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Credenciales inválidas (pass)' });
            }
            
            const token = jwt.sign(
                { id: user._id, username: user.username }, 
                JWT_SECRET, 
                { expiresIn: '3h' }
            );
            res.status(200).json({ token, user: { id: user._id, username: user.username, name: user.name } });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },
    // Función para poblar datos (opcional, ejecutar una vez)
    // ¡CUIDADO! Esto borra las canciones existentes.
    populateSongs: async (req, res) => {
        try {
            await Cancion.deleteMany({}); // Limpiar
            const sampleSongs = [
              { title: 'Bohemian Rhapsody', artist: ['Queen'], genres: ['Rock'], year: 1975, tags: ['Classic Rock', 'Epic'] },
              { title: 'Shape of You', artist: ['Ed Sheeran'], genres: ['Pop'], year: 2017, tags: ['Upbeat', 'Dance'] },
              { title: 'Smells Like Teen Spirit', artist: ['Nirvana'], genres: ['Grunge', 'Rock'], year: 1991, tags: ['90s', 'Alternative'] },
              { title: 'Blinding Lights', artist: ['The Weeknd'], genres: ['Synth-pop', 'Pop'], year: 2019, tags: ['80s Vibe', 'Driving'] },
              { title: 'Hotel California', artist: ['Eagles'], genres: ['Rock'], year: 1976, tags: ['Classic Rock', 'Guitar Solo'] },
              { title: 'bad guy', artist: ['Billie Eilish'], genres: ['Pop', 'Electronic'], year: 2019, tags: ['Dark', 'Minimal'] },
              { title: 'Lose Yourself', artist: ['Eminem'], genres: ['Hip Hop'], year: 2002, tags: ['Inspirational', 'Workout'] },
              { title: 'Uptown Funk', artist: ['Mark Ronson', 'Bruno Mars'], genres: ['Funk', 'Pop'], year: 2014, tags: ['Party', 'Feel Good'] },
              { title: 'Despacito', artist: ['Luis Fonsi', 'Daddy Yankee'], genres: ['Reggaeton', 'Latin Pop'], year: 2017, tags: ['Summer', 'Dance'] },
              { title: 'Get Lucky', artist: ['Daft Punk', 'Pharrell Williams'], genres: ['Funk', 'Disco'], year: 2013, tags: ['Groovy', 'Retro'] },
            ];
            await Cancion.insertMany(sampleSongs);
            res.status(201).json({ message: "Datos de canciones cargados" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
};

// --- Controlador de Usuario/Perfil ---
const userController = {
    // Obtener mi perfil
    getMe: async (req, res) => {
        try {
            const user = await Usuario.findOne({ username: req.username }).select('-password'); // No enviar el hash
            if (!user) {
                return res.status(404).json({ message: "Usuario no encontrado" });
            }
            res.json(user);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },
    
    // Actualizar mi perfil (nombre, artistas/géneros fav)
    updateProfile: async (req, res) => {
        try {
            const { name, favoriteArtists, favoriteGenres } = req.body;
            const updatedUser = await Usuario.findOneAndUpdate(
                { username: req.username },
                { $set: { name, favoriteArtists, favoriteGenres } },
                { new: true, runValidators: true } // 'new: true' devuelve el doc actualizado
            ).select('-password');
            
            res.json(updatedUser);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },
    
    // Añadir un amigo
    addFriend: async (req, res) => {
        try {
            const { friendUsername } = req.body;
            if (friendUsername === req.username) {
                return res.status(400).json({ message: "No puedes agregarte a ti mismo" });
            }
            
            const friend = await Usuario.findOne({ username: friendUsername });
            if (!friend) {
                return res.status(404).json({ message: "Usuario amigo no encontrado" });
            }
            
            // Añadir amigo a mi lista
            await Usuario.updateOne(
                { username: req.username },
                { $addToSet: { friends: friendUsername } } // $addToSet evita duplicados
            );
            // Opcional: Añadirme a la lista del amigo (amistad bidireccional)
            await Usuario.updateOne(
                { username: friendUsername },
                { $addToSet: { friends: req.username } }
            );
            
            res.status(200).json({ message: `¡${friendUsername} ha sido añadido como amigo!` });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
};

// --- Controlador de Datos (para listas de selección) ---
const dataController = {
    // Obtener lista única de todos los artistas
    getAllArtists: async (req, res) => {
        try {
            const artists = await Cancion.distinct("artist");
            res.json(artists.sort());
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },
    // Obtener lista única de todos los géneros
    getAllGenres: async (req, res) => {
        try {
            const genres = await Cancion.distinct("genres");
            res.json(genres.sort());
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },
    // Obtener lista de todos los usuarios (usernames)
    getAllUsers: async (req, res) => {
        try {
            // Devolvemos username y _id, filtramos al usuario actual
            const users = await Usuario.find({ username: { $ne: req.username } }).select('username');
            res.json(users);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
};

// --- Controlador de Canciones y Recomendaciones ---
const recsController = {
    // Obtener todas las canciones (para un carrusel)
    getAllSongs: async (req, res) => {
        try {
            const songs = await Cancion.find().limit(20);
            res.json(songs);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },
    // Buscar canciones
    searchSongs: async (req, res) => {
        try {
            const searchTerm = req.query.q;
            if (!searchTerm) {
                return res.status(400).json({ message: "Término de búsqueda requerido" });
            }
            const songs = await Cancion.find(
                { $text: { $search: searchTerm } },
                { score: { $meta: "textScore" } }
            ).sort({ score: { $meta: "textScore" } }).limit(20);
            res.json(songs);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },
    
    // Registrar una interacción (like, play, skip)
    postInteraction: async (req, res) => {
        try {
            const songId = req.params.id;
            const username = req.username; // Obtenido del token
            const { action } = req.body; // 'play', 'like', 'skip'

            if (!action || !['play', 'like', 'skip'].includes(action)) {
                return res.status(400).json({ message: "Acción no válida" });
            }

            // Evitar duplicados de 'like'
            if (action === 'like') {
                const existingLike = await Interaccion.findOne({ userId: username, songId, action: 'like' });
                if (existingLike) {
                    return res.status(400).json({ message: "Ya te gusta esta canción" });
                }
            }
            
            // Si es 'play', no necesitamos evitar duplicados, solo registrar
            const newInteraction = new Interaccion({ 
                userId: username, 
                songId, 
                action 
            });
            await newInteraction.save();
            res.status(201).json(newInteraction);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },

    // Obtener mis "likes"
    getMyLikes: async (req, res) => {
        try {
            // Buscamos interacciones "like" del usuario
            const myLikes = await Interaccion.find({ 
                userId: req.username, 
                action: 'like' 
            }).populate('songId'); // .populate() trae la info de la canción
            
            res.json(myLikes.map(interaction => interaction.songId)); // Devolver solo las canciones
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },

    // --- *NUEVO* Obtener mi historial de reproducción ---
    getMyHistory: async (req, res) => {
        try {
            const myHistory = await Interaccion.find({
                userId: req.username,
                action: 'play'
            })
            .sort({ ts: -1 }) // Más recientes primero
            .populate('songId')
            .limit(50); // Límite de 50
            
            // Evitar duplicados en el historial (solo mostrar la última vez que se tocó)
            const uniqueHistory = [...new Map(myHistory.map(item => [item.songId._id.toString(), item.songId])).values()];
            
            res.json(uniqueHistory);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },
    
    // --- Algoritmos de Recomendación ---

    // Carrusel 1: Basado en Contenido ("Porque te gusta...")

getContentBasedRecs: async (req, res) => {
    try {
        // 1. Encontrar canciones que me han gustado ('like')
        const myLikes = await Interaccion.find({ 
            userId: req.username, 
            action: 'like' 
        }).populate('songId');
        
        if (myLikes.length === 0) {
            // Si no hay likes, devolvemos una lista de populares o vacía.
            // Para el examen, lo dejamos vacío para no confundir.
            return res.json([]); 
        }
        
        const myLikedSongIds = myLikes.map(like => like.songId._id);
        
        // 2. Obtener los "rasgos" de las canciones que me gustan
        // Aplanar todos los arrays de géneros y tags en listas únicas
        const likedGenres = [...new Set(myLikes.flatMap(like => like.songId.genres))];
        const likedTags = [...new Set(myLikes.flatMap(like => like.songId.tags))];
        
        // 3. Usar Aggregation para priorizar, puntuar y diversificar
        const recs = await Cancion.aggregate([
            // a. Filtrar canciones que no me gusten ya (la clave para no repetir)
            { $match: { _id: { $nin: myLikedSongIds } } },
            
            // b. Asignar un "Score" a cada canción por coincidencia de atributos
            { $addFields: {
                // Puntuación por Género
                genreMatchScore: { $size: { $setIntersection: ["$genres", likedGenres] } }, 
                // Puntuación por Tag
                tagMatchScore: { $size: { $setIntersection: ["$tags", likedTags] } }
            }},
            
            // c. Calcular el Score Total (Aseguramos que haya algo de match)
            { $addFields: {
                totalScore: { $add: ["$genreMatchScore", "$tagMatchScore"] }
            }},
            
            // d. Solo considerar canciones con match (> 0)
            { $match: { totalScore: { $gt: 0 } } },
            
            // e. Ordenar por Score (más relevante)
            { $sort: { totalScore: -1 } },
            
            // f. Tomar 40 candidatas y luego 20 al azar para diversidad
            { $limit: 40 }, 
            { $sample: { size: 20 } } 
        ]);
        
        res.json(recs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
},

    // Carrusel 2: Basado en Usuarios ("Usuarios como tú...")
    getUserBasedRecs: async (req, res) => {
        try {
            // 1. Encontrar mis "likes"
            const myLikes = await Interaccion.find({ userId: req.username, action: 'like' });
            const myLikedSongIds = myLikes.map(l => l.songId);
            
            if (myLikedSongIds.length === 0) return res.json([]);

            // 2. Encontrar usuarios similares (que les gusten las mismas canciones)
            const similarUsers = await Interaccion.aggregate([
                { $match: { songId: { $in: myLikedSongIds }, action: 'like', userId: { $ne: req.username } } },
                { $group: { _id: "$userId", commonLikes: { $sum: 1 } } }, // Agrupar por userId (username)
                { $sort: { commonLikes: -1 } },
                { $limit: 10 } // Tomar los 10 usuarios más similares
            ]);

            const similarUsernames = similarUsers.map(u => u._id);
            if (similarUsernames.length === 0) return res.json([]);
            
            // 3. Obtener los "likes" de esos usuarios
            const recs = await Interaccion.find({ 
                userId: { $in: similarUsernames },
                action: 'like',
                songId: { $nin: myLikedSongIds } // Que no me gusten a mi
            })
            .populate('songId')
            .limit(20);

            // Evitar canciones duplicadas en las recomendaciones
            const uniqueRecs = [...new Map(recs.map(item => [item.songId._id.toString(), item.songId])).values()];
            
            res.json(uniqueRecs);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },
    
    // Carrusel 3: Populares ("Más 'likes'")
    getPopularRecs: async (req, res) => {
        try {
            const popular = await Interaccion.aggregate([
                { $match: { action: 'like' } }, // Contar solo "likes"
                { $group: { _id: "$songId", likeCount: { $sum: 1 } } },
                { $sort: { likeCount: -1 } },
                { $limit: 20 },
                // $lookup es el "JOIN" de Mongo
                { $lookup: { from: 'canciones', localField: '_id', foreignField: '_id', as: 'songDetails' } },
                { $unwind: "$songDetails" }, // Descomprimir el array de songDetails
                { $replaceRoot: { newRoot: "$songDetails" } } // Promover songDetails a la raíz
            ]);
            res.json(popular);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },
    
    // Carrusel 4: Basado en Perfil (Artistas/Géneros Favoritos)
    getProfileBasedRecs: async (req, res) => {
        try {
            // 1. Obtener mi perfil
            const user = await Usuario.findOne({ username: req.username });
            if (!user) return res.status(404).json([]);
            
            const { favoriteArtists, favoriteGenres } = user;
            if (favoriteArtists.length === 0 && favoriteGenres.length === 0) {
                return res.json([]);
            }

            // 2. Encontrar mis "likes" para no repetirlos
            const myLikes = await Interaccion.find({ userId: req.username, action: 'like' });
            const myLikedSongIds = myLikes.map(l => l.songId);
            
            // 3. Buscar canciones de esos artistas/géneros que no me gusten ya
            const recs = await Cancion.find({
                _id: { $nin: myLikedSongIds },
                $or: [
                    { artist: { $in: favoriteArtists } },
                    { genres: { $in: favoriteGenres } }
                ]
            }).limit(20);
            
            res.json(recs);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },
    
    // Carrusel 5: Actividad de Amigos
    getFriendBasedRecs: async (req, res) => {
        try {
            // 1. Obtener mi perfil y mi lista de amigos
            const user = await Usuario.findOne({ username: req.username });
            if (!user || user.friends.length === 0) {
                return res.json([]);
            }
            
            // 2. Encontrar mis "likes" para no repetirlos
            const myLikes = await Interaccion.find({ userId: req.username, action: 'like' });
            const myLikedSongIds = myLikes.map(l => l.songId);
            
            // 3. Obtener los "likes" de mis amigos
            const friendLikes = await Interaccion.find({
                userId: { $in: user.friends }, // Solo de mis amigos
                action: 'like',
                songId: { $nin: myLikedSongIds } // Que no me gusten a mi
            })
            .sort({ ts: -1 }) // Mostrar lo más reciente
            .populate('songId')
            .limit(30);
            
            // Evitar duplicados
            const uniqueRecs = [...new Map(friendLikes.map(item => [item.songId._id.toString(), item.songId])).values()];
            
            res.json(uniqueRecs.slice(0, 20));
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
};

// --- 3. RUTAS (La API) ---
// Rutas públicas (login/registro)
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/populate-songs', authController.populateSongs); // Ruta para cargar datos

// Rutas protegidas (requieren token)
app.use('/api', authMiddleware); // Todo lo que sigue requiere autenticación

// Rutas de Canciones e Interacciones
app.get('/api/songs', recsController.getAllSongs);
app.get('/api/songs/search', recsController.searchSongs);
app.post('/api/songs/:id/interact', recsController.postInteraction);
app.get('/api/me/likes', recsController.getMyLikes);
app.get('/api/me/history', recsController.getMyHistory); // *NUEVO*

// Rutas de Perfil y Amigos
app.get('/api/me/profile', userController.getMe);
app.put('/api/me/profile', userController.updateProfile);
app.post('/api/me/friends', userController.addFriend);

// Rutas de Recomendaciones
app.get('/api/recs/content-based', recsController.getContentBasedRecs);
app.get('/api/recs/user-based', recsController.getUserBasedRecs);
app.get('/api/recs/popular', recsController.getPopularRecs);
app.get('/api/recs/profile-based', recsController.getProfileBasedRecs);
app.get('/api/recs/friend-based', recsController.getFriendBasedRecs);

// Rutas de Datos (para listas de selección)
app.get('/api/data/all-artists', dataController.getAllArtists);
app.get('/api/data/all-genres', dataController.getAllGenres);
app.get('/api/data/all-users', dataController.getAllUsers);


// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
