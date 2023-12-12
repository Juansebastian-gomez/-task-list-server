const http = require("http");
const url = require("url");
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const port = 3000;

const listaDeTareas = [
    { id: 1, tarea: 'estudiar', completada: false },
    { id: 2, tarea: 'ir al gimnasio', completada: false },
    { id: 3, tarea: 'dormir', completada: false },
];
const usuarios = [
    { userName: 'usuario1', password: 'contraseña1' },
    { userName: 'usuario2', password: 'contraseña2' },
];

const secretKey = process.env.JWT_SECRET || 'clave_secreta';

const paramValidationMiddleware = (req, res, next) => {
    const parsedUrl = url.parse(req.url, true);

    // Validar parámetros 
    const taskId = parsedUrl.pathname.split('/').pop();
    if (isNaN(taskId) || taskId <= 0 || taskId > listaDeTareas.length) {
        res.statusCode = 400; // Bad Request
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Parámetro de tarea inválido' }));
    } else {
        req.params = { taskId: parseInt(taskId) };
        next();
    }
};

const methodValidationMiddleware = (req, res, next) => {
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE']; // Agrega métodos según tus necesidades

    if (!validMethods.includes(req.method)) {
        res.statusCode = 405; // Método no permitido
        res.setHeader('Allow', validMethods.join(', '));
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: `Método ${req.method} no permitido` }));
    } else {
        next();
    }
};

const errorHandlerMiddleware = (req, res, next) => {
    if (req.method === 'POST' && req.url === '/tareas') {
        if (req.headers['content-type'] !== 'application/json') {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'El cuerpo de la solicitud debe ser de tipo application/json' }));
        } else if (Object.keys(req.body).length === 0) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'El cuerpo de la solicitud no puede estar vacío' }));
        } else if (!req.body.tarea || typeof req.body.tarea !== 'string' || req.body.completada === undefined) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'La información proporcionada no es válida o algunos atributos faltan para crear la tarea' }));
        }
    } else if (req.method === 'PUT' && req.url.startsWith('/tareas/')) {
        if (req.headers['content-type'] !== 'application/json') {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'El cuerpo de la solicitud debe ser de tipo application/json' }));
        } else if (Object.keys(req.body).length === 0) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'El cuerpo de la solicitud no puede estar vacío' }));
        } else if (!req.body.tarea || typeof req.body.tarea !== 'string' || req.body.completada === undefined) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'La información proporcionada no es válida o algunos atributos faltan para actualizar la tarea' }));
        }
    }
    next();
};

const loginHandler = (req, res) => {
    if (req.method === 'POST' && req.url === '/login') {
        const userName = req.body.userName;
        const password = req.body.password;
        const usuario = usuarios.find(u => u.userName === userName && u.password === password);

        if (usuario) {
            // Creamos un token JWT
            const token = jwt.sign({ username: usuario.userName }, secretKey, { expiresIn: '1h' });

            // Enviamos el token como respuesta
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ token }));
        } else {
            res.statusCode = 401; // No autorizado
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Credenciales inválidas' }));
        }

    } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
    }
};

const verifyTokenMiddleware = (req, res, next) => {
    const authorizationHeader = req.headers['authorization'];
    if (authorizationHeader) {
        const token = authorizationHeader.split(' ')[1];
        jwt.verify(token, secretKey, (err, decoded) => {
            if (err) {
                res.statusCode = 401;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Token no válido' }));
            } else {
                req.user = decoded;
                next();
            }
        });
    } else {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Token no proporcionado' }));
    }
};

const protectedRouteHandler = (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Acceso permitido' }));
};

const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'POST' && req.url === '/login') {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });

        req.on('end', () => {
            try {
                req.body = JSON.parse(data);
                loginHandler(req, res);
            } catch (error) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Cuerpo de la solicitud no válido' }));
            }
        });
    } else if (req.method === 'GET' && req.url === '/ruta-protegida') {
        // Ruta protegida
        verifyTokenMiddleware(req, res, () => {
            protectedRouteHandler(req, res);
        });
    } else {
        paramValidationMiddleware(req, res, () => {
            methodValidationMiddleware(req, res, () => {
                errorHandlerMiddleware(req, res, () => {
                    if (req.method === 'GET' && req.url === '/tareas') {
                        res.end(JSON.stringify(listaDeTareas));
                    } else if (req.method === 'GET' && req.url === '/tareas/completadas') {
                        const tareasCompletadas = listaDeTareas.filter(t => t.completada);
                        res.end(JSON.stringify(tareasCompletadas));
                    } else if (req.method === 'GET' && req.url === '/tareas/incompletas') {
                        const tareasIncompletas = listaDeTareas.filter(t => !t.completada);
                        res.end(JSON.stringify(tareasIncompletas));
                    } else if (req.method === 'GET' && req.url.startsWith('/tareas/')) {
                        const taskId = req.params.taskId;
                        const tarea = listaDeTareas.find(t => t.id === taskId);

                        if (tarea) {
                            res.end(JSON.stringify(tarea));
                        } else {
                            res.statusCode = 404;
                            res.end(JSON.stringify({ error: 'Tarea no encontrada' }));
                        }
                    } else if (req.method === 'POST' && req.url === '/tareas') {
                        const newTask = req.body;
                        newTask.id = listaDeTareas.length + 1;
                        listaDeTareas.push(newTask);
                        res.statusCode = 201; // Created
                        res.end(JSON.stringify(newTask));
                    } else if (req.method === 'PUT' && req.url.startsWith('/tareas/')) {
                        const taskId = req.params.taskId;
                        const updatedTask = req.body;

                        const existingTaskIndex = listaDeTareas.findIndex(t => t.id === taskId);

                        if (existingTaskIndex !== -1) {
                            listaDeTareas[existingTaskIndex] = { ...listaDeTareas[existingTaskIndex], ...updatedTask };
                            res.statusCode = 200;
                            res.end(JSON.stringify(listaDeTareas[existingTaskIndex]));
                        } else {
                            res.statusCode = 404;
                            res.end(JSON.stringify({ error: 'Tarea no encontrada' }));
                        }
                    } else if (req.method === 'DELETE' && req.url.startsWith('/tareas/')) {
                        const taskId = req.params.taskId;
                        const existingTaskIndex = listaDeTareas.findIndex(t => t.id === taskId);

                        if (existingTaskIndex !== -1) {
                            const deletedTask = listaDeTareas.splice(existingTaskIndex, 1);
                            res.statusCode = 200;
                            res.end(JSON.stringify(deletedTask));
                        } else {
                            res.statusCode = 404;
                            res.end(JSON.stringify({ error: 'Tarea no encontrada' }));
                        }
                    } else {
                        res.statusCode = 404;
                        res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
                    }
                });
            });
        });
    }
});

server.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});
