const http = require("http");
const fs = require("fs");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;

const partidas = {};

function crearCodigo() {
    let codigo;

    do {
        codigo = Math.floor(
            100000 + Math.random() * 900000
        ).toString();
    } while (partidas[codigo]);

    return codigo;
}

function crearObjetivo() {
    return {
        x: Math.floor(Math.random() * 900) + 50,
        y: Math.floor(Math.random() * 500) + 100,
        radio: 30
    };
}

function crearPartida() {
    const codigo = crearCodigo();

    partidas[codigo] = {
        jugadores: {},
        objetivos: []
    };

    for (let i = 0; i < 10; i++) {
        partidas[codigo].objetivos.push(
            crearObjetivo()
        );
    }

    return codigo;
}

function enviarPartida(codigo) {
    const partida = partidas[codigo];

    if (!partida) return;

    const mensaje = JSON.stringify({
        tipo: "estado",
        jugadores: partida.jugadores,
        objetivos: partida.objetivos,
        partida: codigo
    });

    Object.values(partida.jugadores).forEach(jugador => {
        if (
            jugador.socket.readyState ===
            WebSocket.OPEN
        ) {
            jugador.socket.send(mensaje);
        }
    });
}

const servidor = http.createServer(
    (req, res) => {

        if (
            req.url === "/" ||
            req.url === "/index.html"
        ) {

            fs.readFile(
                "index.html",
                (error, datos) => {

                    if (error) {
                        res.writeHead(500);
                        res.end(
                            "Error al cargar index.html"
                        );
                        return;
                    }

                    res.writeHead(200, {
                        "Content-Type":
                            "text/html; charset=utf-8"
                    });

                    res.end(datos);
                }
            );

        } else {

            res.writeHead(404);
            res.end("No encontrado");
        }
    }
);

const wss =
    new WebSocket.Server({
        server: servidor
    });

wss.on("connection", socket => {

    const id =
        Math.random()
            .toString(36)
            .substring(2, 8);

    let partidaActual = null;

    console.log(
        "Jugador conectado:",
        id
    );

    socket.send(
        JSON.stringify({
            tipo: "conexion",
            id: id
        })
    );

    socket.on("message", mensaje => {

        try {

            const datos =
                JSON.parse(mensaje);

            // =========================
            // CREAR PARTIDA
            // =========================

            if (
                datos.tipo ===
                "crear_partida"
            ) {

                const codigo =
                    crearPartida();

                partidaActual =
                    codigo;

                partidas[codigo]
                    .jugadores[id] = {

                    id: id,

                    puntos: 0,

                    socket: socket
                };

                socket.send(
                    JSON.stringify({

                        tipo:
                            "partida_creada",

                        codigo:
                            codigo
                    })
                );

                enviarPartida(codigo);

                console.log(
                    "Partida creada:",
                    codigo
                );
            }

            // =========================
            // UNIRSE A PARTIDA
            // =========================

            if (
                datos.tipo ===
                "unirse_partida"
            ) {

                const codigo =
                    String(
                        datos.codigo
                    );

                if (
                    !partidas[codigo]
                ) {

                    socket.send(
                        JSON.stringify({

                            tipo:
                                "error",

                            mensaje:
                                "La partida no existe."
                        })
                    );

                    return;
                }

                if (
                    partidaActual &&
                    partidas[partidaActual]
                ) {

                    delete partidas[
                        partidaActual
                    ].jugadores[id];

                    enviarPartida(
                        partidaActual
                    );
                }

                partidaActual =
                    codigo;

                partidas[codigo]
                    .jugadores[id] = {

                    id: id,

                    puntos: 0,

                    socket: socket
                };

                socket.send(
                    JSON.stringify({

                        tipo:
                            "unido",

                        codigo:
                            codigo
                    })
                );

                enviarPartida(codigo);

                console.log(
                    "Jugador",
                    id,
                    "se unió a",
                    codigo
                );
            }

            // =========================
            // DISPARO
            // =========================

            if (
                datos.tipo ===
                "disparo"
            ) {

                if (
                    !partidaActual ||
                    !partidas[partidaActual]
                ) {
                    return;
                }

                const partida =
                    partidas[partidaActual];

                const jugador =
                    partida.jugadores[id];

                if (!jugador) return;

                const x =
                    Number(datos.x);

                const y =
                    Number(datos.y);

                let acierto = false;

                for (
                    let i =
                        partida.objetivos.length - 1;

                    i >= 0;

                    i--
                ) {

                    const objetivo =
                        partida.objetivos[i];

                    const distancia =
                        Math.sqrt(

                            (x - objetivo.x) ** 2 +

                            (y - objetivo.y) ** 2
                        );

                    if (
                        distancia <=
                        objetivo.radio
                    ) {

                        jugador.puntos++;

                        partida.objetivos.splice(
                            i,
                            1
                        );

                        partida.objetivos.push(
                            crearObjetivo()
                        );

                        acierto = true;

                        break;
                    }
                }

                const mensaje =
                    JSON.stringify({

                        tipo:
                            "disparo",

                        jugador:
                            id,

                        x:
                            x,

                        y:
                            y,

                        acertado:
                            acierto
                    });

                Object.values(
                    partida.jugadores
                ).forEach(j => {

                    if (
                        j.socket.readyState ===
                        WebSocket.OPEN
                    ) {

                        j.socket.send(
                            mensaje
                        );
                    }
                });

                enviarPartida(
                    partidaActual
                );
            }

            // =========================
            // REINICIAR
            // =========================

            if (
                datos.tipo ===
                "reiniciar"
            ) {

                if (
                    !partidaActual ||
                    !partidas[partidaActual]
                ) {
                    return;
                }

                const partida =
                    partidas[partidaActual];

                Object.values(
                    partida.jugadores
                ).forEach(j => {

                    j.puntos = 0;
                });

                partida.objetivos = [];

                for (
                    let i = 0;
                    i < 10;
                    i++
                ) {

                    partida.objetivos.push(
                        crearObjetivo()
                    );
                }

                enviarPartida(
                    partidaActual
                );
            }

        } catch (error) {

            console.log(
                "Error:",
                error.message
            );
        }
    });

    socket.on("close", () => {

        console.log(
            "Jugador desconectado:",
            id
        );

        if (
            partidaActual &&
            partidas[partidaActual]
        ) {

            delete partidas[
                partidaActual
            ].jugadores[id];

            enviarPartida(
                partidaActual
            );

            if (
                Object.keys(
                    partidas[partidaActual]
                        .jugadores
                ).length === 0
            ) {

                delete partidas[
                    partidaActual
                ];
            }
        }
    });
});

servidor.listen(
    PORT,
    () => {

        console.log("");
        console.log(
            "================================="
        );
        console.log(
            " 🔫 DISPAROS ANTIESTRÉS ONLINE"
        );
        console.log(
            " 🎮 SERVIDOR MULTIJUGADOR"
        );
        console.log(
            " 🌐 Puerto:",
            PORT
        );
        console.log(
            "================================="
        );
        console.log("");
    }
);