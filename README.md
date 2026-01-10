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

### code coverage (jacoco)

wyniki w folderze: pzsp2-eyetracking/backend/target/site/jacoco/index.html

można je czytelniej zobaczyć przez przeglądarke wpisując:

```
file:///home/<sciezka do repo>/pzsp2-eyetracking/backend/target/site/jacoco/index.html
```

### check code quality (SonarQube)

- po docker-compose up -d trzeba chwilę poczekać
- wchodzimy na stronę

```
http://localhost:9000
```

- tam powinna pojawić się strona SonarQube
- trzeba się zalogować (jeśli pierwszy raz to l: admin, h: admin)
- Projects -> local -> Follows the instance default -> Analysis Method Locally -> generate token -> maven

komendy do terminala (przykład, najlepiej skopiować kod z SonarQube):

```
cd backend
mvn clean verify org.sonarsource.scanner.maven:sonar-maven-plugin:sonar \
  -Dsonar.projectKey=pzsp2-backend \
  -Dsonar.projectName='pzsp2-backend' \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=<sqp..>
```

## Główne Funkcjonalności

- Utworzenie badania
- Załadowanie plików png
- Przeprowadzenie badania
- Zapisanie badania (backend)
- Przeglądanie badań
- Przeglądanie wyników z danego badania
- Pobranie wyników badań w formacie csv
