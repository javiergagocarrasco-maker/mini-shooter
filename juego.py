import pygame
import random

pygame.init()

ANCHO = 900
ALTO = 600

pantalla = pygame.display.set_mode((ANCHO, ALTO))
pygame.display.set_caption("Mini Shooter")

reloj = pygame.time.Clock()

# Colores
FONDO = (20, 20, 30)
BLANCO = (255, 255, 255)
AZUL = (60, 150, 255)
ROJO = (255, 60, 60)
AMARILLO = (255, 220, 50)
VERDE = (60, 220, 120)

fuente_grande = pygame.font.Font(None, 80)
fuente = pygame.font.Font(None, 40)

# Jugador
jugador = pygame.Rect(430, 500, 40, 40)

# Enemigo
enemigo = pygame.Rect(
    random.randint(50, 810),
    100,
    40,
    40
)

# Balas
balas = []

puntos = 0
estado = "menu"


def nuevo_enemigo():
    enemigo.x = random.randint(50, ANCHO - 90)
    enemigo.y = random.randint(70, 300)


def texto(mensaje, fuente, color, x, y):
    imagen = fuente.render(mensaje, True, color)
    pantalla.blit(imagen, (x, y))


jugando = True

while jugando:

    for evento in pygame.event.get():

        if evento.type == pygame.QUIT:
            jugando = False

        # Teclado
        if evento.type == pygame.KEYDOWN:

            # ESC = pausa
            if evento.key == pygame.K_ESCAPE:

                if estado == "juego":
                    estado = "pausa"

                elif estado == "pausa":
                    estado = "juego"

            # ESPACIO = disparar
            if evento.key == pygame.K_SPACE and estado == "juego":

                bala = pygame.Rect(
                    jugador.centerx - 5,
                    jugador.y - 15,
                    10,
                    20
                )

                balas.append(bala)

        # Ratón para los botones
        if evento.type == pygame.MOUSEBUTTONDOWN:

            raton = evento.pos

            # MENÚ
            if estado == "menu":

                boton_jugar = pygame.Rect(325, 260, 250, 70)
                boton_salir = pygame.Rect(325, 360, 250, 70)

                if boton_jugar.collidepoint(raton):

                    puntos = 0
                    jugador.x = 430
                    jugador.y = 500
                    balas.clear()
                    nuevo_enemigo()

                    estado = "juego"

                if boton_salir.collidepoint(raton):
                    jugando = False

            # PAUSA
            elif estado == "pausa":

                boton_continuar = pygame.Rect(300, 280, 300, 60)
                boton_menu = pygame.Rect(300, 360, 300, 60)

                if boton_continuar.collidepoint(raton):
                    estado = "juego"

                if boton_menu.collidepoint(raton):
                    estado = "menu"

    # ==========================
    # JUEGO
    # ==========================

    if estado == "juego":

        teclas = pygame.key.get_pressed()

        # Movimiento con flechas
        if teclas[pygame.K_LEFT]:
            jugador.x -= 6

        if teclas[pygame.K_RIGHT]:
            jugador.x += 6

        if teclas[pygame.K_UP]:
            jugador.y -= 6

        if teclas[pygame.K_DOWN]:
            jugador.y += 6

        # No salir de la pantalla
        jugador.x = max(0, min(jugador.x, ANCHO - jugador.width))
        jugador.y = max(60, min(jugador.y, ALTO - jugador.height))

        # Mover balas
        for bala in balas[:]:

            bala.y -= 10

            # Si sale de la pantalla
            if bala.bottom < 0:
                balas.remove(bala)

            # Si golpea al enemigo
            elif bala.colliderect(enemigo):

                puntos += 1

                balas.remove(bala)

                nuevo_enemigo()

    # ==========================
    # DIBUJAR
    # ==========================

    pantalla.fill(FONDO)

    if estado == "menu":

        texto(
            "MINI SHOOTER",
            fuente_grande,
            BLANCO,
            270,
            120
        )

        boton_jugar = pygame.Rect(325, 260, 250, 70)
        boton_salir = pygame.Rect(325, 360, 250, 70)

        pygame.draw.rect(pantalla, VERDE, boton_jugar)
        pygame.draw.rect(pantalla, ROJO, boton_salir)

        texto("JUGAR", fuente, BLANCO, 395, 280)
        texto("SALIR", fuente, BLANCO, 405, 380)

    elif estado == "juego":

        # Jugador
        pygame.draw.rect(
            pantalla,
            AZUL,
            jugador
        )

        # Enemigo
        pygame.draw.rect(
            pantalla,
            ROJO,
            enemigo
        )

        # Balas
        for bala in balas:

            pygame.draw.rect(
                pantalla,
                AMARILLO,
                bala
            )

        texto(
            "Puntos: " + str(puntos),
            fuente,
            BLANCO,
            20,
            20
        )

        texto(
            "Flechas = Mover",
            fuente,
            BLANCO,
            300,
            20
        )

        texto(
            "ESPACIO = Disparar",
            fuente,
            BLANCO,
            600,
            20
        )

    elif estado == "pausa":

        texto(
            "PAUSA",
            fuente_grande,
            BLANCO,
            350,
            120
        )

        texto(
            "Puntos: " + str(puntos),
            fuente,
            BLANCO,
            370,
            210
        )

        boton_continuar = pygame.Rect(300, 280, 300, 60)
        boton_menu = pygame.Rect(300, 360, 300, 60)

        pygame.draw.rect(
            pantalla,
            VERDE,
            boton_continuar
        )

        pygame.draw.rect(
            pantalla,
            ROJO,
            boton_menu
        )

        texto(
            "CONTINUAR",
            fuente,
            BLANCO,
            350,
            292
        )

        texto(
            "MENÚ PRINCIPAL",
            fuente,
            BLANCO,
            325,
            372
        )

    pygame.display.flip()

    reloj.tick(60)

pygame.quit()