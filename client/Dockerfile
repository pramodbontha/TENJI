FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

ARG VITE_API_URL

ENV VITE_API_URL=${VITE_API_URL}

CMD ["npm", "run", "dev", "--", "--host"]