const http = require ("http");
const url = require ("url");
const port = 3000;

const listaDeTareas = [
    {id: 1, tarea: 'estudiar', completada: false},
    {id: 2, tarea: 'ir al gimnasio', completeda: false},
    {id: 3, tarea: 'dormir', completada: false},
];

/*const server = http.createServer((req,res) => {
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
*/
const paramValidationMiddleware = (req, res, next) => {
    const parsedUrl = url.parse(req.url, true);
  
    // Validar parámetros 
    const taskId = parsedUrl.pathname.split('/').pop();
    if (isNaN(taskId) || taskId <= 0 || taskId > listaDeTareas.length) {
      res.statusCode = 400; // Bad Request
      res.end(`Error: Parámetro de tarea inválido`);
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
      res.end(`Error: Método ${req.method} no permitido`);
    } else {
      next();
    }
  };


const errorHandlerMiddleware = (req, res, next) => {
    if (req.method === 'POST' && req.url === '/tareas') {
      if (req.headers['content-type'] !== 'application/json') {
        res.statusCode = 400;
        res.end('Error: El cuerpo de la solicitud debe ser de tipo application/json');
      } else if (Object.keys(req.body).length === 0) {
        res.statusCode = 400;
        res.end('Error: El cuerpo de la solicitud no puede estar vacío');
      } else if (!req.body.tarea || typeof req.body.tarea !== 'string' || req.body.completada === undefined) {
        res.statusCode = 400;
        res.end('Error: La información proporcionada no es válida o algunos atributos faltan para crear la tarea');
      }
    } else if (req.method === 'PUT' && req.url.startsWith('/tareas/')) {
      if (req.headers['content-type'] !== 'application/json') {
        res.statusCode = 400;
        res.end('Error: El cuerpo de la solicitud debe ser de tipo application/json');
      } else if (Object.keys(req.body).length === 0) {
        res.statusCode = 400;
        res.end('Error: El cuerpo de la solicitud no puede estar vacío');
      } else if (!req.body.tarea || typeof req.body.tarea !== 'string' || req.body.completada === undefined) {
        res.statusCode = 400;
        res.end('Error: La información proporcionada no es válida o algunos atributos faltan para actualizar la tarea');
      }
    }
    next();
  };
  
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
  
    paramValidationMiddleware(req, res, () => {

      methodValidationMiddleware(req, res, () => {
        
        errorHandlerMiddleware(req, res, () => {
          if (req.method === 'GET' && req.url === '/tareas') {
            res.end(JSON.stringify(listaDeTareas));
          } else if (req.method === 'GET' && req.url.startsWith('/tareas/')) {
            const taskId = req.params.taskId;
            const tarea = listaDeTareas.find(t => t.id === taskId);
  
            if (tarea) {
              res.end(JSON.stringify(tarea));
            } else {
              res.statusCode = 404;
              res.end(`Error: Tarea no encontrada`);
            }
          } else {
            res.statusCode = 404;
            res.end('Ruta no encontrada');
          }
        });
      });
    });
  });
  
  server.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
  });
