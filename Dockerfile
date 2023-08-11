# Use an official Node runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container to /app
WORKDIR /app

# Add `pnpm` globally in your image
RUN npm install -g pnpm

# Install Python, make, g++, gcc
RUN apk add --update --no-cache python3 make g++ gcc git && ln -sf python3 /usr/bin/python

# Install pip3
RUN apk add --update --no-cache py3-pip

# Copy the current directory contents into the container at /app
COPY . .

# Install Doppler CLI
# https://docs.doppler.com/docs/dockerfile
RUN wget -q -t3 'https://packages.doppler.com/public/cli/rsa.8004D9FF50437357.key' -O /etc/apk/keys/cli@doppler-8004D9FF50437357.rsa.pub && \
    echo 'https://packages.doppler.com/public/cli/alpine/any-version/main' | tee -a /etc/apk/repositories && \
    apk add doppler

# Install app dependencies using pnpm
RUN pnpm install

# Build the project
RUN pnpm build

# Install pydeps
RUN pip3 install pydeps

# Make port 3001 available to the world outside this container
EXPOSE 3001

# Run the migration and then start the server
CMD ["doppler", "run", "--", "pnpm", "start"]