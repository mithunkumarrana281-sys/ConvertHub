FROM node:20-bookworm-slim

RUN apt-get update \
    && apt-get install -y \
    ffmpeg \
    imagemagick \
    libreoffice \
    ghostscript \
    poppler-utils \
    img2pdf \
    qpdf \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY server.js ./

EXPOSE 3000

CMD ["npm", "start"]
