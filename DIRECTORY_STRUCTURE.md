# Directory Structure

This document provides an overview of the project's directory structure, detailing the purpose of each directory and its usage in the project.

## Root Directory

- **`data/`**
  - **`db/`**
    - Used for storing MongoDB data.
    - Mounted as a Docker volume to persist database data.
  - **`mongo-init/`**
    - Contains initialization scripts to set up MongoDB upon container creation.
    - Mounted to Docker's entrypoint for MongoDB to execute these scripts automatically.

- **`src/`**
  - **`database/`**
    - Contains classes and modules for database management and access logic.
    - Manages MongoDB connections, queries, and collection management.

## Configuration

- **`.env`**
  - Stores environment variables for configuring services like MongoDB, Redis, and API keys.
  - Ensures credentials are kept secure and configurable outside the source code.

## Docker

- **`docker-compose.yml`**
  - Defines services, networks, volumes, and configurations for Docker containers.
  - Utilizes environment variables from `.env` file to configure credentials and network settings.

## Miscellaneous

- **`logs/`**
  - Directory for storing application logs, used for monitoring and debugging purposes.

This directory structure ensures a clear separation of responsibilities, with each directory serving a distinct purpose in the overall project architecture. The use of environment variables and Docker allows for flexible configuration and deployment.
