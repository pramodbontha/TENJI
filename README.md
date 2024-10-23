# TENJI - Textbook Entity Network and Jurisprudence Interface

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![Neo4j](https://img.shields.io/badge/Neo4j-008CC1?style=for-the-badge&logo=neo4j&logoColor=white)
![Elasticsearch](https://img.shields.io/badge/Elasticsearch-005571?style=for-the-badge&logo=elasticsearch&logoColor=white)

**TENJI** (Textbook Entity Network and Jurisprudence Interface) is a search engine specifically designed to navigate and retrieve legal data from German law texts and textbooks. It uses a combination of **React (Vite)** for the frontend, **NestJS** for the backend API, **Neo4j** as a graph database to store legal relationships, and **Elasticsearch** to index and perform searches on legal documents. Additionally, a **lemmatizer** service is integrated for linguistic processing.

## Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)

## Services

The application consists of the following services:

### 1. **Neo4j** - Graph Database

Neo4j is used to manage the legal entities and their relationships in the law texts. Neo4j helps represent the data in a highly relational way, making it ideal for legal networks.

- **Ports**: `7474` (HTTP), `7687` (Bolt protocol)
- **Environment Variables**:
  - `NEO4J_AUTH`: Neo4j authentication credentials.

### 2. **Elasticsearch** - Search Engine

Elasticsearch is used to index and search the legal texts, enabling efficient retrieval of documents and entities. It handles complex search queries, providing powerful full-text search capabilities.

- **Ports**: `9200` (HTTP), `9300` (Transport)
- **Environment Variables**:
  - `discovery.type=single-node`: Configures Elasticsearch as a single-node instance.
  - `ES_JAVA_OPTS`: Limits memory usage.
  - `xpack.security.enabled=false`: Disables X-Pack security for simplicity in development.

### 3. **NestJS API** - Backend Service

NestJS provides a scalable backend API for processing client requests, interacting with Neo4j and Elasticsearch, and managing the lemmatization workflow. The API also handles business logic related to legal text processing.

- **Port**: `3000`
- **Environment Variables**:
  - `NEO4J_URL`, `NEO4J_USER`, `NEO4J_PASSWORD`: Connection details for Neo4j.
  - `ELASTICSEARCH_URL`: URL for Elasticsearch.

### 4. **Lemmatizer** - Linguistic Processing Service

The lemmatizer service is a Python-based microservice that processes German legal text to normalize words for better search accuracy and understanding. It ensures that variations of words are handled correctly during searches.

- **Port**: `5000`

### 5. **React (Vite) Client** - Frontend

The frontend is built with React (using Vite for fast development) and provides an interface for users to search and navigate through legal documents. It interacts with the NestJS API to retrieve search results and legal data.

- **Port**: `5173`
- **Environment Variables**:
  - `VITE_API_URL`: The URL for the API that the client interacts with.

## Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Configure Environment Variables

Create a `.env` file at the root of the project and add the necessary environment variables:

```bash
NEO4J_AUTH=
NEO4J_URL=
NEO4J_USER=
NEO4J_PASSWORD=
ELASTICSEARCH_URL=
VITE_API_URL=
PORT=
```

### 3. Start the Application

For development:

```bash
docker-compose up -d
```

### 4. Access the Services

- **Neo4j Browser**: http://localhost:7474
- **Elasticsearch**: http://localhost:9200
- **API (NestJS)**: http://localhost:3000
- **Client (React)**: http://localhost:5173
- **Lemmatizer**: http://localhost:5000

### 5. Stopping the Application

To stop the services, run:

```bash
docker-compose down
```

## Development Workflow

- **Frontend (React)**: The frontend uses Vite for development. Changes in the source code will automatically reload the browser.
- **Backend (NestJS)**: The API server runs in development mode with live reload enabled, so changes in the source code will automatically restart the server.
- **Database (Neo4j)**: Neo4j and Elasticsearch are set up with Docker volumes to persist data across container restarts.

## Volumes

- `neo4j_data`: Stores Neo4j database files.
- `neo4j_logs`: Stores Neo4j log files.
- `neo4j_import`: Used for importing files into Neo4j.
- `neo4j_plugins`: Used to store Neo4j plugins.
- `esdata`: Stores Elasticsearch data.

## Troubleshooting

- If you encounter issues with container restarts or services not starting properly, ensure that the necessary ports are not already in use on your machine.
- Check the logs of individual services by using the `docker logs` command, e.g.:

  ```bash
  docker logs neo4j
  ```

- To rebuild the images after making changes, run:

  ```bash
  docker-compose up --build
  ```
