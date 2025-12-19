# EyePath

# Aplikacja do przeprowadzania badań atencji wzrokowej

## Uruchomienie

z głównego katalogu zawołaj w terminalu:

    docker-compose build
    docker-compose up

(można dopisać frontend lub backend lub database by uruchomić tylko dany obraz z dockera)
Program korzysta z biblioteki Material UI, zainstaluj ją komendą:

    npm install @mui/material @emotion/react @emotion/styled
    npm install @mui/material
    npm install framer-motion
    npm install @hello-pangea/dnd

Testy:
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event

### docker compose, tips

docker-compose down -v --remove-orphans

### Uruchomienie frontendu lokalnie

cd /frontend
npm start

## Formatowanie i sprawdzanie reguł (linting)

### Wymagane wtyczki

Aby formatowanie działało przy zapisie i linting potrzebne są wtyczki (VS Code):

- **Extension Pack for Java** (od Microsoftu)
- **Checkstyle for Java** (od `shengchen`)
- **Prettier - Code formatter** (od `esbenp.prettier-vscode`)

### Komendy do pracy z kodem

Przed `git push`, **musisz** można upewnić się, że lintowanie na CI przejdzie pomyślnie.

#### Backend (Java / Checkstyle)

```bash
cd backend
mvn checkstyle:check
```

#### Frontend (ESLint / Prettier)

##### Sprawdzanie:

```bash
cd frontend
npm run lint
npm run format:check
```

##### Naprawianie:

```bash
cd frontend
# Naprawia błędy formatowania (Prettier)
npm run format:fix
# Próbuje naprawić błędy logiczne (ESLint)
npm run lint:fix
```

## Główne Funkcjonalności

- Utworzenie badania
- Załadowanie plików png
- Przeprowadzenie badania
- Zapisanie badania (backend)
- Przeglądanie badań
- Przeglądanie wyników z danego badania
- Pobranie wyników badań w formacie csv


## gitlab CI runner on docker

docker run -d --name gitlab-runner --restart always \
 -v /srv/gitlab-runner/config:/etc/gitlab-runner \
 -v /var/run/docker.sock:/var/run/docker.sock \
 gitlab/gitlab-runner:latest
