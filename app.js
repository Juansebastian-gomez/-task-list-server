const http = require ("http");
const port = 3000;

const listaDeTareas = [
    {id: 1, tarea: 'estudiar', completada: false},
    {id: 2, tarea: 'ir al gimnasio', completeda: false},
    {id: 3, tarea: 'dormir', completada: false},
];

const server = http.createServer((req,res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'GET' && req.url === '/tareas'){
        res.end(JSON.stringify(listaDeTareas));
    }else{
        res.statusCode=404;
        res.end('Ruta no encontrada');
    }
});

server.listen(3000, () => {
    console.log('servidor escuchando en el puerto 3000')
});